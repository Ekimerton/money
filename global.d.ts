import Database from 'better-sqlite3';

declare global {
  var sqliteDb: Database.Database | undefined;
}
