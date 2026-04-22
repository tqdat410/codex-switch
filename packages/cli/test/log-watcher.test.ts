import assert from 'node:assert/strict';
import test from 'node:test';
import { collectLogUpdates, parseHistoryChunk } from '../src/core/log-watcher-helpers.js';

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

test('collectLogUpdates skips rows older than switchedAt while advancing the cursor', () => {
  const updates = collectLogUpdates(
    [
      {
        id: 1,
        ts: 100,
        thread_id: 'before-thread',
        feedback_log_body: '{"usage":{"input_tokens":2,"output_tokens":1}}',
      },
      {
        id: 2,
        ts: 200,
        thread_id: 'after-thread',
        feedback_log_body:
          '{"usage":{"input_tokens":9,"output_tokens":4},"rate_limit":{"used":3,"remaining":7,"reset_seconds":60}}',
      },
    ],
    'beta',
    150_000,
  );

  assert.equal(updates.lastLogId, 2);
  assert.equal(updates.sessions.length, 1);
  assert.equal(updates.sessions[0]?.sessionId, 'after-thread');
  assert.equal(updates.sessions[0]?.account, 'beta');
  assert.equal(updates.quotaSamples.length, 1);
  assert.equal(updates.quotaSamples[0]?.account, 'beta');
});
