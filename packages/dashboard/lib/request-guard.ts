import { NextResponse } from 'next/server';

export function rejectCrossOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin || !host) {
    return null;
  }

  try {
    if (new URL(origin).host === host) {
      return null;
    }
  } catch {
    return NextResponse.json({ error: 'Invalid origin header.' }, { status: 400 });
  }

  return NextResponse.json({ error: 'Cross-origin requests are blocked.' }, { status: 403 });
}
