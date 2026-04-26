import { spawn } from 'node:child_process';

export function spawnDetachedCli(args: string[]) {
  const entry = process.argv[1];
  if (!entry) {
    throw new Error('Cannot determine codex-switch CLI entrypoint.');
  }

  const child = spawn(process.execPath, [entry, ...args], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });

  child.unref();
  return child.pid ?? null;
}

export function isProcessRunning(pid: number | null | undefined) {
  if (!pid || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function stopProcess(pid: number | null | undefined) {
  if (!isProcessRunning(pid)) {
    return false;
  }

  process.kill(pid as number, 'SIGTERM');
  return true;
}
