import os from 'node:os';
import path from 'node:path';

function homeRoot() {
  return os.homedir();
}

export function codexHome() {
  return process.env.CODEX_SWITCH_CODEX_HOME ?? path.join(homeRoot(), '.codex');
}

export function vaultRoot() {
  return process.env.CODEX_SWITCH_VAULT_ROOT ?? path.join(homeRoot(), '.codex-switch');
}

export function authFile() {
  return path.join(codexHome(), 'auth.json');
}

export function codexHistoryFile() {
  return path.join(codexHome(), 'history.jsonl');
}

export function codexLogsDatabaseFile() {
  return path.join(codexHome(), 'logs_2.sqlite');
}

export function sessionIndexFile() {
  return path.join(codexHome(), 'session_index.jsonl');
}

export function vaultAccountsDir() {
  return path.join(vaultRoot(), 'accounts');
}

export function vaultAccountFile(name: string) {
  return path.join(vaultAccountsDir(), `${name}.json`);
}

export function vaultStateFile() {
  return path.join(vaultRoot(), 'state.sqlite');
}

export function vaultConfigFile() {
  return path.join(vaultRoot(), 'config.json');
}

export function vaultLockFile() {
  return path.join(vaultRoot(), '.lock');
}
