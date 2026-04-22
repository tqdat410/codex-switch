import { Command } from 'commander';
import { getActiveAccount, openStateDatabase } from '../core/db.js';

export function registerCurrentCommand(program: Command) {
  program
    .command('current')
    .description('Show the current active account.')
    .option('--json', 'print JSON output')
    .action((options: { json?: boolean }) => {
      const db = openStateDatabase();

      try {
        const active = getActiveAccount(db);
        if (options.json) {
          console.log(JSON.stringify(active, null, 2));
          return;
        }

        console.log(active?.account ?? '');
      } finally {
        db.close();
      }
    });
}
