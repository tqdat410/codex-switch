import type { StateDatabase } from './db.js';

export interface QuotaWorkerState {
  pid: number | null;
  startedAt: number | null;
  heartbeatAt: number | null;
  intervalMs: number;
  lastRunAt: number | null;
  lastError: string | null;
}

export function getQuotaWorkerState(db: StateDatabase): QuotaWorkerState | null {
  const row = db
    .prepare(
      `SELECT pid, started_at, heartbeat_at, interval_ms, last_run_at, last_error
       FROM quota_worker_state
       WHERE id = 1`,
    )
    .get() as DatabaseQuotaWorkerState | undefined;

  return row
    ? {
        pid: row.pid,
        startedAt: row.started_at,
        heartbeatAt: row.heartbeat_at,
        intervalMs: row.interval_ms,
        lastRunAt: row.last_run_at,
        lastError: row.last_error,
      }
    : null;
}

export function upsertQuotaWorkerState(
  db: StateDatabase,
  state: Partial<QuotaWorkerState> & Pick<QuotaWorkerState, 'intervalMs'>,
) {
  const current = getQuotaWorkerState(db);

  db.prepare(
    `INSERT INTO quota_worker_state
       (id, pid, started_at, heartbeat_at, interval_ms, last_run_at, last_error)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       pid = excluded.pid,
       started_at = excluded.started_at,
       heartbeat_at = excluded.heartbeat_at,
       interval_ms = excluded.interval_ms,
       last_run_at = excluded.last_run_at,
       last_error = excluded.last_error`,
  ).run(
    readPatchValue(state, 'pid', current?.pid ?? null),
    readPatchValue(state, 'startedAt', current?.startedAt ?? null),
    readPatchValue(state, 'heartbeatAt', current?.heartbeatAt ?? null),
    state.intervalMs,
    readPatchValue(state, 'lastRunAt', current?.lastRunAt ?? null),
    readPatchValue(state, 'lastError', current?.lastError ?? null),
  );
}

export function markQuotaWorkerStopped(db: StateDatabase) {
  const current = getQuotaWorkerState(db);
  if (!current) {
    return;
  }

  upsertQuotaWorkerState(db, {
    ...current,
    pid: null,
    heartbeatAt: Date.now(),
  });
}

function readPatchValue<K extends keyof QuotaWorkerState>(
  state: Partial<QuotaWorkerState>,
  key: K,
  fallback: QuotaWorkerState[K],
) {
  return Object.hasOwn(state, key) ? state[key] ?? null : fallback;
}

interface DatabaseQuotaWorkerState {
  pid: number | null;
  started_at: number | null;
  heartbeat_at: number | null;
  interval_ms: number;
  last_run_at: number | null;
  last_error: string | null;
}
