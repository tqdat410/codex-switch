# Quota Lab Dashboard Design

**Date:** 2026-04-24  
**Status:** approved for planning  
**Scope:** dashboard UI refactor only

## Problem

Current dashboard shows accounts as flat cards with two quota bars. User wants a stronger visual dashboard concept: a stylized sci-fi lab where account quota is readable at a glance.

## Requirements

- Refactor main dashboard into read-only quota overview.
- Concept: stylized sci-fi lab / control-room monitoring bench.
- Each account renders as one hybrid glass chemical tube.
- Top spherical chamber shows weekly quota remaining.
- Bottom cylindrical chamber shows 5h quota remaining.
- Liquid level means quota left, not quota used.
- Support 9+ accounts without laggy per-card 3D scenes.
- No history UI in main dashboard.
- No add account, switch account, or remove account controls in main dashboard.
- No alarm, bubbling, flashing, shaking, or heavy animated effects.
- Keep refresh quota action if useful.

## Evaluated Approaches

### Option A: Single 3D Lab Shelf

One 3D scene renders all account tubes on lab shelves/grid rows. HTML overlays render labels and metadata.

Pros:
- True 3D.
- Best fit for sci-fi lab concept.
- Scales better for 9+ accounts than one canvas per account.
- Keeps text accessible via HTML.

Cons:
- Adds 3D dependency and implementation complexity.
- Needs careful responsive and performance handling.

### Option B: 2.5D Tube Grid

Use CSS/SVG/canvas to mimic 3D glass tubes without WebGL.

Pros:
- Faster implementation.
- Lower performance risk.
- Easier testing.

Cons:
- Not true 3D.
- Less visually distinctive.

### Option C: Per-account 3D Mini Cards

Each account card owns its own small 3D tube scene.

Pros:
- Simple component boundary at first.

Cons:
- Poor fit for 9+ accounts.
- Many canvases/scenes can lag and complicate debugging.

## Decision

Use **Option A: Single 3D Lab Shelf**.

Reason: it preserves the 3D lab concept while keeping performance manageable for 9+ accounts.

## Visual Model

Each account:

- One glass tube object.
- Top sphere chamber fill percent = `weekly.percentLeft`.
- Bottom cylinder chamber fill percent = `fiveHour.percentLeft`.
- Neutral empty tube when quota unavailable.
- Static warning label when reauth required.
- Optional active-account marker as static ring/badge only.

Scene:

- Dark clean lab background.
- Shelves or bench grid, multiple rows.
- Cyan/green liquid for healthy quota.
- Amber/red static color for low quota if needed.
- No decorative bokeh/orbs, no heavy motion.

## Data Flow

- Reuse existing dashboard account snapshot.
- Reuse existing usage polling/refresh behavior.
- Do not change CLI vault, auth, switching, or quota probing logic.
- Dashboard main page reads account quota and renders lab view.
- Refresh action calls existing usage refresh route.

## Component Direction

Likely focused files/components:

- `lab-dashboard-scene` - one canvas / one 3D scene for all tubes.
- `quota-lab-tube` - reusable tube mesh/group logic.
- `quota-lab-overlay` - accessible HTML labels and quota text.
- Existing account grid container becomes read-only lab container.

Names may adjust to existing file conventions during planning. Use kebab-case filenames.

## Performance Constraints

- One canvas for all account tubes.
- Shared geometry and materials.
- Text in HTML overlays, not 3D text.
- Static scene by default.
- Responsive grid columns based on viewport and account count.
- Mobile can scroll shelves vertically.
- Graceful fallback needed if WebGL unavailable.

## Success Criteria

- Main dashboard reads as sci-fi quota lab.
- 9+ accounts visible and scannable.
- Weekly and 5h quota clearly distinguishable.
- No history/add/switch/remove controls on main dashboard.
- Refresh quota still possible if kept.
- Typecheck/build pass after implementation.
- UI remains readable on desktop and mobile.

## Risks

- 3D dependency choice may affect bundle size.
- WebGL support can vary.
- HTML overlay alignment can drift on responsive layouts.
- Too much realism may hurt clarity and performance.

Mitigation:

- Keep stylized, low-poly/static.
- Prefer one scene and shared assets.
- Plan fallback before implementation.
- Verify with screenshots across viewports.

## Next Steps

1. Create implementation plan.
2. Confirm 3D library choice in planning.
3. Plan component split and file ownership.
4. Implement read-only lab dashboard.
5. Run typecheck/build/tests.
6. Update project docs/changelog if implementation changes dashboard scope.

## Self Review

- No placeholders.
- Scope limited to dashboard UI.
- Account management/history excluded from main dashboard by decision.
- Data source stays existing quota snapshot/polling.
- Performance risk addressed by single-scene design.

## Unresolved Questions

None.
