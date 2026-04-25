import process from 'node:process';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';

const rootDir = process.cwd();
const cliDistDir = path.join(rootDir, 'packages', 'cli', 'dist');
const sharedDistEntry = path.join(rootDir, 'packages', 'shared', 'dist', 'index.js');

await rm(new URL('../packages/shared/dist/', import.meta.url), {
  recursive: true,
  force: true,
});
await rm(new URL('../packages/cli/dist/', import.meta.url), {
  recursive: true,
  force: true,
});

await runCommand('pnpm', ['--filter', '@codex-switch/shared', 'build']);
await runCommand('pnpm', ['--filter', '@codex-switch/cli', 'build']);
await rewriteSharedPackageImports();

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const [executable, commandArgs] = resolveCommand(command, args);
    const child = spawn(executable, commandArgs, {
      cwd: rootDir,
      stdio: 'inherit',
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

function resolveCommand(command, args) {
  if (process.platform !== 'win32') {
    return [command, args];
  }

  return [
    process.env.ComSpec ?? 'cmd.exe',
    ['/d', '/s', '/c', [command, ...args].join(' ')],
  ];
}

async function rewriteSharedPackageImports() {
  const files = await listFiles(cliDistDir);

  await Promise.all(
    files
      .filter((file) => file.endsWith('.js') || file.endsWith('.d.ts'))
      .map(async (file) => {
        const input = await readFile(file, 'utf8');
        if (!input.includes('@codex-switch/shared')) {
          return;
        }

        const relativeImport = toModuleSpecifier(
          path.relative(path.dirname(file), sharedDistEntry),
        );
        const output = input
          .replaceAll("'@codex-switch/shared'", `'${relativeImport}'`)
          .replaceAll('"@codex-switch/shared"', `"${relativeImport}"`);

        await writeFile(file, output, 'utf8');
      }),
  );
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(fullPath) : fullPath;
    }),
  );

  return files.flat();
}

function toModuleSpecifier(relativePath) {
  const normalized = relativePath.replaceAll(path.sep, '/');
  return normalized.startsWith('.') ? normalized : `./${normalized}`;
}
