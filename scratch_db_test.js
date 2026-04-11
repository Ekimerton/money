const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'data/user_data.db');
const db = new Database(dbPath);

try {
  console.log('Testing DB connection...');
  const accounts = db.prepare('SELECT id FROM accounts LIMIT 1').all();
  console.log('Accounts found:', accounts.length);
  
  if (accounts.length > 0) {
    const account_id = accounts[0].id;
    console.log('Testing account_history insertion for account:', account_id);
    
    db.exec(`
        CREATE TABLE IF NOT EXISTS account_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT NOT NULL,
            balance TEXT NOT NULL,
            balance_date INTEGER NOT NULL,
            fetched_at INTEGER NOT NULL,
            FOREIGN KEY (account_id) REFERENCES accounts(id)
        );
    `);
    
    const insert = db.prepare('INSERT INTO account_history (account_id, balance, balance_date, fetched_at) VALUES (?, ?, ?, ?)');
    const result = insert.run(account_id, '100.00', Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000));
    console.log('Insertion result:', result);
    
    const count = db.prepare('SELECT count(*) as count FROM account_history').get();
    console.log('Total history rows:', count.count);
  }
} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}
