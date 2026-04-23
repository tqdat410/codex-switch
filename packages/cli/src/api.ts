export {
  fetchQuotaWithCache,
  type FetchQuotaReason,
  type FetchQuotaWithCacheOptions,
  type FetchQuotaWithCacheResult,
} from './core/quota-orchestrator.js';

import { vaultStateFile } from '@codex-switch/shared';
import { existsSync } from 'node:fs';
import { listAccounts, openStateDatabase } from './core/db.js';

export function listKnownAccounts() {
  if (!existsSync(vaultStateFile())) {
    return [];
  }

  try {
    const db = openStateDatabase({ readonly: true });

    try {
      return listAccounts(db);
    } finally {
      db.close();
    }
  } catch (error) {
    if (isMissingStateDatabaseError(error)) {
      return [];
    }

    throw error;
  }
}

function isMissingStateDatabaseError(error: unknown) {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === 'SQLITE_CANTOPEN'
  );
}
