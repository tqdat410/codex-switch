import type { AccountSummary, AccountUsageSnapshot, QuotaWindow, SessionRow } from '@codex-switch/shared';
import type { UsageSnapshot } from './db';

export type QuotaTone = 'empty' | 'healthy' | 'warn' | 'danger' | 'reauth';

export interface CommandDeckQuotaLevel {
  percent: number | null;
  resetAt: number | null;
  tone: QuotaTone;
  resetLabel: string;
}

export interface CommandDeckAccount {
  name: string;
  email: string;
  plan: string;
  isActive: boolean;
  requiresReauth: boolean;
  errorMessage: string | null;
  sourceLabel: string;
  updatedLabel: string;
  capturedAtLabel: string;
  fiveHour: CommandDeckQuotaLevel;
  weekly: CommandDeckQuotaLevel;
}

export interface CommandDeckMetrics {
  totalAccounts: number;
  activeAccountName: string | null;
  lowQuotaCount: number;
  warningQuotaCount: number;
  reauthCount: number;
  unknownQuotaCount: number;
  newestQuotaLabel: string;
}

export interface CommandDeckModel {
  accounts: CommandDeckAccount[];
  metrics: CommandDeckMetrics;
  selectedAccountName: string | null;
  recentSessions: SessionRow[];
  usageSnapshot: UsageSnapshot;
}

type UsageMap = Record<string, AccountUsageSnapshot | null | undefined>;

export function buildCommandDeckModel({
  accounts,
  usageByAccount,
  recentSessions,
  usageSnapshot,
  selectedAccountName,
}: {
  accounts: AccountSummary[];
  usageByAccount: UsageMap;
  recentSessions: SessionRow[];
  usageSnapshot: UsageSnapshot;
  selectedAccountName?: string | null;
}): CommandDeckModel {
  const deckAccounts = accounts.map((account) => buildDeckAccount(account, usageByAccount));
  const selected = selectedAccountName ?? selectDefaultAccountName(accounts);

  return {
    accounts: deckAccounts,
    metrics: buildMetrics(accounts, usageByAccount),
    selectedAccountName: selected,
    recentSessions,
    usageSnapshot,
  };
}

export function selectDefaultAccountName(accounts: AccountSummary[]): string | null {
  return accounts.find((account) => account.isActive)?.name ?? accounts[0]?.name ?? null;
}

export function clampPercent(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function quotaTone(percent: number | null, requiresReauth: boolean): QuotaTone {
  if (requiresReauth) {
    return 'reauth';
  }

  if (percent === null) {
    return 'empty';
  }

  if (percent <= 20) {
    return 'danger';
  }

  if (percent <= 45) {
    return 'warn';
  }

  return 'healthy';
}

export function formatUpdatedLabel(usage: AccountUsageSnapshot | null | undefined) {
  if (!usage || usage.ageMs === null || usage.ageMs === undefined) {
    return 'Updated never';
  }

  const minutes = Math.round(Math.max(0, usage.ageMs) / 60_000);
  if (minutes < 1) {
    return 'Updated just now';
  }

  if (minutes < 60) {
    return `Updated ${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `Updated ${hours}h ago`;
  }

  return `Updated ${Math.round(hours / 24)}d ago`;
}

export function formatResetLabel(resetAt: number | null | undefined) {
  return resetAt ? `Resets ${new Date(resetAt).toLocaleString()}` : 'Reset unknown';
}

export function formatCapturedAtLabel(capturedAt: number | null | undefined) {
  return capturedAt ? new Date(capturedAt).toLocaleString() : 'Never captured';
}

export function formatDuration(startedAt: number, endedAt: number | null) {
  if (!endedAt) {
    return 'active';
  }

  const minutes = Math.max(1, Math.round((endedAt - startedAt) / 60_000));
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function formatCompactNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return 'n/a';
  }

  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function buildDeckAccount(account: AccountSummary, usageByAccount: UsageMap): CommandDeckAccount {
  const usage = usageByAccount[account.name] ?? account.latestQuota;
  const requiresReauth = Boolean(usage?.requiresReauth);
  const fiveHourPercent = clampPercent(usage?.fiveHour?.percentLeft);
  const weeklyPercent = clampPercent(usage?.weekly?.percentLeft);

  return {
    name: account.name,
    email: account.email ?? 'Email unknown',
    plan: account.plan ?? 'Plan unknown',
    isActive: account.isActive,
    requiresReauth,
    errorMessage: usage?.error?.message ?? null,
    sourceLabel: usage?.source ? `Source ${usage.source}` : 'Source unknown',
    updatedLabel: formatUpdatedLabel(usage),
    capturedAtLabel: formatCapturedAtLabel(usage?.capturedAt),
    fiveHour: buildQuotaLevel(usage?.fiveHour, fiveHourPercent, requiresReauth),
    weekly: buildQuotaLevel(usage?.weekly, weeklyPercent, requiresReauth),
  };
}

function buildQuotaLevel(
  quota: QuotaWindow | null | undefined,
  percent: number | null,
  requiresReauth: boolean,
): CommandDeckQuotaLevel {
  return {
    percent,
    resetAt: quota?.resetAt ?? null,
    tone: quotaTone(percent, requiresReauth),
    resetLabel: formatResetLabel(quota?.resetAt),
  };
}

function buildMetrics(accounts: AccountSummary[], usageByAccount: UsageMap): CommandDeckMetrics {
  let lowQuotaCount = 0;
  let warningQuotaCount = 0;
  let reauthCount = 0;
  let unknownQuotaCount = 0;
  let newestCapturedAt: number | null = null;

  for (const account of accounts) {
    const usage = usageByAccount[account.name] ?? account.latestQuota;
    const requiresReauth = Boolean(usage?.requiresReauth);
    const fiveHour = clampPercent(usage?.fiveHour?.percentLeft);
    const weekly = clampPercent(usage?.weekly?.percentLeft);
    const quotaValues = [fiveHour, weekly].filter((value) => value !== null);
    const lowest = quotaValues.length > 0 ? Math.min(...quotaValues) : null;

    if (requiresReauth) {
      reauthCount += 1;
    }
    if (lowest === null) {
      unknownQuotaCount += 1;
    } else if (lowest <= 20) {
      lowQuotaCount += 1;
    } else if (lowest <= 45) {
      warningQuotaCount += 1;
    }
    if (usage?.capturedAt && (!newestCapturedAt || usage.capturedAt > newestCapturedAt)) {
      newestCapturedAt = usage.capturedAt;
    }
  }

  return {
    totalAccounts: accounts.length,
    activeAccountName: accounts.find((account) => account.isActive)?.name ?? null,
    lowQuotaCount,
    warningQuotaCount,
    reauthCount,
    unknownQuotaCount,
    newestQuotaLabel: newestCapturedAt ? formatCapturedAtLabel(newestCapturedAt) : 'No quota cache',
  };
}
