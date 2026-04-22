import assert from 'node:assert/strict';
import test from 'node:test';
import { extractQuotaSamples, extractTokenUsage } from '../src/core/log-parsers.js';

test('extractTokenUsage reads token counts from websocket payload text', () => {
  const usage = extractTokenUsage('{"usage":{"input_tokens":321,"output_tokens":45}}');

  assert.deepEqual(usage, {
    tokenIn: 321,
    tokenOut: 45,
  });
});

test('extractQuotaSamples infers request quota data', () => {
  const samples = extractQuotaSamples(
    '{"rate_limit":{"used":12,"remaining":88,"reset_seconds":60}}',
    'personal',
    1_700_000_000_000,
  );

  assert.equal(samples.length, 1);
  assert.equal(samples[0]?.account, 'personal');
  assert.equal(samples[0]?.used, 12);
  assert.equal(samples[0]?.remaining, 88);
  assert.equal(samples[0]?.limitKind, 'requests');
  assert.equal(samples[0]?.resetAt, 1_700_000_060_000);
});
