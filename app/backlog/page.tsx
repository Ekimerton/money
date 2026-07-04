import { BacklogClient } from '@/app/backlog/backlog-client';
import { Transaction } from '@/lib/types';
import { unstable_cache } from 'next/cache';
import { getDb } from '@/lib/db';

const getBacklogData = unstable_cache(async () => {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM transactions WHERE category = 'Uncategorized' AND hidden = 0 ORDER BY transacted_at DESC").all() as any[];
    const transactions: Transaction[] = rows.map((r) => ({
        id: String(r.id),
        account_id: String(r.account_id),
        posted: Number(r.posted),
        amount: String(r.amount),
        description: String(r.description ?? ''),
        payee: r.payee ?? null,
        transacted_at: Number(r.transacted_at ?? r.posted ?? 0),
        pending: Boolean(r.pending),
        hidden: Boolean(r.hidden),
        category: String(r.category ?? 'Uncategorized'),
    }));

    const categories = db.prepare("SELECT DISTINCT category FROM transactions WHERE category IS NOT NULL AND category != 'Uncategorized'").all().map((row: any) => row.category) as string[];
    return { transactions, categories };
}, ["backlog-v1"], { tags: ["transactions"] });

export default async function BacklogPage() {
    const { transactions, categories } = await getBacklogData();
    return (
        <div className="p-4">
            <BacklogClient initialTransactions={transactions} initialCategories={categories} />
        </div>
    );
}


