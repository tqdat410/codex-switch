import type { AccountSummary, QuotaSample, SessionRow } from '@codex-switch/shared';
import {
  latestQuotaPerAccountSql,
  recentSessionsSql,
  requestsPerDaySql,
  tokensPerWeekSql,
  vaultStateFile,
} from '@codex-switch/shared';
import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
import { eachLocalDayBucket } from './day-buckets';

type UsagePoint = Record<string, number | string>;

export interface UsageSnapshot {
  accounts: string[];
  requestsPerDay: UsagePoint[];
  tokensPerWeek: UsagePoint[];
}

export function readAccountsSnapshot(): AccountSummary[] {
  return withDatabase((db) => {
    const active = db
      .prepare('SELECT account FROM active WHERE id = 1')
      .get() as { account: string } | undefined;
    const latestQuotaRows = db.prepare(latestQuotaPerAccountSql).all() as Array<{
      account: string;
      captured_at: number;
      limit_kind: string;
      used: number | null;
      remaining: number | null;
      reset_at: number | null;
      source: string;
    }>;
    const quotaMap = new Map<string, QuotaSample>(
      latestQuotaRows.map((row) => [
        row.account,
        {
          account: row.account,
          capturedAt: row.captured_at,
          limitKind: row.limit_kind,
          used: row.used,
          remaining: row.remaining,
          resetAt: row.reset_at,
          source: row.source,
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
      latestQuota: quotaMap.get(account.name) ?? null,
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
    const tokenRows = db.prepare(tokensPerWeekSql).all(from, to) as Array<{
      account: string;
      bucket: string;
      token_in: number;
      token_out: number;
    }>;
    const accountSet = new Set<string>();

    requestRows.forEach((row) => accountSet.add(row.account));
    tokenRows.forEach((row) => accountSet.add(row.account));

    const accounts = Array.from(accountSet).sort();
    const requestBuckets = new Map<string, UsagePoint>();
    const tokenBuckets = new Map<string, UsagePoint>();

    for (const bucket of eachLocalDayBucket(from, to)) {
      requestBuckets.set(bucket, { bucket });
    }

    for (const row of requestRows) {
      const entry = requestBuckets.get(row.bucket) ?? { bucket: row.bucket };
      entry[row.account] = row.request_count;
      requestBuckets.set(row.bucket, entry);
    }

    for (const row of tokenRows) {
      const entry = tokenBuckets.get(row.bucket) ?? { bucket: row.bucket };
      entry[`${row.account}_in`] = row.token_in;
      entry[`${row.account}_out`] = row.token_out;
      tokenBuckets.set(row.bucket, entry);
    }

    return {
      accounts,
      requestsPerDay: Array.from(requestBuckets.values()),
      tokensPerWeek: Array.from(tokenBuckets.values()),
    };
  }, { accounts: [], requestsPerDay: [], tokensPerWeek: [] });
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
