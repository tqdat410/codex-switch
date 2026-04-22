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
  latestQuota: QuotaSample | null;
}
