import { Command } from 'commander';
import { parseAccountName } from '../core/auth-schema.js';
import { getActiveAccount, openStateDatabase, removeAccount } from '../core/db.js';
import { removeVaultEntry } from '../core/vault.js';

export function registerRemoveCommand(program: Command) {
  program
    .command('rm')
    .description('Remove an account from the vault.')
    .argument('<name>', 'vault account name')
    .action(async (rawName: string) => {
      const name = parseAccountName(rawName);
      const db = openStateDatabase();

      try {
        const active = getActiveAccount(db);
        if (active?.account === name) {
          throw new Error('Refusing to remove the active account.');
        }

        removeAccount(db, name);
        await removeVaultEntry(name);
        console.log(`Removed account "${name}".`);
      } finally {
        db.close();
      }
    });
}
