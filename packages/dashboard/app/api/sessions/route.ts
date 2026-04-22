import { NextResponse } from 'next/server';
import { readRecentSessions } from '../../../lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') ?? '50')));
  const offset = Math.max(0, Number(url.searchParams.get('offset') ?? '0'));

  return NextResponse.json(readRecentSessions(limit, offset));
}
