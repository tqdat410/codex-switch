import { createLogWatcher } from '../core/log-watcher.js';
import { Command } from 'commander';
import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import getPort from 'get-port';
import open from 'open';

export function registerDashCommand(program: Command) {
  program
    .command('dash')
    .description('Start the local dashboard and open it in a browser.')
    .action(async () => {
      const runtime = resolveRuntimePaths();
      await ensureDashboardBuild(runtime);
      await copyStandaloneAssets(runtime);

      const port = await getPort();
      const watcher = createLogWatcher();
      await watcher.start();

      const child = execa(process.execPath, [runtime.serverEntry], {
        cwd: runtime.standaloneRoot,
        stdio: 'inherit',
        env: {
          ...process.env,
          HOSTNAME: '127.0.0.1',
          PORT: String(port),
          CS_CLI_ENTRY: runtime.cliEntry,
          CS_NODE_BINARY: process.execPath,
        },
      });

      const cleanup = async () => {
        child.kill('SIGTERM');
        await watcher.stop();
      };

      const onSigint = () => {
        void cleanup();
      };
      const onSigterm = () => {
        void cleanup();
      };

      process.once('SIGINT', onSigint);
      process.once('SIGTERM', onSigterm);

      if (process.env.CODEX_SWITCH_NO_OPEN !== '1') {
        await open(`http://127.0.0.1:${port}`);
      }

      try {
        await child;
      } finally {
        process.removeListener('SIGINT', onSigint);
        process.removeListener('SIGTERM', onSigterm);
        await watcher.stop();
      }
    });
}

function resolveRuntimePaths() {
  const commandDir = dirname(fileURLToPath(import.meta.url));
  const cliPackageDir = resolve(commandDir, '..', '..');
  const workspacePackagesDir = resolve(cliPackageDir, '..');
  const workspaceRoot = resolve(workspacePackagesDir, '..');
  const dashboardPackageDir = join(workspacePackagesDir, 'dashboard');
  const standaloneRoot = join(dashboardPackageDir, '.next', 'standalone');

  return {
    workspaceRoot,
    dashboardPackageDir,
    standaloneRoot,
    serverEntry: join(standaloneRoot, 'packages', 'dashboard', 'server.js'),
    staticSource: join(dashboardPackageDir, '.next', 'static'),
    publicSource: join(dashboardPackageDir, 'public'),
    staticDestination: join(
      standaloneRoot,
      'packages',
      'dashboard',
      '.next',
      'static',
    ),
    publicDestination: join(standaloneRoot, 'packages', 'dashboard', 'public'),
    cliEntry: join(cliPackageDir, 'dist', 'index.js'),
  };
}

async function ensureDashboardBuild(runtime: ReturnType<typeof resolveRuntimePaths>) {
  if (existsSync(runtime.serverEntry) && process.env.CODEX_SWITCH_FORCE_DASH_BUILD !== '1') {
    return;
  }

  await execa('pnpm', ['--filter', '@codex-switch/dashboard', 'build'], {
    cwd: runtime.workspaceRoot,
    stdio: 'inherit',
  });
}

async function copyStandaloneAssets(runtime: ReturnType<typeof resolveRuntimePaths>) {
  await mkdir(dirname(runtime.staticDestination), { recursive: true });
  if (existsSync(runtime.staticSource)) {
    await cp(runtime.staticSource, runtime.staticDestination, {
      recursive: true,
      force: true,
    });
  }

  if (existsSync(runtime.publicSource)) {
    await cp(runtime.publicSource, runtime.publicDestination, {
      recursive: true,
      force: true,
    });
  }
}
