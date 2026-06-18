import Database from 'better-sqlite3';
import path from 'path';
import { Account, Transaction } from './types';
import { unstable_cache } from 'next/cache';

const getDbPath = () => path.join(process.cwd(), './data/user_data.db');

export const getTransactionsCached = unstable_cache(
    async (accountId?: string) => {
        const db = new Database(getDbPath());
        try {
            let query = 'SELECT * FROM transactions';
            const params: any[] = [];
            if (accountId) {
                query += ' WHERE account_id = ?';
                params.push(accountId);
            }
            query += ' ORDER BY transacted_at DESC';
            return db.prepare(query).all(...params) as Transaction[];
        } finally {
            db.close();
        }
    },
    ['get-transactions'],
    { tags: ['transactions'] }
);

export const getAccountsCached = unstable_cache(
    async (days = 90) => {
        const db = new Database(getDbPath());
        try {
            const accounts = db.prepare('SELECT * FROM accounts').all() as any[];
            for (const account of accounts) {
                const transactions = db.prepare(
                    `SELECT amount, transacted_at FROM transactions WHERE account_id = ? ORDER BY transacted_at DESC`
                ).all(account.id) as Array<{ amount: string | number; transacted_at: number }>;

                const balanceHistory: { date: string; balance: number }[] = [];
                let currentBalance = Number(account.balance);

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
            return accounts as Account[];
        } finally {
            db.close();
        }
    },
    ['get-accounts'],
    { tags: ['accounts', 'transactions'] }
);

export const getCategoriesCached = unstable_cache(
    async () => {
        const db = new Database(getDbPath());
        try {
            return db.prepare('SELECT DISTINCT category FROM transactions').all().map((row: any) => row.category) as string[];
        } finally {
            db.close();
        }
    },
    ['get-categories'],
    { tags: ['transactions'] }
);
