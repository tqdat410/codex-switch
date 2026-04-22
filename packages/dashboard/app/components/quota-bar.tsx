import type { QuotaSample } from '@codex-switch/shared';

export function QuotaBar({ sample }: Readonly<{ sample: QuotaSample | null }>) {
  const used = sample?.used ?? 0;
  const remaining = sample?.remaining ?? 0;
  const total = used + remaining;
  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const tone =
    percent >= 90
      ? 'bg-[var(--danger)]'
      : percent >= 70
        ? 'bg-[var(--warning)]'
        : 'bg-[var(--success)]';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>{sample?.limitKind ?? 'quota'}</span>
        <span>{total > 0 ? `${used}/${total}` : 'No data'}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--accent-soft)]">
        <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm text-[var(--muted)]">
        {sample?.resetAt
          ? `Resets ${new Date(sample.resetAt).toLocaleString()}`
          : 'No reset estimate captured yet.'}
      </p>
    </div>
  );
}
