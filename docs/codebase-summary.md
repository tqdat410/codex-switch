# Codebase Summary

## Repo Shape

- `packages/shared`: shared types, paths, SQL schema, SQL queries
- `packages/cli`: commander-based CLI, vault logic, swap flow, TUI, watcher
- `packages/dashboard`: Next.js app, read-only quota lab home, local API routes, charts, add/history pages
- `bin`: publish-time bin shims
- `scripts`: packaging helpers
- `plans`: brainstorm + implementation plan artifacts

## Package Summary

- `@codex-switch/shared`: exports path helpers for `~/.codex` and `~/.codex-switch`, plus SQLite schema and query strings.
- `@codex-switch/cli`: owns account add/use/run/sync/remove flows, session locking, atomic writes, and the dashboard launcher.
- `@codex-switch/dashboard`: reads the shared SQLite state read-only, renders the home quota lab with one client-only Three/R3F canvas plus HTML fallback, and exposes local mutation routes that shell out to the CLI.

## Primary Commands

- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm inspect:codex-logs`

## Key Data Stores

- `~/.codex/auth.json`: active live auth used by native Codex
- `~/.codex/history.jsonl`: session history source
- `~/.codex/logs_2.sqlite`: structured log source
- `~/.codex-switch/accounts/*.json`: vault snapshots
- `~/.codex-switch/state.sqlite`: account/session/quota state

## Main Runtime Paths

- CLI entry: `packages/cli/dist/index.js`
- Dashboard standalone server: `packages/dashboard/.next/standalone/packages/dashboard/server.js`
- Publish bins: `bin/codex-switch.js`, `bin/cs.js`
