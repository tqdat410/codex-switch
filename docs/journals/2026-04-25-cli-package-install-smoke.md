# CLI Package Install Smoke Caught Missing Runtime Dependencies

**Date**: 2026-04-25 11:52  
**Severity**: High  
**Component**: Packaging  
**Status**: Resolved

## What Happened

The CLI-only pivot passed build, tests, lint, and `npm pack --dry-run`, but code review caught that the packed root package was not actually installable. The root `package.json` shipped `bin/`, `packages/cli/dist/`, and `packages/shared/dist/`, but it did not declare the CLI runtime dependencies.

## The Brutal Truth

`npm pack --dry-run` looked useful but was not enough. It verified file inclusion, not whether `npm i -g codex-switch` would start. That is exactly the flow the README advertises, so missing this would have shipped a broken first command.

## Technical Details

Temp install failed with `ERR_MODULE_NOT_FOUND` for runtime packages such as `commander`. The compiled CLI also imported the workspace-only `@codex-switch/shared` package, which is not published as a separate package in this plan.

## What We Tried

- Removed browser UI package and stale `dash` dist artifacts.
- Added root runtime dependencies for the published package.
- Rewrote compiled CLI imports during `prepack` from `@codex-switch/shared` to relative `packages/shared/dist` imports.
- Added temp global install/bin smoke from a packed tarball.

## Root Cause Analysis

The repo is a workspace during development but publishes the root package as the user-facing CLI. Package dry-run did not exercise Node module resolution in the installed layout.

## Lessons Learned

Package validation must include install-and-run smoke, not just tarball inspection. For this repo, `npm pack` plus temp `npm install -g` and `cs --help` should stay in release validation.

## Next Steps

- Keep temp install/bin smoke in release readiness checks.
- Still run live `cs add`, `cs use`, `cs run`, and cross-platform install smoke before publish.
