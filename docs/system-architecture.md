# System Architecture

## System Context

`codex-switch` sits beside the native Codex CLI. It does not intercept Codex network traffic. Instead it manages local auth snapshots, local state, and terminal account workflows.

## Package Responsibilities

- `packages/shared`: common path helpers, SQL schema, shared types
- `packages/cli`: auth parsing, OAuth refresh, quota cache/probe orchestration, vault IO, config, smart account selection, atomic writes, session lock, Codex launch, TUI, status formatting

## Filesystem Layout

- Native live auth: `~/.codex/auth.json`
- Vault root: `~/.codex-switch/`
- Publish assets: `bin/`, `packages/cli/dist/`, `packages/shared/dist/`

## Vault and Active Auth Flow

1. `add` runs `codex login` in a temporary `CODEX_HOME`.
2. The resulting temp `auth.json` is validated and written to `~/.codex-switch/accounts/<name>.json`.
3. `use` syncs the current live auth back into the previously active vault entry when needed.
4. `use` copies the selected vault snapshot into `~/.codex/auth.json`.
5. The CLI records the active account and launch timestamp in `state.sqlite`.

## Default Launch Flow

1. Bare `cs` reads `~/.codex-switch/config.json`.
2. If automatic selection is on, it probes or reads cached quota for vault accounts and selects the best available account.
3. If automatic selection is off, it opens the account picker.
4. The selected account flows through the same swap-and-launch helper as `use`.
5. Raw arguments after `cs` are forwarded to the native `codex` binary.

## CLI Launch and Locking Flow

- A session lock file under `~/.codex-switch/.lock` prevents overlapping swap flows.
- Lock acquisition uses exclusive create semantics.
- The release path verifies lock ownership with a per-lock token.
- The `launchCodex` helper shells out to the real `codex` binary and forwards termination signals.

## CLI Command Surface

- `add`: capture a new account auth snapshot.
- `use`: switch to an account and launch Codex.
- `auto`: enable, disable, or show automatic account selection.
- `rm`: remove a vault account and related local state.
- `status`: list accounts, active marker, metadata, quota bars, and stale/reauth status.
- `current`: print the active account.
- `sync`: persist the current live auth back to its active vault entry.
- bare `cs`: smart-select an account and launch native Codex.

## SQLite Schema

Tables in `state.sqlite`:

- `accounts`
- `quota_cache`
- `account_auth_state`
- `active`

Shared schema lives in `packages/shared/src/schema.sql`.

## Quota Probing

- Quota is fetched on demand from `https://chatgpt.com/backend-api/wham/usage` with `/backend-api/codex/usage` fallback.
- Successful quota probes are cached per account in `quota_cache` with a default 2-minute TTL.
- Invalid or expired stored auth is surfaced through `account_auth_state` so CLI output can show re-auth status instead of crashing.
- `cs status` maps cached/probed quota into deterministic ASCII bars and status text.

## Failure Modes and Degradation

- If quota probing fails, the CLI falls back to the last cached quota row when available.
- Missing, invalid, or expired vault snapshots are shown as re-auth states.
- Unknown quota renders as empty bars with `--`, not fabricated percentages.
