import { vaultLockFile } from '@codex-switch/shared';
import { existsSync, readFileSync, rmSync } from 'node:fs';

interface LockState {
  pid: number;
  account: string;
  startedAt: number;
}

export function readActiveLock() {
  if (!existsSync(vaultLockFile())) {
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(vaultLockFile(), 'utf8')) as LockState;
    if (isProcessAlive(parsed.pid)) {
      return parsed;
    }

    rmSync(vaultLockFile(), { force: true });
    return null;
  } catch {
    return null;
  }
}

function isProcessAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
