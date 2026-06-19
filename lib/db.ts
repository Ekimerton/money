import Database from 'better-sqlite3';
import path from 'path';

const globalForDb = globalThis as unknown as {
  sqliteDb: any;
};

export function getDb() {
  if (!globalForDb.sqliteDb || !globalForDb.sqliteDb.open) {
    const dbPath = path.join(process.cwd(), 'data', 'user_data.db');
    globalForDb.sqliteDb = new Database(dbPath);
  }
  return globalForDb.sqliteDb;
}
