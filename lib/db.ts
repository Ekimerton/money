import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

let productionDb: Database.Database | null = null;

export function getDb() {
  // Use singleton pattern to prevent database locked errors during HMR
  if (process.env.NODE_ENV === 'development') {
    if (!globalThis.sqliteDb) {
      globalThis.sqliteDb = new Database(dbPath);
    }
    return globalThis.sqliteDb;
  }

  if (!productionDb) {
    productionDb = new Database(dbPath);
  }
  return productionDb;
}
