import type { SessionRow } from '@codex-switch/shared';

interface HistoryRowShape {
  session_id?: unknown;
  ts?: unknown;
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

function safeParseJson(raw: string) {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
