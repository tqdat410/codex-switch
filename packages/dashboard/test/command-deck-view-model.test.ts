import assert from 'node:assert/strict';
import test from 'node:test';
import type { AccountSummary, AccountUsageSnapshot } from '@codex-switch/shared';
import {
  buildCommandDeckModel,
  clampPercent,
  formatCompactNumber,
  formatDuration,
  quotaTone,
  selectDefaultAccountName,
} from '../lib/command-deck-view-model';

test('clampPercent preserves null and clamps numeric bounds', () => {
  assert.equal(clampPercent(null), null);
  assert.equal(clampPercent(undefined), null);
  assert.equal(clampPercent(Number.NaN), null);
  assert.equal(clampPercent(-12), 0);
  assert.equal(clampPercent(45.4), 45);
  assert.equal(clampPercent(120), 100);
});

test('quotaTone maps empty, healthy, warning, danger, and reauth states', () => {
  assert.equal(quotaTone(null, false), 'empty');
  assert.equal(quotaTone(86, false), 'healthy');
  assert.equal(quotaTone(45, false), 'warn');
  assert.equal(quotaTone(20, false), 'danger');
  assert.equal(quotaTone(100, true), 'reauth');
});

test('buildCommandDeckModel keeps all accounts and selects active by default', () => {
  const model = buildCommandDeckModel({
    accounts: [accountSummary('personal', false), accountSummary('work', true)],
    usageByAccount: { work: usageSnapshot({ fiveHourPercent: 42, weeklyPercent: 88 }) },
    recentSessions: [],
    usageSnapshot: emptyUsage(),
  });

  assert.equal(model.accounts.length, 2);
  assert.equal(model.selectedAccountName, 'work');
  assert.equal(model.metrics.totalAccounts, 2);
  assert.equal(model.accounts[1]?.fiveHour.tone, 'warn');
  assert.equal(model.accounts[1]?.weekly.tone, 'healthy');
});

test('selectDefaultAccountName falls back to first account when none active', () => {
  const accounts = [accountSummary('personal', false), accountSummary('work', false)];

  assert.equal(selectDefaultAccountName(accounts), 'personal');
});

test('reauth overrides quota tone and increments metric', () => {
  const model = buildCommandDeckModel({
    accounts: [accountSummary('work', false)],
    usageByAccount: {
      work: usageSnapshot({
        fiveHourPercent: 90,
        weeklyPercent: 95,
        requiresReauth: true,
        errorMessage: 'OAuth session expired.',
      }),
    },
    recentSessions: [],
    usageSnapshot: emptyUsage(),
  });

  assert.equal(model.accounts[0]?.requiresReauth, true);
  assert.equal(model.accounts[0]?.weekly.tone, 'reauth');
  assert.equal(model.metrics.reauthCount, 1);
});

test('low, warning, and unknown quota metrics are classified by lowest window', () => {
  const model = buildCommandDeckModel({
    accounts: [
      accountSummary('low', false),
      accountSummary('warn', false),
      accountSummary('unknown', false),
    ],
    usageByAccount: {
      low: usageSnapshot({ fiveHourPercent: 19, weeklyPercent: 91 }),
      warn: usageSnapshot({ fiveHourPercent: 44, weeklyPercent: 80 }),
    },
    recentSessions: [],
    usageSnapshot: emptyUsage(),
  });

  assert.equal(model.metrics.lowQuotaCount, 1);
  assert.equal(model.metrics.warningQuotaCount, 1);
  assert.equal(model.metrics.unknownQuotaCount, 1);
});

test('formatting helpers handle active duration and compact numbers', () => {
  assert.equal(formatDuration(1_000, null), 'active');
  assert.equal(formatDuration(0, 90_000), '2 min');
  assert.equal(formatDuration(0, 7_200_000), '2h');
  assert.equal(formatCompactNumber(1_250), '1.3K');
});

function accountSummary(
  name: string,
  isActive: boolean,
  overrides: Partial<AccountSummary> = {},
): AccountSummary {
  return {
    name,
    email: `${name}@example.test`,
    plan: 'Plus',
    addedAt: 1,
    lastUsedAt: null,
    notes: null,
    isActive,
    latestQuota: null,
    ...overrides,
  };
}

function usageSnapshot({
  fiveHourPercent,
  weeklyPercent,
  requiresReauth = false,
  errorMessage = null,
}: {
  fiveHourPercent: number;
  weeklyPercent: number;
  requiresReauth?: boolean;
  errorMessage?: string | null;
}): AccountUsageSnapshot {
  return {
    fiveHour: { percentLeft: fiveHourPercent, resetAt: null },
    weekly: { percentLeft: weeklyPercent, resetAt: null },
    capturedAt: 1_000,
    ageMs: 600,
    requiresReauth,
    source: 'cache',
    error: errorMessage ? { code: 'reauth', message: errorMessage } : null,
  };
}

function emptyUsage() {
  return { accounts: [], requestsPerDay: [] };
}
