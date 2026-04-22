import assert from 'node:assert/strict';
import test from 'node:test';
import { eachLocalDayBucket, formatLocalDayBucket } from '../lib/day-buckets';

test('formatLocalDayBucket keeps the local calendar day', () => {
  const timestamp = new Date(2026, 3, 23, 0, 30, 0, 0).getTime();
  assert.equal(formatLocalDayBucket(timestamp), '2026-04-23');
});

test('eachLocalDayBucket fills inclusive local-day buckets', () => {
  const from = new Date(2026, 3, 23, 8, 0, 0, 0).getTime();
  const to = new Date(2026, 3, 25, 18, 0, 0, 0).getTime();

  assert.deepEqual(eachLocalDayBucket(from, to), [
    '2026-04-23',
    '2026-04-24',
    '2026-04-25',
  ]);
});
