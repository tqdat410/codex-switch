# Superseded Quota Lab Dashboard Design

**Date:** 2026-04-24  
**Status:** superseded  
**Scope:** historical dashboard UI proposal only

## Current Outcome

This proposal was replaced by the completed full-account command deck dashboard. Do not use this file as current implementation guidance.

Current dashboard facts:

- Home renders all vault accounts in a command deck, not a single-account surface.
- Account switch, remove, add, history, selected refresh, and refresh-all controls stay available from local dashboard flows.
- Dashboard mutations stay local and route through `/api/switch`, `/api/add`, and `/api/accounts/[name]`.
- Quota polling is targeted through `/api/usage?account=<name>` for the active or selected account; refresh-all is explicit user action.
- Account names, quota values, errors, reset text, and controls remain accessible HTML.
- The Three/R3F layer is decorative ambient depth only, with CSS fallback and no data/control ownership.

## Historical Context

The earlier quota-lab direction explored a read-only sci-fi quota visualization. That direction was removed before the final dashboard scope because the product needed full-account control from the home surface.

## Replacement References

- `docs/system-architecture.md`
- `docs/code-standards.md`
- `docs/design-guidelines.md`
- `docs/project-changelog.md`
