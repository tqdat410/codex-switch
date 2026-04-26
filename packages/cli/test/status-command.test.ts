import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { Command } from 'commander';
import test from 'node:test';
import { registerStatusCommand } from '../src/commands/status.js';
import { openStateDatabase, setActiveAccount, upsertAccount } from '../src/core/db.js';
import { upsertQuotaCache } from '../src/core/quota-cache.js';

test('status without refresh reads cache without calling quota network', async () => {
  const cleanup = await withTempVaultRoot();
  const db = openStateDatabase();
  const output: string[] = [];
  const originalLog = console.log;

  test.mock.method(globalThis, 'fetch', async () => {
    throw new Error('status without --refresh must not call quota network');
  });

  try {
    upsertAccount(db, { name: 'personal', email: null, plan: null, notes: null });
    setActiveAccount(db, 'personal');
    upsertQuotaCache(db, 'personal', {
      fiveHour: { percentLeft: 77, resetAt: Date.now() + 60_000 },
      weekly: { percentLeft: 88, resetAt: Date.now() + 600_000 },
      capturedAt: Date.now(),
      source: 'wham',
    });
    console.log = (value?: unknown) => {
      output.push(String(value));
    };

    await createProgram().parseAsync(['node', 'test', 'status']);

    assert.match(output.join('\n'), /personal/);
    assert.match(output.join('\n'), /77%/);
  } finally {
    console.log = originalLog;
    db.close();
    await cleanup();
  }
});

function createProgram() {
  const program = new Command();
  program.exitOverride();
  registerStatusCommand(program);
  return program;
}

async function withTempVaultRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'codex-switch-status-'));
  const previous = process.env.CODEX_SWITCH_VAULT_ROOT;
  process.env.CODEX_SWITCH_VAULT_ROOT = tempRoot;

  return async () => {
    if (previous === undefined) {
      delete process.env.CODEX_SWITCH_VAULT_ROOT;
    } else {
      process.env.CODEX_SWITCH_VAULT_ROOT = previous;
    }

    await rm(tempRoot, { recursive: true, force: true });
  };
}
