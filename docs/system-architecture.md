# System Architecture

## System Context

`codex-switch` sits beside the native Codex CLI. It does not intercept Codex network traffic. Instead it manages local auth snapshots, local state, and a local dashboard.

## Package Responsibilities

- `packages/shared`: common path helpers, SQL schema, SQL queries, shared types
- `packages/cli`: auth parsing, OAuth refresh, quota cache/probe orchestration, vault IO, atomic writes, session lock, Codex launch, TUI, session watcher
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
- `GET /api/usage` (cache-backed quota state, optional refresh)

All mutations stay local and call back into the CLI.

## SQLite Schema

Tables in `state.sqlite`:

- `accounts`
- `quota_cache`
- `quota_samples`
- `account_auth_state`
- `sessions`
- `active`

Shared schema lives in `packages/shared/src/schema.sql`.

## Quota and Session Ingestion

- `history.jsonl` contributes session-level rows.
- Quota is fetched on demand from `https://chatgpt.com/backend-api/wham/usage` with `/backend-api/codex/usage` fallback.
- Successful quota probes are cached per account in `quota_cache` with a default 2-minute TTL.
- Invalid or expired stored auth is surfaced through `account_auth_state` so the CLI/dashboard can show a re-auth banner instead of crashing.
- Rows older than the current account’s `switched_at` cutoff are skipped so late watcher startup does not misattribute prior activity.

## Failure Modes and Degradation

- Missing or unknown Codex log files do not block switching.
- Cross-origin dashboard mutations are rejected.
- If no vault state exists yet, dashboard readers return empty snapshots rather than crashing.
- If quota probing fails, the dashboard and CLI fall back to the last cached quota row when available.
- Standalone build currently emits a non-failing NFT tracing warning due terminal spawn code in dashboard routes.
