'use client';

import type { CommandDeckAccount } from '../../lib/command-deck-view-model';
import { CommandDeckAccountModule } from './command-deck-account-module';

export function CommandDeckAccountField({
  accounts,
  selectedAccountName,
  busy,
  confirmRemoveName,
  onSelect,
  onSwitch,
  onRefresh,
  onRemove,
  onAskRemove,
  onCancelRemove,
}: Readonly<{
  accounts: CommandDeckAccount[];
  selectedAccountName: string | null;
  busy: boolean;
  confirmRemoveName: string | null;
  onSelect: (name: string) => void;
  onSwitch: (name: string) => void;
  onRefresh: (name: string) => void;
  onRemove: (name: string) => void;
  onAskRemove: (name: string) => void;
  onCancelRemove: () => void;
}>) {
  if (accounts.length === 0) {
    return (
      <section className="command-deck-empty-panel">
        <h2>No accounts in the vault.</h2>
        <p>Add an account to start switching and tracking quota.</p>
      </section>
    );
  }

  return (
    <section className="command-deck-account-field" aria-label="Vault accounts">
      {accounts.map((account) => (
        <CommandDeckAccountModule
          key={account.name}
          account={account}
          isSelected={account.name === selectedAccountName}
          busy={busy}
          confirmRemove={confirmRemoveName === account.name}
          onSelect={() => onSelect(account.name)}
          onSwitch={() => onSwitch(account.name)}
          onRefresh={() => onRefresh(account.name)}
          onRemove={() => onRemove(account.name)}
          onAskRemove={() => onAskRemove(account.name)}
          onCancelRemove={onCancelRemove}
        />
      ))}
    </section>
  );
}
