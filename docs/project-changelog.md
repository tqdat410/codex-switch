# Project Changelog

## 2026-04-24

### Added

- full-account command deck home with account cards, selected telemetry, activity preview, refresh-all, switch, remove, add, and history entry points
- command deck view-model tests covering default selection, quota thresholds, reauth override, unknown quota, duration, and compact number formatting
- decorative command deck ambient Three/R3F layer with CSS fallback and no data/control ownership
- command deck stylesheet for the full-account home surface

### Changed

- home dashboard now shows every vault account on one surface
- quota polling remains targeted for active/selected account unless the user explicitly refreshes all accounts
- dashboard home mutation controls route through existing local API boundaries
- home page keeps selected-account refresh plus explicit refresh-all for cached quota data
- selected-account telemetry carries focused quota/status details while every vault account remains visible
- add/history entry points and switch/remove controls remain available from the command deck home
- command deck visual system now uses a darker operations-console shell, amber command accent, stronger typography hierarchy, and stacked mobile navigation
- command deck styles are split into focused files for foundation, metric strip, accounts, telemetry, and activity/responsive rules
- dashboard build config transpiles `three`
- previous narrowed dashboard scope has been superseded by the full-account command deck

### Fixed

- production dashboard home route now reads runtime vault state instead of static build-time account data

### Removed

- obsolete `quota-lab-*` components, `quota-lab.css`, and quota lab view-model/tests after command deck replacement
- obsolete card/gauge/switch components from the old home dashboard surface

### Validation

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- desktop/mobile browser smoke with seeded fake account data
- desktop/mobile Chrome headless smoke confirms no horizontal overflow at 390px and 1440px
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
