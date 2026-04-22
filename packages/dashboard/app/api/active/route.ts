import { NextResponse } from 'next/server';
import { readAccountsSnapshot } from '../../../lib/db';

export async function GET() {
  const active = readAccountsSnapshot().find((account) => account.isActive) ?? null;
  return NextResponse.json({ active: active?.name ?? null });
}
