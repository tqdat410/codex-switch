import { parseAuthJson } from './auth-schema.js';
import type { AuthJson } from './types.js';

export const CODEX_OAUTH_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const OAUTH_TOKEN_URL = 'https://auth.openai.com/oauth/token';

export type OAuthRefreshErrorCode = 'invalid_grant' | 'network' | 'parse';

export class OAuthRefreshError extends Error {
  readonly code: OAuthRefreshErrorCode;

  constructor(code: OAuthRefreshErrorCode, message: string) {
    super(message);
    this.name = 'OAuthRefreshError';
    this.code = code;
  }
}

export async function refreshAccessToken(auth: AuthJson): Promise<AuthJson> {
  const refreshToken = auth.tokens?.refresh_token;
  if (!refreshToken) {
    throw new OAuthRefreshError('invalid_grant', 'Missing refresh token.');
  }

  let response: Response;
  try {
    response = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CODEX_OAUTH_CLIENT_ID,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new OAuthRefreshError('network', 'OAuth refresh request failed.');
  }

  const payload = await readJsonRecord(response);
  if (!response.ok) {
    const errorCode = typeof payload?.error === 'string' ? payload.error : null;
    if (errorCode === 'invalid_grant') {
      throw new OAuthRefreshError('invalid_grant', 'Refresh token is no longer valid.');
    }

    throw new OAuthRefreshError(
      'network',
      `OAuth refresh failed with status ${response.status}.`,
    );
  }

  const nextTokens = {
    ...(auth.tokens ?? {}),
    ...(payload ?? {}),
    access_token:
      typeof payload?.access_token === 'string'
        ? payload.access_token
        : auth.tokens?.access_token ?? null,
    id_token:
      typeof payload?.id_token === 'string' ? payload.id_token : auth.tokens?.id_token ?? null,
    refresh_token:
      typeof payload?.refresh_token === 'string'
        ? payload.refresh_token
        : auth.tokens?.refresh_token ?? null,
  };

  return parseAuthJson({
    ...auth,
    tokens: nextTokens,
    last_refresh: new Date().toISOString(),
  });
}

async function readJsonRecord(response: Response) {
  try {
    const payload = (await response.json()) as unknown;
    return payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    throw new OAuthRefreshError('parse', 'OAuth refresh response was not valid JSON.');
  }
}
