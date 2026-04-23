import assert from 'node:assert/strict';
import test from 'node:test';
import { QuotaProbeError, probeQuota } from '../src/quota-probe.js';

function jwt(payload: Record<string, unknown>) {
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.sig`;
}

test('probeQuota parses wham quota windows', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    return new Response(
      JSON.stringify({
        rate_limit: {
          primary_window: {
            used_percent: 58,
            reset_at: 1_800_000_000,
          },
          secondary_window: {
            used_percent: 12,
            reset_at: 1_900_000_000,
          },
        },
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      },
    );
  });

  const snapshot = await probeQuota({
    tokens: {
      access_token: jwt({
        'https://api.openai.com/auth': {
          chatgpt_account_id: 'acc-123',
        },
      }),
    },
  });

  assert.equal(snapshot.source, 'wham');
  assert.equal(snapshot.fiveHour?.percentLeft, 42);
  assert.equal(snapshot.weekly?.percentLeft, 88);
});

test('probeQuota falls back to codex usage when wham is missing', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls += 1;
    if (calls === 1) {
      return new Response('not found', { status: 404 });
    }

    return new Response(
      JSON.stringify({
        usage: {
          five_hour: {
            percent_left: 0.5,
            reset_time_ms: 1_800_000_000_000,
          },
          weekly: {
            percent_left: 0.75,
            reset_time_ms: 1_900_000_000_000,
          },
        },
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      },
    );
  });

  const snapshot = await probeQuota({
    tokens: {
      access_token: jwt({
        'https://api.openai.com/auth': {
          chatgpt_account_id: 'acc-123',
        },
      }),
    },
  });

  assert.equal(snapshot.source, 'codex');
  assert.equal(snapshot.fiveHour?.percentLeft, 50);
  assert.equal(snapshot.weekly?.percentLeft, 75);
});

test('probeQuota surfaces unauthorized errors', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('nope', { status: 401 }));

  await assert.rejects(
    () =>
      probeQuota({
        tokens: {
          access_token: jwt({
            'https://api.openai.com/auth': {
              chatgpt_account_id: 'acc-123',
            },
          }),
        },
      }),
    (error: unknown) =>
      error instanceof QuotaProbeError && error.code === 'unauthorized',
  );
});

test('probeQuota requires an account id', async () => {
  await assert.rejects(
    () =>
      probeQuota({
        tokens: {
          access_token: jwt({ sub: 'user-1' }),
        },
      }),
    (error: unknown) =>
      error instanceof QuotaProbeError && error.code === 'account_missing',
  );
});
