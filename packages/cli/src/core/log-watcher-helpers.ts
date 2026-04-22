import type { QuotaSample, SessionRow } from '@codex-switch/shared';
import { extractQuotaSamples, extractTokenUsage } from './log-parsers.js';

interface HistoryRowShape {
  session_id?: unknown;
  ts?: unknown;
}

export interface LogDatabaseRow {
  id: number;
  ts: number;
  thread_id: string | null;
  feedback_log_body: string | null;
}

export function parseHistoryChunk(raw: string, account: string, switchedAt: number) {
  const sessions: SessionRow[] = [];

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    const row = safeParseJson(line) as HistoryRowShape | null;
    if (!row || typeof row.session_id !== 'string' || typeof row.ts !== 'number') {
      continue;
    }

    const timestamp = row.ts * 1000;
    if (timestamp < switchedAt) {
      continue;
    }

    sessions.push({
      account,
      sessionId: row.session_id,
      startedAt: timestamp,
      endedAt: timestamp,
      requestCount: 1,
      tokenIn: null,
      tokenOut: null,
    });
  }

  return sessions;
}

export function collectLogUpdates(
  rows: LogDatabaseRow[],
  account: string,
  switchedAt: number,
) {
  const quotaSamples: QuotaSample[] = [];
  const sessions: SessionRow[] = [];
  let lastLogId = 0;

  for (const row of rows) {
    lastLogId = row.id;
    if (!row.feedback_log_body) {
      continue;
    }

    const capturedAt = row.ts * 1000;
    if (capturedAt < switchedAt) {
      continue;
    }

    quotaSamples.push(...extractQuotaSamples(row.feedback_log_body, account, capturedAt));

    const tokenUsage = extractTokenUsage(row.feedback_log_body);
    if (tokenUsage && row.thread_id) {
      sessions.push({
        account,
        sessionId: row.thread_id,
        startedAt: capturedAt,
        endedAt: capturedAt,
        requestCount: 1,
        tokenIn: tokenUsage.tokenIn,
        tokenOut: tokenUsage.tokenOut,
      });
    }
  }

  return {
    quotaSamples,
    sessions,
    lastLogId,
  };
}

function safeParseJson(raw: string) {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
