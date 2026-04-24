'use client';

import type { AccountSummary, SessionRow } from '@codex-switch/shared';
import type { UsageSnapshot } from '../../lib/db';
import { CommandDeckDashboard } from './command-deck-dashboard';

export function AccountGridClient({
  initialAccounts,
  recentSessions = [],
  usageSnapshot = { accounts: [], requestsPerDay: [] },
  pollingEnabled,
}: Readonly<{
  initialAccounts: AccountSummary[];
  recentSessions?: SessionRow[];
  usageSnapshot?: UsageSnapshot;
  pollingEnabled: boolean;
}>) {
  return (
    <CommandDeckDashboard
      initialAccounts={initialAccounts}
      recentSessions={recentSessions}
      usageSnapshot={usageSnapshot}
      pollingEnabled={pollingEnabled}
    />
  );
}
