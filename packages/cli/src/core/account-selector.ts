import type { AccountRecord, QuotaCacheRow } from '@codex-switch/shared';
import { readCachedQuotaState } from './quota-cache-reader.js';
import type { FetchQuotaWithCacheResult } from './quota-orchestrator.js';

export interface AccountSelectionCandidate {
  account: AccountRecord;
  quota: FetchQuotaWithCacheResult | null;
  isActive?: boolean;
}

export async function selectBestAccount() {
  const state = readCachedQuotaState();
  const accounts = state.accounts;
  if (accounts.length === 0) {
    throw new Error('No accounts in vault. Run `cs add --name <name>` first.');
  }

  const candidates = accounts.map((account) => ({
    account,
    quota: {
      row: state.quotas[account.name] ?? null,
      fresh: false,
      reason: state.authStates[account.name]?.requiresReauth ? 'requires_reauth' as const : 'cache' as const,
      requiresReauth: state.authStates[account.name]?.requiresReauth ?? false,
      source: state.quotas[account.name] ? 'cache' as const : null,
      error: null,
    },
    isActive: state.active?.account === account.name,
  }));

  return candidates.sort(compareCandidates)[0]?.account.name ?? accounts[0]?.name;
}

function compareCandidates(left: AccountSelectionCandidate, right: AccountSelectionCandidate) {
  const scoreDiff = scoreCandidate(right) - scoreCandidate(left);
  if (scoreDiff !== 0) {
    return scoreDiff;
  }

  return Number(Boolean(right.isActive)) - Number(Boolean(left.isActive));
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
