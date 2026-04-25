import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import test from 'node:test';
import { authFile, vaultAccountsDir } from '@codex-switch/shared';
import { switchAccount } from '../src/core/swap.js';
import { getActiveAccount, openStateDatabase, upsertAccount } from '../src/core/db.js';
import { writeVaultEntry } from '../src/core/vault.js';

test('switchAccount swaps auth and updates active state without launching Codex', async () => {
  const cleanup = await withTempRoots();
  const db = openStateDatabase();
  process.env.CODEX_SWITCH_CODEX_BIN = 'missing-codex-binary-for-switch-test';

  try {
    upsertAccount(db, { name: 'personal', email: null, plan: null, notes: null });
    await writeVaultEntry('personal', auth('personal'));

    await switchAccount('personal');

    const active = getActiveAccount(db);
    const liveAuth = JSON.parse(await readFile(authFile(), 'utf8')) as ReturnType<typeof auth>;

    assert.equal(active?.account, 'personal');
    assert.equal(liveAuth.tokens.access_token, auth('personal').tokens.access_token);
  } finally {
    db.close();
    await cleanup();
    delete process.env.CODEX_SWITCH_CODEX_BIN;
  }
});

async function withTempRoots() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'codex-switch-switch-'));
  const previousVault = process.env.CODEX_SWITCH_VAULT_ROOT;
  const previousCodexHome = process.env.CODEX_SWITCH_CODEX_HOME;
  process.env.CODEX_SWITCH_VAULT_ROOT = path.join(tempRoot, 'vault');
  process.env.CODEX_SWITCH_CODEX_HOME = path.join(tempRoot, 'codex');
  await mkdir(vaultAccountsDir(), { recursive: true });

  return async () => {
    if (previousVault === undefined) {
      delete process.env.CODEX_SWITCH_VAULT_ROOT;
    } else {
      process.env.CODEX_SWITCH_VAULT_ROOT = previousVault;
    }

    if (previousCodexHome === undefined) {
      delete process.env.CODEX_SWITCH_CODEX_HOME;
    } else {
      process.env.CODEX_SWITCH_CODEX_HOME = previousCodexHome;
    }

    await rm(tempRoot, { recursive: true, force: true });
  };
}

function auth(name: string) {
  return {
    tokens: {
      access_token: `access-${name}`,
      refresh_token: `refresh-${name}`,
    },
  };
}
