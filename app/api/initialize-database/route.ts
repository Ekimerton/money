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

      CREATE TABLE IF NOT EXISTS user_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        display_name TEXT,
        simplefin_url TEXT,
        classifier_training_date TEXT DEFAULT NULL,
        auto_categorize BOOLEAN DEFAULT FALSE,
        auto_mark_duplicates BOOLEAN DEFAULT FALSE
      );
    `);

    // Ensure new column exists on already-initialized databases
    try {
      db.prepare(`ALTER TABLE user_config ADD COLUMN auto_mark_duplicates BOOLEAN DEFAULT FALSE`).run();
    } catch (e) {
      // ignore if column already exists
    }

    db.close();

    return NextResponse.json({ message: 'Database initialized successfully!' }, { status: 200 });
  } catch (error: any) {
    console.error('Error initializing database:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 