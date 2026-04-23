import type { FetchQuotaWithCacheResult } from '@codex-switch/cli/api';
import {
  formatQuotaErrorMessage,
  type AccountUsageSnapshot,
  type QuotaErrorSummary,
  type UsageResponse,
} from '@codex-switch/shared';

export async function buildUsageResponse(
  accounts: string[],
  options: {
    ttlMs: number;
    fetchQuota: (account: string) => Promise<FetchQuotaWithCacheResult>;
    now?: () => number;
  },
): Promise<UsageResponse> {
  const now = options.now ?? Date.now;
  const payload: UsageResponse = {
    accounts: {},
    ttlMs: options.ttlMs,
  };

  for (const account of accounts) {
    try {
      const result = await options.fetchQuota(account);
      payload.accounts[account] = quotaResultToUsageSnapshot(result, now());
    } catch (error) {
      payload.accounts[account] = quotaErrorToUsageSnapshot(error);
    }
  }

  return payload;
}

export function quotaResultToUsageSnapshot(
  result: FetchQuotaWithCacheResult,
  now = Date.now(),
): AccountUsageSnapshot {
  return {
    fiveHour: result.row
      ? {
          percentLeft: result.row.fiveHourPercent,
          resetAt: result.row.fiveHourResetAt,
        }
      : null,
    weekly: result.row
      ? {
          percentLeft: result.row.weeklyPercent,
          resetAt: result.row.weeklyResetAt,
        }
      : null,
    capturedAt: result.row?.capturedAt ?? null,
    ageMs: result.row ? Math.max(0, now - result.row.capturedAt) : null,
    requiresReauth: result.requiresReauth,
    source: result.source,
    error: result.error,
  };
}

export function quotaErrorToUsageSnapshot(error: unknown): AccountUsageSnapshot {
  const code = readQuotaErrorCode(error);

  return {
    fiveHour: null,
    weekly: null,
    capturedAt: null,
    ageMs: null,
    requiresReauth: isReauthErrorCode(code),
    source: null,
    error: toQuotaErrorSummary(code, error),
  };
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
