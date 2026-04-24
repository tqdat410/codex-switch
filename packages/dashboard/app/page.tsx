import { AppShell } from './components/app-shell';
import { AccountGridClient } from './components/account-grid-client';
import { readAccountsSnapshot } from '../lib/db';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const accounts = readAccountsSnapshot();
  const pollingEnabled = process.env.CODEX_SWITCH_POLL_DISABLED !== '1';

  return (
    <AppShell
      title="Active quota reactor"
      description="Read-only local quota monitoring for the active Codex account. Weekly capacity fills the upper chamber; 5h capacity fills the lower chamber."
      hideNavigation
      variant="lab"
    >
      <AccountGridClient initialAccounts={accounts} pollingEnabled={pollingEnabled} />
    </AppShell>
  );
}
