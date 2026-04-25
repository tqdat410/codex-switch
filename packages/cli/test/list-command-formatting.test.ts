import assert from 'node:assert/strict';
import test from 'node:test';
import { formatListRows, formatQuotaBar, type ListDisplayRow } from '../src/commands/quota-display.js';

const BOLD = '\u001B[1m';
const ANSI_PATTERN = new RegExp(`${BOLD.slice(0, 2).replace('[', '\\[')}[0-9;]*m`, 'g');
const COLOR_PATTERN = new RegExp(`${BOLD.slice(0, 2).replace('[', '\\[')}(31|32|33|36)m`);

test('formatQuotaBar renders deterministic block bars', () => {
  assert.equal(stripAnsi(formatQuotaBar('5h', 42)), '5h [████████░░░░░░░░░░░░] 42%');
  assert.equal(stripAnsi(formatQuotaBar('7d', 84)), '7d [█████████████████░░░] 84%');
  assert.match(formatQuotaBar('5h', 42), new RegExp(escapeRegExp(BOLD)));
  assert.doesNotMatch(formatQuotaBar('5h', 42), COLOR_PATTERN);
});

test('formatQuotaBar clamps unavailable and out-of-range values', () => {
  assert.equal(stripAnsi(formatQuotaBar('5h', null)), '5h [░░░░░░░░░░░░░░░░░░░░] --');
  assert.equal(stripAnsi(formatQuotaBar('5h', -20)), '5h [░░░░░░░░░░░░░░░░░░░░] 0%');
  assert.equal(stripAnsi(formatQuotaBar('5h', 120)), '5h [████████████████████] 100%');
});

test('formatListRows renders healthy probe rows', () => {
  const output = formatListRows([
    row({
      quotaReason: 'probed',
      quotaSource: 'wham',
      latestQuota: quota({
        fiveHourPercent: 42,
        fiveHourResetAt: todayAt(16, 52),
        weeklyPercent: 84,
        weeklyResetAt: localDate(2026, 4, 29, 13, 4),
      }),
    }),
  ]);
  const cleanOutput = stripAnsi(output);

  assert.match(cleanOutput, /^╭─+┬─+┬─+╮/m);
  assert.match(cleanOutput, /│ Account \(1\)\s+│ 5h Limit\s+│ Weekly Limit\s+│/);
  assert.match(cleanOutput, /\* personal/);
  assert.match(cleanOutput, /\(Pro \/ user@example.com\)/);
  assert.match(cleanOutput, /│ \[████████░{12}\] 42%\s+│/);
  assert.match(cleanOutput, /│ \(resets 16:52\)\s+│/);
  assert.match(cleanOutput, /│ \[█████████████████░{3}\] 84%/);
  assert.match(cleanOutput, /│ \(resets 13:04 on 29 Apr\)/);
  assert.match(output, new RegExp(escapeRegExp(BOLD)));
  assert.doesNotMatch(output, COLOR_PATTERN);
  assert.doesNotMatch(cleanOutput, /source probe:wham/);
  assert.doesNotMatch(cleanOutput, /last used/);
});

test('formatListRows can hide email addresses for private terminal output', () => {
  const output = formatListRows(
    [
      row({
        quotaReason: 'probed',
        latestQuota: quota({
          fiveHourPercent: 42,
          weeklyPercent: 84,
        }),
      }),
    ],
    { private: true },
  );
  const cleanOutput = stripAnsi(output);

  assert.doesNotMatch(cleanOutput, /user@example\.com/);
  assert.match(cleanOutput, /\(Pro \/ email hidden\)/);
  assert.match(cleanOutput, /\* personal/);
  assert.match(cleanOutput, /│ \[████████░{12}\] 42%\s+│/);
});

test('formatListRows renders partial and stale cache rows', () => {
  const output = formatListRows([
    row({
      quotaReason: 'stale_network',
      quotaSource: 'cache',
      latestQuota: quota({
        fiveHourPercent: 30,
        weeklyPercent: null,
        staleReason: 'network',
      }),
    }),
  ]);
  const cleanOutput = stripAnsi(output);

  assert.match(cleanOutput, /│ \[██████░{14}\] 30%\s+│/);
  assert.match(cleanOutput, /│ \[░{20}\] --/);
  assert.match(cleanOutput, /stale:network/);
  assert.doesNotMatch(cleanOutput, /source cache/);
});

test('formatListRows renders unavailable reauth rows', () => {
  const output = formatListRows([
    row({
      latestQuota: null,
      quotaReason: 'requires_reauth',
      requiresReauth: true,
      quotaError: {
        code: 'vault_missing',
        message: 'Vault snapshot is missing for this account.',
      },
    }),
  ]);
  const cleanOutput = stripAnsi(output);

  assert.match(cleanOutput, /│ \[░{20}\] --\s+│/);
  assert.match(cleanOutput, /│ \[░{20}\] --/);
  assert.match(cleanOutput, /reauth required/);
  assert.match(cleanOutput, /vault_missing/);
});

function row(overrides: Partial<ListDisplayRow>): ListDisplayRow {
  return {
    name: 'personal',
    email: 'user@example.com',
    plan: 'Pro',
    addedAt: 1,
    lastUsedAt: 1_800_000_000_000,
    notes: null,
    isActive: true,
    latestQuota: null,
    requiresReauth: false,
    quotaReason: 'cache',
    quotaSource: null,
    quotaError: null,
    ...overrides,
  };
}

function todayAt(hour: number, minute: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute).getTime();
}

function localDate(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

function quota(overrides: Partial<NonNullable<ListDisplayRow['latestQuota']>>) {
  return {
    account: 'personal',
    capturedAt: 1_800_000_000_000,
    fiveHourPercent: null,
    fiveHourResetAt: null,
    weeklyPercent: null,
    weeklyResetAt: null,
    source: 'wham' as const,
    staleReason: null,
    ...overrides,
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripAnsi(value: string) {
  return value.replace(ANSI_PATTERN, '');
}
