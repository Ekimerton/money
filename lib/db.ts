import Database from 'better-sqlite3';
import path from 'path';

// Define the type for the global object
interface GlobalWithDb {
  __db: Database.Database | undefined;
}

// Ensure the global object has the db property in development
const globalWithDb = global as unknown as GlobalWithDb;

export function getDb(): Database.Database {
  const dbPath = path.join(process.cwd(), './data/user_data.db');

  if (process.env.NODE_ENV === 'development') {
    if (!globalWithDb.__db) {
      globalWithDb.__db = new Database(dbPath);
      // Optional: Set PRAGMAs for better performance and concurrency
      globalWithDb.__db.pragma('journal_mode = WAL');
      globalWithDb.__db.pragma('synchronous = NORMAL');
    }
    return globalWithDb.__db;
  } else {
    // In production, we can still cache it in module scope
    if (!globalWithDb.__db) {
      globalWithDb.__db = new Database(dbPath);
      globalWithDb.__db.pragma('journal_mode = WAL');
      globalWithDb.__db.pragma('synchronous = NORMAL');
    }
    return globalWithDb.__db;
  }
}
