# Code Standards

## Monorepo Boundaries

- Keep shared filesystem paths, SQL schema, and cross-package types in `packages/shared`.
- Keep auth mutation, vault writes, swapping, lock handling, and process launching in `packages/cli`.
- Keep dashboard UI and local HTTP routes in `packages/dashboard`.

## TypeScript and Module Rules

- Use ESM across the repo.
- Prefer small focused modules over large mixed-concern files.
- Keep runtime code readable; avoid unnecessary abstractions.
- Use Zod for boundary validation where the input shape is unstable or external.

## Build, Test, and Lint

- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm inspect:codex-logs`

Run validation after code edits that affect runtime behavior.

## CLI Conventions

- Commands are registered in `packages/cli/src/index.ts`.
- Mutating commands should flow through the same swap/vault helpers rather than duplicate auth logic.
- Bare `cs` should remain a shortcut to the interactive picker.

## Dashboard Conventions

- App routes live under `packages/dashboard/app`.
- Read-only database access stays in `packages/dashboard/lib/db.ts`.
- Mutation routes should guard against cross-origin requests and call the CLI rather than reimplement auth changes inside the dashboard.

## SQLite Rules

- `state.sqlite` is the source of truth for dashboard reads.
- Writes go through the CLI-side DB helpers.
- Dashboard DB access must stay read-only with `query_only`.

## File Safety Rules

- Use atomic replacement helpers for auth and vault writes.
- Do not delete the destination file before rename-based replacement.
- Session locking must use exclusive file creation rather than read-then-write races.

## Logging and Secrets

- Do not print token values.
- Keep Pino redaction paths aligned with auth payload shapes.
- Treat `accounts/*.json` the same as `~/.codex/auth.json`.

## Environment Variables

- `CODEX_SWITCH_CODEX_HOME`
- `CODEX_SWITCH_VAULT_ROOT`
- `CODEX_SWITCH_CODEX_BIN`
- `CODEX_SWITCH_SKIP_LAUNCH`
- `CODEX_SWITCH_NO_OPEN`
- `CODEX_SWITCH_FORCE_DASH_BUILD`
- `CODEX_SWITCH_LOG_LEVEL`
- `CS_CLI_ENTRY`
- `CS_NODE_BINARY`

## Generated Artifact Policy

- Publish bins from `bin/`.
- Build CLI and shared packages into `dist/`.
- Keep dashboard standalone output under `.next/standalone`.
- `prepack` must rebuild and copy dashboard static/public assets into the standalone tree.

## Documentation Sync Rules

- Update `docs/` when feature scope or architecture changes materially.
- Keep plan status aligned with the real codebase, not the original plan defaults.
- Keep unresolved manual validation work explicit.
