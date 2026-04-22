import { execa } from 'execa';

export async function launchCodex(codexArgs: string[]) {
  if (process.env.CODEX_SWITCH_SKIP_LAUNCH === '1') {
    return 0;
  }

  const command = process.env.CODEX_SWITCH_CODEX_BIN ?? 'codex';
  const child = execa(command, codexArgs, {
    stdio: 'inherit',
    windowsHide: false,
  });

  const stopChild = () => {
    child.kill('SIGTERM');
  };

  process.once('SIGINT', stopChild);
  process.once('SIGTERM', stopChild);

  try {
    await child;
    return 0;
  } catch (error) {
    const exitCode = typeof error === 'object' && error && 'exitCode' in error ? error.exitCode : 1;
    return typeof exitCode === 'number' ? exitCode : 1;
  } finally {
    process.removeListener('SIGINT', stopChild);
    process.removeListener('SIGTERM', stopChild);
  }
}

export async function runCodexLogin(tempCodexHome: string) {
  const command = process.env.CODEX_SWITCH_CODEX_BIN ?? 'codex';
  await execa(command, ['login'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      CODEX_HOME: tempCodexHome,
    },
    windowsHide: false,
  });
}
