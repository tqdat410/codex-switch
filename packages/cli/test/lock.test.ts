import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import test from 'node:test';
import { vaultLockFile } from '@codex-switch/shared';
import { acquireSessionLock, readActiveLock } from '../src/core/lock.js';

test('acquireSessionLock allows only one active holder', async () => {
  const cleanup = await withTempVaultRoot();

  try {
    const release = await acquireSessionLock('alpha');
    await assert.rejects(() => acquireSessionLock('beta'), /already be running/);

    const active = await readActiveLock();
    assert.equal(active?.account, 'alpha');

    await release();
  } finally {
    await cleanup();
  }
});

test('readActiveLock clears stale lock files', async () => {
  const cleanup = await withTempVaultRoot();

  try {
    await writeFile(
      vaultLockFile(),
      JSON.stringify({
        pid: 999_999,
        account: 'stale',
        startedAt: Date.now() - 1_000,
        token: 'stale-token',
      }),
      'utf8',
    );

    const active = await readActiveLock();
    assert.equal(active, null);

    const release = await acquireSessionLock('fresh');
    await release();
  } finally {
    await cleanup();
  }
});

async function withTempVaultRoot() {
  const tempRoot = await import('node:fs/promises').then(({ mkdtemp, rm }) =>
    mkdtemp(path.join(os.tmpdir(), 'codex-switch-lock-')).then((dir) => ({
      dir,
      rm,
    })),
  );
  const previous = process.env.CODEX_SWITCH_VAULT_ROOT;
  process.env.CODEX_SWITCH_VAULT_ROOT = tempRoot.dir;

  return async () => {
    if (previous === undefined) {
      delete process.env.CODEX_SWITCH_VAULT_ROOT;
    } else {
      process.env.CODEX_SWITCH_VAULT_ROOT = previous;
    }

    await tempRoot.rm(tempRoot.dir, { recursive: true, force: true });
  };
}
