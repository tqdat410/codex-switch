import type { AuthJson } from '@codex-switch/shared';
import {
  authFile,
  codexHome,
  vaultAccountFile,
  vaultAccountsDir,
  vaultConfigFile,
  vaultRoot,
} from '@codex-switch/shared';
import { mkdir, open, readFile, rm } from 'node:fs/promises';
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
  await updateVaultEntry(name, async () => auth);
}

export async function removeVaultEntry(name: string) {
  await updateVaultEntry(name, async () => null);
}

export async function syncCurrentAuthToVault(name: string) {
  const sourceAuth = await loadAuthFromFile(authFile());

  await updateVaultEntry(name, async (current) => mergeVaultSnapshot(current, sourceAuth));
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

export async function updateVaultEntry(
  name: string,
  updater: (current: AuthJson | null) => Promise<AuthJson | null> | AuthJson | null,
) {
  return withVaultEntryLock(name, async () => {
    const current = await readVaultEntryOrNull(name);
    const next = await updater(current);

    if (!next) {
      await rm(vaultAccountFile(name), { force: true });
      return null;
    }

    parseAuthJson(next);
    await writeJsonAtomic(vaultAccountFile(name), next);
    return next;
  });
}

async function withVaultEntryLock<T>(name: string, run: () => Promise<T>) {
  const lockPath = `${vaultAccountFile(name)}.lock`;
  const handle = await acquireFileLock(lockPath);

  try {
    return await run();
  } finally {
    await handle.close().catch(() => undefined);
    await rm(lockPath, { force: true }).catch(() => undefined);
  }
}

async function acquireFileLock(lockPath: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      return await open(lockPath, 'wx');
    } catch (error) {
      lastError = error;
      if (!isAlreadyExistsError(error)) {
        throw error;
      }

      await sleep(25);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Could not acquire vault lock for ${lockPath}.`);
}

async function readVaultEntryOrNull(name: string) {
  try {
    return await readVaultEntry(name);
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  }
}

function mergeVaultSnapshot(current: AuthJson | null, source: AuthJson) {
  const preserveVaultRefreshToken =
    !!current?.tokens?.refresh_token && isCurrentRefreshNewer(current, source);

  return parseAuthJson({
    ...(current ?? {}),
    ...source,
    tokens: {
      ...(current?.tokens ?? {}),
      ...(source.tokens ?? {}),
      refresh_token: preserveVaultRefreshToken
        ? current?.tokens?.refresh_token ?? source.tokens?.refresh_token ?? null
        : source.tokens?.refresh_token ?? current?.tokens?.refresh_token ?? null,
      account_id: source.tokens?.account_id ?? current?.tokens?.account_id ?? null,
    },
    last_refresh: preserveVaultRefreshToken
      ? current?.last_refresh ?? source.last_refresh ?? null
      : source.last_refresh ?? current?.last_refresh ?? null,
  });
}

function isCurrentRefreshNewer(current: AuthJson, source: AuthJson) {
  const currentRefresh = parseTimestamp(current.last_refresh);
  const sourceRefresh = parseTimestamp(source.last_refresh);

  if (currentRefresh === null) {
    return false;
  }

  if (sourceRefresh === null) {
    return true;
  }

  return currentRefresh > sourceRefresh;
}

function parseTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function isAlreadyExistsError(error: unknown) {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === 'EEXIST'
  );
}

function isMissingFileError(error: unknown) {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === 'ENOENT'
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
