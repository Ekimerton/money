import Database from 'better-sqlite3';
import path from 'path';

interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  transacted_at: number;
  description: string;
  category: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  balance_date: number;
}

const dbPath = path.join(process.cwd(), './data/user_data.db');
const db = new Database(dbPath);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');

    const accounts = db.prepare('SELECT * FROM accounts').all() as Account[];

    for (const account of accounts) {
      const transactions = db.prepare(
        `SELECT * FROM transactions WHERE account_id = ? ORDER BY transacted_at DESC`
      ).all(account.id) as Transaction[];

      const balanceHistory: { date: string; balance: number }[] = [];
      let currentBalance = Number(account.balance);

      const now = new Date();
      const todayUtcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      for (let i = 0; i < days; i++) {
        const date = new Date(todayUtcMidnight);
        date.setUTCDate(todayUtcMidnight.getUTCDate() - i);
        const dateString = date.toISOString().split('T')[0];

        const transactionsForDay = transactions.filter((t: Transaction) => {
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
      (account as any).balanceHistory = balanceHistory;
    }

    return new Response(JSON.stringify({ accounts }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching accounts and calculating historical balances:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 