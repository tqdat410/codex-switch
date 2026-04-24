'use client';

import type { AccountSummary } from '@codex-switch/shared';
import { startTransition, useMemo, useState } from 'react';
import { QuotaLabStage } from './quota-lab-stage';
import { buildQuotaLabItems } from '../../lib/quota-lab-view-model';
import { useUsagePolling } from '../../lib/usage-hooks';

export function AccountGridClient({
  initialAccounts,
  pollingEnabled,
}: Readonly<{
  initialAccounts: AccountSummary[];
  pollingEnabled: boolean;
}>) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const { usage, pending, refresh } = useUsagePolling(
    Object.fromEntries(initialAccounts.map((account) => [account.name, account.latestQuota])),
    60_000,
    pollingEnabled,
  );
  const labItems = useMemo(() => buildQuotaLabItems(accounts, usage), [accounts, usage]);

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

  async function refreshLabData() {
    await refresh();
    await refreshAccounts();
  }

  if (accounts.length === 0) {
    return (
      <div className="lab-empty-state">
        <p>No accounts in the vault yet.</p>
        <p>Open the add-account route directly when you are ready to ingest a Codex login.</p>
      </div>
    );
  }

  return <QuotaLabStage items={labItems} pending={pending} onRefresh={refreshLabData} />;
}
