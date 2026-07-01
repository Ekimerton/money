import Database from 'better-sqlite3';

declare global {
  var __db: Database.Database | undefined;
}

export {};
