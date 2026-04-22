'use client';

import type { AccountSummary } from '@codex-switch/shared';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { QuotaBar } from './quota-bar';
import { SwitchButton } from './switch-button';

export function AccountCard({
  account,
  onDone,
}: Readonly<{
  account: AccountSummary;
  onDone: () => void;
}>) {
  const [pending, startTransition] = useTransition();

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
      </div>

      <div className="mt-5">
        <QuotaBar sample={account.latestQuota} />
      </div>

      <p className="mt-4 text-sm text-[var(--muted)]">
        Last used{' '}
        {account.lastUsedAt ? new Date(account.lastUsedAt).toLocaleString() : 'not yet tracked'}
      </p>

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
