import type { AuthJson } from '@codex-switch/shared';
import {
  authFile,
  codexHome,
  vaultAccountFile,
  vaultAccountsDir,
  vaultConfigFile,
  vaultRoot,
} from '@codex-switch/shared';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { deriveAccountMetadata, parseAuthJson, parseAuthJsonString } from './auth-schema.js';
import { upsertAccount, type StateDatabase } from './db.js';
import { copyFileAtomic, writeJsonAtomic } from '../util/atomic-write.js';

export async function ensureVaultSetup() {
  await mkdir(codexHome(), { recursive: true });
  await mkdir(vaultRoot(), { recursive: true });
  await mkdir(vaultAccountsDir(), { recursive: true });

  try {
    await readFile(vaultConfigFile(), 'utf8');
  } catch {
    await writeJsonAtomic(vaultConfigFile(), {
      port: null,
      theme: 'system',
      defaultAccount: null,
    });
  }
}

export async function loadAuthFromFile(filePath: string) {
  return parseAuthJsonString(await readFile(filePath, 'utf8'));
}

export async function readVaultEntry(name: string) {
  return loadAuthFromFile(vaultAccountFile(name));
}

export async function writeVaultEntry(name: string, auth: AuthJson) {
  parseAuthJson(auth);
  await writeJsonAtomic(vaultAccountFile(name), auth);
}

export async function removeVaultEntry(name: string) {
  await rm(vaultAccountFile(name), { force: true });
}

export async function syncCurrentAuthToVault(name: string) {
  await copyFileAtomic(authFile(), vaultAccountFile(name));
}

export async function copyVaultEntryToAuth(name: string) {
  await copyFileAtomic(vaultAccountFile(name), authFile());
}

export function upsertAccountFromAuth(db: StateDatabase, name: string, auth: AuthJson) {
  const metadata = deriveAccountMetadata(auth);
  upsertAccount(db, {
    name,
    email: metadata.email,
    plan: metadata.plan,
    notes: null,
  });
}
