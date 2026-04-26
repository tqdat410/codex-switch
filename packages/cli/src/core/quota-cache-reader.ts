import type { AccountAuthState, AccountRecord, ActiveAccountState, QuotaCacheRow } from '@codex-switch/shared';
import { vaultStateFile } from '@codex-switch/shared';
import { existsSync } from 'node:fs';
import { getActiveAccount, listAccounts, openStateDatabase } from './db.js';
import { getAllAccountAuthStates, getQuotaCache } from './quota-cache.js';

export interface CachedQuotaState {
  accounts: AccountRecord[];
  active: ActiveAccountState | null;
  authStates: Record<string, AccountAuthState>;
  quotas: Record<string, QuotaCacheRow | null>;
}

export function readCachedQuotaState(): CachedQuotaState {
  if (!existsSync(vaultStateFile())) {
    return {
      accounts: [],
      active: null,
      authStates: {},
      quotas: {},
    };
  }

  const db = openStateDatabase({ readonly: true });

  try {
    const accounts = listAccounts(db);
    const quotas = Object.fromEntries(
      accounts.map((account) => [account.name, getQuotaCache(db, account.name)]),
    );

    return {
      accounts,
      active: getActiveAccount(db),
      authStates: getAllAccountAuthStates(db),
      quotas,
    };
  } finally {
    db.close();
  }
}
