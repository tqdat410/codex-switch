CREATE TABLE IF NOT EXISTS accounts (
  name TEXT PRIMARY KEY,
  email TEXT,
  plan TEXT,
  added_at INTEGER NOT NULL,
  last_used_at INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS quota_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL,
  captured_at INTEGER NOT NULL,
  limit_kind TEXT NOT NULL,
  used INTEGER,
  remaining INTEGER,
  reset_at INTEGER,
  source TEXT NOT NULL,
  UNIQUE(account, captured_at, limit_kind, source)
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  account TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  request_count INTEGER NOT NULL DEFAULT 0,
  token_in INTEGER,
  token_out INTEGER
);

CREATE TABLE IF NOT EXISTS active (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  account TEXT NOT NULL,
  switched_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quota_samples_account_captured_at
  ON quota_samples(account, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_started_at
  ON sessions(started_at DESC);
