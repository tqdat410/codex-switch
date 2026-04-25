# Project Changelog

## 2026-04-25

### Added

- terminal `cs ls` quota table with 5h and weekly quota bars
- bare `cs` smart launch path that auto-selects an account before opening native Codex
- `cs auto on|off|status` to control automatic account selection
- `cs status` as the account/quota status command
- `cs status --private` to hide email addresses in table output
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
