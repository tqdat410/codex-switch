export interface AccountRecord {
  name: string;
  email: string | null;
  plan: string | null;
  addedAt: number;
  lastUsedAt: number | null;
  notes: string | null;
}

export interface QuotaSample {
  account: string;
  capturedAt: number;
  limitKind: string;
  used: number | null;
  remaining: number | null;
  resetAt: number | null;
  source: string;
}

export interface QuotaWindow {
  percentLeft: number | null;
  resetAt: number | null;
}

export type QuotaSource = 'wham' | 'codex';
export type QuotaDisplaySource = QuotaSource | 'cache';

export interface QuotaSnapshot {
  fiveHour: QuotaWindow | null;
  weekly: QuotaWindow | null;
  capturedAt: number;
  source: QuotaSource;
}

export interface QuotaCacheRow {
  account: string;
  capturedAt: number;
  fiveHourPercent: number | null;
  fiveHourResetAt: number | null;
  weeklyPercent: number | null;
  weeklyResetAt: number | null;
  source: QuotaSource;
  staleReason: string | null;
}

export interface QuotaErrorSummary {
  code: string;
  message: string;
}

export interface AccountAuthState {
  account: string;
  requiresReauth: boolean;
  lastError: string | null;
  lastErrorAt: number | null;
}

export interface AccountUsageSnapshot {
  fiveHour: QuotaWindow | null;
  weekly: QuotaWindow | null;
  capturedAt: number | null;
  ageMs: number | null;
  requiresReauth: boolean;
  source: QuotaDisplaySource | null;
  error: QuotaErrorSummary | null;
}

export interface UsageResponse {
  accounts: Record<string, AccountUsageSnapshot>;
  ttlMs: number;
}

export interface SessionRow {
  account: string;
  sessionId: string;
  startedAt: number;
  endedAt: number | null;
  requestCount: number;
  tokenIn: number | null;
  tokenOut: number | null;
}

export interface ActiveAccountState {
  account: string;
  switchedAt: number;
}

export interface VaultConfig {
  port: number | null;
  theme: 'system' | 'light' | 'dark';
  defaultAccount: string | null;
}

export interface AuthTokenBundle {
  id_token?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  account_id?: string | null;
  [key: string]: unknown;
}

export interface AuthJson {
  auth_mode?: string | null;
  OPENAI_API_KEY?: string | null;
  tokens?: AuthTokenBundle;
  last_refresh?: string | null;
  [key: string]: unknown;
}

export interface AccountSummary extends AccountRecord {
  isActive: boolean;
  latestQuota: AccountUsageSnapshot | null;
}
