import { authFile } from '@codex-switch/shared';
import { Command } from 'commander';
import { access, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { parseAccountName } from '../core/auth-schema.js';
import { openStateDatabase } from '../core/db.js';
import { runCodexLogin } from '../core/launch.js';
import { ensureVaultSetup, loadAuthFromFile, upsertAccountFromAuth, writeVaultEntry } from '../core/vault.js';

export function registerAddCommand(program: Command) {
  program
    .command('add')
    .description('Run `codex login` in a temporary CODEX_HOME and save it into the vault.')
    .option('--name <name>', 'vault account name')
    .action(async (options: { name?: string }) => {
      await ensureVaultSetup();

      const tempHome = await mkdtemp(path.join(os.tmpdir(), 'codex-switch-'));
      const db = openStateDatabase();

      try {
        const name = parseAccountName(options.name ?? (await promptForName()));
        await runCodexLogin(tempHome);
        const tempAuthFile = path.join(tempHome, path.basename(authFile()));
        await access(tempAuthFile);

        const auth = await loadAuthFromFile(tempAuthFile);
        await writeVaultEntry(name, auth);
        upsertAccountFromAuth(db, name, auth);

        console.log(`Added account "${name}".`);
      } finally {
        db.close();
        await rm(tempHome, { recursive: true, force: true });
      }
    });
}

async function promptForName() {
  const cli = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return await cli.question('Account name: ');
  } finally {
    cli.close();
  }
}
