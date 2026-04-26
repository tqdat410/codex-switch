# Project Changelog

## 2026-04-26

### Added

- `cs cache start|stop|status|refresh` for background quota cache management
- detached quota cache worker with heartbeat state in SQLite
- cache-only quota reader for foreground selection and status
- tests for cache-only selector/status, config env overrides, routing, and worker refresh behavior

### Changed

- bare `cs`, `cs switch`, and `cs status` use cached quota by default instead of foreground quota probing
- `cs status --refresh` remains exact foreground refresh
- local SQLite schema now tracks `quota_worker_state`

### Validation

- passed: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test`

## 2026-04-25

### Added

- terminal `cs ls` quota table with 5h and weekly quota bars
- bare `cs` smart launch path that auto-selects an account before opening native Codex
- `cs auto on|off|status` to control automatic account selection
- `cs status` as the account/quota status command
- `cs status --private` to mask email addresses in table output
- `cs switch` to auto-select and switch accounts without launching Codex
- formatter tests for healthy, partial, unavailable, stale, and re-auth list output
- CLI-first packaging path for root global installs

### Changed

- bare `cs` now launches Codex instead of opening the picker by default
- Codex args passed to bare `cs` are forwarded to the native `codex` binary
- product scope is CLI-only
- package scripts and prepack build shared + CLI only
- docs describe terminal quota workflows and current package shape only
- local SQLite state now tracks accounts, active account, quota cache, and auth state

### Removed

- public `cs run` command
- public `cs current` command
- local browser UI package and launch command
- browser UI dependencies and standalone package artifacts
- stale dashboard screenshot/output artifacts
- historical dashboard design spec
- unused session-history watcher, queries, API export, tests, types, schema tables, and inspect script

### Validation

- passed after cleanup: `pnpm install --lockfile-only`, `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build`, `npm pack --dry-run`, docs validation, stale reference scans
- passed before cleanup: temp global install/bin smoke
- manual pending: live `cs add`, `cs use`, bare `cs`, `cs status --refresh`, and cross-platform global install smoke
