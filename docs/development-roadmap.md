# Development Roadmap

## Current Status Summary

The product scope is now CLI-only. Core account switching, smart default launch, optional TUI picker, and on-demand quota probing are implemented. The removed browser UI scope is superseded by terminal quota bars in `cs status`.

## Phase Status

| Phase | Status | Notes |
| --- | --- | --- |
| 1. Monorepo Setup | Completed | Workspace, packages, build/lint/typecheck wiring are in place. |
| 2. Vault and Core CLI Swap | In Progress | Core flows are implemented; native live-account smoke is still manual. |
| 3. TUI Picker and Quota Capture | Completed | Picker is implemented and quota comes from on-demand backend probing. |
| 4. Terminal Quota Visibility | Completed | `cs status` shows deterministic 5h and 7d quota bars plus stale/reauth status; `--private` masks email. |
| 5. Removed Browser UI Scope | Completed | The local browser UI package and command were removed from current product scope. |
| 6. Packaging and Distribution | In Progress | CLI-only package and temp global install smoke pass on Windows; publish readiness still needs live-account and cross-platform proof. |

## Completed Scope

- CLI command surface, smart default launch, and optional TUI picker
- vault snapshot storage and active auth swap
- local SQLite schema and quota cache helpers
- on-demand quota probing
- terminal quota bars for account list output
- CLI/shared-only package build path

## Validation Still Pending

- live `codex login` / `cs add` smoke
- live `cs use` / bare `cs` smoke against real accounts
- native Codex tool fidelity checks after switch
- repeated swap durability testing
- global install smoke on one non-Windows platform

## Immediate Backlog

1. Perform native end-to-end smoke with real Codex auth.
2. Validate packaged install from tarball on another platform.
3. Consider `cs quota [account]` only if `cs status` lacks enough detail in real use.

## Risks and Dependencies

- The project depends on Codex's auth snapshot shape and the undocumented ChatGPT quota endpoint remaining usable.
- Real publish should wait for live-account smoke, not just local unit/integration-style checks.
