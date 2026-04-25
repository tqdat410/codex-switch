import type { AccountRecord, QuotaCacheRow } from '@codex-switch/shared';
import { listAccounts, openStateDatabase } from './db.js';
import { fetchQuotaWithCache, type FetchQuotaWithCacheResult } from './quota-orchestrator.js';

export interface AccountSelectionCandidate {
  account: AccountRecord;
  quota: FetchQuotaWithCacheResult | null;
}

export async function selectBestAccount() {
  const accounts = readAccounts();
  if (accounts.length === 0) {
    throw new Error('No accounts in vault. Run `cs add --name <name>` first.');
  }

  const candidates: AccountSelectionCandidate[] = [];
  for (const account of accounts) {
    candidates.push({
      account,
      quota: await readQuota(account.name),
    });
  }

  return candidates.sort(compareCandidates)[0]?.account.name ?? accounts[0]?.name;
}

function readAccounts() {
  const db = openStateDatabase();

  try {
    return listAccounts(db);
  } finally {
    db.close();
  }
}

async function readQuota(account: string): Promise<FetchQuotaWithCacheResult | null> {
  try {
    return await fetchQuotaWithCache(account, { force: true });
  } catch {
    return null;
  }
}

function compareCandidates(left: AccountSelectionCandidate, right: AccountSelectionCandidate) {
  return scoreCandidate(right) - scoreCandidate(left);
}

function scoreCandidate(candidate: AccountSelectionCandidate) {
  if (candidate.quota?.requiresReauth) {
    return -1_000;
  }

  const row = candidate.quota?.row ?? null;
  if (!row) {
    return 0;
  }

  if (row.staleReason === 'requires_reauth') {
    return -1_000;
  }

  const fiveHour = scoreWindow(row.fiveHourPercent);
  const weekly = scoreWindow(row.weeklyPercent);
  return fiveHour * 10 + weekly;
}

function scoreWindow(percentLeft: QuotaCacheRow['fiveHourPercent']) {
  if (percentLeft === null) {
    return 1;
  }

  if (percentLeft <= 0) {
    return -100;
  }

  return percentLeft;
}
