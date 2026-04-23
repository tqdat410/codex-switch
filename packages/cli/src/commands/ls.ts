import { formatQuotaErrorMessage, type QuotaErrorSummary } from '@codex-switch/shared';
import { Command } from 'commander';
import { getActiveAccount, listAccounts, openStateDatabase } from '../core/db.js';
import {
  fetchQuotaWithCache,
  type FetchQuotaWithCacheResult,
} from '../core/quota-orchestrator.js';

export function registerListCommand(program: Command) {
  program
    .command('ls')
    .description('List vault accounts.')
    .option('--json', 'print JSON output')
    .option('--refresh', 'refresh quota before printing')
    .action(async (options: { json?: boolean; refresh?: boolean }) => {
      const db = openStateDatabase();

      try {
        const active = getActiveAccount(db);
        const accounts = listAccounts(db);
        const rows = [];

        for (const account of accounts) {
          const quota = await readQuotaState(account.name, options.refresh ?? false);

          rows.push({
            ...account,
            isActive: active?.account === account.name,
            latestQuota: quota.row,
            requiresReauth: quota.requiresReauth,
            quotaSource: quota.source,
            quotaError: quota.error,
          });
        }

        if (options.json) {
          console.log(JSON.stringify(rows, null, 2));
          return;
        }

        if (rows.length === 0) {
          console.log('No accounts in vault.');
          return;
        }

        console.table(
          rows.map((row) => ({
            active: row.isActive ? '*' : '',
            name: row.name,
            email: row.email ?? '',
            plan: row.plan ?? '',
            quota: row.requiresReauth ? 'reauth required' : formatQuotaCell(row.latestQuota),
            lastUsed: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : '',
          })),
        );
      } finally {
        db.close();
      }
    });
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

function formatQuotaCell(
  quota: {
    fiveHourPercent: number | null;
    weeklyPercent: number | null;
    staleReason: string | null;
  } | null,
) {
  if (!quota) {
    return 'quota unavailable';
  }

  const pieces = [];
  if (quota.fiveHourPercent !== null) {
    pieces.push(`5h ${Math.round(quota.fiveHourPercent)}%`);
  }

  if (quota.weeklyPercent !== null) {
    pieces.push(`7d ${Math.round(quota.weeklyPercent)}%`);
  }

  if (quota.staleReason && quota.staleReason !== 'requires_reauth') {
    pieces.push(`stale:${quota.staleReason}`);
  }

  return pieces.join(' · ') || 'quota unavailable';
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
