'use client';

import type { AccountSummary, SessionRow } from '@codex-switch/shared';
import { startTransition, useMemo, useState } from 'react';
import type { UsageSnapshot } from '../../lib/db';
import { buildCommandDeckModel, selectDefaultAccountName } from '../../lib/command-deck-view-model';
import { useUsagePolling } from '../../lib/usage-hooks';
import { CommandDeckAccountField } from './command-deck-account-field';
import { CommandDeckActivityBand } from './command-deck-activity-band';
import { CommandDeckAmbient } from './command-deck-ambient';
import { CommandDeckCommandStrip } from './command-deck-command-strip';
import { CommandDeckTelemetryPanel } from './command-deck-telemetry-panel';

export function CommandDeckDashboard({
  initialAccounts,
  recentSessions,
  usageSnapshot,
  pollingEnabled,
}: Readonly<{
  initialAccounts: AccountSummary[];
  recentSessions: SessionRow[];
  usageSnapshot: UsageSnapshot;
  pollingEnabled: boolean;
}>) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [selectedAccountName, setSelectedAccountName] = useState(() => selectDefaultAccountName(initialAccounts));
  const [confirmRemoveName, setConfirmRemoveName] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mutatingName, setMutatingName] = useState<string | null>(null);
  const initialUsage = useMemo(() => Object.fromEntries(initialAccounts.map((account) => [
    account.name,
    account.latestQuota,
  ])), [initialAccounts]);
  const activeAccountName = accounts.find((account) => account.isActive)?.name ?? selectedAccountName;
  const { usage, pending, refresh } = useUsagePolling(
    initialUsage,
    60_000,
    pollingEnabled && Boolean(activeAccountName),
    activeAccountName,
  );
  const model = useMemo(
    () => buildCommandDeckModel({
      accounts,
      usageByAccount: usage,
      recentSessions,
      usageSnapshot,
      selectedAccountName,
    }),
    [accounts, recentSessions, selectedAccountName, usage, usageSnapshot],
  );
  const selectedAccount = model.accounts.find((account) => account.name === model.selectedAccountName) ?? null;
  const busy = pending || mutatingName !== null;
  const activeIndex = Math.max(0, model.accounts.findIndex((account) => account.isActive));
  const selectedTone = selectedAccount?.requiresReauth ? 'reauth' : selectedAccount?.weekly.tone ?? 'empty';

  async function refreshAccounts(nextSelectedName?: string | null) {
    const response = await fetch('/api/accounts', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(await readError(response, 'Unable to refresh accounts.'));
    }

    const payload = (await response.json()) as { accounts: AccountSummary[] };
    startTransition(() => {
      setAccounts(payload.accounts);
      setSelectedAccountName(nextSelectedName ?? selectDefaultAccountName(payload.accounts));
    });
  }

  async function runAction(name: string | null, action: () => Promise<void>) {
    setMutatingName(name);
    setActionError(null);

    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action failed.');
    } finally {
      setMutatingName(null);
    }
  }

  return (
    <section className="command-deck" aria-busy={busy}>
      <CommandDeckAmbient
        accountCount={model.accounts.length}
        activeIndex={activeIndex}
        selectedTone={selectedTone}
      />
      <div className="command-deck__content">
        <CommandDeckCommandStrip
          metrics={model.metrics}
          busy={busy}
          onRefreshAll={() => {
            void runAction(null, async () => {
              await refresh();
              await refreshAccounts(selectedAccountName);
            });
          }}
        />
        {actionError ? <p className="command-deck__error" role="alert">{actionError}</p> : null}
        <div className="command-deck__grid">
          <CommandDeckAccountField
            accounts={model.accounts}
            selectedAccountName={model.selectedAccountName}
            busy={busy}
            confirmRemoveName={confirmRemoveName}
            onSelect={(name) => {
              setSelectedAccountName(name);
              setConfirmRemoveName(null);
            }}
            onSwitch={(name) => {
              void runAction(name, async () => {
                await postJson('/api/switch', { name });
                await refreshAccounts(name);
              });
            }}
            onRefresh={(name) => {
              void runAction(name, async () => {
                await refresh(name);
                await refreshAccounts(name);
              });
            }}
            onRemove={(name) => {
              void runAction(name, async () => {
                const response = await fetch(`/api/accounts/${encodeURIComponent(name)}`, { method: 'DELETE' });
                if (!response.ok) {
                  throw new Error(await readError(response, 'Unable to remove account.'));
                }
                setConfirmRemoveName(null);
                await refreshAccounts(null);
              });
            }}
            onAskRemove={setConfirmRemoveName}
            onCancelRemove={() => setConfirmRemoveName(null)}
          />
          <CommandDeckTelemetryPanel
            account={selectedAccount}
            busy={busy}
            confirmRemove={Boolean(selectedAccount && confirmRemoveName === selectedAccount.name)}
            onSwitch={() => {
              if (selectedAccount) {
                void runAction(selectedAccount.name, async () => {
                  await postJson('/api/switch', { name: selectedAccount.name });
                  await refreshAccounts(selectedAccount.name);
                });
              }
            }}
            onRefresh={() => {
              if (selectedAccount) {
                void runAction(selectedAccount.name, async () => {
                  await refresh(selectedAccount.name);
                  await refreshAccounts(selectedAccount.name);
                });
              }
            }}
            onRemove={() => {
              if (selectedAccount) {
                void runAction(selectedAccount.name, async () => {
                  const response = await fetch(`/api/accounts/${encodeURIComponent(selectedAccount.name)}`, {
                    method: 'DELETE',
                  });
                  if (!response.ok) {
                    throw new Error(await readError(response, 'Unable to remove account.'));
                  }
                  setConfirmRemoveName(null);
                  await refreshAccounts(null);
                });
              }
            }}
            onAskRemove={() => {
              if (selectedAccount) {
                setConfirmRemoveName(selectedAccount.name);
              }
            }}
            onCancelRemove={() => setConfirmRemoveName(null)}
          />
        </div>
        <CommandDeckActivityBand sessions={model.recentSessions} usageSnapshot={model.usageSnapshot} />
      </div>
    </section>
  );
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'Request failed.'));
  }
}

async function readError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? fallback;
}
