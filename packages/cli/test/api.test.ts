import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import test from 'node:test';
import { listKnownAccounts } from '../src/api.js';

test('listKnownAccounts returns an empty list before state.sqlite exists', async () => {
  const cleanup = await withTempVaultRoot();

  try {
    assert.deepEqual(listKnownAccounts(), []);
  } finally {
    await cleanup();
  }
});

async function withTempVaultRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'codex-switch-api-'));
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
