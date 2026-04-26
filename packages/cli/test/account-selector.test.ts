import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import test from 'node:test';
import { vaultAccountsDir } from '@codex-switch/shared';
import { selectBestAccount } from '../src/core/account-selector.js';
import { openStateDatabase, upsertAccount } from '../src/core/db.js';
import { upsertAccountAuthState, upsertQuotaCache } from '../src/core/quota-cache.js';

test('selectBestAccount prefers the account with more 5h quota left', async () => {
  const cleanup = await withTempVaultRoot();
  const db = openStateDatabase();

  rejectQuotaFetch();

  try {
    upsertAccount(db, { name: 'nearly-full', email: null, plan: null, notes: null });
    upsertAccount(db, { name: 'healthy', email: null, plan: null, notes: null });
    upsertQuotaCache(db, 'nearly-full', snapshot(3));
    upsertQuotaCache(db, 'healthy', snapshot(80));

    assert.equal(await selectBestAccount(), 'healthy');
  } finally {
    db.close();
    await cleanup();
  }
});

test('selectBestAccount avoids accounts that require reauth', async () => {
  const cleanup = await withTempVaultRoot();
  const db = openStateDatabase();

  rejectQuotaFetch();

  try {
    upsertAccount(db, { name: 'reauth', email: null, plan: null, notes: null });
    upsertAccount(db, { name: 'unknown', email: null, plan: null, notes: null });
    upsertQuotaCache(db, 'reauth', snapshot(99), 'requires_reauth');
    upsertQuotaCache(db, 'unknown', {
      ...snapshot(0),
      fiveHour: null,
      weekly: null,
    });
    upsertAccountAuthState(db, {
      account: 'reauth',
      requiresReauth: true,
      lastError: 'requires_reauth',
      lastErrorAt: Date.now(),
    });

    assert.equal(await selectBestAccount(), 'unknown');
  } finally {
    db.close();
    await cleanup();
  }
});

test('selectBestAccount falls back to active account when quota cache is empty', async () => {
  const cleanup = await withTempVaultRoot();
  const db = openStateDatabase();

  rejectQuotaFetch();

  try {
    upsertAccount(db, { name: 'recent', email: null, plan: null, notes: null });
    upsertAccount(db, { name: 'active', email: null, plan: null, notes: null });
    db.prepare(
      `INSERT INTO active (id, account, switched_at)
       VALUES (1, ?, ?)`,
    ).run('active', Date.now());

    assert.equal(await selectBestAccount(), 'active');
  } finally {
    db.close();
    await cleanup();
  }
});

test('selectBestAccount fails clearly when the vault has no accounts', async () => {
  const cleanup = await withTempVaultRoot();

  try {
    await assert.rejects(selectBestAccount(), /No accounts in vault/);
  } finally {
    await cleanup();
  }
});

function snapshot(fiveHourPercent: number) {
  return {
    fiveHour: {
      percentLeft: fiveHourPercent,
      resetAt: Date.now() + 60_000,
    },
    weekly: {
      percentLeft: 50,
      resetAt: Date.now() + 600_000,
    },
    capturedAt: Date.now(),
    source: 'wham' as const,
  };
}

function rejectQuotaFetch() {
  test.mock.method(globalThis, 'fetch', async () => {
    throw new Error('foreground selection must not call quota network');
  });
}

async function withTempVaultRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'codex-switch-selector-'));
  const previous = process.env.CODEX_SWITCH_VAULT_ROOT;
  process.env.CODEX_SWITCH_VAULT_ROOT = tempRoot;
  await mkdir(vaultAccountsDir(), { recursive: true });

  return async () => {
    if (previous === undefined) {
      delete process.env.CODEX_SWITCH_VAULT_ROOT;
    } else {
      process.env.CODEX_SWITCH_VAULT_ROOT = previous;
    }

    await rm(tempRoot, { recursive: true, force: true });
  };
}
