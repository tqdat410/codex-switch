import { codexHistoryFile } from '@codex-switch/shared';
import chokidar from 'chokidar';
import { readFile } from 'node:fs/promises';
import { getActiveAccount, openStateDatabase, upsertSession } from './db.js';
import { parseHistoryChunk } from './log-watcher-helpers.js';
import { logger } from '../util/logger.js';

export function createLogWatcher() {
  let historyOffset = 0;
  const stateDb = openStateDatabase();
  const historyWatcher = chokidar.watch(codexHistoryFile(), {
    ignoreInitial: false,
  });

  async function start() {
    await backfillHistory();

    historyWatcher.on('add', () => void processHistoryAppend());
    historyWatcher.on('change', () => void processHistoryAppend());
  }

  async function stop() {
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
