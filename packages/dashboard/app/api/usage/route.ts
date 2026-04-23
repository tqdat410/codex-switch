import type { UsageResponse } from '@codex-switch/shared';
import { listKnownAccounts, fetchQuotaWithCache } from '@codex-switch/cli/api';
import { NextResponse } from 'next/server';
import { buildUsageResponse } from '../../../lib/usage-response';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const force = url.searchParams.get('refresh') === '1';
  const targetAccount = url.searchParams.get('account');
  const accounts = listKnownAccounts()
    .map((account) => account.name)
    .filter((name) => !targetAccount || name === targetAccount);
  const ttlMs = Number(process.env.CODEX_SWITCH_QUOTA_TTL_MS ?? 120_000);
  const payload: UsageResponse = await buildUsageResponse(accounts, {
    ttlMs,
    fetchQuota: (account) =>
      fetchQuotaWithCache(account, {
        force,
        ttlMs,
      }),
  });

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
