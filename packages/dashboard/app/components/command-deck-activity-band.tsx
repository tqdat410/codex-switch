'use client';

import Link from 'next/link';
import type { SessionRow } from '@codex-switch/shared';
import type { UsageSnapshot } from '../../lib/db';
import { formatCompactNumber, formatDuration } from '../../lib/command-deck-view-model';
import { CommandDeckMiniChart } from './command-deck-mini-chart';

export function CommandDeckActivityBand({
  sessions,
  usageSnapshot,
}: Readonly<{
  sessions: SessionRow[];
  usageSnapshot: UsageSnapshot;
}>) {
  return (
    <section className="command-deck-activity" aria-label="Recent activity">
      <div className="command-deck-activity__sessions">
        <div className="command-deck-section-title">
          <h2>Recent activity</h2>
          <Link href="/history">Open history</Link>
        </div>
        {sessions.length === 0 ? (
          <p className="command-deck-muted">No sessions ingested yet.</p>
        ) : (
          <ul>
            {sessions.map((session) => (
              <li key={session.sessionId}>
                <span>{session.account}</span>
                <strong>{formatCompactNumber(session.requestCount)} req</strong>
                <small>
                  {new Date(session.startedAt).toLocaleString()} /{' '}
                  {formatDuration(session.startedAt, session.endedAt)}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <div className="command-deck-section-title">
          <h2>Requests per day</h2>
        </div>
        <CommandDeckMiniChart usageSnapshot={usageSnapshot} />
      </div>
    </section>
  );
}
