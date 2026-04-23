import type { QuotaCacheRow } from '@codex-switch/shared';
import type { StateDatabase } from './db.js';

export function getLatestQuotaByAccount(db: StateDatabase) {
  const rows = db
    .prepare(
      `SELECT
         account,
         captured_at,
         five_hour_percent,
         five_hour_reset_at,
         weekly_percent,
         weekly_reset_at,
         source,
         stale_reason
       FROM quota_cache
       ORDER BY captured_at DESC, account ASC`,
    )
    .all() as Array<{
    account: string;
    captured_at: number;
    five_hour_percent: number | null;
    five_hour_reset_at: number | null;
    weekly_percent: number | null;
    weekly_reset_at: number | null;
    source: QuotaCacheRow['source'];
    stale_reason: string | null;
  }>;

  return Object.fromEntries(
    rows.map((row) => [
      row.account,
      {
        account: row.account,
        capturedAt: row.captured_at,
        fiveHourPercent: row.five_hour_percent,
        fiveHourResetAt: row.five_hour_reset_at,
        weeklyPercent: row.weekly_percent,
        weeklyResetAt: row.weekly_reset_at,
        source: row.source,
        staleReason: row.stale_reason,
      } satisfies QuotaCacheRow,
    ]),
  ) as Record<string, QuotaCacheRow>;
}

export function formatQuotaSummary(row: QuotaCacheRow | null | undefined) {
  if (!row) {
    return 'quota unavailable';
  }

  const parts: string[] = [];
  if (row.staleReason === 'requires_reauth') {
    parts.push('reauth required');
  }

  const fiveHour = formatWindow('5h', row.fiveHourPercent, row.fiveHourResetAt);
  if (fiveHour) {
    parts.push(fiveHour);
  }

  const weekly = formatWindow('7d', row.weeklyPercent, row.weeklyResetAt);
  if (weekly) {
    parts.push(weekly);
  }

  parts.push(formatAge(row.capturedAt));
  return parts.join(' · ');
}

function formatWindow(label: string, percentLeft: number | null, resetAt: number | null) {
  if (percentLeft === null && resetAt === null) {
    return null;
  }

  const pieces = [`${label}: ${percentLeft === null ? '?' : Math.round(percentLeft)}%`];
  if (resetAt) {
    pieces.push(`resets ${formatRemaining(resetAt)}`);
  }

  return pieces.join(' ');
}

function formatRemaining(timestamp: number) {
  const diffMs = Math.max(0, timestamp - Date.now());
  const diffMinutes = Math.round(diffMs / 60_000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatAge(timestamp: number) {
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 1) {
    return 'just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.round(diffHours / 24)}d ago`;
}
