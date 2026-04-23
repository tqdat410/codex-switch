import type {
  AccountSummary,
  AccountUsageSnapshot,
  SessionRow,
} from '@codex-switch/shared';
import {
  formatQuotaErrorMessage,
  recentSessionsSql,
  requestsPerDaySql,
  vaultStateFile,
} from '@codex-switch/shared';
import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
import { eachLocalDayBucket } from './day-buckets';

type UsagePoint = Record<string, number | string>;

export interface UsageSnapshot {
  accounts: string[];
  requestsPerDay: UsagePoint[];
}

export function readAccountsSnapshot(): AccountSummary[] {
  return withDatabase((db) => {
    const active = db
      .prepare('SELECT account FROM active WHERE id = 1')
      .get() as { account: string } | undefined;
    const latestQuotaRows = safeAll<{
      account: string;
      captured_at: number;
      five_hour_percent: number | null;
      five_hour_reset_at: number | null;
      weekly_percent: number | null;
      weekly_reset_at: number | null;
      source: 'wham' | 'codex';
      stale_reason: string | null;
    }>(
      db,
      `SELECT
         account,
         captured_at,
         five_hour_percent,
         five_hour_reset_at,
         weekly_percent,
         weekly_reset_at,
         source,
         stale_reason
       FROM quota_cache
       ORDER BY captured_at DESC, account ASC`,
    );
    const quotaMap = new Map<string, AccountUsageSnapshot>(
      latestQuotaRows.map((row) => [
        row.account,
        {
          fiveHour: {
            percentLeft: row.five_hour_percent,
            resetAt: row.five_hour_reset_at,
          },
          weekly: {
            percentLeft: row.weekly_percent,
            resetAt: row.weekly_reset_at,
          },
          capturedAt: row.captured_at,
          ageMs: Math.max(0, Date.now() - row.captured_at),
          requiresReauth: row.stale_reason === 'requires_reauth',
          source: 'cache',
          error: row.stale_reason
            ? {
                code: row.stale_reason,
                message: formatQuotaError(row.stale_reason),
              }
            : null,
        },
      ]),
    );
    const authStateRows = safeAll<{
      account: string;
      requires_reauth: number;
      last_error: string | null;
    }>(
      db,
      `SELECT account, requires_reauth, last_error
       FROM account_auth_state`,
    );
    const authStateMap = new Map(
      authStateRows.map((row) => [
        row.account,
        {
          requiresReauth: row.requires_reauth === 1,
          lastError: row.last_error,
        },
      ]),
    );

    const accounts = db.prepare(
      `SELECT name, email, plan, added_at, last_used_at, notes
       FROM accounts
       ORDER BY COALESCE(last_used_at, added_at) DESC, name ASC`,
    ).all() as Array<{
      name: string;
      email: string | null;
      plan: string | null;
      added_at: number;
      last_used_at: number | null;
      notes: string | null;
    }>;

    return accounts.map((account) => ({
      name: account.name,
      email: account.email,
      plan: account.plan,
      addedAt: account.added_at,
      lastUsedAt: account.last_used_at,
      notes: account.notes,
      isActive: active?.account === account.name,
      latestQuota: mergeUsageState(
        quotaMap.get(account.name) ?? null,
        authStateMap.get(account.name),
      ),
    }));
  }, []);
}

export function readUsageSnapshot(from: number, to: number): UsageSnapshot {
  return withDatabase((db) => {
    const requestRows = db.prepare(requestsPerDaySql).all(from, to) as Array<{
      account: string;
      bucket: string;
      request_count: number;
    }>;
    const accountSet = new Set<string>();

    requestRows.forEach((row) => accountSet.add(row.account));

    const accounts = Array.from(accountSet).sort();
    const requestBuckets = new Map<string, UsagePoint>();

    for (const bucket of eachLocalDayBucket(from, to)) {
      requestBuckets.set(bucket, { bucket });
    }

    for (const row of requestRows) {
      const entry = requestBuckets.get(row.bucket) ?? { bucket: row.bucket };
      entry[row.account] = row.request_count;
      requestBuckets.set(row.bucket, entry);
    }

    return {
      accounts,
      requestsPerDay: Array.from(requestBuckets.values()),
    };
  }, { accounts: [], requestsPerDay: [] });
}

export function readRecentSessions(limit: number, offset: number) {
  return withDatabase(
    (db) => {
      const rows = db.prepare(recentSessionsSql).all(limit, offset) as Array<{
        session_id: string;
        account: string;
        started_at: number;
        ended_at: number | null;
        request_count: number;
        token_in: number | null;
        token_out: number | null;
      }>;
      const total = db.prepare('SELECT COUNT(*) AS total FROM sessions').get() as {
        total: number;
      };

      return {
        rows: rows.map(
          (row) =>
            ({
              sessionId: row.session_id,
              account: row.account,
              startedAt: row.started_at,
              endedAt: row.ended_at,
              requestCount: row.request_count,
              tokenIn: row.token_in,
              tokenOut: row.token_out,
            }) satisfies SessionRow,
        ),
        total: total.total,
      };
    },
    { rows: [], total: 0 },
  );
}

function withDatabase<T>(run: (db: Database.Database) => T, fallback: T) {
  if (!existsSync(vaultStateFile())) {
    return fallback;
  }

  const db = new Database(vaultStateFile(), {
    readonly: true,
    fileMustExist: true,
  });

  try {
    db.pragma('query_only = ON');
    return run(db);
  } catch {
    return fallback;
  } finally {
    db.close();
  }
}

function safeAll<T>(db: Database.Database, sql: string, ...params: unknown[]) {
  try {
    return db.prepare(sql).all(...params) as T[];
  } catch {
    return [];
  }
}

function mergeUsageState(
  usage: AccountUsageSnapshot | null,
  authState:
    | {
        requiresReauth: boolean;
        lastError: string | null;
      }
    | undefined,
) {
  if (!usage && !authState) {
    return null;
  }

  if (!authState) {
    return usage;
  }

  return {
    fiveHour: usage?.fiveHour ?? null,
    weekly: usage?.weekly ?? null,
    capturedAt: usage?.capturedAt ?? null,
    ageMs: usage?.ageMs ?? null,
    requiresReauth: authState.requiresReauth,
    source: usage?.source ?? null,
    error: authState.lastError
      ? {
          code: authState.lastError,
          message: formatQuotaError(authState.lastError),
        }
      : usage?.error ?? null,
  } satisfies AccountUsageSnapshot;
}

function formatQuotaError(code: string) {
  return formatQuotaErrorMessage(code);
}
