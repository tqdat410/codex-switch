import { codexHistoryFile, codexLogsDatabaseFile } from '@codex-switch/shared';
import chokidar from 'chokidar';
import { access, readFile } from 'node:fs/promises';
import Database from 'better-sqlite3';
import { getActiveAccount, insertQuotaSample, openStateDatabase, upsertSession } from './db.js';
import {
  collectLogUpdates,
  type LogDatabaseRow,
  parseHistoryChunk,
} from './log-watcher-helpers.js';
import { logger } from '../util/logger.js';

export function createLogWatcher() {
  let historyOffset = 0;
  let lastLogId = 0;
  let pollTimer: NodeJS.Timeout | null = null;
  const stateDb = openStateDatabase();
  const historyWatcher = chokidar.watch(codexHistoryFile(), {
    ignoreInitial: false,
  });

  async function start() {
    await backfillHistory();
    await backfillLogs();

    historyWatcher.on('add', () => void processHistoryAppend());
    historyWatcher.on('change', () => void processHistoryAppend());
    pollTimer = setInterval(() => {
      void backfillLogs();
    }, 5000);
  }

  async function stop() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }

    await historyWatcher.close();
    stateDb.close();
  }

  async function backfillHistory() {
    try {
      const active = getActiveAccount(stateDb);
      if (!active) {
        return;
      }

      const content = await tryReadFile(codexHistoryFile());
      historyOffset = Buffer.byteLength(content);

      for (const session of parseHistoryChunk(content, active.account, active.switchedAt)) {
        upsertSession(stateDb, session);
      }
    } catch (error) {
      logger.debug({ error }, 'History backfill skipped.');
    }
  }

  async function processHistoryAppend() {
    try {
      const active = getActiveAccount(stateDb);
      if (!active) {
        return;
      }

      const content = await tryReadFile(codexHistoryFile());
      const allBytes = Buffer.from(content);
      const nextChunk = allBytes.subarray(historyOffset).toString('utf8');
      historyOffset = allBytes.length;

      for (const session of parseHistoryChunk(nextChunk, active.account, active.switchedAt)) {
        upsertSession(stateDb, session);
      }
    } catch (error) {
      logger.debug({ error }, 'History append parse failed.');
    }
  }

  async function backfillLogs() {
    try {
      await access(codexLogsDatabaseFile());
      const active = getActiveAccount(stateDb);
      if (!active) {
        return;
      }

      const logsDb = new Database(codexLogsDatabaseFile(), {
        readonly: true,
        fileMustExist: true,
      });

      try {
        logsDb.pragma('query_only = ON');
        const rows = logsDb
          .prepare(
            `SELECT id, ts, thread_id, feedback_log_body
             FROM logs
             WHERE id > ?
             ORDER BY id ASC`,
          )
          .all(lastLogId) as LogDatabaseRow[];

        const updates = collectLogUpdates(rows, active.account, active.switchedAt);
        if (updates.lastLogId > 0) {
          lastLogId = updates.lastLogId;
        }

        for (const sample of updates.quotaSamples) {
          insertQuotaSample(stateDb, sample);
        }

        for (const session of updates.sessions) {
          upsertSession(stateDb, session);
        }
      } finally {
        logsDb.close();
      }
    } catch (error) {
      logger.debug({ error }, 'Logs database polling skipped.');
    }
  }

  return {
    start,
    stop,
  };
}

async function tryReadFile(filePath: string) {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}
