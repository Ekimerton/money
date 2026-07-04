import { getDb } from './db';
import { Account, Transaction } from './types';

export function getTransactionsData(accountId?: string, month?: string, year?: string): Transaction[] {
  const db = getDb();
  let query = 'SELECT * FROM transactions';
  const params: any[] = [];
  const conditions: string[] = [];

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

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map(r => ({
    id: String(r.id),
    account_id: String(r.account_id),
    amount: String(r.amount),
    transacted_at: Number(r.transacted_at),
    description: String(r.description ?? ''),
    category: String(r.category ?? 'Uncategorized'),
    posted: Number(r.posted),
    payee: r.payee ?? null,
    pending: Boolean(r.pending),
    hidden: Boolean(r.hidden)
  }));
}

export function getAccountsData(days: number = 90): Account[] {
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

export function getCategoriesData(): string[] {
  const db = getDb();
  return db.prepare('SELECT DISTINCT category FROM transactions WHERE category IS NOT NULL AND TRIM(category) <> ""').all().map((row: any) => String(row.category));
}
