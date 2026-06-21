import Database from 'better-sqlite3';
import path from 'path';

// Define the global type for the DB connection
declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

const dbPath = path.join(process.cwd(), './data/user_data.db');

export function getDb(): Database.Database {
  if (process.env.NODE_ENV === 'development') {
    if (!global.__db) {
      global.__db = new Database(dbPath);
    }
    return global.__db;
  }

  // In production, it's safer to not use global to prevent memory leaks if the file is re-evaluated,
  // though Next.js doesn't usually hot-reload in production.
  // We'll create a new connection or manage it in a module variable.
  // To avoid `database is locked`, we'll keep a single connection here as well.
  if (!moduleDb) {
      moduleDb = new Database(dbPath);
  }
  return moduleDb;
}

let moduleDb: Database.Database | undefined;
