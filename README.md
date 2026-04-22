# codex-switch

`codex-switch` keeps native Codex behavior intact while letting you switch between multiple OAuth accounts.

It does not proxy API traffic and it does not split `~/.codex/` into per-account homes. Instead it snapshots each account's `auth.json` into a vault at `~/.codex-switch/accounts/` and swaps the active snapshot into `~/.codex/auth.json` before launching Codex.

## What ships

- `cs` / `codex-switch`: CLI wrapper for add, use, run, sync, remove, dashboard launch
- Next.js dashboard on localhost for list, switch, history, and add-account flow
- local SQLite state at `~/.codex-switch/state.sqlite`
- read-only log/history ingestion for session and quota summaries

## Requirements

- Node `>=22`
- pnpm `10`
- a working `codex` binary already installed and authenticated at least once

## Quickstart

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
```

Add an account:

```bash
pnpm --filter @codex-switch/cli exec node dist/index.js add --name personal
```

Use an account:

```bash
pnpm --filter @codex-switch/cli exec node dist/index.js use personal
```

Launch the dashboard:

```bash
pnpm --filter @codex-switch/cli exec node dist/index.js dash
```

## Global install flow

After packaging, the intended user flow is:

```bash
npm i -g codex-switch
cs add --name personal
cs use personal
cs dash
```

## Recommended shell aliases

PowerShell:

```powershell
function codex { cs run @Args }
```

Bash / zsh:

```bash
alias codex='cs run'
```

## Vault layout

```text
~/.codex-switch/
├── accounts/
│   ├── personal.json
│   └── work.json
├── state.sqlite
├── config.json
└── .lock
```

`accounts/*.json` contains refresh-capable auth snapshots. Treat them with the same sensitivity as `~/.codex/auth.json`.

## Troubleshooting

- `Could not locate the bindings file`:
  Run `pnpm install` again after allowing native builds for `better-sqlite3` and `sharp`.
- `No active account recorded`:
  Add or use an account first.
- `Close the running Codex session first`:
  Another `cs use` / `cs run` process still owns the runtime lock.
- No quota data yet:
  The watcher degrades gracefully. Session counts still populate from `history.jsonl`, but quota/token fields depend on what Codex currently writes into its local logs.

## Developer utilities

```bash
pnpm inspect:codex-logs
```
