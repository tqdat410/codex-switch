import { formatQuotaErrorMessage, type QuotaErrorSummary } from '@codex-switch/shared';
import { Command } from 'commander';
import { getActiveAccount, listAccounts, openStateDatabase } from '../core/db.js';
import {
  fetchQuotaWithCache,
  type FetchQuotaWithCacheResult,
} from '../core/quota-orchestrator.js';
import { formatListRows, type ListDisplayRow } from './quota-display.js';

export function registerStatusCommand(program: Command) {
  program
    .command('status')
    .description('Show vault accounts and cached quota.')
    .option('--json', 'print JSON output')
    .option('--refresh', 'refresh quota before printing')
    .action(async (options: { json?: boolean; refresh?: boolean }) => {
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

        console.log(formatListRows(rows));
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
