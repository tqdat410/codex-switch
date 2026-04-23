import {
  OAuthRefreshError,
  formatQuotaErrorMessage,
  type QuotaErrorSummary,
  type QuotaCacheRow,
  type QuotaDisplaySource,
  type QuotaSnapshot,
  QuotaProbeError,
  type QuotaSource,
  isAccessTokenExpiringSoon,
  probeQuota,
} from '@codex-switch/shared';
import { openStateDatabase } from './db.js';
import { refreshVaultEntryTokens } from './auth-refresh-writeback.js';
import {
  clearAccountAuthState,
  getAccountAuthState,
  getQuotaCache,
  setQuotaCacheStaleReason,
  upsertAccountAuthState,
  upsertQuotaCache,
} from './quota-cache.js';
import { readVaultEntry } from './vault.js';

const inFlight = new Map<string, Promise<FetchQuotaWithCacheResult>>();
const DEFAULT_QUOTA_TTL_MS = 120_000;

export type FetchQuotaReason =
  | 'cache'
  | 'probed'
  | 'stale_network'
  | 'requires_reauth'
  | 'endpoint_gone';

export interface FetchQuotaWithCacheOptions {
  ttlMs?: number;
  force?: boolean;
}

export interface FetchQuotaWithCacheResult {
  row: QuotaCacheRow | null;
  fresh: boolean;
  reason: FetchQuotaReason;
  requiresReauth: boolean;
  source: QuotaDisplaySource | null;
  error: QuotaErrorSummary | null;
}

export async function fetchQuotaWithCache(
  account: string,
  options: FetchQuotaWithCacheOptions = {},
): Promise<FetchQuotaWithCacheResult> {
  const ttlMs = resolveQuotaTtlMs(options.ttlMs);
  const force = options.force ?? false;

  const preflight = readPreflightState(account, ttlMs, force);
  if (preflight) {
    return preflight;
  }

  const active = inFlight.get(account);
  if (active) {
    return active;
  }

  const request = runProbeFlow(account, force);
  inFlight.set(account, request);

  try {
    return await request;
  } finally {
    if (inFlight.get(account) === request) {
      inFlight.delete(account);
    }
  }
}

function readPreflightState(account: string, ttlMs: number, force: boolean) {
  const db = openStateDatabase();

  try {
    const authState = getAccountAuthState(db, account);
    const cached = getQuotaCache(db, account);

    if (authState.requiresReauth && !force) {
      return buildResult(
        cached,
        'requires_reauth',
        true,
        authState.lastError,
        errorSummaryFromCode(authState.lastError),
      );
    }

    if (!force && cached && Date.now() - cached.capturedAt <= ttlMs) {
      return buildResult(
        cached,
        'cache',
        false,
        authState.lastError,
        errorSummaryFromCode(authState.lastError),
      );
    }

    return null;
  } finally {
    db.close();
  }
}

async function runProbeFlow(account: string, force: boolean) {
  const db = openStateDatabase();

  try {
    let cached = getQuotaCache(db, account);
    let authState = getAccountAuthState(db, account);
    if (authState.requiresReauth && !force) {
      return buildResult(
        cached,
        'requires_reauth',
        true,
        authState.lastError,
        errorSummaryFromCode(authState.lastError),
      );
    }

    let auth: Awaited<ReturnType<typeof readVaultEntry>>;
    try {
      auth = await readVaultEntry(account);
    } catch (error) {
      authState = rememberVaultReadError(db, account, error);
      cached = getQuotaCache(db, account);
      return buildResult(
        applyStaleReason(cached, authState.lastError),
        authState.requiresReauth ? 'requires_reauth' : 'stale_network',
        authState.requiresReauth,
        authState.lastError,
        errorSummaryFromCode(authState.lastError),
      );
    }

    if (!auth.tokens?.access_token || isAccessTokenExpiringSoon(auth)) {
      try {
        auth = await refreshVaultEntryTokens(account, db);
      } catch (error) {
        if (error instanceof OAuthRefreshError && error.code === 'invalid_grant') {
          setQuotaCacheStaleReason(db, account, 'requires_reauth');
          return buildResult(
            applyStaleReason(cached, 'requires_reauth'),
            'requires_reauth',
            true,
            error.code,
            toErrorSummary(error),
          );
        }

        authState = rememberProbeError(db, account, error);
        cached = getQuotaCache(db, account);
        return buildResult(
          applyStaleReason(cached, mapStaleReason(error)),
          mapReason(error),
          authState.requiresReauth,
          authState.lastError,
          errorSummaryFromCode(authState.lastError) ?? toErrorSummary(error),
        );
      }
    }

    try {
      const snapshot = await probeQuota(auth);
      cacheSnapshot(db, account, snapshot);
      return buildResult(getQuotaCache(db, account), 'probed', false, null, null);
    } catch (error) {
      if (error instanceof QuotaProbeError && error.code === 'unauthorized') {
        return handleUnauthorizedProbe(db, account, cached);
      }

      authState = rememberProbeError(db, account, error);
      cached = getQuotaCache(db, account);
      return buildResult(
        applyStaleReason(cached, mapStaleReason(error)),
        mapReason(error),
        authState.requiresReauth,
        authState.lastError,
        errorSummaryFromCode(authState.lastError) ?? toErrorSummary(error),
      );
    }
  } finally {
    db.close();
  }
}

