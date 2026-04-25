# codex-switch

Native Codex account switching without proxying, patched clients, or separate `CODEX_HOME` folders.

`codex-switch` stores each account's `auth.json` snapshot in `~/.codex-switch/accounts/`, swaps the selected snapshot into `~/.codex/auth.json`, then launches the real `codex` binary.

## Install

```bash
npm i -g @tqdat410/codex-switch
```

Requirements:

- Node.js `>=22`
- Codex CLI installed and authenticated at least once

## Quick Start

Add accounts:

```bash
cs add --name personal
cs add --name work
```

Launch Codex:

```bash
cs
```

Bare `cs` refreshes quota, chooses the best available account, swaps auth, and opens native Codex. If one account hits a limit, exit Codex and run `cs` again.

Forward Codex flags as usual:

```bash
cs --model gpt-5.5
cs exec --json "Say ok"
```

## Commands

```text
cs                         Launch Codex with automatic account selection
cs add --name <name>       Add a Codex account to the vault
cs use <name> [args...]    Launch Codex with a specific account
cs switch                  Switch to the best available account without launching Codex
cs status [--refresh]      Show accounts and quota
cs status --private        Show status table with email hidden
cs status --json           Print machine-readable account status
cs auto off                Use the manual account picker for bare cs
cs auto on                 Re-enable automatic account selection
cs sync                    Save current ~/.codex/auth.json back to the vault
cs rm <name>               Remove an account from the vault
```

## Quota Status

`cs status` shows:

- all saved accounts
- the active account marker
- 5-hour and weekly quota bars
- reset times, stale states, and re-auth warnings

Use `cs status --private` to keep the table layout but hide email addresses. JSON output is unchanged and should be treated as machine-readable metadata.

The terminal output uses `█` for quota left and dim `░` for used or unavailable quota. Unknown quota is shown as `--`.

Example:

```text
╭────────────────────────────────┬──────────────────────────────┬──────────────────────────────────────╮
│ Account (3)                    │ 5h Limit                     │ Weekly Limit                         │
├────────────────────────────────┼──────────────────────────────┼──────────────────────────────────────┤
│ * personal                     │ [████████░░░░░░░░░░░░] 42%   │ [█████████████████░░░] 84%           │
│ (Pro / personal@example.com)   │ (resets 16:52)               │ (resets 13:04 on 29 Apr)             │
│   work                         │ [██████████████████░░] 91%   │ [████████████░░░░░░░░] 61%           │
│ (Team / work@example.com)      │ (resets 18:10)               │ (resets 09:30 on 30 Apr)             │
│   backup                       │ [██████████████░░░░░░] 68%   │ [█████████░░░░░░░░░░░] 47%           │
│ (Plus / backup@example.com)    │ (resets 20:45)               │ (resets 11:15 on 1 May)              │
╰────────────────────────────────┴──────────────────────────────┴──────────────────────────────────────╯
```

## Storage

```text
~/.codex-switch/
├── accounts/
│   ├── personal.json
│   └── work.json
├── state.sqlite
├── config.json
└── .lock
```

Account snapshots contain refresh-capable auth data. Treat them with the same care as `~/.codex/auth.json`.

## Notes

- No API proxying.
- No custom Codex runtime.
- No per-account Codex home directories.
- Native Codex behavior, tools, and session UI stay intact.
