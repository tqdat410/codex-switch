import { Command } from 'commander';
import { selectAccountForSwitch } from '../core/switch-selection.js';
import { switchAccount } from '../core/swap.js';

export function registerSwitchCommand(program: Command) {
  program
    .command('switch')
    .description('Automatically switch to the best available account without launching Codex.')
    .action(async () => {
      const account = await selectAccountForSwitch();
      if (!account) {
        throw new Error('No accounts in vault. Run `cs add --name <name>` first.');
      }

      await switchAccount(account);
      console.log(`Switched to ${account}.`);
    });
}
