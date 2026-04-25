import { authFile } from '@codex-switch/shared';
import { access } from 'node:fs/promises';
import { getActiveAccount, openStateDatabase, setActiveAccount, touchAccountLastUsed } from './db.js';
import { acquireSessionLock } from './lock.js';
import { launchCodex } from './launch.js';
import {
  copyVaultEntryToAuth,
  ensureVaultSetup,
  readVaultEntry,
  syncCurrentAuthToVault,
  upsertAccountFromAuth,
} from './vault.js';

export async function useAccount(name: string, codexArgs: string[]) {
  const { exitCode } = await activateAccount(name, { codexArgs });
  return exitCode;
}

export async function switchAccount(name: string) {
  await activateAccount(name);
}

async function activateAccount(name: string, options: { codexArgs?: string[] } = {}) {
  await ensureVaultSetup();

  const releaseLock = await acquireSessionLock(name);
  const db = openStateDatabase();

  try {
    const active = getActiveAccount(db);
    const authExists = await fileExists(authFile());

    let targetAuth = null;
    if (active?.account === name) {
      if (authExists) {
        await syncCurrentAuthToVault(name);
        targetAuth = await readVaultEntry(name);
      } else {
        targetAuth = await readVaultEntry(name);
        await copyVaultEntryToAuth(name);
      }
    } else {
      if (active && authExists) {
        await syncCurrentAuthToVault(active.account);
      }
      targetAuth = await readVaultEntry(name);
      await copyVaultEntryToAuth(name);
    }

    upsertAccountFromAuth(db, name, targetAuth);
    setActiveAccount(db, name);
    touchAccountLastUsed(db, name);

    const exitCode = options.codexArgs ? await launchCodex(options.codexArgs) : 0;

    if (options.codexArgs && (await fileExists(authFile()))) {
      await syncCurrentAuthToVault(name);
    }

    return { exitCode };
  } finally {
    db.close();
    await releaseLock();
  }
}

export async function syncActiveAccount() {
  await ensureVaultSetup();
  const db = openStateDatabase();

  try {
    const active = getActiveAccount(db);
    if (!active) {
      throw new Error('No active account recorded.');
    }

    if (!(await fileExists(authFile()))) {
      throw new Error('No ~/.codex/auth.json file found to sync.');
    }

    await syncCurrentAuthToVault(active.account);
    const currentAuth = await readVaultEntry(active.account);
    upsertAccountFromAuth(db, active.account, currentAuth);
    return active.account;
  } finally {
    db.close();
  }
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
