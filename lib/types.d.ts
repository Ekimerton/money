import type { Database } from 'better-sqlite3';

declare global {
  var _db: Database | undefined;
}
