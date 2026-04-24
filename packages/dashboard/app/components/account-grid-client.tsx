'use client';

import type { AccountSummary } from '@codex-switch/shared';
import { startTransition, useMemo, useState } from 'react';
import { QuotaLabStage } from './quota-lab-stage';
import {
  buildQuotaLabItems,
  selectActiveAccount,
} from '../../lib/quota-lab-view-model';
import { useUsagePolling } from '../../lib/usage-hooks';

export function AccountGridClient({
  initialAccounts,
  pollingEnabled,
}: Readonly<{
  initialAccounts: AccountSummary[];
  pollingEnabled: boolean;
}>) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const activeAccount = useMemo(() => selectActiveAccount(accounts), [accounts]);
  const initialActiveAccount = selectActiveAccount(initialAccounts);
  const { usage, pending, refresh } = useUsagePolling(
    initialActiveAccount
      ? { [initialActiveAccount.name]: initialActiveAccount.latestQuota }
      : {},
    60_000,
    pollingEnabled && Boolean(activeAccount),
    activeAccount?.name,
  );
  const labItems = useMemo(
    () => (activeAccount ? buildQuotaLabItems([activeAccount], usage) : []),
    [activeAccount, usage],
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

  async function refreshLabData() {
    if (activeAccount) {
      await refresh(activeAccount.name);
    }
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

  if (!activeAccount) {
    return (
      <div className="lab-empty-state" role="status">
        <p>No active account recorded.</p>
        <p>Switch to an account from the CLI, then refresh this dashboard.</p>
        <button
          type="button"
          className="quota-lab-stage__refresh"
          disabled={pending}
          onClick={() => {
            void refreshAccounts();
          }}
        >
          {pending ? 'Refreshing...' : 'Refresh accounts'}
        </button>
      </div>
    );
  }

  return <QuotaLabStage items={labItems} pending={pending} onRefresh={refreshLabData} />;
}
