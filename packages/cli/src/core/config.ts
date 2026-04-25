import { vaultConfigFile } from '@codex-switch/shared';
import { readFile } from 'node:fs/promises';
import { writeJsonAtomic } from '../util/atomic-write.js';

export interface CodexSwitchConfig {
  autoSelectAccount: boolean;
}

const DEFAULT_CONFIG: CodexSwitchConfig = {
  autoSelectAccount: true,
};

export async function readConfig(): Promise<CodexSwitchConfig> {
  try {
    const raw = await readFile(vaultConfigFile(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<CodexSwitchConfig>;

    return {
      autoSelectAccount:
        typeof parsed.autoSelectAccount === 'boolean'
          ? parsed.autoSelectAccount
          : DEFAULT_CONFIG.autoSelectAccount,
    };
  } catch (error) {
    if (isMissingFileError(error) || error instanceof SyntaxError) {
      return { ...DEFAULT_CONFIG };
    }

    throw error;
  }
}

export async function setAutoSelectAccount(enabled: boolean) {
  const current = await readConfig();
  const next: CodexSwitchConfig = {
    ...current,
    autoSelectAccount: enabled,
  };

  await writeJsonAtomic(vaultConfigFile(), next);
  return next;
}

function isMissingFileError(error: unknown) {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === 'ENOENT'
  );
}
