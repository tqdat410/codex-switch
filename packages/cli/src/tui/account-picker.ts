import { cancel, isCancel, select } from '@clack/prompts';
import { getActiveAccount, listAccounts, openStateDatabase } from '../core/db.js';
import { formatQuotaSummary, getLatestQuotaByAccount } from '../core/quota-aggregator.js';
import { getAllAccountAuthStates } from '../core/quota-cache.js';

export async function pickAccountFromTui() {
  const db = openStateDatabase();

  try {
    const accounts = listAccounts(db);
    if (accounts.length === 0) {
      cancel('No accounts in vault. Run `cs add` first.');
      return null;
    }

    const active = getActiveAccount(db);
    const quotas = getLatestQuotaByAccount(db);
    const authStates = getAllAccountAuthStates(db);
    const result = await select({
      message: 'Pick a Codex account',
      options: accounts.map((account) => {
        const labelParts = [
          active?.account === account.name ? '●' : '○',
          account.name,
        ];

        if (account.plan) {
          labelParts.push(account.plan);
        }

        if (account.email) {
          labelParts.push(account.email);
        }

        if (authStates[account.name]?.requiresReauth) {
          labelParts.push('reauth required');
        } else {
          labelParts.push(formatQuotaSummary(quotas[account.name] ?? null));
        }

        if (account.lastUsedAt) {
          labelParts.push(`used ${formatRelative(account.lastUsedAt)}`);
        }

        return {
          value: account.name,
          label: labelParts.join(' · '),
        };
      }),
    });

    if (isCancel(result)) {
      cancel('Cancelled.');
      return null;
    }

    return result;
  } finally {
    db.close();
  }
}

function formatRelative(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const diffHours = Math.round(diffMs / 3_600_000);
  if (diffHours <= 1) {
    return '1h ago';
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffMs / 86_400_000);
  return `${diffDays}d ago`;
}
