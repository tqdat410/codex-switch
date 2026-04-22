import assert from 'node:assert/strict';
import test from 'node:test';
import { waitForAccountReady } from '../lib/account-availability';

test('waitForAccountReady resolves when the account appears', async () => {
  let now = 0;
  let attempts = 0;

  const ready = await waitForAccountReady({
    name: 'personal',
    timeoutMs: 10,
    intervalMs: 1,
    now: () => now,
    sleep: async () => {
      now += 1;
    },
    fetchAccountNames: async () => {
      attempts += 1;
      return attempts >= 2 ? ['personal'] : [];
    },
  });

  assert.equal(ready, true);
});

test('waitForAccountReady rejects with AbortError when aborted', async () => {
  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    () =>
      waitForAccountReady({
        name: 'personal',
        signal: controller.signal,
        fetchAccountNames: async () => [],
        sleep: async () => undefined,
      }),
    (error: unknown) => error instanceof Error && error.name === 'AbortError',
  );
});
