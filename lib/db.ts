import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

declare global {
  // eslint-disable-next-line no-var
  var __db: import('better-sqlite3').Database | undefined;
}

let db: import('better-sqlite3').Database;

export function getDb() {
  if (process.env.NODE_ENV === 'production') {
    if (!db) {
      db = new Database(dbPath);
    }
    return db;
  } else {
    if (!global.__db) {
      global.__db = new Database(dbPath);
    }
    return global.__db;
  }
}
