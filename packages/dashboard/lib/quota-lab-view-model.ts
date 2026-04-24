import type { AccountSummary, AccountUsageSnapshot, QuotaWindow } from '@codex-switch/shared';

export type QuotaTone = 'empty' | 'healthy' | 'warn' | 'danger' | 'reauth';

export interface LabQuotaLevel {
  percent: number | null;
  resetAt: number | null;
  tone: QuotaTone;
  resetLabel: string;
}

export interface LabAccountItem {
  name: string;
  email: string;
  plan: string;
  isActive: boolean;
  requiresReauth: boolean;
  errorMessage: string | null;
  updatedLabel: string;
  fiveHour: LabQuotaLevel;
  weekly: LabQuotaLevel;
  layout: {
    index: number;
    row: number;
    column: number;
    columns: number;
    rows: number;
    x: number;
    y: number;
  };
}

type UsageMap = Record<string, AccountUsageSnapshot | null | undefined>;

const CELL_WIDTH = 2.8;
const CELL_HEIGHT = 2.7;

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

export function computeLabGrid(count: number) {
  const columns = count <= 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
  return {
    columns,
    rows: Math.max(1, Math.ceil(count / columns)),
  };
}

export function buildQuotaLabItems(
  accounts: AccountSummary[],
  usageByAccount: UsageMap,
): LabAccountItem[] {
  const grid = computeLabGrid(accounts.length);

  return accounts.map((account, index) => {
    const usage = usageByAccount[account.name] ?? account.latestQuota;
    const requiresReauth = Boolean(usage?.requiresReauth);
    const fiveHourPercent = clampPercent(usage?.fiveHour?.percentLeft);
    const weeklyPercent = clampPercent(usage?.weekly?.percentLeft);
    const row = Math.floor(index / grid.columns);
    const column = index % grid.columns;

    return {
      name: account.name,
      email: account.email ?? 'Email unknown',
      plan: account.plan ?? 'Plan unknown',
      isActive: account.isActive,
      requiresReauth,
      errorMessage: usage?.error?.message ?? null,
      updatedLabel: formatUpdatedLabel(usage),
      fiveHour: buildQuotaLevel(usage?.fiveHour, fiveHourPercent, requiresReauth),
      weekly: buildQuotaLevel(usage?.weekly, weeklyPercent, requiresReauth),
      layout: {
        index,
        row,
        column,
        columns: grid.columns,
        rows: grid.rows,
        x: (column - (grid.columns - 1) / 2) * CELL_WIDTH,
        y: ((grid.rows - 1) / 2 - row) * CELL_HEIGHT,
      },
    };
  });
}

function buildQuotaLevel(
  quota: QuotaWindow | null | undefined,
  percent: number | null,
  requiresReauth: boolean,
): LabQuotaLevel {
  return {
    percent,
    resetAt: quota?.resetAt ?? null,
    tone: quotaTone(percent, requiresReauth),
    resetLabel: formatResetLabel(quota?.resetAt ?? null),
  };
}

function formatUpdatedLabel(usage: AccountUsageSnapshot | null | undefined) {
  if (!usage || usage.ageMs === null || usage.ageMs === undefined) {
    return 'Updated never';
  }

  const diffMinutes = Math.round(Math.max(0, usage.ageMs) / 60_000);
  if (diffMinutes < 1) {
    return 'Updated just now';
  }

  if (diffMinutes < 60) {
    return `Updated ${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Updated ${diffHours}h ago`;
  }

  return `Updated ${Math.round(diffHours / 24)}d ago`;
}

function formatResetLabel(resetAt: number | null) {
  if (!resetAt) {
    return 'Reset unknown';
  }

  return `Resets ${new Date(resetAt).toLocaleString()}`;
}
