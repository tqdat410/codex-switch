const CODEX_SWITCH_COMMANDS = new Set([
  'add',
  'auto',
  'cache',
  'current',
  'help',
  '__cache-worker',
  'rm',
  'remove',
  'status',
  'sync',
  'switch',
  'use',
]);

const ROOT_HELP_ARGS = new Set(['-h', '--help', '-V', '--version']);

export function shouldUseDefaultLaunch(args: string[]) {
  const first = args[0];
  if (!first) {
    return true;
  }

  if (ROOT_HELP_ARGS.has(first)) {
    return false;
  }

  return !CODEX_SWITCH_COMMANDS.has(first);
}
