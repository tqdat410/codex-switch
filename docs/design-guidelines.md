# Design Guidelines

## Terminal Account List

- Keep `cs ls` scan-friendly with three columns: account/type/email, 5h limit, weekly limit.
- Use terminal block bars: `█` for quota left and `░` for quota used/unavailable.
- Use rounded Unicode table borders for the default terminal table.
- Auto-align columns by visible width and ignore ANSI color codes during width calculation.
- Use a monochrome ink palette only: bold for emphasis, dim for secondary text and used/unavailable quota cells. Avoid colorful status or quota palettes.
- Clamp quota percentages to 0-100% and round to whole numbers.
- Render unknown quota as a fully shaded `░` bar with `--`.
- Show re-auth and stale states as text. Do not invent quota values.
- Keep `--json` output for machines; terminal formatting is for humans.

## Text And Status

- Active account marker is `*`.
- Account names should be bold in supported terminals, with plan/email on the next line.
- Quota cells should put the bar and percent on the first line, then reset text on the next line.
- Terminal output should omit low-value metadata such as source and last-used when there is no stale/error state.
- Stale and re-auth status text should render only when it requires user attention, inside the account column.
- Do not print auth payloads, tokens, or raw vault file content.

## Layout Rules

- Use a text table for quota bars so accounts can be scanned row-by-row.
- Keep each line short enough for typical terminals.
- Use deterministic formatting so tests can assert exact bar output.
