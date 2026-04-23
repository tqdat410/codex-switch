import { deriveAccountMetadata } from './auth-schema.js';
import type { AuthJson, QuotaSnapshot, QuotaWindow, QuotaSource } from './types.js';

const CHATGPT_ORIGIN = 'https://chatgpt.com';
const WHAM_USAGE_URL = `${CHATGPT_ORIGIN}/backend-api/wham/usage`;
const CODEX_USAGE_URL = `${CHATGPT_ORIGIN}/backend-api/codex/usage`;

export type QuotaProbeErrorCode =
  | 'unauthorized'
  | 'account_missing'
  | 'endpoint_gone'
  | 'network'
  | 'parse';

export class QuotaProbeError extends Error {
  readonly code: QuotaProbeErrorCode;

  constructor(code: QuotaProbeErrorCode, message: string) {
    super(message);
    this.name = 'QuotaProbeError';
    this.code = code;
  }
}

export async function probeQuota(auth: AuthJson): Promise<QuotaSnapshot> {
  const accessToken = auth.tokens?.access_token;
  if (!accessToken) {
    throw new QuotaProbeError('unauthorized', 'Missing access token.');
  }

  const accountId = deriveAccountMetadata(auth).accountId;
  if (!accountId) {
    throw new QuotaProbeError('account_missing', 'Missing ChatGPT account id.');
  }

  const whamResponse = await requestQuotaEndpoint(WHAM_USAGE_URL, accessToken, accountId);
  if (whamResponse.status === 404) {
    const codexResponse = await requestQuotaEndpoint(CODEX_USAGE_URL, accessToken, accountId);
    if (codexResponse.status === 404) {
      throw new QuotaProbeError('endpoint_gone', 'Quota endpoint no longer exists.');
    }

    return parseQuotaResponse(codexResponse, 'codex');
  }

  return parseQuotaResponse(whamResponse, 'wham');
}

async function requestQuotaEndpoint(url: string, accessToken: string, accountId: string) {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${accessToken}`,
        'ChatGPT-Account-Id': accountId,
        origin: CHATGPT_ORIGIN,
        referer: `${CHATGPT_ORIGIN}/`,
        'user-agent': 'codex-switch/0.1.0',
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new QuotaProbeError('network', 'Quota probe request failed.');
  }

  return response;
}

async function parseQuotaResponse(response: Response, source: QuotaSource): Promise<QuotaSnapshot> {
  if (response.status === 401) {
    throw new QuotaProbeError('unauthorized', 'Quota probe rejected the access token.');
  }

  if (response.status === 404) {
    throw new QuotaProbeError('endpoint_gone', 'Quota endpoint no longer exists.');
  }

  if (!response.ok) {
    throw new QuotaProbeError(
      'network',
      `Quota probe failed with status ${response.status}.`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new QuotaProbeError('parse', 'Quota probe response was not valid JSON.');
  }

  const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
  if (!root) {
    throw new QuotaProbeError('parse', 'Quota probe response was not an object.');
  }

  const capturedAt = Date.now();
  const rateLimit = readRecord(root.rate_limit);
  const fiveHour =
    parseQuotaWindow(findQuotaWindow(root, 'five_hour'), capturedAt) ??
    parseQuotaWindow(readRecord(rateLimit?.primary_window), capturedAt);
  const weekly =
    parseQuotaWindow(findQuotaWindow(root, 'weekly'), capturedAt) ??
    parseQuotaWindow(readRecord(rateLimit?.secondary_window), capturedAt);
  if (!fiveHour && !weekly) {
    throw new QuotaProbeError('parse', 'Quota probe response did not include quota windows.');
  }

  return {
    fiveHour,
    weekly,
    capturedAt,
    source,
  };
}

function findQuotaWindow(
  value: unknown,
  key: 'five_hour' | 'weekly',
  depth = 0,
): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || depth > 5) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const direct = record[key];
  if (direct && typeof direct === 'object') {
    return direct as Record<string, unknown>;
  }

  for (const nested of Object.values(record)) {
    const found = findQuotaWindow(nested, key, depth + 1);
    if (found) {
      return found;
    }
  }

  return null;
}

function parseQuotaWindow(window: Record<string, unknown> | null, capturedAt: number): QuotaWindow | null {
  if (!window) {
    return null;
  }

  const percentLeft = normalizePercent(
    readNumber(window.percent_left) ??
      readNumber(window.remaining_percent) ??
      readNumber(window.percentRemaining) ??
      invertPercent(readNumber(window.used_percent)),
  );
  const resetAt =
    readTimestamp(window.reset_time_ms) ??
    readTimestamp(window.reset_at) ??
    readTimestamp(window.resets_at) ??
    readRelativeSeconds(window.reset_after_seconds, capturedAt);

  if (percentLeft === null && resetAt === null) {
    return null;
  }

  return {
    percentLeft,
    resetAt,
  };
}

function readNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readTimestamp(value: unknown) {
  const numeric = readNumber(value);
  if (numeric === null) {
    return null;
  }

  return numeric > 9_999_999_999 ? numeric : numeric * 1000;
}

function readRelativeSeconds(value: unknown, capturedAt: number) {
  const numeric = readNumber(value);
  return numeric === null ? null : capturedAt + numeric * 1000;
}

function normalizePercent(value: number | null) {
  if (value === null) {
    return null;
  }

  const normalized = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, normalized));
}

function invertPercent(value: number | null) {
  return value === null ? null : 100 - value;
}

function readRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}
