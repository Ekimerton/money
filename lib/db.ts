import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export function getDb(readonly = false) {
    if (readonly) {
        return new Database(dbPath, { readonly: true });
    }

    if (process.env.NODE_ENV !== 'production') {
        if (!globalThis.sqliteDb) {
            globalThis.sqliteDb = new Database(dbPath);
            globalThis.sqliteDb.pragma('journal_mode = WAL');
        }
        return globalThis.sqliteDb;
    }

    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    return db;
}
