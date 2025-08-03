import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function POST(req: NextRequest) {
    try {
        const { payee, newCategory } = await req.json();

        if (!payee || newCategory === undefined) {
            return NextResponse.json({ error: 'Missing payee or newCategory' }, { status: 400 });
        }

        const db = new Database(dbPath);

        const stmt = db.prepare('UPDATE transactions SET category = ? WHERE payee = ?');
        stmt.run(newCategory, payee);
        db.close();

        return NextResponse.json({ message: `All transactions for payee ${payee} updated to category ${newCategory}` });
    } catch (error) {
        console.error('Error updating transactions by payee:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 