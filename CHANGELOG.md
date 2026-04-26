# Changelog

## 1.1.0

- Added cache-first foreground quota selection for bare `cs`, `cs switch`, and `cs status`.
- Added `cs cache start|stop|status|refresh` for background quota refresh.
- Added quota worker SQLite state, heartbeat tracking, and cache interval/concurrency config.
- Kept exact foreground refresh available through `cs status --refresh` and `cs cache refresh`.

## 1.0.11

- Changed `cs status --private` to mask email characters with `░` while preserving `@`.

## 1.0.10

- Added `cs switch` to auto-select and switch accounts without launching Codex.
- Added `cs status --private` to hide email addresses in table output.
- Removed the public `cs current` command.

## 1.0.9

- Changed bare `cs` into the smart native Codex launcher with automatic account selection.
- Added `cs auto on|off|status` to control automatic selection.
- Renamed the account quota table command from `cs ls` to `cs status`.
- Removed the public `cs run` command.
- Forwarded Codex flags through bare `cs` and `cs use <account>`.
- Refreshed quota during smart selection so rerunning `cs` after a limit hit avoids stale cache.

## 1.0.8

- Publish npm package under the owned `@tqdat410/codex-switch` scope because the unscoped `codex-switch` name is owned by another npm maintainer.

## 1.0.7

- Added the pnpm workspace with shared and CLI packages.
- Added vault-backed auth switching, TUI picker, and CLI quota flows.
- Added deterministic `cs ls` quota bars for 5h and 7d limits.
- Removed the local browser UI package, browser launch command, browser dependencies, standalone UI packaging, stale screenshot artifacts, and unused session-history code.
- Added publish bins and repo validation scripts.
- Fixed session lock exclusivity and atomic auth replacement.
