import { NextResponse } from 'next/server';
import { validateAccountName } from '../../../lib/account-name';
import { openCliInNewTerminal } from '../../../lib/cli-spawn';
import { readActiveLock } from '../../../lib/lock-probe';
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

  const activeLock = readActiveLock();
  if (activeLock) {
    return NextResponse.json(
      { error: `Close the running Codex session for "${activeLock.account}" first.` },
      { status: 409 },
    );
  }

  openCliInNewTerminal(['use', name]);
  return NextResponse.json({ ok: true }, { status: 202 });
}
