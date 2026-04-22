import { Command } from 'commander';
import { parseAccountName } from '../core/auth-schema.js';
import { useAccount } from '../core/swap.js';

export function registerUseCommand(program: Command) {
  program
    .command('use')
    .description('Switch to an account, then launch Codex.')
    .argument('<name>', 'vault account name')
    .argument('[codexArgs...]', 'args forwarded to codex')
    .action(async (rawName: string, codexArgs: string[]) => {
      const name = parseAccountName(rawName);
      process.exitCode = await useAccount(name, codexArgs);
    });
}
