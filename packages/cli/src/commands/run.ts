import { Command } from 'commander';
import { getActiveAccount, openStateDatabase } from '../core/db.js';
import { useAccount } from '../core/swap.js';

export function registerRunCommand(program: Command) {
  program
    .command('run')
    .description('Launch Codex using the currently active account.')
    .argument('[codexArgs...]', 'args forwarded to codex')
    .action(async (codexArgs: string[]) => {
      const db = openStateDatabase();

      try {
        const active = getActiveAccount(db);
        if (!active) {
          throw new Error('No active account recorded. Run `cs use <name>` first.');
        }

        process.exitCode = await useAccount(active.account, codexArgs);
      } finally {
        db.close();
      }
    });
}
