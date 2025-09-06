import { Account } from "@/lib/types";
import Database from 'better-sqlite3';
import path from 'path';
import { AccountBalancePage } from "./account-balance-page";

export default async function AccountsPage() {
    const dbPath = path.join(process.cwd(), './data/user_data.db');
    const db = new Database(dbPath);
    try {
        const days = 365;
        const rows = db.prepare('SELECT * FROM accounts').all() as any[];

        const accounts: Account[] = rows.map((r) => ({
            id: String(r.id),
            name: String(r.name ?? ''),
            currency: String(r.currency ?? 'USD'),
            balance: String(r.balance),
            "balance-date": Number(r.balance_date ?? 0),
            type: String(r.type ?? ''),
            balanceHistory: [],
        }));

        for (const account of accounts) {
            const transactions = db.prepare(
                `SELECT * FROM transactions WHERE account_id = ? ORDER BY transacted_at DESC`
            ).all(account.id) as Array<{ amount: number; transacted_at: number }>;

            const balanceHistory: { date: string; balance: number }[] = [];
            let currentBalance = parseFloat(account.balance);

            const now = new Date();
            const todayUtcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

            for (let i = 0; i < days; i++) {
                const date = new Date(todayUtcMidnight);
                date.setUTCDate(todayUtcMidnight.getUTCDate() - i);
                const dateString = date.toISOString().split('T')[0];

                const transactionsForDay = transactions.filter((t) => {
                    const transactedDate = new Date(Number(t.transacted_at) * 1000);
                    const transactedDateString = transactedDate.toISOString().split('T')[0];
                    return transactedDateString === dateString;
                });

                let dailyTransactionsSum = 0;
                for (const transaction of transactionsForDay) {
                    dailyTransactionsSum += Number(transaction.amount);
                }

                const balanceAtStartOfDay = currentBalance - dailyTransactionsSum;
                balanceHistory.unshift({ date: dateString, balance: parseFloat(balanceAtStartOfDay.toFixed(2)) });

                currentBalance = balanceAtStartOfDay;
            }

            account.balanceHistory = balanceHistory;
        }

        return (
            <div>
                <AccountBalancePage accounts={accounts} />
            </div>
        );
    } finally {
        db.close();
    }
} 