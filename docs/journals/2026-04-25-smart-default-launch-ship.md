# Smart Default Launch Ship

**Date**: 2026-04-25 19:57
**Severity**: Medium
**Component**: CLI command surface
**Status**: Resolved

## What Happened

The manual retry workflow after Codex account limits was still too verbose. The product now treats bare `cs` as the native Codex launcher, refreshes quota before choosing an account, and keeps `cs auto off` as the escape hatch for picker mode.

## Technical Details

`cs run` was removed. `cs status` replaces `cs ls`. Bare `cs` forwards raw Codex args before Commander parses subcommands, so calls like `cs --model gpt-5.5` reach native Codex. Review caught a stale-cache issue: smart selection originally respected the quota TTL, which could pick the same account immediately after a limit hit. Selection now force-refreshes quota and syncs active live auth before probing.

## What We Tried

The earlier auto-switch/app-server direction was rejected because it would replace native Codex UX. The simpler solution keeps Codex untouched and moves only account choice into the launcher.

## Root Cause Analysis

The old command surface optimized implementation shape, not the real recovery loop. Users do not need a proxy or automatic resume; they need one clean command after exiting Codex.

## Lessons Learned

Default commands matter more than feature breadth. For this tool, preserving native behavior while reducing retry steps beats building deeper integration.

## Next Steps

Manually publish npm after PR merge and verify the packaged global install with live accounts.
