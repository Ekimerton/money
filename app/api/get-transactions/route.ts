
import Database from 'better-sqlite3';
import path from 'path';
import { NextRequest } from 'next/server';

const dbPath = path.join(process.cwd(), './data/user_data.db');
const db = new Database(dbPath);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let query = 'SELECT * FROM transactions';
    const params = [];
    const conditions = [];

    if (accountId) {
      conditions.push('account_id = ?');
      params.push(accountId);
    }

    if (month && year) {
      // For SQLite, timestamps are typically in seconds since epoch
      // We need to calculate the start and end of the month in UTC seconds
      const startDate = new Date(Date.UTC(parseInt(year), parseInt(month), 1));
      const endDate = new Date(Date.UTC(parseInt(year), parseInt(month) + 1, 0, 23, 59, 59, 999));

      conditions.push('transacted_at >= ?');
      params.push(Math.floor(startDate.getTime() / 1000));

      conditions.push('transacted_at <= ?');
      params.push(Math.floor(endDate.getTime() / 1000));
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
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