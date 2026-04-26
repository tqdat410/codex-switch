import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { vaultConfigFile } from '@codex-switch/shared';
import { readConfig, setAutoSelectAccount } from '../src/core/config.js';

test('readConfig defaults auto account selection on', async () => {
  const cleanup = await withTempVaultRoot();

  try {
    assert.deepEqual(await readConfig(), {
      autoSelectAccount: true,
      quotaCacheConcurrency: 3,
      quotaCacheIntervalMs: 60_000,
    });
  } finally {
    await cleanup();
  }
});

test('setAutoSelectAccount persists the manual picker preference', async () => {
  const cleanup = await withTempVaultRoot();

  try {
    await setAutoSelectAccount(false);
    assert.deepEqual(await readConfig(), {
      autoSelectAccount: false,
      quotaCacheConcurrency: 3,
      quotaCacheIntervalMs: 60_000,
    });
  } finally {
    await cleanup();
  }
});

test('readConfig ignores malformed config and keeps defaults', async () => {
  const cleanup = await withTempVaultRoot();

  try {
    await writeFile(vaultConfigFile(), '{broken', 'utf8');
    assert.deepEqual(await readConfig(), {
      autoSelectAccount: true,
      quotaCacheConcurrency: 3,
      quotaCacheIntervalMs: 60_000,
    });
  } finally {
    await cleanup();
  }
});

test('readConfig applies quota cache env overrides', async () => {
  const cleanup = await withTempVaultRoot();
  const previousInterval = process.env.CODEX_SWITCH_QUOTA_CACHE_INTERVAL_MS;
  const previousConcurrency = process.env.CODEX_SWITCH_QUOTA_CACHE_CONCURRENCY;
  process.env.CODEX_SWITCH_QUOTA_CACHE_INTERVAL_MS = '30000';
  process.env.CODEX_SWITCH_QUOTA_CACHE_CONCURRENCY = '2';

  try {
    assert.deepEqual(await readConfig(), {
      autoSelectAccount: true,
      quotaCacheConcurrency: 2,
      quotaCacheIntervalMs: 30_000,
    });
  } finally {
    restoreEnv('CODEX_SWITCH_QUOTA_CACHE_INTERVAL_MS', previousInterval);
    restoreEnv('CODEX_SWITCH_QUOTA_CACHE_CONCURRENCY', previousConcurrency);
    await cleanup();
  }
});

test('setAutoSelectAccount does not persist quota cache env overrides', async () => {
  const cleanup = await withTempVaultRoot();
  const previousInterval = process.env.CODEX_SWITCH_QUOTA_CACHE_INTERVAL_MS;
  process.env.CODEX_SWITCH_QUOTA_CACHE_INTERVAL_MS = '30000';

  try {
    await setAutoSelectAccount(false);
    restoreEnv('CODEX_SWITCH_QUOTA_CACHE_INTERVAL_MS', previousInterval);

    assert.deepEqual(await readConfig(), {
      autoSelectAccount: false,
      quotaCacheConcurrency: 3,
      quotaCacheIntervalMs: 60_000,
    });
  } finally {
    restoreEnv('CODEX_SWITCH_QUOTA_CACHE_INTERVAL_MS', previousInterval);
    await cleanup();
  }
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

async function withTempVaultRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'codex-switch-config-'));
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
