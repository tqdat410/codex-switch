'use client';

import type { AccountSummary } from '@codex-switch/shared';
import { startTransition, useEffect, useState } from 'react';
import { AccountCard } from './account-card';

export function AccountGridClient({
  initialAccounts,
}: Readonly<{
  initialAccounts: AccountSummary[];
}>) {
  const [accounts, setAccounts] = useState(initialAccounts);

  async function refresh() {
    const response = await fetch('/api/accounts', { cache: 'no-store' });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { accounts: AccountSummary[] };
    startTransition(() => {
      setAccounts(payload.accounts);
    });
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refresh();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

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
        <AccountCard key={account.name} account={account} onDone={() => void refresh()} />
      ))}
    </div>
  );
}
