import { NextResponse } from 'next/server';
import { validateAccountName } from '../../../../lib/account-name';
import { runCli } from '../../../../lib/cli-spawn';
import { rejectCrossOrigin } from '../../../../lib/request-guard';

export async function DELETE(
  request: Request,
  context: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  const rejection = rejectCrossOrigin(request);
  if (rejection) {
    return rejection;
  }

  const params = await context.params;
  const name = validateAccountName(params.name);
  if (!name) {
    return NextResponse.json({ error: 'Invalid account name.' }, { status: 400 });
  }

  const result = await runCli(['rm', name]);
  if (result.code !== 0) {
    return NextResponse.json(
      { error: result.stderr || result.stdout || 'Unable to remove account.' },
      { status: /active/i.test(result.stderr) ? 409 : 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
