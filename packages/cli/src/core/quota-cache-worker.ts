import { openStateDatabase, listAccounts } from './db.js';
import { getAllAccountAuthStates, getQuotaCache } from './quota-cache.js';
import { fetchQuotaWithCache, type FetchQuotaWithCacheResult } from './quota-orchestrator.js';
import {
  getQuotaWorkerState,
  markQuotaWorkerStopped,
  upsertQuotaWorkerState,
} from './quota-worker-state.js';
export { getQuotaWorkerState, markQuotaWorkerStopped, upsertQuotaWorkerState } from './quota-worker-state.js';

export interface RefreshQuotaCacheOptions {
  concurrency: number;
  intervalMs: number;
  forceAll?: boolean;
  refresh?: (account: string) => Promise<FetchQuotaWithCacheResult>;
}

export interface RefreshQuotaCacheSummary {
  refreshed: number;
  skipped: number;
  failed: number;
}

let stopRequested = false;

export async function refreshQuotaCacheOnce(options: RefreshQuotaCacheOptions) {
  const concurrency = Math.max(1, Math.floor(options.concurrency));
  const intervalMs = Math.max(1, Math.floor(options.intervalMs));
  const refresh = options.refresh ?? ((account: string) => fetchQuotaWithCache(account, { force: true }));
  const db = openStateDatabase();

  let dueAccounts: string[];
  let skipped = 0;

  try {
    upsertQuotaWorkerState(db, {
      pid: process.pid,
      startedAt: getQuotaWorkerState(db)?.startedAt ?? Date.now(),
      heartbeatAt: Date.now(),
      intervalMs,
    });

    const authStates = getAllAccountAuthStates(db);
    dueAccounts = listAccounts(db).flatMap((account) => {
      if (authStates[account.name]?.requiresReauth && !options.forceAll) {
        skipped += 1;
        return [];
      }

      const cached = getQuotaCache(db, account.name);
      if (!options.forceAll && cached && Date.now() - cached.capturedAt < intervalMs) {
        skipped += 1;
        return [];
      }

      return [account.name];
    });
  } finally {
    db.close();
  }

  const results = await mapWithConcurrency(dueAccounts, concurrency, async (account) => {
    try {
      await refresh(account);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  });

  const errors = results.filter((result): result is string => result !== null);
  const finishDb = openStateDatabase();

  try {
    upsertQuotaWorkerState(finishDb, {
      pid: process.pid,
      heartbeatAt: Date.now(),
      intervalMs,
      lastRunAt: Date.now(),
      lastError: errors[0] ?? null,
    });
  } finally {
    finishDb.close();
  }

  return {
    refreshed: dueAccounts.length - errors.length,
    skipped,
    failed: errors.length,
  } satisfies RefreshQuotaCacheSummary;
}

export async function runQuotaCacheWorker(options: RefreshQuotaCacheOptions) {
  stopRequested = false;
  process.once('SIGINT', requestStop);
  process.once('SIGTERM', requestStop);

  while (!stopRequested) {
    try {
      await refreshQuotaCacheOnce(options);
    } catch (error) {
      rememberWorkerLoopError(options.intervalMs, error);
    }
    await sleepUntilNextRun(options.intervalMs);
  }

  const db = openStateDatabase();
  try {
    markQuotaWorkerStopped(db);
  } finally {
    db.close();
  }
}

function rememberWorkerLoopError(intervalMs: number, error: unknown) {
  try {
    const db = openStateDatabase();
    try {
      upsertQuotaWorkerState(db, {
        pid: process.pid,
        heartbeatAt: Date.now(),
        intervalMs,
        lastError: error instanceof Error ? error.message : String(error),
      });
    } finally {
      db.close();
    }
  } catch {
    // Detached workers have ignored stdio; keep the loop alive even if state writes fail.
  }
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
) {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    for (;;) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const value = values[currentIndex];
      if (value === undefined) {
        return;
      }

      results[currentIndex] = await mapper(value);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
}

function requestStop() {
  stopRequested = true;
}

async function sleepUntilNextRun(ms: number) {
  const endAt = Date.now() + ms;
  while (!stopRequested && Date.now() < endAt) {
    await new Promise((resolve) => {
      setTimeout(resolve, Math.min(500, endAt - Date.now()));
    });
  }
}
