'use client';

import type { CommandDeckAccount } from '../../lib/command-deck-view-model';

export function CommandDeckTelemetryPanel({
  account,
  busy,
  confirmRemove,
  onSwitch,
  onRefresh,
  onRemove,
  onAskRemove,
  onCancelRemove,
}: Readonly<{
  account: CommandDeckAccount | null;
  busy: boolean;
  confirmRemove: boolean;
  onSwitch: () => void;
  onRefresh: () => void;
  onRemove: () => void;
  onAskRemove: () => void;
  onCancelRemove: () => void;
}>) {
  if (!account) {
    return <aside className="command-deck-panel">Select an account to inspect telemetry.</aside>;
  }

  return (
    <aside className="command-deck-panel" aria-label="Selected account telemetry">
      <div className="command-deck-panel__header">
        <div>
          <p>{account.isActive ? 'Active account' : 'Selected account'}</p>
          <h2>{account.name}</h2>
        </div>
        <span data-tone={account.requiresReauth ? 'reauth' : account.weekly.tone}>
          {account.requiresReauth ? 'Needs re-auth' : account.plan}
        </span>
      </div>
      <dl className="command-deck-telemetry">
        <div><dt>Email</dt><dd>{account.email}</dd></div>
        <div><dt>5h capacity</dt><dd>{formatQuota(account.fiveHour.percent)}</dd></div>
        <div><dt>Weekly capacity</dt><dd>{formatQuota(account.weekly.percent)}</dd></div>
        <div><dt>5h reset</dt><dd>{account.fiveHour.resetLabel}</dd></div>
        <div><dt>Weekly reset</dt><dd>{account.weekly.resetLabel}</dd></div>
        <div><dt>Captured</dt><dd>{account.capturedAtLabel}</dd></div>
        <div><dt>Source</dt><dd>{account.sourceLabel}</dd></div>
      </dl>
      {account.errorMessage ? <p className="command-deck-panel__error">{account.errorMessage}</p> : null}
      {confirmRemove ? (
        <div className="command-deck-panel__confirm" role="alert">
          <span>Remove this account?</span>
          <button type="button" disabled={busy} onClick={onRemove}>Remove</button>
          <button type="button" disabled={busy} onClick={onCancelRemove}>Cancel</button>
        </div>
      ) : (
        <div className="command-deck-panel__actions">
          <button type="button" disabled={busy || account.isActive} onClick={onSwitch}>Switch</button>
          <button type="button" disabled={busy} onClick={onRefresh}>Refresh</button>
          <button type="button" disabled={busy} onClick={onAskRemove}>Remove</button>
        </div>
      )}
    </aside>
  );
}

function formatQuota(value: number | null) {
  return value === null ? 'Unknown' : `${value}% left`;
}
