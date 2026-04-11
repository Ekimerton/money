const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'data/test_transactions.db');
const db = new Database(dbPath);

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        posted INTEGER NOT NULL,
        amount TEXT NOT NULL,
        description TEXT NOT NULL,
        payee TEXT,
        transacted_at INTEGER,
        pending BOOLEAN NOT NULL DEFAULT 0,
        hidden BOOLEAN NOT NULL DEFAULT 0,
        category TEXT DEFAULT 'uncategorized'
    );
  `);

  // Insert a transaction and hide it
  db.prepare('INSERT INTO transactions (id, account_id, posted, amount, description) VALUES (?, ?, ?, ?, ?)').run('tx1', 'acc1', 12345, '10.00', 'Test 1');
  db.prepare('UPDATE transactions SET hidden = 1 WHERE id = ?').run('tx1');
  
  console.log('Before refresh:', db.prepare('SELECT id, hidden FROM transactions WHERE id = ?').get('tx1'));

  // Logic used in the app (reverted state)
  const sql = 'INSERT INTO transactions (id, account_id, posted, amount, description, payee, transacted_at, pending, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET account_id=excluded.account_id, posted=excluded.posted, amount=excluded.amount, description=excluded.description, payee=excluded.payee, transacted_at=excluded.transacted_at, pending=excluded.pending, hidden=excluded.hidden';
  
  const stmt = db.prepare(sql);
  
  // Try to "refresh" the same transaction
  stmt.run('tx1', 'acc1', 12345, '10.00', 'Test 1 Updated', null, null, 0, 'Uncategorized');
  
  console.log('After refresh:', db.prepare('SELECT id, hidden, description FROM transactions WHERE id = ?').get('tx1'));

} catch (err) {
  console.error('SQL Error:', err);
} finally {
  db.close();
  // Don't delete for now so we can inspect if needed
}
