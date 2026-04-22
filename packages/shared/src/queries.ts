export const latestQuotaPerAccountSql = `
  WITH ranked AS (
    SELECT
      account,
      captured_at,
      limit_kind,
      used,
      remaining,
      reset_at,
      source,
      ROW_NUMBER() OVER (
        PARTITION BY account
        ORDER BY captured_at DESC, id DESC
      ) AS rank
    FROM quota_samples
  )
  SELECT account, captured_at, limit_kind, used, remaining, reset_at, source
  FROM ranked
  WHERE rank = 1
`;

export const requestsPerDaySql = `
  SELECT
    account,
    strftime('%Y-%m-%d', started_at / 1000, 'unixepoch', 'localtime') AS bucket,
    SUM(request_count) AS request_count
  FROM sessions
  WHERE started_at BETWEEN ? AND ?
  GROUP BY account, bucket
  ORDER BY bucket ASC, account ASC
`;

export const tokensPerWeekSql = `
  SELECT
    account,
    strftime('%Y-W%W', started_at / 1000, 'unixepoch', 'localtime') AS bucket,
    SUM(COALESCE(token_in, 0)) AS token_in,
    SUM(COALESCE(token_out, 0)) AS token_out
  FROM sessions
  WHERE started_at BETWEEN ? AND ?
  GROUP BY account, bucket
  ORDER BY bucket ASC, account ASC
`;

export const recentSessionsSql = `
  SELECT
    session_id,
    account,
    started_at,
    ended_at,
    request_count,
    token_in,
    token_out
  FROM sessions
  ORDER BY started_at DESC
  LIMIT ? OFFSET ?
`;
