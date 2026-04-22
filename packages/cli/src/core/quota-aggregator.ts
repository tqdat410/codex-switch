import type { QuotaSample } from '@codex-switch/shared';
import type { StateDatabase } from './db.js';

export function getLatestQuotaByAccount(db: StateDatabase) {
  const rows = db
    .prepare(
      `WITH ranked AS (
         SELECT
           account,
           captured_at,
           limit_kind,
           used,
           remaining,
           reset_at,
           source,
           ROW_NUMBER() OVER (PARTITION BY account ORDER BY captured_at DESC, id DESC) AS rank
         FROM quota_samples
       )
       SELECT account, captured_at, limit_kind, used, remaining, reset_at, source
       FROM ranked
       WHERE rank = 1`,
    )
    .all() as Array<{
    account: string;
    captured_at: number;
    limit_kind: string;
    used: number | null;
    remaining: number | null;
    reset_at: number | null;
    source: string;
  }>;

  return Object.fromEntries(
    rows.map((row) => [
      row.account,
      {
        account: row.account,
        capturedAt: row.captured_at,
        limitKind: row.limit_kind,
        used: row.used,
        remaining: row.remaining,
        resetAt: row.reset_at,
        source: row.source,
      } satisfies QuotaSample,
    ]),
  ) as Record<string, QuotaSample>;
}

export function formatQuotaSummary(sample: QuotaSample | null | undefined) {
  if (!sample) {
    return 'quota unavailable';
  }

  const parts: string[] = [];
  if (sample.used !== null || sample.remaining !== null) {
    parts.push(`${sample.used ?? '?'} used`);
    parts.push(`${sample.remaining ?? '?'} left`);
  }

  if (sample.resetAt) {
    const hours = Math.max(0, Math.round((sample.resetAt - Date.now()) / 3_600_000));
    parts.push(`resets ${hours}h`);
  }

  return parts.length > 0 ? parts.join(' · ') : sample.limitKind;
}
