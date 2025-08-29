import { Transaction } from "@/lib/types";
import { CumulativeSpendLineChart } from "@/app/spending/cumulative-spend-line-chart";
import Database from 'better-sqlite3';
import path from 'path';

export default async function InsightsPage() {
    const dbPath = path.join(process.cwd(), './data/user_data.db');
    const db = new Database(dbPath);
    try {
        const rows = db.prepare('SELECT * FROM transactions ORDER BY transacted_at DESC').all() as any[];
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

        const spendOnly = transactions
            .filter((t) => !t.hidden && t.category !== "Internal Transfer")
            .filter((t) => Number(t.amount) < 0);
        const totalSpending = spendOnly.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const formattedTotal = Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalSpending);

        return (
            <div className="p-4">
                <div className="flex gap-2 space-y-0 sm:flex-row max-sm:p-2">
                    <div className="grid flex-1 gap-1">
                        <h2 className="font-bold text-muted-foreground uppercase text-sm font-mono">All Time Spend</h2>
                        <h1 className="text-2xl font-bold text-neutral-950 dark:text-neutral-50">{formattedTotal}</h1>
                    </div>
                </div>
                <CumulativeSpendLineChart transactions={spendOnly} />
            </div>
        );
    } finally {
        db.close();
    }
}


