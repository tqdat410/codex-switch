import { vaultLockFile } from '@codex-switch/shared';
import { randomUUID } from 'node:crypto';
import { access, open, readFile, rm, stat } from 'node:fs/promises';

interface LockState {
  pid: number;
  account: string;
  startedAt: number;
  token: string;
}

export async function acquireSessionLock(account: string) {
  const state: LockState = {
    pid: process.pid,
    account,
    startedAt: Date.now(),
    token: randomUUID(),
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await writeLockFile(state);

      return async () => {
        const current = await readStoredLock();
        if (current?.pid === state.pid && current.token === state.token) {
          await rm(vaultLockFile(), { force: true });
        }
      };
    } catch (error) {
      if (!isAlreadyExistsError(error)) {
        throw error;
      }

      const active = await readActiveLock();
      if (active) {
        throw new Error(
          `Codex appears to already be running under "${active.account}" (pid ${active.pid}).`,
        );
      }
    }
  }

  throw new Error('Could not acquire the Codex session lock.');
}

export async function readActiveLock() {
  const current = await readStoredLock();
  if (!current) {
    return null;
  }

  if (isProcessAlive(current.pid)) {
    return current;
  }

  await rm(vaultLockFile(), { force: true });
  return null;
}

async function writeLockFile(state: LockState) {
  const handle = await open(vaultLockFile(), 'wx');

  try {
    await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`, 'utf8');
  } finally {
    await handle.close();
  }
}

async function readStoredLock() {
  try {
    await access(vaultLockFile());
    const info = await stat(vaultLockFile());
    if (!info.isFile()) {
      return null;
    }
    const raw = await readFile(vaultLockFile(), 'utf8');
    return JSON.parse(raw) as LockState;
  } catch {
    return null;
  }
}

function isAlreadyExistsError(error: unknown) {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === 'EEXIST'
  );
}

function isProcessAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
