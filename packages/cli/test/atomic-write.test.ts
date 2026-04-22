import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { writeTextAtomic } from '../src/util/atomic-write.js';

test('writeTextAtomic replaces file contents and cleans temp files', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'codex-switch-atomic-'));
  const targetFile = path.join(tempDir, 'auth.json');

  try {
    await writeFile(targetFile, '{"old":true}\n', 'utf8');
    await writeTextAtomic(targetFile, '{"new":true}\n');

    assert.equal(await readFile(targetFile, 'utf8'), '{"new":true}\n');

    const entries = await readdir(tempDir);
    assert.equal(entries.some((entry) => entry.startsWith('auth.json.tmp-')), false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
