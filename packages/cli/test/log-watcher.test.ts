import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHistoryChunk } from '../src/core/log-watcher-helpers.js';

test('parseHistoryChunk ignores sessions from before the active switch', () => {
  const rows = parseHistoryChunk(
    [
      JSON.stringify({ session_id: 'before', ts: 100 }),
      JSON.stringify({ session_id: 'after', ts: 200 }),
    ].join('\n'),
    'beta',
    150_000,
  );

  assert.deepEqual(
    rows.map((row) => row.sessionId),
    ['after'],
  );
  assert.equal(rows[0]?.account, 'beta');
});
