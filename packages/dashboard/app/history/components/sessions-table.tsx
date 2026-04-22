import Link from 'next/link';
import type { SessionRow } from '@codex-switch/shared';

export function SessionsTable({
  rows,
  page,
  pageSize,
  total,
}: Readonly<{
  rows: SessionRow[];
  page: number;
  pageSize: number;
  total: number;
}>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="rounded-[24px] border border-[var(--card-border)] bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent sessions</h2>
        <p className="text-sm text-[var(--muted)]">
          Page {page} of {totalPages}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-[var(--muted)]">
            <tr>
              <th className="pb-3 font-medium">Account</th>
              <th className="pb-3 font-medium">Started</th>
              <th className="pb-3 font-medium">Duration</th>
              <th className="pb-3 font-medium">Requests</th>
              <th className="pb-3 font-medium">Token in</th>
              <th className="pb-3 font-medium">Token out</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sessionId} className="border-t border-black/6">
                <td className="py-3">{row.account}</td>
                <td className="py-3">{new Date(row.startedAt).toLocaleString()}</td>
                <td className="py-3">{formatDuration(row.startedAt, row.endedAt)}</td>
                <td className="py-3">{row.requestCount}</td>
                <td className="py-3">{row.tokenIn ?? 'n/a'}</td>
                <td className="py-3">{row.tokenOut ?? 'n/a'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <PagerLink disabled={page <= 1} href={`/history?page=${page - 1}`}>
          Previous
        </PagerLink>
        <PagerLink disabled={page >= totalPages} href={`/history?page=${page + 1}`}>
          Next
        </PagerLink>
      </div>
    </div>
  );
}

function PagerLink({
  href,
  disabled,
  children,
}: Readonly<{ href: string; disabled: boolean; children: React.ReactNode }>) {
  if (disabled) {
    return (
      <span className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--muted)] opacity-60">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-full border border-[var(--card-border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      {children}
    </Link>
  );
}

function formatDuration(startedAt: number, endedAt: number | null) {
  if (!endedAt) {
    return 'active';
  }

  const minutes = Math.max(1, Math.round((endedAt - startedAt) / 60_000));
  return `${minutes} min`;
}
