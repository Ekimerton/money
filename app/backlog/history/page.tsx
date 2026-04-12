import { FetchHistoryClient } from '../fetch-history-client';
import Database from 'better-sqlite3';
import path from 'path';
import { unstable_cache } from 'next/cache';

const getFetchHistory = unstable_cache(async () => {
    const dbPath = path.join(process.cwd(), './data/user_data.db');
    const db = new Database(dbPath);
    try {
        const fetchSessions = db.prepare(`
            SELECT 
                fetched_at,
                SUM(CAST(balance AS REAL)) as total_balance
            FROM account_history
            GROUP BY fetched_at
            ORDER BY fetched_at DESC
            LIMIT 30
        `).all() as any[];

        return fetchSessions.map(session => {
            const txs = db.prepare(`
                SELECT id, amount, description, payee, transacted_at, category
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
    } finally {
        db.close();
    }
}, ["fetch-history-v1"], { tags: ["transactions", "accounts"] });

export default async function FetchHistoryPage() {
    const history = await getFetchHistory();
    return (
        <div className="">
            <FetchHistoryClient initialHistory={history} />
        </div>
    );
}


