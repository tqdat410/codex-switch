import { NextResponse } from 'next/server';
import { validateAccountName } from '../../../lib/account-name';
import { openCliInNewTerminal } from '../../../lib/cli-spawn';
import { readAccountsSnapshot } from '../../../lib/db';
import { rejectCrossOrigin } from '../../../lib/request-guard';

export async function POST(request: Request) {
  const rejection = rejectCrossOrigin(request);
  if (rejection) {
    return rejection;
  }

  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const name = validateAccountName(body.name);
  if (!name) {
    return NextResponse.json({ error: 'Invalid account name.' }, { status: 400 });
  }

  if (readAccountsSnapshot().some((account) => account.name === name)) {
    return NextResponse.json({ error: 'That account name already exists.' }, { status: 409 });
  }

  openCliInNewTerminal(['add', '--name', name]);
  return NextResponse.json({ ok: true }, { status: 202 });
}
