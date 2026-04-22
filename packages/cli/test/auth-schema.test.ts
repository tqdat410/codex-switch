import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveAccountMetadata, parseAccountName, parseAuthJson } from '../src/core/auth-schema.js';

test('parseAccountName accepts expected slug names', () => {
  assert.equal(parseAccountName('personal'), 'personal');
  assert.equal(parseAccountName('work_2'), 'work_2');
});

test('parseAuthJson keeps forward-compatible shapes', () => {
  const auth = parseAuthJson({
    auth_mode: 'chatgpt',
    tokens: {
      account_id: 'acc-1',
      custom_field: 'kept',
    },
    extra: true,
  });

  assert.equal(auth.tokens?.account_id, 'acc-1');
  assert.equal(auth.extra, true);
});

test('deriveAccountMetadata decodes id_token claims', () => {
  const payload = Buffer.from(
    JSON.stringify({
      email: 'user@example.com',
      'https://api.openai.com/auth': {
        chatgpt_plan_type: 'team',
        chatgpt_account_id: 'acc-123',
      },
    }),
  ).toString('base64url');

  const metadata = deriveAccountMetadata({
    tokens: {
      id_token: `header.${payload}.sig`,
    },
  });

  assert.equal(metadata.email, 'user@example.com');
  assert.equal(metadata.plan, 'team');
  assert.equal(metadata.accountId, 'acc-123');
});
