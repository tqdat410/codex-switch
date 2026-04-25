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
    assert.deepEqual(await readConfig(), { autoSelectAccount: true });
  } finally {
    await cleanup();
  }
});

test('setAutoSelectAccount persists the manual picker preference', async () => {
  const cleanup = await withTempVaultRoot();

  try {
    await setAutoSelectAccount(false);
    assert.deepEqual(await readConfig(), { autoSelectAccount: false });
  } finally {
    await cleanup();
  }
});

test('readConfig ignores malformed config and keeps defaults', async () => {
  const cleanup = await withTempVaultRoot();

  try {
    await writeFile(vaultConfigFile(), '{broken', 'utf8');
    assert.deepEqual(await readConfig(), { autoSelectAccount: true });
  } finally {
    await cleanup();
  }
});

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
