# codex-switch

`codex-switch` keeps native Codex behavior intact while letting you switch between multiple OAuth accounts from the terminal.

It does not proxy API traffic and it does not split `~/.codex/` into per-account homes. Instead it snapshots each account's `auth.json` into a vault at `~/.codex-switch/accounts/` and swaps the active snapshot into `~/.codex/auth.json` before launching Codex.

## What ships

- `cs` / `codex-switch`: CLI wrapper for add, use, status, sync, remove, and current
- bare `cs` smart launcher that selects an account, swaps auth, and opens native Codex
- local SQLite state at `~/.codex-switch/state.sqlite`
- on-demand quota probing with a 2-minute cache
- terminal quota bars in `cs status`

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

Launch native Codex with automatic account selection:

```bash
pnpm --filter @codex-switch/cli exec node dist/index.js
```

List accounts and cached quota:

```bash
pnpm --filter @codex-switch/cli exec node dist/index.js status
```

Force-refresh cached quota:

```bash
pnpm --filter @codex-switch/cli exec node dist/index.js status --refresh
```

Machine-readable list output:

```bash
pnpm --filter @codex-switch/cli exec node dist/index.js status --json
```

## Global install flow

After packaging, the intended user flow is:

```bash
npm i -g @tqdat410/codex-switch
cs add --name personal
cs use personal
cs status --refresh
```

## Quota Display

`cs status` prints a three-column quota table:

```text
╭───────────────────────────────┬──────────────────────────────┬──────────────────────────────────────╮
│ Account (1)                   │ 5h Limit                     │ Weekly Limit                         │
├───────────────────────────────┼──────────────────────────────┼──────────────────────────────────────┤
│ * personal                    │ [████████░░░░░░░░░░░░] 42%   │ [█████████████████░░░] 84%           │
│ (Pro / user@example.com)      │ (resets 16:52)               │ (resets 13:04 on 29 Apr)             │
╰───────────────────────────────┴──────────────────────────────┴──────────────────────────────────────╯
```

The display uses a monochrome ink palette: bold for emphasis and dim text for secondary/used quota cells. Columns are auto-aligned by visible terminal width, ignoring ANSI style codes. Bars clamp to 0-100%; `█` means quota left and `░` means quota used/unavailable. Unknown quota renders as a fully shaded bar with `--`. Re-auth and stale states are shown in the account cell instead of fake quota.

## Smart Launch

Bare `cs` is the default launcher. It auto-selects the best available account using cached/probed quota, swaps that snapshot into `~/.codex/auth.json`, and then launches the native `codex` binary.

Codex flags are forwarded as-is:

```bash
cs --model gpt-5.5
cs exec --json "Say ok"
```

Turn automatic selection off to use the account picker instead:

```bash
cs auto off
cs auto on
cs auto status
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
  Run `pnpm install` again after allowing native builds for `better-sqlite3`.
- `No active account recorded`:
  Add or use an account first.
- `Close the running Codex session first`:
  Another `cs` / `cs use` process still owns the runtime lock.
- No quota data yet:
  Quota is fetched on demand from ChatGPT when `cs status --refresh` asks for it. If refresh fails, the CLI shows the last cached value or a re-auth status.
