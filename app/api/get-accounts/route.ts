import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');
const db = new Database(dbPath);

export async function GET() {
  try {
    const accounts = db.prepare('SELECT * FROM accounts').all();
    return new Response(JSON.stringify({ accounts }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching accounts from DB:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 