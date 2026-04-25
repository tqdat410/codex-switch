import type { AccountAuthState, QuotaCacheRow, QuotaSnapshot } from '@codex-switch/shared';
import type { StateDatabase } from './db.js';

export function getQuotaCache(db: StateDatabase, account: string) {
  const row = db
    .prepare(
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
       WHERE account = ?`,
    )
    .get(account) as DatabaseQuotaCacheRow | undefined;

  return row ? mapQuotaCacheRow(row) : null;
}

export function upsertQuotaCache(
  db: StateDatabase,
  account: string,
  snapshot: QuotaSnapshot,
  staleReason: string | null = null,
) {
  db.prepare(
    `INSERT INTO quota_cache
      (account, captured_at, five_hour_percent, five_hour_reset_at, weekly_percent, weekly_reset_at, source, stale_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(account) DO UPDATE SET
       captured_at = excluded.captured_at,
       five_hour_percent = excluded.five_hour_percent,
       five_hour_reset_at = excluded.five_hour_reset_at,
       weekly_percent = excluded.weekly_percent,
       weekly_reset_at = excluded.weekly_reset_at,
       source = excluded.source,
       stale_reason = excluded.stale_reason`,
  ).run(
    account,
    snapshot.capturedAt,
    snapshot.fiveHour?.percentLeft ?? null,
    snapshot.fiveHour?.resetAt ?? null,
    snapshot.weekly?.percentLeft ?? null,
    snapshot.weekly?.resetAt ?? null,
    snapshot.source,
    staleReason,
  );
}

export function setQuotaCacheStaleReason(
  db: StateDatabase,
  account: string,
  staleReason: string | null,
) {
  db.prepare('UPDATE quota_cache SET stale_reason = ? WHERE account = ?').run(staleReason, account);
}

export function getAccountAuthState(db: StateDatabase, account: string): AccountAuthState {
  const row = db
    .prepare(
      `SELECT account, requires_reauth, last_error, last_error_at
       FROM account_auth_state
       WHERE account = ?`,
    )
    .get(account) as DatabaseAccountAuthStateRow | undefined;

  if (row) {
    return mapAccountAuthState(row);
  }

  return {
    account,
    requiresReauth: false,
    lastError: null,
    lastErrorAt: null,
  };
}

export function getAllAccountAuthStates(db: StateDatabase) {
  const rows = db
    .prepare(
      `SELECT account, requires_reauth, last_error, last_error_at
       FROM account_auth_state`,
    )
    .all() as DatabaseAccountAuthStateRow[];

  return Object.fromEntries(rows.map((row) => [row.account, mapAccountAuthState(row)])) as Record<
    string,
    AccountAuthState
  >;
}

export function upsertAccountAuthState(
  db: StateDatabase,
  state: AccountAuthState,
) {
  db.prepare(
    `INSERT INTO account_auth_state (account, requires_reauth, last_error, last_error_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(account) DO UPDATE SET
       requires_reauth = excluded.requires_reauth,
       last_error = excluded.last_error,
       last_error_at = excluded.last_error_at`,
  ).run(
    state.account,
    state.requiresReauth ? 1 : 0,
    state.lastError,
    state.lastErrorAt,
  );
}

export function clearAccountAuthState(db: StateDatabase, account: string) {
  upsertAccountAuthState(db, {
    account,
    requiresReauth: false,
    lastError: null,
    lastErrorAt: null,
  });
}

function mapQuotaCacheRow(row: DatabaseQuotaCacheRow): QuotaCacheRow {
  return {
    account: row.account,
    capturedAt: row.captured_at,
    fiveHourPercent: row.five_hour_percent,
    fiveHourResetAt: row.five_hour_reset_at,
    weeklyPercent: row.weekly_percent,
    weeklyResetAt: row.weekly_reset_at,
    source: row.source,
    staleReason: row.stale_reason,
  };
}

function mapAccountAuthState(row: DatabaseAccountAuthStateRow): AccountAuthState {
  return {
    account: row.account,
    requiresReauth: row.requires_reauth === 1,
    lastError: row.last_error,
    lastErrorAt: row.last_error_at,
  };
}

interface DatabaseQuotaCacheRow {
  account: string;
  captured_at: number;
  five_hour_percent: number | null;
  five_hour_reset_at: number | null;
  weekly_percent: number | null;
  weekly_reset_at: number | null;
  source: QuotaCacheRow['source'];
  stale_reason: string | null;
}

interface DatabaseAccountAuthStateRow {
  account: string;
  requires_reauth: number;
  last_error: string | null;
  last_error_at: number | null;
}
