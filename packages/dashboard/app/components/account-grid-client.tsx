'use client';

import type { AccountSummary } from '@codex-switch/shared';
import { startTransition, useState } from 'react';
import { AccountCard } from './account-card';
import { useUsagePolling } from '../../lib/usage-hooks';

export function AccountGridClient({
  initialAccounts,
  pollingEnabled,
}: Readonly<{
  initialAccounts: AccountSummary[];
  pollingEnabled: boolean;
}>) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const { usage, refresh } = useUsagePolling(
    Object.fromEntries(initialAccounts.map((account) => [account.name, account.latestQuota])),
    60_000,
    pollingEnabled,
  );

  async function refreshAccounts() {
    const response = await fetch('/api/accounts', { cache: 'no-store' });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { accounts: AccountSummary[] };
    startTransition(() => {
      setAccounts(payload.accounts);
    });
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-[var(--card-border)] bg-white/80 p-8 text-center text-[var(--muted)]">
        No accounts yet. Open the Add Account screen to ingest a new Codex login.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {accounts.map((account) => (
        <AccountCard
          key={account.name}
          account={account}
          usage={usage[account.name] ?? null}
          onDone={() => void refreshAccounts()}
          onRefreshUsage={(name) => refresh(name)}
        />
      ))}
    </div>
  );
}
