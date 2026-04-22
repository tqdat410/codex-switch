import { spawn } from 'node:child_process';
import process from 'node:process';

export async function runCli(args: string[]) {
  const invocation = resolveCliInvocation(args);

  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(invocation.command, invocation.args, {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

export function openCliInNewTerminal(args: string[]) {
  const invocation = resolveCliInvocation(args);

  if (process.platform === 'win32') {
    const commandLine = [invocation.command, ...invocation.args].map(quoteWindows).join(' ');
    spawn('cmd.exe', ['/d', '/s', '/c', `start "codex-switch" ${commandLine}`], {
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    }).unref();
    return;
  }

  if (process.platform === 'darwin') {
    const commandLine = [invocation.command, ...invocation.args].map(quotePosix).join(' ');
    spawn(
      'osascript',
      ['-e', `tell application "Terminal" to do script ${quoteAppleScript(commandLine)}`],
      { detached: true, stdio: 'ignore' },
    ).unref();
    return;
  }

  spawn('x-terminal-emulator', ['-e', invocation.command, ...invocation.args], {
    detached: true,
    stdio: 'ignore',
  }).unref();
}

function resolveCliInvocation(args: string[]) {
  const entry = process.env.CS_CLI_ENTRY;
  if (entry) {
    return {
      command: process.env.CS_NODE_BINARY ?? process.execPath,
      args: [entry, ...args],
    };
  }

  return {
    command: 'cs',
    args,
  };
}

function quoteWindows(value: string) {
  if (!/[ \t"]/u.test(value)) {
    return value;
  }

  return JSON.stringify(value);
}

function quotePosix(value: string) {
  const escapedSingleQuote = String.raw`'"'"'`;
  return `'${value.replaceAll("'", escapedSingleQuote)}'`;
}

function quoteAppleScript(value: string) {
  return JSON.stringify(value);
}
