import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();

await runCommand('pnpm', ['-r', 'build']);

const standaloneDir = path.join(
  rootDir,
  'packages',
  'dashboard',
  '.next',
  'standalone',
);
const staticDir = path.join(rootDir, 'packages', 'dashboard', '.next', 'static');
const publicDir = path.join(rootDir, 'packages', 'dashboard', 'public');

if (existsSync(standaloneDir)) {
  const standaloneDashboardDir = path.join(standaloneDir, 'packages', 'dashboard');
  await mkdir(path.join(standaloneDashboardDir, '.next'), { recursive: true });

  if (existsSync(staticDir)) {
    await cp(staticDir, path.join(standaloneDashboardDir, '.next', 'static'), {
      recursive: true,
      force: true,
    });
  }

  if (existsSync(publicDir)) {
    await cp(publicDir, path.join(standaloneDashboardDir, 'public'), {
      recursive: true,
      force: true,
    });
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
    });
  });
}
