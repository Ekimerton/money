import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';

export async function POST(req: NextRequest) {
    try {
        const { transactionId, newCategory } = await req.json();

        if (!transactionId || newCategory === undefined) {
            return NextResponse.json({ error: 'Missing transactionId or newCategory' }, { status: 400 });
        }

        const db = new Database('data/user_data.db');

        const stmt = db.prepare('UPDATE transactions SET category = ? WHERE id = ?');
        stmt.run(newCategory, transactionId);
        db.close();

        return NextResponse.json({ id: transactionId, category: newCategory });
    } catch (error) {
        console.error('Error updating transaction category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 