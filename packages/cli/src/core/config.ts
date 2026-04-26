import { vaultConfigFile } from '@codex-switch/shared';
import { readFile } from 'node:fs/promises';
import { writeJsonAtomic } from '../util/atomic-write.js';

export interface CodexSwitchConfig {
  autoSelectAccount: boolean;
  quotaCacheConcurrency: number;
  quotaCacheIntervalMs: number;
}

const DEFAULT_CONFIG: CodexSwitchConfig = {
  autoSelectAccount: true,
  quotaCacheConcurrency: 3,
  quotaCacheIntervalMs: 60_000,
};

export async function readConfig(): Promise<CodexSwitchConfig> {
  return readConfigWithEnv(true);
}

async function readConfigWithEnv(includeEnv: boolean): Promise<CodexSwitchConfig> {
  try {
    const raw = await readFile(vaultConfigFile(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<CodexSwitchConfig>;

    return mergeConfig(parsed, includeEnv);
  } catch (error) {
    if (isMissingFileError(error) || error instanceof SyntaxError) {
      return mergeConfig({}, includeEnv);
    }

    throw error;
  }
}

function mergeConfig(parsed: Partial<CodexSwitchConfig>, includeEnv: boolean): CodexSwitchConfig {
  return {
    autoSelectAccount:
      typeof parsed.autoSelectAccount === 'boolean'
        ? parsed.autoSelectAccount
        : DEFAULT_CONFIG.autoSelectAccount,
    quotaCacheConcurrency: readPositiveInteger(
      includeEnv ? process.env.CODEX_SWITCH_QUOTA_CACHE_CONCURRENCY : undefined,
      parsed.quotaCacheConcurrency,
      DEFAULT_CONFIG.quotaCacheConcurrency,
    ),
    quotaCacheIntervalMs: readPositiveInteger(
      includeEnv ? process.env.CODEX_SWITCH_QUOTA_CACHE_INTERVAL_MS : undefined,
      parsed.quotaCacheIntervalMs,
      DEFAULT_CONFIG.quotaCacheIntervalMs,
    ),
  };
}

function readPositiveInteger(
  envValue: string | undefined,
  configValue: unknown,
  fallback: number,
) {
  const fromEnv = parsePositiveInteger(envValue);
  if (fromEnv !== null) {
    return fromEnv;
  }

  const fromConfig = typeof configValue === 'number' ? parsePositiveInteger(String(configValue)) : null;
  return fromConfig ?? fallback;
}

function parsePositiveInteger(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function setAutoSelectAccount(enabled: boolean) {
  const current = await readConfigWithEnv(false);
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
