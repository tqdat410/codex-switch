import assert from 'node:assert/strict';
import test from 'node:test';
import type { AccountSummary, AccountUsageSnapshot } from '@codex-switch/shared';
import {
  buildQuotaLabItems,
  clampPercent,
  computeLabGrid,
  quotaTone,
  selectActiveAccount,
} from '../lib/quota-lab-view-model';

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

test('buildQuotaLabItems maps account identity and usage quota levels', () => {
  const usage = usageSnapshot({
    fiveHourPercent: 42,
    weeklyPercent: 88,
    fiveHourResetAt: 2_000,
    weeklyResetAt: 8_000,
  });

  const [item] = buildQuotaLabItems([accountSummary('personal', true)], {
    personal: usage,
  });

  assert.equal(item?.name, 'personal');
  assert.equal(item?.isActive, true);
  assert.equal(item?.fiveHour.percent, 42);
  assert.equal(item?.fiveHour.tone, 'warn');
  assert.equal(item?.weekly.percent, 88);
  assert.equal(item?.weekly.tone, 'healthy');
  assert.equal(item?.requiresReauth, false);
});

test('buildQuotaLabItems supports 9+ accounts with stable grid metadata', () => {
  const accounts = Array.from({ length: 10 }, (_, index) =>
    accountSummary(`account-${index + 1}`, index === 0),
  );
  const items = buildQuotaLabItems(accounts, {});

  assert.equal(items.length, 10);
  assert.deepEqual(computeLabGrid(10), { columns: 4, rows: 3 });
  assert.equal(items[9]?.layout.column, 1);
  assert.equal(items[9]?.layout.row, 2);
  assert.equal(items[0]?.weekly.tone, 'empty');
});

test('buildQuotaLabItems surfaces reauth state above quota percentages', () => {
  const [item] = buildQuotaLabItems([accountSummary('work', false)], {
    work: usageSnapshot({
      fiveHourPercent: 90,
      weeklyPercent: 95,
      requiresReauth: true,
      errorMessage: 'OAuth token expired.',
    }),
  });

  assert.equal(item?.requiresReauth, true);
  assert.equal(item?.errorMessage, 'OAuth token expired.');
  assert.equal(item?.fiveHour.tone, 'reauth');
  assert.equal(item?.weekly.tone, 'reauth');
});

test('selectActiveAccount returns the active account from a mixed vault', () => {
  const accounts = [
    accountSummary('personal', false),
    accountSummary('work', true),
    accountSummary('sandbox', false),
  ];

  const activeAccount = selectActiveAccount(accounts);
  const items = activeAccount ? buildQuotaLabItems([activeAccount], {}) : [];

  assert.equal(activeAccount?.name, 'work');
  assert.equal(items.length, 1);
  assert.equal(items[0]?.name, 'work');
});

test('selectActiveAccount returns null when no account is active', () => {
  const accounts = [accountSummary('personal', false), accountSummary('work', false)];

  assert.equal(selectActiveAccount(accounts), null);
});

test('active account mapping falls back to latest quota snapshot', () => {
  const activeAccount = accountSummary('personal', true, {
    latestQuota: usageSnapshot({
      fiveHourPercent: 17,
      weeklyPercent: 73,
    }),
  });

  const [item] = buildQuotaLabItems([activeAccount], {});

  assert.equal(item?.fiveHour.percent, 17);
  assert.equal(item?.fiveHour.tone, 'danger');
  assert.equal(item?.weekly.percent, 73);
  assert.equal(item?.weekly.tone, 'healthy');
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
  fiveHourResetAt = null,
  weeklyResetAt = null,
  requiresReauth = false,
  errorMessage = null,
}: {
  fiveHourPercent: number;
  weeklyPercent: number;
  fiveHourResetAt?: number | null;
  weeklyResetAt?: number | null;
  requiresReauth?: boolean;
  errorMessage?: string | null;
}): AccountUsageSnapshot {
  return {
    fiveHour: {
      percentLeft: fiveHourPercent,
      resetAt: fiveHourResetAt,
    },
    weekly: {
      percentLeft: weeklyPercent,
      resetAt: weeklyResetAt,
    },
    capturedAt: 1_000,
    ageMs: 600,
    requiresReauth,
    source: 'cache',
    error: errorMessage ? { code: 'reauth', message: errorMessage } : null,
  };
}
