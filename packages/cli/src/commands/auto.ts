import { Command } from 'commander';
import { readConfig, setAutoSelectAccount } from '../core/config.js';

export function registerAutoCommand(program: Command) {
  program
    .command('auto')
    .description('Control automatic account selection for bare `cs`.')
    .argument('[state]', 'on, off, or status')
    .action(async (state?: string) => {
      if (!state || state === 'status') {
        const config = await readConfig();
        console.log(`auto account selection: ${config.autoSelectAccount ? 'on' : 'off'}`);
        return;
      }

      if (state !== 'on' && state !== 'off') {
        throw new Error('Expected `cs auto on`, `cs auto off`, or `cs auto status`.');
      }

      const next = await setAutoSelectAccount(state === 'on');
      console.log(`auto account selection: ${next.autoSelectAccount ? 'on' : 'off'}`);
    });
}
