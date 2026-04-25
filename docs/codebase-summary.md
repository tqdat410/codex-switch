# Codebase Summary

## Repo Shape

- `packages/shared`: shared types, paths, SQL schema
- `packages/cli`: commander-based CLI, vault logic, smart account selection, swap flow, TUI, quota display
- `bin`: publish-time bin shims
- `scripts`: packaging helpers
- `plans`: brainstorm + implementation plan artifacts

## Package Summary

- `@codex-switch/shared`: exports path helpers for `~/.codex` and `~/.codex-switch`, plus SQLite schema and shared runtime types.
- `@codex-switch/cli`: owns account add/use/sync/remove/current/status/auto flows, default smart launch routing, session locking, atomic writes, quota cache/probe orchestration, and terminal quota formatting.

## Primary Commands

- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

## Key Data Stores

- `~/.codex/auth.json`: active live auth used by native Codex
- `~/.codex-switch/accounts/*.json`: vault snapshots
- `~/.codex-switch/state.sqlite`: account and quota state

## Main Runtime Paths

- CLI entry: `packages/cli/dist/index.js`
- Publish bins: `bin/codex-switch.js`, `bin/cs.js`
