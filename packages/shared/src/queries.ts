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
