import {
  codexHistoryFile,
  codexLogsDatabaseFile,
  sessionIndexFile,
} from '@codex-switch/shared';
import { existsSync, readFileSync } from 'node:fs';
import Database from 'better-sqlite3';

console.log('session_index.jsonl');
if (existsSync(sessionIndexFile())) {
  const lines = readFileSync(sessionIndexFile(), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean);
  const last = lines.at(-1);
  if (last) {
    console.log(JSON.stringify(Object.keys(JSON.parse(last)).sort(), null, 2));
  }
} else {
  console.log('not found');
}

console.log('\nhistory.jsonl');
if (existsSync(codexHistoryFile())) {
  const lines = readFileSync(codexHistoryFile(), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean);
  const last = lines.at(-1);
  if (last) {
    console.log(JSON.stringify(Object.keys(JSON.parse(last)).sort(), null, 2));
  }
} else {
  console.log('not found');
}

console.log('\nlogs_2.sqlite');
if (existsSync(codexLogsDatabaseFile())) {
  const db = new Database(codexLogsDatabaseFile(), {
    readonly: true,
    fileMustExist: true,
  });

  try {
    db.pragma('query_only = ON');
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`)
      .all() as Array<{ name: string }>;

    for (const table of tables) {
      const columns = db.prepare(`PRAGMA table_info(${table.name})`).all() as Array<{
        name: string;
      }>;
      console.log(table.name, columns.map((column) => column.name));
    }
  } finally {
    db.close();
  }
} else {
  console.log('not found');
}
