'use client';

import Link from 'next/link';
import type { CommandDeckMetrics } from '../../lib/command-deck-view-model';

export function CommandDeckCommandStrip({
  metrics,
  busy,
  onRefreshAll,
}: Readonly<{
  metrics: CommandDeckMetrics;
  busy: boolean;
  onRefreshAll: () => void;
}>) {
  return (
    <section className="command-deck-strip" aria-label="Dashboard commands">
      <Metric label="Active" value={metrics.activeAccountName ?? 'None'} />
      <Metric label="Accounts" value={String(metrics.totalAccounts)} />
      <Metric label="Low" value={String(metrics.lowQuotaCount)} />
      <Metric label="Warn" value={String(metrics.warningQuotaCount)} />
      <Metric label="Re-auth" value={String(metrics.reauthCount)} />
      <Metric label="Quota cache" value={metrics.newestQuotaLabel} wide />
      <div className="command-deck-strip__actions">
        <button type="button" disabled={busy} onClick={onRefreshAll}>
          {busy ? 'Refreshing...' : 'Refresh all'}
        </button>
        <Link href="/add">Add account</Link>
        <Link href="/history">History</Link>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  wide = false,
}: Readonly<{ label: string; value: string; wide?: boolean }>) {
  return (
    <div className="command-deck-strip__metric" data-wide={wide}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
