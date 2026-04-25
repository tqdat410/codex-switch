# Code Standards

## Monorepo Boundaries

- Keep shared filesystem paths, SQL schema, and cross-package types in `packages/shared`.
- Keep auth mutation, vault writes, swapping, lock handling, process launching, and CLI display in `packages/cli`.
- Do not reintroduce browser UI or local HTTP routes without a new plan.

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

Run validation after code edits that affect runtime behavior.

## CLI Conventions

- Commands are registered in `packages/cli/src/index.ts`.
- Mutating commands should flow through the same swap/vault helpers rather than duplicate auth logic.
- Bare `cs` should remain the native Codex launcher and forward unknown args to Codex.
- Keep `cs status --json` stable for scripts.
- Put deterministic terminal formatting in small helpers with focused tests.
- Use ASCII for quota bars so output is width-stable across terminals.

## SQLite Rules

- `state.sqlite` is the source of truth for local account and quota state.
- Writes go through CLI-side DB helpers.
- Read-only paths should open SQLite with readonly/query-only options when practical.

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
- `CODEX_SWITCH_QUOTA_TTL_MS`
- `CODEX_SWITCH_LOG_LEVEL`

## Generated Artifact Policy

- Publish bins from `bin/`.
- Build CLI and shared packages into `dist/`.
- `prepack` must rebuild shared before CLI.
- Package files should not include removed UI artifacts.

## Documentation Sync Rules

- Update `docs/` when feature scope or architecture changes materially.
- Keep plan status aligned with the real codebase, not the original plan defaults.
- Keep unresolved manual validation work explicit.
