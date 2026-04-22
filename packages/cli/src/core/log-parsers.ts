import type { QuotaSample } from '@codex-switch/shared';

export function extractQuotaSamples(
  body: string,
  account: string,
  capturedAt: number,
): QuotaSample[] {
  const lowerBody = body.toLowerCase();
  if (!/(rate_limit|quota|remaining|reset|usage)/.test(lowerBody)) {
    return [];
  }

  const used = readNumber(body, /"used"\s*:\s*(\d+)/i) ?? readNumber(body, /\bused\b[^0-9]{0,20}(\d+)/i);
  const remaining =
    readNumber(body, /"remaining"\s*:\s*(\d+)/i) ??
    readNumber(body, /\bremaining\b[^0-9]{0,20}(\d+)/i);
  const resetAt = readResetTimestamp(body, capturedAt);

  if (used === null && remaining === null && resetAt === null) {
    return [];
  }

  return [
    {
      account,
      capturedAt,
      limitKind: inferLimitKind(body),
      used,
      remaining,
      resetAt,
      source: 'logs_2_sqlite',
    },
  ];
}

export function extractTokenUsage(body: string) {
  const inputTokens = readNumber(body, /"input_tokens"\s*:\s*(\d+)/i);
  const outputTokens = readNumber(body, /"output_tokens"\s*:\s*(\d+)/i);

  if (inputTokens === null && outputTokens === null) {
    return null;
  }

  return {
    tokenIn: inputTokens,
    tokenOut: outputTokens,
  };
}

function readNumber(body: string, pattern: RegExp) {
  const match = body.match(pattern);
  if (!match?.[1]) {
    return null;
  }

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function readResetTimestamp(body: string, capturedAt: number) {
  const absolute = readNumber(body, /"reset_at"\s*:\s*(\d{10,13})/i);
  if (absolute !== null) {
    return absolute > 9_999_999_999 ? absolute : absolute * 1000;
  }

  const seconds = readNumber(body, /"reset_seconds"\s*:\s*(\d+)/i);
  if (seconds !== null) {
    return capturedAt + seconds * 1000;
  }

  return null;
}

function inferLimitKind(body: string) {
  if (/token/i.test(body)) {
    return 'tokens';
  }

  return 'requests';
}
