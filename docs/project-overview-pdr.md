# Project Overview PDR

## Project Summary

`codex-switch` is a local-first account switcher for the native Codex CLI. It stores per-account `auth.json` snapshots in a vault under `~/.codex-switch/`, swaps the active snapshot into `~/.codex/auth.json`, and launches the real `codex` binary without proxying traffic or replacing Codex features.

## Goals

- Switch between multiple Codex OAuth accounts without forking the Codex runtime.
- Keep image generation, web browsing, MCP tools, and other native Codex capabilities intact.
- Provide terminal-first account management and quota visibility.
- Persist account metadata and quota cache state in local SQLite.

## Non-Goals

- No API proxying.
- No per-account `CODEX_HOME` for normal runtime sessions.
- No remote sync, hosted UI, or shared multi-user service.
- No billing estimation or quota prediction in v1.

## Primary User Flows

1. `cs add --name <name>` opens `codex login` in a temporary `CODEX_HOME`, then stores the resulting auth snapshot in the vault.
2. `cs use <name>` syncs the current active auth back into the vault, swaps the target snapshot into `~/.codex/auth.json`, and launches Codex.
3. `cs switch` auto-selects the best available account, swaps auth, and exits without opening Codex.
4. Bare `cs ...` auto-selects the best available account, forwards the raw arguments to native Codex, and launches Codex.
5. `cs auto off` disables automatic selection so bare `cs` opens the account picker.
6. `cs status` lists vault accounts with compact 5h and 7d quota bars.
7. `cs status --private` masks email addresses in the table output.
8. `cs status --refresh` probes quota before printing; `cs status --json` keeps machine-readable output.

## Implemented Feature Scope

- `add`
- `use`
- `rm`
- `status`
- `auto`
- `switch`
- `sync`
- bare `cs` smart launcher

## Functional Requirements

- Persist account snapshots under `~/.codex-switch/accounts/*.json`.
- Maintain local state in `~/.codex-switch/state.sqlite`.
- Keep swaps local and filesystem-based.
- Block conflicting runtime switches with a session lock.
- Use on-demand ChatGPT backend probing for quota.
- Cache quota per account and degrade safely when the endpoint or stored auth becomes invalid.
- Show terminal quota bars for 5h and 7d quota windows.
- Keep re-auth and stale states visible without inventing quota values.

## Non-Functional Requirements

- Local-only data handling.
- Safe file replacement for vault/auth writes.
- Typecheck, lint, build, and automated test coverage for core helpers.
- Publish package contains CLI/shared artifacts only.

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
- The log watcher is read-only against Codex-owned files.
- Quota probing never logs raw tokens.

## Acceptance Criteria

- `pnpm build`, `pnpm typecheck`, `pnpm lint`, and `pnpm test` pass locally, or unrelated failures are documented.
- CLI command surface is callable from built artifacts.
- `cs --help` has no removed commands.
- `cs status` renders 5h and 7d quota bars.
- `cs status --private` masks email addresses in table output.
- `cs switch` swaps auth without launching Codex.
- Packed install exposes working `cs`/`codex-switch` bins.
- Packed artifacts contain no removed UI files.

## Known Limitations

- Native smoke for real `add`, `use`, `switch`, and bare `cs` against live Codex auth is still manual.
- Cross-platform global-install validation is not complete.
- Quota uses undocumented ChatGPT backend endpoints and may need a fallback patch if OpenAI changes them.

## Deferred Work

- Cross-platform install smoke on a non-Windows platform.
- End-to-end native Codex fidelity smoke.
- Optional `cs quota [account]` if users need more detail than `cs status`.
