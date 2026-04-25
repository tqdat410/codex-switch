import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import test from 'node:test';
import { vaultAccountsDir } from '@codex-switch/shared';
import { selectBestAccount } from '../src/core/account-selector.js';
import { openStateDatabase, upsertAccount } from '../src/core/db.js';
import { upsertAccountAuthState, upsertQuotaCache } from '../src/core/quota-cache.js';
import { writeVaultEntry } from '../src/core/vault.js';

test('selectBestAccount prefers the account with more 5h quota left', async () => {
  const cleanup = await withTempVaultRoot();
  const db = openStateDatabase();

  mockQuotaFetch();

  try {
    upsertAccount(db, { name: 'nearly-full', email: null, plan: null, notes: null });
    upsertAccount(db, { name: 'healthy', email: null, plan: null, notes: null });
    upsertQuotaCache(db, 'nearly-full', snapshot(3));
    upsertQuotaCache(db, 'healthy', snapshot(80));
    await writeVaultEntry('nearly-full', auth('nearly-full', 'acc-nearly-full'));
    await writeVaultEntry('healthy', auth('healthy', 'acc-healthy'));

    assert.equal(await selectBestAccount(), 'healthy');
  } finally {
    db.close();
    await cleanup();
  }
});

test('selectBestAccount avoids accounts that require reauth', async () => {
  const cleanup = await withTempVaultRoot();
  const db = openStateDatabase();

  mockQuotaFetch();

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
    await writeVaultEntry('unknown', auth('unknown', 'acc-unknown'));

    assert.equal(await selectBestAccount(), 'unknown');
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

function auth(name: string, accountId: string) {
  return {
    tokens: {
      access_token: jwt({
        name,
        exp: Math.floor(Date.now() / 1000) + 3_600,
        'https://api.openai.com/auth': {
          chatgpt_account_id: accountId,
        },
      }),
      refresh_token: `${name}-refresh-token`,
    },
  };
}

function jwt(payload: Record<string, unknown>) {
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.sig`;
}

function mockQuotaFetch() {
  test.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, init?: RequestInit) => {
    const accountId = init?.headers
      ? new Headers(init.headers).get('ChatGPT-Account-Id')
      : null;
    const percentLeft = accountId === 'acc-healthy' || accountId === 'acc-unknown' ? 80 : 3;

    return new Response(
      JSON.stringify({
        rate_limit: {
          five_hour: {
            percent_left: percentLeft,
            reset_time_ms: Date.now() + 60_000,
          },
          weekly: {
            percent_left: 50,
            reset_time_ms: Date.now() + 600_000,
          },
        },
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      },
    );
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
