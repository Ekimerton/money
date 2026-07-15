import Database from 'better-sqlite3';
import path from 'path';
import { NextResponse } from 'next/server';
import { getDataPath } from '@/lib/paths';

export const dynamic = "force-dynamic";

export async function GET() {
    const dbPath = getDataPath('user_data.db');
    const db = new Database(dbPath);

    try {
        const accounts = db.prepare('SELECT * FROM accounts').all() as any[];
        const allHistoryRaw = db.prepare('SELECT account_id, balance, fetched_at FROM account_history').all() as any[];
        const allHistory = allHistoryRaw.map(h => ({
            ...h,
            fetched_at: String(h.fetched_at ?? '')
        }));

        // Get the unique fetched_at times, sorted descending
        const uniqueFetchedTimes = Array.from(new Set(allHistory.map(h => h.fetched_at)))
            .filter(Boolean)
            .sort((a, b) => b.localeCompare(a))
            .slice(0, 30);

        // For each session, get the transaction details and carry forward balances
        const results = uniqueFetchedTimes.map(fetchedAt => {
            const balancesAtTime: Record<string, number> = {};

            accounts.forEach(acc => {
                const entries = allHistory.filter(h => h.account_id === acc.id);
                if (entries.length > 0) {
                    entries.sort((a, b) => a.fetched_at.localeCompare(b.fetched_at));
                    const historyBeforeOrAt = entries.filter(e => e.fetched_at <= fetchedAt);
                    if (historyBeforeOrAt.length > 0) {
                        balancesAtTime[acc.id] = parseFloat(historyBeforeOrAt[historyBeforeOrAt.length - 1].balance);
                    } else {
                        balancesAtTime[acc.id] = parseFloat(entries[0].balance);
                    }
                } else {
                    balancesAtTime[acc.id] = parseFloat(acc.balance);
                }
            });

            const totalBalance = Object.values(balancesAtTime).reduce((sum, val) => sum + val, 0);

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
            `).all(fetchedAt) as any[];

            const dateObj = isNaN(Number(fetchedAt)) ? new Date(fetchedAt) : new Date(Number(fetchedAt) * 1000);

            return {
                fetched_at: fetchedAt,
                date: dateObj.toISOString(),
                total_balance: totalBalance,
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
