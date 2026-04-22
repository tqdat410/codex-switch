import { Command } from 'commander';
import { syncActiveAccount } from '../core/swap.js';

export function registerSyncCommand(program: Command) {
  program
    .command('sync')
    .description('Sync the current ~/.codex/auth.json back into the active vault entry.')
    .action(async () => {
      const account = await syncActiveAccount();
      console.log(`Synced auth.json back into "${account}".`);
    });
}
