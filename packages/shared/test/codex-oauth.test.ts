import assert from 'node:assert/strict';
import test from 'node:test';
import { OAuthRefreshError, refreshAccessToken } from '../src/codex-oauth.js';

test('refreshAccessToken merges refreshed tokens into auth json', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    return new Response(
      JSON.stringify({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        id_token: 'new-id-token',
        token_type: 'Bearer',
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      },
    );
  });

  const refreshed = await refreshAccessToken({
    auth_mode: 'chatgpt',
    tokens: {
      access_token: 'old-access-token',
      refresh_token: 'old-refresh-token',
      account_id: 'acc-1',
    },
  });

  assert.equal(refreshed.tokens?.access_token, 'new-access-token');
  assert.equal(refreshed.tokens?.refresh_token, 'new-refresh-token');
  assert.equal(refreshed.tokens?.id_token, 'new-id-token');
  assert.equal(refreshed.tokens?.account_id, 'acc-1');
  assert.equal(typeof refreshed.last_refresh, 'string');
});

test('refreshAccessToken throws invalid_grant for rejected refresh tokens', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    return new Response(JSON.stringify({ error: 'invalid_grant' }), {
      status: 400,
      headers: {
        'content-type': 'application/json',
      },
    });
  });

  await assert.rejects(
    () =>
      refreshAccessToken({
        tokens: {
          refresh_token: 'fake-refresh-token',
        },
      }),
    (error: unknown) =>
      error instanceof OAuthRefreshError && error.code === 'invalid_grant',
  );
});
