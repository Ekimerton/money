import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function POST(req: NextRequest) {
    try {
        const db = new Database(dbPath);

        db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        currency TEXT NOT NULL,
        balance TEXT NOT NULL,
        balance_date INTEGER NOT NULL,
        type TEXT DEFAULT 'checking'
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        posted INTEGER NOT NULL,
        amount TEXT NOT NULL,
        description TEXT NOT NULL,
        payee TEXT,
        transacted_at INTEGER,
        pending BOOLEAN NOT NULL,
        hidden BOOLEAN NOT NULL,
        category TEXT DEFAULT 'uncategorized',
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      );
    `);

        db.exec(`
      CREATE TABLE IF NOT EXISTS user_config (
        name TEXT PRIMARY KEY,
        simplefin_url TEXT
      );
    `);

        db.close();

        return NextResponse.json({ message: 'Database initialized successfully!' }, { status: 200 });
    } catch (error: any) {
        console.error('Error initializing database:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 