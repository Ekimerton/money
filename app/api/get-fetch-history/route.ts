import Database from 'better-sqlite3';
import path from 'path';
import { NextResponse } from 'next/server';
import { getDataPath } from '@/lib/paths';

export const dynamic = "force-dynamic";

export async function GET() {
    const dbPath = getDataPath('user_data.db');
    const db = new Database(dbPath);

    try {
        // First, get the unique fetch sessions with total balances and transaction counts
        const fetchSessions = db.prepare(`
            SELECT 
                fetched_at,
                SUM(CAST(balance AS REAL)) as total_balance
            FROM account_history
            GROUP BY fetched_at
            ORDER BY fetched_at DESC
            LIMIT 30
        `).all() as any[];

        // For each session, get the transaction details
        const results = fetchSessions.map(session => {
            const txs = db.prepare(`
                SELECT 
                    id, 
                    amount, 
                    description, 
                    payee, 
                    transacted_at,
                    category
                FROM transactions 
                WHERE fetched_at = ?
            `).all(session.fetched_at) as any[];

            const dateObj = isNaN(Number(session.fetched_at)) ? new Date(session.fetched_at) : new Date(Number(session.fetched_at) * 1000);

            return {
                fetched_at: session.fetched_at,
                date: dateObj.toISOString(),
                total_balance: session.total_balance,
                transactions: txs.map(t => ({
                    id: String(t.id),
                    amount: String(t.amount),
                    description: String(t.description ?? ''),
                    payee: t.payee ?? null,
                    transacted_at: Number(t.transacted_at ?? 0),
                    category: String(t.category ?? 'Uncategorized'),
                }))
            };
        });


        return NextResponse.json({ history: results });
    } catch (error: any) {
        console.error("Failed to fetch history:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        db.close();
    }
}
