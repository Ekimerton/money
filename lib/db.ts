import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';

let db: DatabaseType | null = null;

export function getDb(): DatabaseType {
  if (db) return db;

  const dbPath = path.join(process.cwd(), './data/user_data.db');

  if (process.env.NODE_ENV === 'development') {
    if (!globalThis.__db) {
      globalThis.__db = new Database(dbPath);
      globalThis.__db.pragma('journal_mode = WAL');
    }
    db = globalThis.__db;
  } else {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }

  return db;
}

declare global {
  var __db: DatabaseType | undefined;
}
