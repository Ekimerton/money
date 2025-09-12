import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { revalidateTag } from 'next/cache';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function POST(req: NextRequest) {
    try {
        const { payee, newCategory } = await req.json();

        if (!payee || newCategory === undefined) {
            return NextResponse.json({ error: 'Missing payee or newCategory' }, { status: 400 });
        }

        const db = new Database(dbPath);

        const normalized = (() => {
            const value = String(newCategory ?? '').trim();
            if (value.length === 0) return 'Uncategorized';
            return value.toLowerCase() === 'uncategorized' ? 'Uncategorized' : value;
        })();

        // Determine if any affected rows cross the backlog boundary
        const prevCountRow = db.prepare("SELECT COUNT(*) as cnt FROM transactions WHERE payee = ? AND category = 'Uncategorized'").get(payee) as { cnt?: number } | undefined;
        const prevUncatCount = Number(prevCountRow?.cnt ?? 0);

        const stmt = db.prepare('UPDATE transactions SET category = ? WHERE payee = ?');
        stmt.run(normalized, payee);

        const nextCountRow = db.prepare("SELECT COUNT(*) as cnt FROM transactions WHERE payee = ? AND category = 'Uncategorized'").get(payee) as { cnt?: number } | undefined;
        const nextUncatCount = Number(nextCountRow?.cnt ?? 0);

        db.close();

        if ((prevUncatCount === 0 && nextUncatCount > 0) || (prevUncatCount > 0 && nextUncatCount === 0)) {
            revalidateTag('transactions');
        }

        return NextResponse.json({ message: `All transactions for payee ${payee} updated to category ${normalized}` });
    } catch (error) {
        console.error('Error updating transactions by payee:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 