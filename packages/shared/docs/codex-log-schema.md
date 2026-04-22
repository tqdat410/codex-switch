# Codex Log Schema Notes

Observed on this machine on 2026-04-22:

- `~/.codex/session_index.jsonl` currently contains thread index rows with keys:
  - `id`
  - `thread_name`
  - `updated_at`
- `~/.codex/logs_2.sqlite` currently has tables:
  - `_sqlx_migrations`
  - `logs`
  - `sqlite_sequence`
- `logs` columns:
  - `id`
  - `ts`
  - `ts_nanos`
  - `level`
  - `target`
  - `feedback_log_body`
  - `module_path`
  - `file`
  - `line`
  - `thread_id`
  - `process_uuid`
  - `estimated_bytes`

The brainstorm assumption about direct quota/session tables was wrong for this environment.
Watcher code should treat `feedback_log_body` as semi-structured text and degrade gracefully.
