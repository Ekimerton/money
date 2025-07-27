
import Database from 'better-sqlite3';
import path from 'path';
import { NextRequest } from 'next/server';

const dbPath = path.join(process.cwd(), './data/user_data.db');
const db = new Database(dbPath);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    let query = 'SELECT * FROM transactions';
    const params = [];

    if (accountId) {
      query += ' WHERE account_id = ?';
      params.push(accountId);
    }

    query += ' ORDER BY transacted_at DESC';

    const transactions = db.prepare(query).all(...params);

    return new Response(JSON.stringify({ transactions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error loading transactions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 