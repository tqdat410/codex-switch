import { AppShell } from './components/app-shell';
import { CommandDeckDashboard } from './components/command-deck-dashboard';
import { readAccountsSnapshot, readRecentSessions, readUsageSnapshot } from '../lib/db';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const accounts = readAccountsSnapshot();
  const recentSessions = readRecentSessions(6, 0);
  const to = Date.now();
  const from = to - 14 * 24 * 60 * 60 * 1_000;
  const usageSnapshot = readUsageSnapshot(from, to);
  const pollingEnabled = process.env.CODEX_SWITCH_POLL_DISABLED !== '1';

  return (
    <AppShell
      title="Command Deck"
      description="Vault control, quota telemetry, and session history for local Codex account switching."
      variant="command"
    >
      <CommandDeckDashboard
        initialAccounts={accounts}
        recentSessions={recentSessions.rows}
        usageSnapshot={usageSnapshot}
        pollingEnabled={pollingEnabled}
      />
    </AppShell>
  );
}
