import assert from 'node:assert/strict';
import test from 'node:test';
import type { AccountSummary, AccountUsageSnapshot } from '@codex-switch/shared';
import {
  buildQuotaLabItems,
  clampPercent,
  computeLabGrid,
  quotaTone,
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

function accountSummary(name: string, isActive: boolean): AccountSummary {
  return {
    name,
    email: `${name}@example.test`,
    plan: 'Plus',
    addedAt: 1,
    lastUsedAt: null,
    notes: null,
    isActive,
    latestQuota: null,
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
