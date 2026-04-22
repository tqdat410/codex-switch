import { AppShell } from './components/app-shell';
import { AccountGridClient } from './components/account-grid-client';
import { readAccountsSnapshot } from '../lib/db';

export default function HomePage() {
  const accounts = readAccountsSnapshot();

  return (
    <AppShell
      title="Native account switcher"
      description="Swap Codex OAuth accounts without a proxy. The dashboard stays local, reads your vault state, and opens new terminals for login and switching."
    >
      <AccountGridClient initialAccounts={accounts} />
    </AppShell>
  );
}
