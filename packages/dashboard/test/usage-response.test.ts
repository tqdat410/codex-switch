import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildUsageResponse,
  quotaResultToUsageSnapshot,
} from '../lib/usage-response';

test('quotaResultToUsageSnapshot maps cached quota rows', () => {
  const snapshot = quotaResultToUsageSnapshot(
    {
      row: {
        account: 'personal',
        capturedAt: 1_000,
        fiveHourPercent: 42,
        fiveHourResetAt: 2_000,
        weeklyPercent: null,
        weeklyResetAt: null,
        source: 'wham',
        staleReason: null,
      },
      fresh: false,
      reason: 'cache',
      requiresReauth: false,
      source: 'cache',
      error: null,
    },
    1_600,
  );

  assert.deepEqual(snapshot, {
    fiveHour: {
      percentLeft: 42,
      resetAt: 2_000,
    },
    weekly: {
      percentLeft: null,
      resetAt: null,
    },
    capturedAt: 1_000,
    ageMs: 600,
    requiresReauth: false,
    source: 'cache',
    error: null,
  });
});

test('buildUsageResponse isolates per-account failures', async () => {
  const payload = await buildUsageResponse(['personal', 'work'], {
    ttlMs: 120_000,
    now: () => 2_000,
    fetchQuota: async (account) => {
      if (account === 'personal') {
        return {
          row: {
            account: 'personal',
            capturedAt: 1_000,
            fiveHourPercent: 70,
            fiveHourResetAt: 2_500,
            weeklyPercent: 85,
            weeklyResetAt: 8_000,
            source: 'wham',
            staleReason: null,
          },
          fresh: true,
          reason: 'probed',
          requiresReauth: false,
          source: 'wham',
          error: null,
        };
      }

      throw Object.assign(new Error('Vault snapshot is broken.'), {
        code: 'vault_invalid',
      });
    },
  });

  assert.equal(payload.ttlMs, 120_000);
  assert.equal(payload.accounts.personal?.fiveHour?.percentLeft, 70);
  assert.equal(payload.accounts.personal?.weekly?.percentLeft, 85);
  assert.equal(payload.accounts.work?.requiresReauth, true);
  assert.deepEqual(payload.accounts.work?.error, {
    code: 'vault_invalid',
    message: 'Vault snapshot could not be parsed.',
  });
});
