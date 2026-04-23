'use client';

import type { QuotaWindow } from '@codex-switch/shared';
import { useEffect, useState } from 'react';

export function QuotaGauge({
  label,
  quota,
}: Readonly<{
  label: string;
  quota: QuotaWindow | null;
}>) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const percent = quota?.percentLeft ?? null;
  const tone =
    percent === null
      ? 'bg-[var(--card-border)]'
      : percent <= 10
        ? 'bg-[var(--danger)]'
        : percent <= 25
          ? 'bg-[var(--warning)]'
          : 'bg-[var(--success)]';

  return (
    <div className="space-y-2 rounded-[18px] border border-[var(--card-border)] bg-white/70 p-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>{label}</span>
        <span>{percent === null ? 'No data' : `${Math.round(percent)}% left`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--accent-soft)]">
        <div
          className={`h-full rounded-full transition-all ${tone}`}
          style={{ width: `${Math.max(0, Math.min(100, percent ?? 0))}%` }}
        />
      </div>
      <p className="text-sm text-[var(--muted)]">
        {quota?.resetAt ? `Resets in ${formatRemaining(quota.resetAt, now)}` : 'Reset unavailable'}
      </p>
    </div>
  );
}

function formatRemaining(timestamp: number, now: number) {
  const diffMs = Math.max(0, timestamp - now);
  const diffMinutes = Math.round(diffMs / 60_000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}
