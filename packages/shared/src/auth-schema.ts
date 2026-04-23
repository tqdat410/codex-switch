import { z } from 'zod';
import type { AuthJson } from './types.js';

const tokenBundleSchema = z.object({}).catchall(z.unknown()).extend({
  id_token: z.string().min(1).nullish(),
  access_token: z.string().min(1).nullish(),
  refresh_token: z.string().min(1).nullish(),
  account_id: z.string().min(1).nullish(),
});

const authJsonSchema = z
  .object({
    auth_mode: z.string().nullish(),
    OPENAI_API_KEY: z.string().nullish(),
    tokens: tokenBundleSchema.optional(),
    last_refresh: z.string().nullish(),
  })
  .passthrough();

const accountNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[a-z0-9_-]+$/i, 'Account name must match /^[a-z0-9_-]{1,32}$/i');

export function parseAuthJson(input: unknown) {
  return authJsonSchema.parse(input) as AuthJson;
}

export function parseAuthJsonString(raw: string) {
  return parseAuthJson(JSON.parse(raw));
}

export function parseAccountName(input: string) {
  return accountNameSchema.parse(input);
}

export function deriveAccountMetadata(auth: AuthJson) {
  const idPayload = decodeJwtPayload(auth.tokens?.id_token);
  const accessPayload = decodeJwtPayload(auth.tokens?.access_token);
  const idAuthClaim = readOpenAiAuthClaim(idPayload);
  const accessAuthClaim = readOpenAiAuthClaim(accessPayload);

  return {
    email:
      readString(idPayload?.email) ??
      readString(accessPayload?.email) ??
      readProfileEmail(accessPayload) ??
      null,
    plan:
      readString(idAuthClaim?.chatgpt_plan_type) ??
      readString(accessAuthClaim?.chatgpt_plan_type) ??
      null,
    accountId:
      readString(auth.tokens?.account_id) ??
      readString(idAuthClaim?.chatgpt_account_id) ??
      readString(accessAuthClaim?.chatgpt_account_id) ??
      null,
  };
}

export function decodeJwtPayload(token: unknown) {
  if (typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(parts[1] ?? '', 'base64url').toString('utf8')) as
      | Record<string, unknown>
      | null;
  } catch {
    return null;
  }
}

export function readAccessTokenExpiryMs(auth: AuthJson) {
  const payload = decodeJwtPayload(auth.tokens?.access_token);
  const exp = typeof payload?.exp === 'number' ? payload.exp : null;
  return exp ? exp * 1000 : null;
}

export function isAccessTokenExpiringSoon(auth: AuthJson, bufferMs = 60_000) {
  const expiryMs = readAccessTokenExpiryMs(auth);
  return expiryMs !== null && expiryMs - Date.now() < bufferMs;
}

function readOpenAiAuthClaim(payload: Record<string, unknown> | null) {
  if (!payload) {
    return null;
  }

  const claim = payload['https://api.openai.com/auth'];
  if (claim && typeof claim === 'object') {
    return claim as Record<string, unknown>;
  }

  return null;
}

function readString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readProfileEmail(payload: Record<string, unknown> | null) {
  if (!payload) {
    return null;
  }

  const profile = payload['https://api.openai.com/profile'];
  if (!profile || typeof profile !== 'object') {
    return null;
  }

  return readString((profile as Record<string, unknown>).email);
}
