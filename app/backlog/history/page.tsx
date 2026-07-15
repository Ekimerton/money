import { FetchHistoryClient } from '../fetch-history-client';
import Database from 'better-sqlite3';
import path from 'path';
import { unstable_cache } from 'next/cache';
import { getDataPath } from '@/lib/paths';

const getFetchHistory = unstable_cache(async () => {
    const dbPath = getDataPath('user_data.db');
    const db = new Database(dbPath);
    try {
        // Ensure necessary columns exist for the query (safety during build/first-run)
        try { db.exec("ALTER TABLE transactions ADD COLUMN fetched_at TEXT;"); } catch (e) { }
        try { db.exec("ALTER TABLE account_history ADD COLUMN fetched_at TEXT;"); } catch (e) { }

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

        const history = uniqueFetchedTimes.map(fetchedAt => {
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
                SELECT *
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
                    account_id: String(t.account_id),
                    posted: Number(t.posted),
                    amount: String(t.amount),
                    description: String(t.description ?? ''),
                    payee: t.payee ?? null,
                    transacted_at: Number(t.transacted_at ?? 0),
                    category: String(t.category ?? 'Uncategorized'),
                    pending: Boolean(t.pending),
                    hidden: Boolean(t.hidden),
                }))
            };
        });

        return { history, accounts };
    } catch (error) {
        console.error("Fetch history failed (this is expected if DB is not initialized):", error);
        return { history: [], accounts: [] };
    } finally {
        db.close();
    }
}, ["fetch-history-v3"], { tags: ["transactions", "accounts"] });


export default async function FetchHistoryPage() {
    const { history, accounts } = await getFetchHistory();
    return (
        <div className="">
            <FetchHistoryClient initialHistory={history} accounts={accounts} />
        </div>
    );
}


