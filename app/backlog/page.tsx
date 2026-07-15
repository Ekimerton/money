import Database from 'better-sqlite3';
import path from 'path';
import { BacklogClient } from '@/app/backlog/backlog-client';

import { Transaction } from '@/lib/types';
import { unstable_cache } from 'next/cache';
import { getDataPath } from '@/lib/paths';

const getBacklogData = unstable_cache(async () => {
    const dbPath = getDataPath('user_data.db');
    const db = new Database(dbPath);
    try {
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
    } finally {
        db.close();
    }
}, ["backlog-v1"], { tags: ["transactions"] });


import Link from 'next/link';
import { History } from 'lucide-react';

export default async function BacklogPage() {
    const { transactions, categories } = await getBacklogData();
    return (
        <div className="p-4 flex flex-col items-center justify-start min-h-screen">
            <BacklogClient initialTransactions={transactions} initialCategories={categories} />
            <div className="w-full mt-12 border-t pt-8 border-neutral-100 dark:border-neutral-800 flex justify-center">
                <Link 
                    href="/backlog/history"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors font-medium border px-4 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                    <History className="size-4" />
                    View Previous Data Fetches
                </Link>
            </div>
        </div>
    );
}




