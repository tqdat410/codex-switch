import { Command } from 'commander';
import { registerAddCommand } from './commands/add.js';
import { registerAutoCommand } from './commands/auto.js';
import { registerCurrentCommand } from './commands/current.js';
import { registerRemoveCommand } from './commands/rm.js';
import { registerStatusCommand } from './commands/status.js';
import { registerSyncCommand } from './commands/sync.js';
import { registerUseCommand } from './commands/use.js';
import { launchDefault } from './core/default-launch.js';
import { shouldUseDefaultLaunch } from './core/default-routing.js';
import { logger } from './util/logger.js';

const program = new Command();
const args = process.argv.slice(2);

program
  .name('codex-switch')
  .description('Switch between native Codex OAuth accounts without proxying.')
  .version('0.1.0');

registerUseCommand(program);
registerAddCommand(program);
registerAutoCommand(program);
registerRemoveCommand(program);
registerStatusCommand(program);
registerCurrentCommand(program);
registerSyncCommand(program);

await (shouldUseDefaultLaunch(args)
  ? launchDefault(args)
  : program.parseAsync(process.argv)
).then((exitCode) => {
  if (typeof exitCode === 'number') {
    process.exitCode = exitCode;
  }
}).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message);
  process.exitCode = 1;
});
