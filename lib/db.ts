import Database from 'better-sqlite3';
import path from 'path';

// Define the global object type
declare global {
  var _sqliteDb: Database.Database | undefined;
}

const dbPath = path.join(process.cwd(), './data/user_data.db');

// For production, maintain a module-level singleton
let prodDb: Database.Database | undefined;

export function getDb() {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._sqliteDb) {
      global._sqliteDb = new Database(dbPath);
    }
    return global._sqliteDb;
  }

  // In production mode, return the module-level singleton
  if (!prodDb) {
    prodDb = new Database(dbPath);
  }
  return prodDb;
}
