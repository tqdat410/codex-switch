import type {
  AccountRecord,
  ActiveAccountState,
  SessionRow,
} from '@codex-switch/shared';
import { STATE_SCHEMA_SQL, vaultStateFile } from '@codex-switch/shared';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

export type StateDatabase = Database.Database;

export function openStateDatabase(options?: { readonly?: boolean }): StateDatabase {
  const readonly = options?.readonly ?? false;
  if (!readonly) {
    mkdirSync(path.dirname(vaultStateFile()), { recursive: true });
  }
  const db = new Database(vaultStateFile(), {
    readonly,
    fileMustExist: readonly,
  });

  if (readonly) {
    db.pragma('query_only = ON');
    return db;
  }

  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.exec(STATE_SCHEMA_SQL);
  return db;
}

export function getActiveAccount(db: StateDatabase): ActiveAccountState | null {
  const row = db
    .prepare('SELECT account, switched_at FROM active WHERE id = 1')
    .get() as { account: string; switched_at: number } | undefined;
  return row ? { account: row.account, switchedAt: row.switched_at } : null;
}

export function setActiveAccount(db: StateDatabase, account: string) {
  db.prepare(
    `INSERT INTO active (id, account, switched_at)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET account = excluded.account, switched_at = excluded.switched_at`,
  ).run(account, Date.now());
}

export function clearActiveAccount(db: StateDatabase) {
  db.prepare('DELETE FROM active WHERE id = 1').run();
}

export function listAccounts(db: StateDatabase): AccountRecord[] {
  const rows = db
    .prepare(
      `SELECT name, email, plan, added_at, last_used_at, notes
       FROM accounts
       ORDER BY COALESCE(last_used_at, added_at) DESC, name ASC`,
    )
    .all() as Array<{
    name: string;
    email: string | null;
    plan: string | null;
    added_at: number;
    last_used_at: number | null;
    notes: string | null;
  }>;

  return rows.map((row) => ({
    name: row.name,
    email: row.email,
    plan: row.plan,
    addedAt: row.added_at,
    lastUsedAt: row.last_used_at,
    notes: row.notes,
  }));
}

export function upsertAccount(
  db: StateDatabase,
  account: Pick<AccountRecord, 'name' | 'email' | 'plan' | 'notes'> & {
    touchLastUsed?: boolean;
  },
) {
  const now = Date.now();
  const lastUsedAt = account.touchLastUsed ? now : null;

  db.prepare(
    `INSERT INTO accounts (name, email, plan, added_at, last_used_at, notes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET
       email = excluded.email,
       plan = excluded.plan,
       last_used_at = COALESCE(excluded.last_used_at, accounts.last_used_at),
       notes = excluded.notes`,
  ).run(account.name, account.email, account.plan, now, lastUsedAt, account.notes);
}

export function touchAccountLastUsed(db: StateDatabase, name: string) {
  db.prepare('UPDATE accounts SET last_used_at = ? WHERE name = ?').run(Date.now(), name);
}

export function removeAccount(db: StateDatabase, name: string) {
  db.prepare('DELETE FROM accounts WHERE name = ?').run(name);
  db.prepare('DELETE FROM quota_cache WHERE account = ?').run(name);
  db.prepare('DELETE FROM quota_samples WHERE account = ?').run(name);
  db.prepare('DELETE FROM account_auth_state WHERE account = ?').run(name);
  db.prepare('DELETE FROM sessions WHERE account = ?').run(name);
}

export function upsertSession(db: StateDatabase, session: SessionRow) {
  db.prepare(
    `INSERT INTO sessions
      (session_id, account, started_at, ended_at, request_count, token_in, token_out)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(session_id) DO UPDATE SET
       account = excluded.account,
       started_at = MIN(sessions.started_at, excluded.started_at),
       ended_at = COALESCE(excluded.ended_at, sessions.ended_at),
       request_count = MAX(sessions.request_count, excluded.request_count),
       token_in = COALESCE(excluded.token_in, sessions.token_in),
       token_out = COALESCE(excluded.token_out, sessions.token_out)`,
  ).run(
    session.sessionId,
    session.account,
    session.startedAt,
    session.endedAt,
    session.requestCount,
    session.tokenIn,
    session.tokenOut,
  );
}
