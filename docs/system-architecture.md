# System Architecture

## System Context

`codex-switch` sits beside the native Codex CLI. It does not intercept Codex network traffic. Instead it manages local auth snapshots, local state, and a local dashboard.

## Package Responsibilities

- `packages/shared`: common path helpers, SQL schema, SQL queries, shared types
- `packages/cli`: auth parsing, vault IO, atomic writes, session lock, Codex launch, TUI, log watcher
- `packages/dashboard`: local UI, read-only state queries, local API routes, terminal spawn helpers

## Filesystem Layout

- Native live auth: `~/.codex/auth.json`
- Native log inputs: `~/.codex/history.jsonl`, `~/.codex/logs_2.sqlite`, `~/.codex/session_index.jsonl`
- Vault root: `~/.codex-switch/`
- Publish/runtime assets: `packages/dashboard/.next/standalone/`, `packages/dashboard/.next/static/`

## Vault and Active Auth Flow

1. `add` runs `codex login` in a temporary `CODEX_HOME`.
2. The resulting temp `auth.json` is validated and written to `~/.codex-switch/accounts/<name>.json`.
3. `use` syncs the current live auth back into the previously active vault entry when needed.
4. `use` then copies the selected vault snapshot into `~/.codex/auth.json`.
5. The CLI records the active account and launch timestamp in `state.sqlite`.

## CLI Launch and Locking Flow

- A session lock file under `~/.codex-switch/.lock` prevents overlapping swap flows.
- Lock acquisition uses exclusive create semantics.
- The release path verifies lock ownership with a per-lock token.
- `launchCodex()` shells out to the real `codex` binary and forwards termination signals.

## Dashboard Runtime Model

- `cs dash` builds the dashboard if needed.
- It copies static/public assets into the standalone tree.
- It starts the CLI-side log watcher.
- It launches the standalone Next server and opens a browser unless disabled.

## Local API Inventory

- `GET /api/accounts`
- `DELETE /api/accounts/:name`
- `GET /api/active`
- `POST /api/add`
- `GET /api/sessions`
- `POST /api/switch`
- `GET /api/usage`

All mutations stay local and call back into the CLI.

## SQLite Schema

Tables in `state.sqlite`:

- `accounts`
- `quota_samples`
- `sessions`
- `active`

Shared schema lives in `packages/shared/src/schema.sql`.

## Quota and Session Ingestion

- `history.jsonl` contributes session-level rows.
- `logs_2.sqlite` contributes parsed quota and token usage from `feedback_log_body`.
- Rows older than the current account’s `switched_at` cutoff are skipped so late watcher startup does not misattribute prior activity.
- Schema notes for observed Codex log shapes live in `packages/shared/docs/codex-log-schema.md`.

## Failure Modes and Degradation

- Missing or unknown Codex log files do not block switching.
- Cross-origin dashboard mutations are rejected.
- If no vault state exists yet, dashboard readers return empty snapshots rather than crashing.
- Standalone build currently emits a non-failing NFT tracing warning due terminal spawn code in dashboard routes.
