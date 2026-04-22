import { NextResponse } from 'next/server';
import { readAccountsSnapshot } from '../../../lib/db';

export async function GET() {
  return NextResponse.json({ accounts: readAccountsSnapshot() });
}