async function handleUnauthorizedProbe(accountDb: ReturnType<typeof openStateDatabase>, account: string, cached: QuotaCacheRow | null) {
  try {
    const refreshed = await refreshVaultEntryTokens(account, accountDb);
    const snapshot = await probeQuota(refreshed);
    cacheSnapshot(accountDb, account, snapshot);
    return buildResult(getQuotaCache(accountDb, account), 'probed', false, null, null);
  } catch (error) {
    if (
      (error instanceof OAuthRefreshError && error.code === 'invalid_grant') ||
      (error instanceof QuotaProbeError && error.code === 'unauthorized')
    ) {
      upsertAccountAuthState(accountDb, {
        account,
        requiresReauth: true,
        lastError: error.code,
        lastErrorAt: Date.now(),
      });
      setQuotaCacheStaleReason(accountDb, account, 'requires_reauth');
      return buildResult(
        applyStaleReason(cached, 'requires_reauth'),
        'requires_reauth',
        true,
        error.code,
        toErrorSummary(error),
      );
    }

    const authState = rememberProbeError(accountDb, account, error);
    return buildResult(
      applyStaleReason(cached, mapStaleReason(error)),
      mapReason(error),
      authState.requiresReauth,
      authState.lastError,
      errorSummaryFromCode(authState.lastError) ?? toErrorSummary(error),
    );
  }
}

function cacheSnapshot(
  db: ReturnType<typeof openStateDatabase>,
  account: string,
  snapshot: QuotaSnapshot,
) {
  upsertQuotaCache(db, account, snapshot);
  clearAccountAuthState(db, account);
}

function rememberProbeError(
  db: ReturnType<typeof openStateDatabase>,
  account: string,
  error: unknown,
) {
  const code = readErrorCode(error);
  const staleReason = mapStaleReason(error);
  const requiresReauth = code === 'vault_missing' || code === 'vault_invalid';

  upsertAccountAuthState(db, {
    account,
    requiresReauth,
    lastError: code,
    lastErrorAt: Date.now(),
  });
  setQuotaCacheStaleReason(db, account, staleReason);

  return getAccountAuthState(db, account);
}

function rememberVaultReadError(
  db: ReturnType<typeof openStateDatabase>,
  account: string,
  error: unknown,
) {
  const code = readVaultErrorCode(error);

  upsertAccountAuthState(db, {
    account,
    requiresReauth: code === 'vault_missing' || code === 'vault_invalid',
    lastError: code,
    lastErrorAt: Date.now(),
  });
  setQuotaCacheStaleReason(db, account, code);

  return getAccountAuthState(db, account);
}

function applyStaleReason(row: QuotaCacheRow | null, staleReason: string | null) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    staleReason,
  };
}

function buildResult(
  row: QuotaCacheRow | null,
  reason: FetchQuotaReason,
  requiresReauth: boolean,
  lastError: string | null,
  error: QuotaErrorSummary | null,
): FetchQuotaWithCacheResult {
  return {
    row,
    fresh: reason === 'probed',
    reason,
    requiresReauth,
    source: selectDisplaySource(reason, row?.source ?? null),
    error: error ?? (lastError ? { code: lastError, message: formatErrorMessage(lastError) } : null),
  };
}

function selectDisplaySource(
  reason: FetchQuotaReason,
  source: QuotaSource | null,
): QuotaDisplaySource | null {
  if (reason !== 'probed' && source) {
    return 'cache';
  }

  return source;
}

function mapReason(error: unknown): FetchQuotaReason {
  if (error instanceof QuotaProbeError && error.code === 'endpoint_gone') {
    return 'endpoint_gone';
  }

  if (readKnownVaultStateErrorCode(error)) {
    return 'requires_reauth';
  }

  if (
    (error instanceof OAuthRefreshError && error.code === 'invalid_grant') ||
    (error instanceof QuotaProbeError && error.code === 'unauthorized')
  ) {
    return 'requires_reauth';
  }

  return 'stale_network';
}

function mapStaleReason(error: unknown) {
  if (
    (error instanceof OAuthRefreshError && error.code === 'invalid_grant') ||
    (error instanceof QuotaProbeError && error.code === 'unauthorized')
  ) {
    return 'requires_reauth';
  }

  return readErrorCode(error);
}

function toErrorSummary(error: unknown): QuotaErrorSummary | null {
  if (error instanceof OAuthRefreshError || error instanceof QuotaProbeError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  return error instanceof Error
    ? {
        code: 'unknown',
        message: error.message,
      }
    : null;
}

function readErrorCode(error: unknown) {
  if (error instanceof OAuthRefreshError || error instanceof QuotaProbeError) {
    return error.code;
  }

  const vaultCode = readKnownVaultStateErrorCode(error);
  if (vaultCode) {
    return vaultCode;
  }

  return error instanceof Error ? 'unknown' : null;
}

function formatErrorMessage(code: string) {
  return formatQuotaErrorMessage(code);
}

function errorSummaryFromCode(code: string | null): QuotaErrorSummary | null {
  return code
    ? {
        code,
        message: formatErrorMessage(code),
      }
    : null;
}

function resolveQuotaTtlMs(override: number | undefined) {
  if (typeof override === 'number' && Number.isFinite(override) && override >= 0) {
    return override;
  }

  const envValue = Number(process.env.CODEX_SWITCH_QUOTA_TTL_MS ?? DEFAULT_QUOTA_TTL_MS);
  return Number.isFinite(envValue) && envValue >= 0 ? envValue : DEFAULT_QUOTA_TTL_MS;
}

function readVaultErrorCode(error: unknown) {
  return readKnownVaultStateErrorCode(error) ?? 'vault_unavailable';
}

function readKnownVaultStateErrorCode(error: unknown) {
  if (isMissingFileError(error)) {
    return 'vault_missing';
  }

  if (error instanceof SyntaxError || isZodError(error)) {
    return 'vault_invalid';
  }

  return null;
}

function isMissingFileError(error: unknown) {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === 'ENOENT'
  );
}

function isZodError(error: unknown) {
  return error instanceof Error && error.name === 'ZodError';
}
