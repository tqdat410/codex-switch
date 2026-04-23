'use client';

import type { AccountSummary, AccountUsageSnapshot } from '@codex-switch/shared';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { QuotaGauge } from './quota-gauge';
import { ReauthBanner } from './reauth-banner';
import { SwitchButton } from './switch-button';

export function AccountCard({
  account,
  usage,
  onDone,
  onRefreshUsage,
}: Readonly<{
  account: AccountSummary;
  usage: AccountUsageSnapshot | null;
  onDone: () => void;
  onRefreshUsage: (account: string) => Promise<void> | void;
}>) {
  const [pending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const currentUsage = usage ?? account.latestQuota;

  return (
    <article className="rounded-[24px] border border-[var(--card-border)] bg-white/90 p-5 shadow-[0_12px_30px_rgba(20,29,51,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{account.name}</h2>
            {account.isActive ? (
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Active
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">{account.email ?? 'Email unknown'}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{account.plan ?? 'Plan unknown'}</p>
        </div>
        <button
          type="button"
          disabled={refreshing}
          className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={async () => {
            setRefreshing(true);
            try {
              await onRefreshUsage(account.name);
            } finally {
              setRefreshing(false);
            }
          }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mt-5">
        {currentUsage?.requiresReauth ? (
          <ReauthBanner account={account.name} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <QuotaGauge label="5h" quota={currentUsage?.fiveHour ?? null} />
            <QuotaGauge label="7d" quota={currentUsage?.weekly ?? null} />
          </div>
        )}
      </div>

      <div className="mt-4 space-y-1 text-sm text-[var(--muted)]">
        <p>
          Updated{' '}
          {currentUsage?.ageMs !== null && currentUsage?.ageMs !== undefined
            ? formatAge(currentUsage.ageMs)
            : 'never'}
        </p>
        {currentUsage?.error ? <p>{currentUsage.error.message}</p> : null}
        <p>
          Last used{' '}
          {account.lastUsedAt ? new Date(account.lastUsedAt).toLocaleString() : 'not yet tracked'}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <SwitchButton name={account.name} disabled={account.isActive} onDone={onDone} />
        <button
          type="button"
          disabled={pending || account.isActive}
          className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--danger)] hover:text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            startTransition(async () => {
              const response = await fetch(`/api/accounts/${encodeURIComponent(account.name)}`, {
                method: 'DELETE',
              });
              const payload = (await response.json().catch(() => ({}))) as { error?: string };

              if (!response.ok) {
                toast.error(payload.error ?? 'Delete failed.');
                return;
              }

              toast.success(`Removed "${account.name}".`);
              onDone();
            });
          }}
        >
          {pending ? 'Removing...' : 'Remove'}
        </button>
      </div>
    </article>
  );
}

function formatAge(ageMs: number) {
  const diffMinutes = Math.round(Math.max(0, ageMs) / 60_000);
  if (diffMinutes < 1) {
    return 'just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.round(diffHours / 24)}d ago`;
}
