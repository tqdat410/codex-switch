# Project Changelog

## 2026-04-24

### Added

- read-only quota lab dashboard with one R3F/Three scene for all account tubes
- HTML quota overlays and CSS fallback for WebGL-disabled browsers
- quota lab view-model tests covering clamping, tones, reauth, and 9+ account layout
- active-account bioreactor tube with procedural glass, liquid chambers, clamps, ports, and hoses
- focused `quota-lab.css` stylesheet for lab-specific layout and fallback styles

### Changed

- main dashboard no longer shows history/add/switch/remove controls
- home page keeps one refresh action for cached quota data
- dashboard build config transpiles `three`
- home quota lab now renders only the active account and targets quota polling to that account
- quota overlay and WebGL fallback now show one active-account telemetry panel instead of a multi-account grid

### Fixed

- production dashboard home route now reads runtime vault state instead of static build-time account data

### Removed

- obsolete card/gauge/switch components from the old home dashboard surface

### Validation

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- desktop/mobile browser smoke with seeded fake account data
- forced WebGL fallback smoke
- production desktop/mobile/fallback smoke with seeded active and inactive account data

## 2026-04-23

### Added

- pnpm monorepo with `shared`, `cli`, and `dashboard` packages
- vault-backed auth snapshot storage and active-account tracking
- CLI commands for add, use, run, remove, list, current, sync, and dashboard launch
- TUI account picker with quota context
- local SQLite schema for accounts, sessions, quota samples, and active state
- Next.js dashboard with home, history, and add-account flows
- standalone dashboard packaging and publish-time bin shims
- developer utility for inspecting observed Codex log shapes

### Changed

- fixed session-lock acquisition to use exclusive file creation
- fixed file replacement to avoid deleting the destination before rename
- fixed log-watcher attribution to honor the active account switch cutoff
- fixed request-per-day bucket generation to use local-day keys
- fixed add-account polling so navigation/unmount can abort the wait loop
- moved quota collection from `logs_2.sqlite` polling to on-demand ChatGPT backend probing with a per-account TTL cache
- rewired dashboard quota UI to show 5h and 7d gauges with refresh/re-auth states

### Removed

- `log-watcher` quota polling from `logs_2.sqlite`
- the history token-per-week chart that depended on background log parsing

### Validation

- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm inspect:codex-logs`
- `npm pack --dry-run`

### Known Limitations

- native Codex smoke is still manual
- one Next standalone NFT tracing warning remains during build
- publish readiness depends on cross-platform install validation
