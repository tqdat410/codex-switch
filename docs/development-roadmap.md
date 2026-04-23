# Development Roadmap

## Current Status Summary

Implementation is materially complete for the planned v1 surface. Local validation is green. Remaining work is mostly live-account acceptance, packaging confidence, and publish readiness.

## Phase Status

| Phase | Status | Notes |
| --- | --- | --- |
| 1. Monorepo Setup | Completed | Workspace, packages, build/lint/typecheck wiring are in place. |
| 2. Vault and Core CLI Swap | In Progress | Core flows are implemented; native live-account smoke is still manual. |
| 3. TUI Picker and Quota Capture | Completed | Picker is implemented and quota now comes from on-demand backend probing instead of log parsing. |
| 4. Dashboard Core | Completed | Home/API/switch flows exist with cache-backed quota gauges; live UI smoke remains open. |
| 5. History Charts and OAuth Add | In Progress | Charts and add flow exist; real interaction smoke remains open. |
| 6. Packaging and Distribution | In Progress | Build/prepack/tarball checks pass; install and publish readiness still need manual proof. |

## Completed Scope

- CLI command surface and TUI picker
- vault snapshot storage and active auth swap
- local SQLite schema and query layer
- history ingestion helpers plus on-demand quota probing
- local dashboard home/history/add pages
- standalone dashboard packaging

## Validation Still Pending

- live `codex login` / `cs add` smoke
- live `cs use` / `cs run` smoke against real accounts
- native Codex tool fidelity checks after switch
- repeated swap durability testing
- global install smoke on Windows and one non-Windows platform

## Immediate Backlog

1. Perform native end-to-end smoke with real Codex auth.
2. Validate packaged install from tarball on another platform.
3. Decide whether to suppress or isolate the Next NFT tracing warning.
4. Add broader dashboard/API integration tests if the project continues beyond v1.

## Risks and Dependencies

- The project depends on Codex’s auth snapshot shape and the undocumented ChatGPT quota endpoint remaining usable.
- Packaging confidence depends on standalone Next output continuing to tolerate local terminal spawn helpers.
- Real publish should wait for live-account smoke, not just local unit/integration-style checks.
