# Project Overview PDR

## Project Summary

`codex-switch` is a local-first account switcher for the native Codex CLI. It stores per-account `auth.json` snapshots in a vault under `~/.codex-switch/`, swaps the active snapshot into `~/.codex/auth.json`, and launches the real `codex` binary without proxying traffic or replacing Codex features.

## Goals

- Switch between multiple Codex OAuth accounts without forking the Codex runtime.
- Keep image generation, web browsing, MCP tools, and other native Codex capabilities intact.
- Provide both CLI and local dashboard workflows.
- Persist account metadata, session history, and quota samples in a local SQLite database.

## Non-Goals

- No API proxying.
- No per-account `CODEX_HOME` for normal runtime sessions.
- No remote sync, hosted dashboard, or shared multi-user service.
- No billing estimation or quota prediction in v1.

## Primary User Flows

1. `cs add --name <name>` opens `codex login` in a temporary `CODEX_HOME`, then stores the resulting auth snapshot in the vault.
2. `cs use <name>` syncs the current active auth back into the vault, swaps the target snapshot into `~/.codex/auth.json`, and launches Codex.
3. `cs run ...` reuses the same swap-and-launch path for shell aliases such as `alias codex='cs run'`.
4. `cs` with no subcommand opens a TUI picker with account and quota context.
5. `cs dash` starts the local Next.js dashboard, opens a browser, and runs the local log watcher.
6. The dashboard supports home, history, and add-account flows through local API routes only.

## Implemented Feature Scope

### CLI

- `add`
- `use`
- `run`
- `rm`
- `ls`
- `current`
- `sync`
- `dash`
- bare `cs` TUI picker

### Dashboard

- `/` account grid
- `/history` usage charts and sessions table
- `/add` account onboarding flow
- `/api/accounts`
- `/api/accounts/[name]`
- `/api/active`
- `/api/add`
- `/api/sessions`
- `/api/switch`
- `/api/usage`

## Functional Requirements

- Persist account snapshots under `~/.codex-switch/accounts/*.json`.
- Maintain local state in `~/.codex-switch/state.sqlite`.
- Keep swaps local and filesystem-based.
- Block conflicting runtime switches with a session lock.
- Use read-only ingestion of `~/.codex/history.jsonl` and `~/.codex/logs_2.sqlite`.
- Degrade safely when Codex log schemas differ from assumptions.

## Non-Functional Requirements

- Local-only data handling.
- Safe file replacement for vault/auth writes.
- Typecheck, lint, build, and automated test coverage for core helpers.
- Standalone dashboard packaging for global install use.

## Local Storage Layout

```text
~/.codex-switch/
├── accounts/
│   ├── personal.json
│   └── work.json
├── state.sqlite
├── config.json
└── .lock
```

## Security Constraints

- Vault files and `~/.codex/auth.json` are sensitive secrets.
- Logger redacts token-shaped fields and `OPENAI_API_KEY`.
- Dashboard mutations reject cross-origin requests.
- The log watcher is read-only against Codex-owned files.

## Acceptance Criteria

- `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm inspect:codex-logs` pass locally.
- CLI command surface is callable from built artifacts.
- Dashboard builds as standalone output and can be launched from `cs dash`.

## Known Limitations

- Native smoke for real `add`, `use`, `run`, and `dash` against live Codex auth is still manual.
- Cross-platform global-install validation is not complete.
- Next standalone build still emits an NFT tracing warning around terminal-spawn code.

## Deferred Work

- Cross-platform install smoke on a non-Windows platform.
- End-to-end UI tests and native Codex fidelity smoke.
- Stronger packaging verification before publish.
