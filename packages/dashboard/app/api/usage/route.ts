import { NextResponse } from 'next/server';
import { readUsageSnapshot } from '../../../lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const to = Number(url.searchParams.get('to') ?? Date.now());
  const from = Number(url.searchParams.get('from') ?? to - 30 * 24 * 60 * 60 * 1000);

  return NextResponse.json(readUsageSnapshot(from, to));
}
