import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import test from 'node:test';
import { openStateDatabase } from '../src/core/db.js';
import {
  getAccountAuthState,
  getQuotaCache,
  upsertAccountAuthState,
  upsertQuotaCache,
} from '../src/core/quota-cache.js';

test('upsertQuotaCache stores the normalized quota windows', async () => {
  const cleanup = await withTempVaultRoot();
  const db = openStateDatabase();

  try {
    upsertQuotaCache(
      db,
      'personal',
      {
        capturedAt: 1_800_000_000_000,
        source: 'wham',
        fiveHour: {
          percentLeft: 42,
          resetAt: 1_800_000_100_000,
        },
        weekly: {
          percentLeft: 88,
          resetAt: 1_900_000_000_000,
        },
      },
      null,
    );

    assert.deepEqual(getQuotaCache(db, 'personal'), {
      account: 'personal',
      capturedAt: 1_800_000_000_000,
      fiveHourPercent: 42,
      fiveHourResetAt: 1_800_000_100_000,
      weeklyPercent: 88,
      weeklyResetAt: 1_900_000_000_000,
      source: 'wham',
      staleReason: null,
    });
  } finally {
    db.close();
    await cleanup();
  }
});

test('getAccountAuthState defaults to a non-error state', async () => {
  const cleanup = await withTempVaultRoot();
  const db = openStateDatabase();

  try {
    assert.deepEqual(getAccountAuthState(db, 'personal'), {
      account: 'personal',
      requiresReauth: false,
      lastError: null,
      lastErrorAt: null,
    });

    upsertAccountAuthState(db, {
      account: 'personal',
      requiresReauth: true,
      lastError: 'invalid_grant',
      lastErrorAt: 123,
    });

    assert.deepEqual(getAccountAuthState(db, 'personal'), {
      account: 'personal',
      requiresReauth: true,
      lastError: 'invalid_grant',
      lastErrorAt: 123,
    });
  } finally {
    db.close();
    await cleanup();
  }
});

async function withTempVaultRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'codex-switch-quota-cache-'));
  const previous = process.env.CODEX_SWITCH_VAULT_ROOT;
  process.env.CODEX_SWITCH_VAULT_ROOT = tempRoot;

  return async () => {
    if (previous === undefined) {
      delete process.env.CODEX_SWITCH_VAULT_ROOT;
    } else {
      process.env.CODEX_SWITCH_VAULT_ROOT = previous;
    }

    await rm(tempRoot, { recursive: true, force: true });
  };
}
