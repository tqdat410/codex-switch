import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import test from 'node:test';
import { openStateDatabase, upsertAccount } from '../src/core/db.js';
import {
  getQuotaWorkerState,
  markQuotaWorkerStopped,
  refreshQuotaCacheOnce,
  upsertQuotaWorkerState,
} from '../src/core/quota-cache-worker.js';
import { upsertAccountAuthState, upsertQuotaCache } from '../src/core/quota-cache.js';

test('refreshQuotaCacheOnce refreshes due accounts and records heartbeat', async () => {
  const cleanup = await withTempVaultRoot();
  const db = openStateDatabase();
  const refreshed: string[] = [];

  try {
    upsertAccount(db, { name: 'fresh', email: null, plan: null, notes: null });
    upsertAccount(db, { name: 'stale', email: null, plan: null, notes: null });
    upsertQuotaCache(db, 'fresh', snapshot(Date.now() - 1_000));
    upsertQuotaCache(db, 'stale', snapshot(Date.now() - 120_000));

    const summary = await refreshQuotaCacheOnce({
      concurrency: 1,
      intervalMs: 60_000,
      refresh: async (account) => {
        refreshed.push(account);
        return {
          row: null,
          fresh: true,
          reason: 'probed',
          requiresReauth: false,
          source: 'wham',
          error: null,
        };
      },
    });

    assert.deepEqual(refreshed, ['stale']);
    assert.equal(summary.refreshed, 1);
    assert.equal(summary.skipped, 1);
    assert.equal(summary.failed, 0);
    assert.ok(getQuotaWorkerState(db)?.heartbeatAt);
  } finally {
    db.close();
    await cleanup();
  }
});

test('refreshQuotaCacheOnce skips reauth accounts and survives account failures', async () => {
  const cleanup = await withTempVaultRoot();
  const db = openStateDatabase();

  try {
    upsertAccount(db, { name: 'broken', email: null, plan: null, notes: null });
    upsertAccount(db, { name: 'reauth', email: null, plan: null, notes: null });
    upsertAccountAuthState(db, {
      account: 'reauth',
      requiresReauth: true,
      lastError: 'requires_reauth',
      lastErrorAt: Date.now(),
    });

    const summary = await refreshQuotaCacheOnce({
      concurrency: 2,
      intervalMs: 60_000,
      refresh: async (account) => {
        throw new Error(`failed ${account}`);
      },
    });

    assert.equal(summary.refreshed, 0);
    assert.equal(summary.skipped, 1);
    assert.equal(summary.failed, 1);
    assert.match(getQuotaWorkerState(db)?.lastError ?? '', /failed broken/);
  } finally {
    db.close();
    await cleanup();
  }
});

test('markQuotaWorkerStopped clears stored pid', async () => {
  const cleanup = await withTempVaultRoot();
  const db = openStateDatabase();

  try {
    upsertQuotaWorkerState(db, {
      pid: 12345,
      startedAt: Date.now(),
      heartbeatAt: Date.now(),
      intervalMs: 60_000,
      lastRunAt: Date.now(),
      lastError: null,
    });

    markQuotaWorkerStopped(db);

    assert.equal(getQuotaWorkerState(db)?.pid, null);
  } finally {
    db.close();
    await cleanup();
  }
});

test('refreshQuotaCacheOnce clears stale last error after success', async () => {
  const cleanup = await withTempVaultRoot();
  const db = openStateDatabase();

  try {
    upsertAccount(db, { name: 'healthy', email: null, plan: null, notes: null });
    upsertQuotaWorkerState(db, {
      pid: 12345,
      startedAt: Date.now(),
      heartbeatAt: Date.now(),
      intervalMs: 60_000,
      lastRunAt: Date.now(),
      lastError: 'old failure',
    });

    const summary = await refreshQuotaCacheOnce({
      concurrency: 1,
      intervalMs: 60_000,
      refresh: async () => ({
        row: null,
        fresh: true,
        reason: 'probed',
        requiresReauth: false,
        source: 'wham',
        error: null,
      }),
    });

    assert.equal(summary.failed, 0);
    assert.equal(getQuotaWorkerState(db)?.lastError, null);
  } finally {
    db.close();
    await cleanup();
  }
});

function snapshot(capturedAt: number) {
  return {
    fiveHour: {
      percentLeft: 50,
      resetAt: Date.now() + 60_000,
    },
    weekly: {
      percentLeft: 50,
      resetAt: Date.now() + 600_000,
    },
    capturedAt,
    source: 'wham' as const,
  };
}

async function withTempVaultRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'codex-switch-worker-'));
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
