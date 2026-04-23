import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { vaultAccountFile, vaultAccountsDir } from '@codex-switch/shared';
import { fetchQuotaWithCache } from '../src/core/quota-orchestrator.js';
import { openStateDatabase } from '../src/core/db.js';
import { getAccountAuthState } from '../src/core/quota-cache.js';
import { writeVaultEntry } from '../src/core/vault.js';

function jwt(payload: Record<string, unknown>) {
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.sig`;
}

test('fetchQuotaWithCache caches successful probes', async (t) => {
  const cleanup = await withTempVaultRoot();
  const farFutureExp = Math.floor(Date.now() / 1000) + 3_600;
  let calls = 0;

  t.mock.method(globalThis, 'fetch', async () => {
    calls += 1;
    return new Response(
      JSON.stringify({
        rate_limit: {
          five_hour: {
            percent_left: 42,
            reset_time_ms: 1_800_000_000_000,
          },
          weekly: {
            percent_left: 84,
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

  try {
    await writeVaultEntry('personal', {
      tokens: {
        access_token: jwt({
          exp: farFutureExp,
          'https://api.openai.com/auth': {
            chatgpt_account_id: 'acc-1',
          },
        }),
        refresh_token: 'refresh-token',
      },
    });

    const first = await fetchQuotaWithCache('personal', { force: true, ttlMs: 120_000 });
    const second = await fetchQuotaWithCache('personal', { ttlMs: 120_000 });

    assert.equal(first.reason, 'probed');
    assert.equal(second.reason, 'cache');
    assert.equal(first.row?.fiveHourPercent, 42);
    assert.equal(second.row?.weeklyPercent, 84);
    assert.equal(calls, 1);
  } finally {
    await cleanup();
  }
});

test('fetchQuotaWithCache single-flights concurrent refreshes', async (t) => {
  const cleanup = await withTempVaultRoot();
  const farFutureExp = Math.floor(Date.now() / 1000) + 3_600;
  let calls = 0;

  t.mock.method(globalThis, 'fetch', async () => {
    calls += 1;
    await sleep(25);
    return new Response(
      JSON.stringify({
        rate_limit: {
          five_hour: {
            percent_left: 55,
            reset_time_ms: 1_800_000_000_000,
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

  try {
    await writeVaultEntry('personal', {
      tokens: {
        access_token: jwt({
          exp: farFutureExp,
          'https://api.openai.com/auth': {
            chatgpt_account_id: 'acc-1',
          },
        }),
        refresh_token: 'refresh-token',
      },
    });

    const results = await Promise.all([
      fetchQuotaWithCache('personal', { force: true, ttlMs: 0 }),
      fetchQuotaWithCache('personal', { force: true, ttlMs: 0 }),
      fetchQuotaWithCache('personal', { force: true, ttlMs: 0 }),
    ]);

    assert.equal(calls, 1);
    assert.equal(results.every((result) => result.row?.fiveHourPercent === 55), true);
  } finally {
    await cleanup();
  }
});

test('fetchQuotaWithCache marks accounts for reauth on invalid_grant', async (t) => {
  const cleanup = await withTempVaultRoot();
  const db = openStateDatabase();

  t.mock.method(globalThis, 'fetch', async () => {
    return new Response(JSON.stringify({ error: 'invalid_grant' }), {
      status: 400,
      headers: {
        'content-type': 'application/json',
      },
    });
  });

  try {
    await writeVaultEntry('personal', {
      tokens: {
        refresh_token: 'refresh-token',
      },
    });

    const result = await fetchQuotaWithCache('personal', { force: true, ttlMs: 0 });

    assert.equal(result.reason, 'requires_reauth');
    assert.equal(result.requiresReauth, true);
    assert.equal(getAccountAuthState(db, 'personal').requiresReauth, true);
  } finally {
    db.close();
    await cleanup();
  }
});

test('fetchQuotaWithCache degrades when the vault snapshot is missing', async () => {
  const cleanup = await withTempVaultRoot();

  try {
    const result = await fetchQuotaWithCache('personal', { force: true, ttlMs: 0 });

    assert.equal(result.reason, 'requires_reauth');
    assert.equal(result.requiresReauth, true);
    assert.deepEqual(result.error, {
      code: 'vault_missing',
      message: 'Vault snapshot is missing for this account.',
    });
  } finally {
    await cleanup();
  }
});

test('fetchQuotaWithCache degrades when the vault snapshot is invalid', async () => {
  const cleanup = await withTempVaultRoot();

  try {
    await writeFile(vaultAccountFile('personal'), '{"tokens":{"access_token":1}}', 'utf8');

    const result = await fetchQuotaWithCache('personal', { force: true, ttlMs: 0 });

    assert.equal(result.reason, 'requires_reauth');
    assert.equal(result.requiresReauth, true);
    assert.deepEqual(result.error, {
      code: 'vault_invalid',
      message: 'Vault snapshot could not be parsed.',
    });
  } finally {
    await cleanup();
  }
});

async function withTempVaultRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'codex-switch-quota-orchestrator-'));
  const previous = process.env.CODEX_SWITCH_VAULT_ROOT;
  process.env.CODEX_SWITCH_VAULT_ROOT = tempRoot;
  await mkdir(vaultAccountsDir(), { recursive: true });

  return async () => {
    if (previous === undefined) {
      delete process.env.CODEX_SWITCH_VAULT_ROOT;
    } else {
      process.env.CODEX_SWITCH_VAULT_ROOT = previous;
    }

    await rm(tempRoot, { recursive: true, force: true });
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
