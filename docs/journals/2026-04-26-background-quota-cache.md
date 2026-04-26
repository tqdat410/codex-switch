# Background Quota Cache

**Date**: 2026-04-26 21:10
**Severity**: Low
**Component**: CLI quota cache
**Status**: Resolved

## What Happened

Implemented cache-first foreground quota behavior and an opt-in background worker. Bare `cs`, `cs switch`, and `cs status` now use SQLite quota cache by default. Exact foreground refresh remains available through `cs status --refresh` and `cs cache refresh`.

## Technical Details

Added `quota_worker_state` to SQLite, `cs cache start|stop|status|refresh`, readonly cache selection, worker heartbeat metadata, env knobs, and regression tests for no-network status/selection plus worker lifecycle state.

## Review Findings

Code review caught worker lifecycle edge cases: explicit `null` state patches were not clearing PID/error fields, worker start/status originally used current config instead of stored worker interval, and the worker loop needed top-level error persistence. Fixed all before final validation.

## Validation

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm test`
- `node %USERPROFILE%/.claude/scripts/validate-docs.cjs docs/`

## Lessons Learned

For background processes, heartbeat is not enough. Stored PID, stored interval, nullable state patch semantics, and stale PID handling need tests because these bugs do not show up in happy-path refresh tests.
