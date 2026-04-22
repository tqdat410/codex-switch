import { Command } from 'commander';
import { getActiveAccount, listAccounts, openStateDatabase } from '../core/db.js';

export function registerListCommand(program: Command) {
  program
    .command('ls')
    .description('List vault accounts.')
    .option('--json', 'print JSON output')
    .action((options: { json?: boolean }) => {
      const db = openStateDatabase();

      try {
        const active = getActiveAccount(db);
        const rows = listAccounts(db).map((account) => ({
          ...account,
          isActive: active?.account === account.name,
        }));

        if (options.json) {
          console.log(JSON.stringify(rows, null, 2));
          return;
        }

        if (rows.length === 0) {
          console.log('No accounts in vault.');
          return;
        }

        console.table(
          rows.map((row) => ({
            active: row.isActive ? '*' : '',
            name: row.name,
            email: row.email ?? '',
            plan: row.plan ?? '',
            lastUsed: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : '',
          })),
        );
      } finally {
        db.close();
      }
    });
}
