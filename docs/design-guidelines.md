# Design Guidelines

## Command Deck Dashboard

- Keep all account names, quota values, errors, and controls in HTML.
- Use the Three/R3F layer only as ambient depth. It must be `pointer-events: none`, non-blocking, and safe to remove.
- Keep cards compact with 8px radius. Avoid nested cards.
- Preserve visible keyboard focus on account cards, links, and mutation buttons.
- Use inline confirmation for destructive actions; do not use browser confirm dialogs.
- Long account names, emails, and errors must wrap without horizontal page scroll.
- Respect reduced motion by disabling transform-heavy hover behavior.
- Command deck CSS is split by concern: foundation, metric strip, account cards, telemetry, and activity/responsive rules.

## Color And Motion

- Dark command surface uses multiple semantic tones, not a single-hue theme.
- Use graphite/off-black surfaces with amber as the primary command accent; avoid blue/purple gradient dominance.
- Healthy: green. Warning: yellow. Danger: red. Reauth: violet. Unknown: slate.
- Use restrained shadows and perspective. Readability wins over depth effects.
- Header typography uses local high-end system display stacks and fixed breakpoint sizes, not viewport-scaled text.

## Responsive Rules

- Desktop: account field plus selected telemetry panel.
- Tablet/mobile: stack command strip, account field, telemetry, and activity.
- Touch targets should be at least 40px high; prefer 44px where layout allows.
- Mobile header navigation stacks full width under the title; no horizontal page scroll.
