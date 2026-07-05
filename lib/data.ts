import { getDb } from './db';
import { Transaction, Account } from './types';

export async function getTransactions(accountId?: string, month?: string, year?: string): Promise<Transaction[]> {
    const db = getDb();

    let query = 'SELECT * FROM transactions';
    const params = [];
    const conditions = [];

    if (accountId) {
      conditions.push('account_id = ?');
      params.push(accountId);
    }

    if (month && year) {
      const startDate = new Date(Date.UTC(parseInt(year), parseInt(month), 1));
      const endDate = new Date(Date.UTC(parseInt(year), parseInt(month) + 1, 0, 23, 59, 59, 999));

      conditions.push('transacted_at >= ?');
      params.push(Math.floor(startDate.getTime() / 1000));

      conditions.push('transacted_at <= ?');
      params.push(Math.floor(endDate.getTime() / 1000));
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY transacted_at DESC';

    const transactions = db.prepare(query).all(...params) as any[];

    return transactions.map(r => ({
      id: String(r.id),
      account_id: String(r.account_id),
      posted: Number(r.posted),
      amount: String(r.amount),
      description: String(r.description ?? ''),
      payee: r.payee ?? null,
      transacted_at: Number(r.transacted_at ?? r.posted ?? 0),
      pending: Boolean(r.pending),
      hidden: Boolean(r.hidden),
      category: String(r.category ?? 'Uncategorized')
    }));
}

export async function getAccounts(days: number = 90): Promise<Account[]> {
    const db = getDb();
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

    return accounts;
}

export async function getCategories(): Promise<string[]> {
    const db = getDb();
    const categories = db.prepare('SELECT DISTINCT category FROM transactions').all().map((row: any) => row.category);
    return categories;
}
