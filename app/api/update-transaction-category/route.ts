import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import Database from 'better-sqlite3';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const { transactionId, newCategory } = await req.json();

        if (!transactionId || newCategory === undefined) {
            return NextResponse.json({ error: 'Missing transactionId or newCategory' }, { status: 400 });
        }

        const dbPath = path.join(process.cwd(), './data/user_data.db');
        const db = new Database(dbPath);

        // Normalize category: treat empty or case-insensitive 'uncategorized' as 'Uncategorized'
        const normalized = (() => {
            const value = String(newCategory ?? '').trim();
            if (value.length === 0) return 'Uncategorized';
            return value.toLowerCase() === 'uncategorized' ? 'Uncategorized' : value;
        })();

        const stmt = db.prepare('UPDATE transactions SET category = ? WHERE id = ?');
        stmt.run(normalized, transactionId);
        db.close();

        // Invalidate cached transaction-backed pages and fetches
        revalidateTag('transactions');

        return NextResponse.json({ id: transactionId, category: normalized });
    } catch (error) {
        console.error('Error updating transaction category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 