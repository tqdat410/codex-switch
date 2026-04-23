import { AppShell } from '../components/app-shell';
import { readRecentSessions, readUsageSnapshot } from '../../lib/db';
import { RequestsPerDayChart } from './components/requests-per-day-chart';
import { SessionsTable } from './components/sessions-table';

const PAGE_SIZE = 20;

export default async function HistoryPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const resolvedSearchParams =
    (searchParams ? await searchParams : undefined) ?? {};
  const page = Math.max(1, Number(resolvedSearchParams.page ?? '1'));
  const to = Date.now();
  const from = to - 30 * 24 * 60 * 60 * 1000;
  const usage = readUsageSnapshot(from, to);
  const sessions = readRecentSessions(PAGE_SIZE, (page - 1) * PAGE_SIZE);

  return (
    <AppShell
      title="Usage history"
      description="Recent sessions and request activity grouped by day. Data stays on your machine and comes from the local vault database."
    >
      <div className="grid gap-4">
        <RequestsPerDayChart data={usage.requestsPerDay} accounts={usage.accounts} />
      </div>
      <div className="mt-4">
        <SessionsTable rows={sessions.rows} page={page} pageSize={PAGE_SIZE} total={sessions.total} />
      </div>
    </AppShell>
  );
}
