import { getDb } from './db';
import { Account, Transaction } from './types';

export function getAccounts(): Account[] {
  const db = getDb();
  return db.prepare('SELECT * FROM accounts ORDER BY name').all() as Account[];
}

export function getTransactions(options?: { accountId?: string; month?: string; year?: string }): Transaction[] {
  const db = getDb();
  let query = 'SELECT * FROM transactions';
  const params: any[] = [];
  const conditions: string[] = [];

  if (options?.accountId) {
    conditions.push('account_id = ?');
    params.push(options.accountId);
  }

  if (options?.month && options?.year) {
    const startDate = new Date(Date.UTC(parseInt(options.year), parseInt(options.month), 1));
    const endDate = new Date(Date.UTC(parseInt(options.year), parseInt(options.month) + 1, 0, 23, 59, 59, 999));

    conditions.push('transacted_at >= ?');
    params.push(Math.floor(startDate.getTime() / 1000));

    conditions.push('transacted_at <= ?');
    params.push(Math.floor(endDate.getTime() / 1000));
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY transacted_at DESC';

  return db.prepare(query).all(...params) as Transaction[];
}

export function getCategories(): string[] {
  const db = getDb();
  const rows = db.prepare('SELECT DISTINCT category FROM transactions WHERE category IS NOT NULL AND category != \'\' ORDER BY category').all() as { category: string }[];
  return rows.map(r => r.category);
}
