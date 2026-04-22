import { Command } from 'commander';
import { registerAddCommand } from './commands/add.js';
import { registerCurrentCommand } from './commands/current.js';
import { registerDashCommand } from './commands/dash.js';
import { registerListCommand } from './commands/ls.js';
import { registerRemoveCommand } from './commands/rm.js';
import { registerRunCommand } from './commands/run.js';
import { registerSyncCommand } from './commands/sync.js';
import { registerUseCommand } from './commands/use.js';
import { useAccount } from './core/swap.js';
import { pickAccountFromTui } from './tui/account-picker.js';
import { logger } from './util/logger.js';

const program = new Command();

program
  .name('codex-switch')
  .description('Switch between native Codex OAuth accounts without proxying.')
  .version('0.1.0');

registerUseCommand(program);
registerRunCommand(program);
registerAddCommand(program);
registerRemoveCommand(program);
registerListCommand(program);
registerCurrentCommand(program);
registerDashCommand(program);
registerSyncCommand(program);

program.action(async () => {
  const name = await pickAccountFromTui();
  if (!name) {
    return;
  }

  process.exitCode = await useAccount(name, []);
});

await program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message);
  process.exitCode = 1;
});
