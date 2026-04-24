'use client';

import type { CommandDeckAccount, CommandDeckQuotaLevel } from '../../lib/command-deck-view-model';

export function CommandDeckAccountModule({
  account,
  isSelected,
  busy,
  confirmRemove,
  onSelect,
  onSwitch,
  onRefresh,
  onRemove,
  onAskRemove,
  onCancelRemove,
}: Readonly<{
  account: CommandDeckAccount;
  isSelected: boolean;
  busy: boolean;
  confirmRemove: boolean;
  onSelect: () => void;
  onSwitch: () => void;
  onRefresh: () => void;
  onRemove: () => void;
  onAskRemove: () => void;
  onCancelRemove: () => void;
}>) {
  return (
    <article
      className="command-deck-account"
      data-selected={isSelected}
      data-active={account.isActive}
      data-tone={account.requiresReauth ? 'reauth' : account.weekly.tone}
    >
      <button type="button" className="command-deck-account__select" onClick={onSelect}>
        <span className="command-deck-account__name">{account.name}</span>
        <span className="command-deck-account__meta">{account.email}</span>
      </button>
      <div className="command-deck-account__badges">
        {account.isActive ? <span>Active</span> : null}
        {account.requiresReauth ? <span>Re-auth</span> : null}
        <span>{account.plan}</span>
      </div>
      <QuotaMeter label="Weekly" level={account.weekly} />
      <QuotaMeter label="5h" level={account.fiveHour} />
      <p className="command-deck-account__updated">{account.updatedLabel}</p>
      {account.errorMessage ? <p className="command-deck-account__error">{account.errorMessage}</p> : null}
      {confirmRemove ? (
        <div className="command-deck-account__confirm">
          <span>Remove account?</span>
          <button type="button" disabled={busy} onClick={onRemove}>Remove</button>
          <button type="button" disabled={busy} onClick={onCancelRemove}>Cancel</button>
        </div>
      ) : (
        <div className="command-deck-account__actions">
          <button type="button" disabled={busy || account.isActive} onClick={onSwitch}>Switch</button>
          <button type="button" disabled={busy} onClick={onRefresh}>Refresh</button>
          <button type="button" disabled={busy} onClick={onAskRemove}>Remove</button>
        </div>
      )}
    </article>
  );
}

function QuotaMeter({
  label,
  level,
}: Readonly<{ label: string; level: CommandDeckQuotaLevel }>) {
  const percent = level.percent ?? 0;

  return (
    <div className="command-deck-meter" data-tone={level.tone}>
      <div className="command-deck-meter__row">
        <span>{label}</span>
        <strong>{level.percent === null ? 'Unknown' : `${level.percent}%`}</strong>
      </div>
      <div className="command-deck-meter__track">
        <span style={{ width: `${percent}%` }} />
      </div>
      <small>{level.resetLabel}</small>
    </div>
  );
}
