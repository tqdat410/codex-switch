export const STATE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS accounts (
  name TEXT PRIMARY KEY,
  email TEXT,
  plan TEXT,
  added_at INTEGER NOT NULL,
  last_used_at INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS quota_cache (
  account TEXT PRIMARY KEY,
  captured_at INTEGER NOT NULL,
  five_hour_percent REAL,
  five_hour_reset_at INTEGER,
  weekly_percent REAL,
  weekly_reset_at INTEGER,
  source TEXT NOT NULL,
  stale_reason TEXT
);

CREATE TABLE IF NOT EXISTS account_auth_state (
  account TEXT PRIMARY KEY,
  requires_reauth INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_error_at INTEGER
);

CREATE TABLE IF NOT EXISTS active (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  account TEXT NOT NULL,
  switched_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quota_worker_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  pid INTEGER,
  started_at INTEGER,
  heartbeat_at INTEGER,
  interval_ms INTEGER NOT NULL,
  last_run_at INTEGER,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_quota_cache_captured_at
  ON quota_cache(captured_at DESC);
`;
