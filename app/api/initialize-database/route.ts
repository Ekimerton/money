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
        type TEXT DEFAULT 'uncategorized'
      );

      CREATE TABLE IF NOT EXISTS account_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id TEXT NOT NULL,
        balance TEXT NOT NULL,
        balance_date INTEGER NOT NULL,
        fetched_at INTEGER NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      );

      CREATE INDEX IF NOT EXISTS idx_account_history_account_id ON account_history (account_id);
      CREATE INDEX IF NOT EXISTS idx_account_history_fetched_at ON account_history (fetched_at);

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        posted INTEGER NOT NULL,
        amount TEXT NOT NULL,
        description TEXT NOT NULL,
        payee TEXT,
        transacted_at INTEGER,
        pending BOOLEAN NOT NULL DEFAULT FALSE,
        hidden BOOLEAN NOT NULL DEFAULT FALSE,
        category TEXT DEFAULT 'uncategorized',
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions (account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_transacted_at ON transactions (transacted_at);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category);

      /* Cleanup old user_config table now that settings are moved to JSON */
      DROP TABLE IF EXISTS user_config;
    `);

    db.close();

    return NextResponse.json({ message: 'Database initialized successfully!' }, { status: 200 });
  } catch (error: any) {
    console.error('Error initializing database:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}