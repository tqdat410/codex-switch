import { OAuthRefreshError, refreshAccessToken } from '@codex-switch/shared';
import { clearAccountAuthState, upsertAccountAuthState } from './quota-cache.js';
import type { StateDatabase } from './db.js';
import { updateVaultEntry, upsertAccountFromAuth } from './vault.js';

export async function refreshVaultEntryTokens(name: string, db: StateDatabase) {
  try {
    const refreshed = await updateVaultEntry(name, async (current) => {
      if (!current) {
        throw createMissingVaultEntryError(name);
      }

      return refreshAccessToken(current);
    });

    if (!refreshed) {
      throw createMissingVaultEntryError(name);
    }

    upsertAccountFromAuth(db, name, refreshed);
    clearAccountAuthState(db, name);
    return refreshed;
  } catch (error) {
    if (error instanceof OAuthRefreshError && error.code === 'invalid_grant') {
      upsertAccountAuthState(db, {
        account: name,
        requiresReauth: true,
        lastError: error.code,
        lastErrorAt: Date.now(),
      });
    }

    throw error;
  }
}

function createMissingVaultEntryError(name: string) {
  const error = new Error(`Vault snapshot for ${name} is missing.`) as Error & {
    code?: string;
  };
  error.code = 'ENOENT';
  return error;
}
