import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(readonly: boolean = false): Database.Database {
    const dbPath = path.join(process.cwd(), './data/user_data.db');

    if (readonly) {
       return new Database(dbPath, { readonly: true });
    }

    if (process.env.NODE_ENV !== 'production') {
        const globalWithDb = global as typeof globalThis & { __db?: Database.Database };
        if (!globalWithDb.__db) {
            globalWithDb.__db = new Database(dbPath);
            globalWithDb.__db.pragma('journal_mode = WAL');
        }
        return globalWithDb.__db;
    } else {
        if (!db) {
            db = new Database(dbPath);
            db.pragma('journal_mode = WAL');
        }
        return db;
    }
}
