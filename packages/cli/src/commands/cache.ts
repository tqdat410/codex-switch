import { Command } from 'commander';
import { readConfig } from '../core/config.js';
import { openStateDatabase } from '../core/db.js';
import { isProcessRunning, spawnDetachedCli, stopProcess } from '../core/background-process.js';
import {
  getQuotaWorkerState,
  markQuotaWorkerStopped,
  refreshQuotaCacheOnce,
  runQuotaCacheWorker,
} from '../core/quota-cache-worker.js';

export function registerCacheCommand(program: Command) {
  const cache = program.command('cache').description('Manage the background quota cache.');

  cache
    .command('refresh')
    .description('Refresh quota cache once in the foreground.')
    .action(async () => {
      const config = await readConfig();
      const summary = await refreshQuotaCacheOnce({
        concurrency: config.quotaCacheConcurrency,
        intervalMs: config.quotaCacheIntervalMs,
        forceAll: true,
      });
      console.log(formatRefreshSummary(summary));
    });

  cache
    .command('start')
    .description('Start the detached quota cache worker.')
    .action(async () => {
      const config = await readConfig();
      const db = openStateDatabase();

      try {
        const current = getQuotaWorkerState(db);
        if (isWorkerRunning(current, current?.intervalMs ?? config.quotaCacheIntervalMs)) {
          console.log(`Quota cache worker already running (pid ${current?.pid ?? 'unknown'}).`);
          return;
        }
      } finally {
        db.close();
      }

      const pid = spawnDetachedCli(['__cache-worker']);
      console.log(`Started quota cache worker${pid ? ` (pid ${pid})` : ''}.`);
    });

  cache
    .command('stop')
    .description('Stop the detached quota cache worker.')
    .action(() => {
      const db = openStateDatabase();

      try {
        const current = getQuotaWorkerState(db);
        const stopped = isWorkerRunning(current, current?.intervalMs ?? 60_000)
          ? stopProcess(current?.pid)
          : false;
        markQuotaWorkerStopped(db);
        console.log(stopped ? 'Stopped quota cache worker.' : 'Quota cache worker was not running.');
      } finally {
        db.close();
      }
    });

  cache
    .command('status')
    .description('Show quota cache worker status.')
    .action(async () => {
      const db = openStateDatabase();

      try {
        const current = getQuotaWorkerState(db);
        if (!current) {
          console.log('Quota cache worker: stopped');
          return;
        }

        const state = isWorkerRunning(current, current.intervalMs)
          ? 'running'
          : 'stale';
        console.log(`Quota cache worker: ${state}`);
        console.log(`pid: ${current.pid ?? '--'}`);
        console.log(`heartbeat: ${formatAge(current.heartbeatAt)}`);
        console.log(`last run: ${formatAge(current.lastRunAt)}`);
        if (current.lastError) {
          console.log(`last error: ${current.lastError}`);
        }
      } finally {
        db.close();
      }
    });

  program
    .command('__cache-worker', { hidden: true })
    .action(async () => {
      const config = await readConfig();
      await runQuotaCacheWorker({
        concurrency: config.quotaCacheConcurrency,
        intervalMs: config.quotaCacheIntervalMs,
      });
    });
}

function isHeartbeatFresh(heartbeatAt: number | null, intervalMs: number) {
  return Boolean(heartbeatAt && Date.now() - heartbeatAt <= intervalMs * 2);
}

function isWorkerRunning(
  state: ReturnType<typeof getQuotaWorkerState>,
  intervalMs: number,
) {
  return Boolean(
    state?.pid &&
      isProcessRunning(state.pid) &&
      isHeartbeatFresh(state.heartbeatAt, intervalMs),
  );
}

function formatRefreshSummary(summary: {
  refreshed: number;
  skipped: number;
  failed: number;
}) {
  return `Quota cache refresh: ${summary.refreshed} refreshed, ${summary.skipped} skipped, ${summary.failed} failed.`;
}

function formatAge(value: number | null) {
  if (!value) {
    return '--';
  }

  const seconds = Math.max(0, Math.round((Date.now() - value) / 1000));
  return `${seconds}s ago`;
}
