import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

declare global {
  var _sqliteDb: Database.Database | undefined;
}

let dbInstance: Database.Database | undefined;

export function getDb(): Database.Database {
  if (process.env.NODE_ENV === 'development') {
    if (!global._sqliteDb) {
      global._sqliteDb = new Database(dbPath);
    }
    return global._sqliteDb;
  }

  if (!dbInstance) {
    dbInstance = new Database(dbPath);
  }
  return dbInstance;
}
