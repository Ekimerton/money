import { getDb } from '@/lib/db';

export function getAccounts() {
    const db = getDb();
    return db.prepare('SELECT * FROM accounts').all();
}

export function getCategories() {
    const db = getDb();
    return db.prepare('SELECT DISTINCT category FROM transactions WHERE category IS NOT NULL AND category != "" ORDER BY category').all().map((r: any) => r.category);
}

export function getTransactions(accountId?: string) {
    const db = getDb();
    let sql = 'SELECT * FROM transactions';
    let params: any[] = [];
    if (accountId) {
        sql += ' WHERE account_id = ?';
        params.push(accountId);
    }
    sql += ' ORDER BY transacted_at DESC';
    return db.prepare(sql).all(...params);
}
