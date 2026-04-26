import { formatQuotaErrorMessage, type QuotaErrorSummary } from '@codex-switch/shared';
import { Command } from 'commander';
import { getActiveAccount, listAccounts, openStateDatabase } from '../core/db.js';
import {
  fetchQuotaWithCache,
  type FetchQuotaWithCacheResult,
} from '../core/quota-orchestrator.js';
import { getAccountAuthState, getQuotaCache } from '../core/quota-cache.js';
import { formatListRows, type ListDisplayRow } from './quota-display.js';

export function registerStatusCommand(program: Command) {
  program
    .command('status')
    .description('Show vault accounts and cached quota.')
    .option('--json', 'print JSON output')
    .option('--private', 'mask email addresses in terminal table output')
    .option('--refresh', 'refresh quota before printing')
    .action(async (options: { json?: boolean; private?: boolean; refresh?: boolean }) => {
      if (options.json && options.private) {
        throw new Error('`cs status --private` is only supported for table output.');
      }

      const db = openStateDatabase();

      try {
        const active = getActiveAccount(db);
        const accounts = listAccounts(db);
        const rows: ListDisplayRow[] = [];

        for (const account of accounts) {
          const quota = await readQuotaState(account.name, options.refresh ?? false);

          rows.push({
            ...account,
            isActive: active?.account === account.name,
            latestQuota: quota.row,
            requiresReauth: quota.requiresReauth,
            quotaReason: quota.reason,
            quotaSource: quota.source,
            quotaError: quota.error,
          });
        }

        if (options.json) {
          console.log(JSON.stringify(rows.map(toJsonRow), null, 2));
          return;
        }

        if (rows.length === 0) {
          console.log('No accounts in vault.');
          return;
        }

        console.log(formatListRows(rows, { private: options.private ?? false }));
        if (!options.refresh && rows.every((row) => !row.latestQuota)) {
          console.log('Quota cache empty. Run `cs cache start` or `cs status --refresh`.');
        }
      } finally {
        db.close();
      }
    });
}

function toJsonRow(row: ListDisplayRow) {
  const jsonRow: Partial<ListDisplayRow> = { ...row };
  delete jsonRow.quotaReason;
  return jsonRow;
}

async function readQuotaState(
  account: string,
  force: boolean,
): Promise<FetchQuotaWithCacheResult> {
  if (!force) {
    return readCachedQuotaState(account);
  }

  try {
    return await fetchQuotaWithCache(account, { force });
  } catch (error) {
    const code = readQuotaErrorCode(error);

    return {
      row: null,
      fresh: false,
      reason: code === 'endpoint_gone' ? 'endpoint_gone' : 'stale_network',
      requiresReauth: isReauthErrorCode(code),
      source: null,
      error: toQuotaErrorSummary(code, error),
    };
  }
}

function readCachedQuotaState(account: string): FetchQuotaWithCacheResult {
  const db = openStateDatabase({ readonly: true });

  try {
    const row = getQuotaCache(db, account);
    const authState = getAccountAuthState(db, account);
    const requiresReauth = authState.requiresReauth || row?.staleReason === 'requires_reauth';

    return {
      row,
      fresh: false,
      reason: requiresReauth ? 'requires_reauth' : 'cache',
      requiresReauth,
      source: row ? 'cache' : null,
      error: authState.lastError ? toQuotaErrorSummary(authState.lastError, null) : null,
    };
  } finally {
    db.close();
  }
}

function toQuotaErrorSummary(code: string, error: unknown): QuotaErrorSummary {
  return {
    code,
    message:
      code === 'unknown' && error instanceof Error && error.message
        ? error.message
        : formatQuotaErrorMessage(code),
  };
}

function readQuotaErrorCode(error: unknown) {
  return (
    (error instanceof Error &&
      'code' in error &&
      typeof error.code === 'string' &&
      error.code) ||
    'unknown'
  );
}

function isReauthErrorCode(code: string) {
  return (
    code === 'invalid_grant' ||
    code === 'requires_reauth' ||
    code === 'unauthorized' ||
    code === 'vault_missing' ||
    code === 'vault_invalid'
  );
}
