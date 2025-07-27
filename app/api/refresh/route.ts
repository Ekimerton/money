import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');
const db = new Database(dbPath);

const ACCESS_URL = "https://8AC46E79E1C2726F5C26C7C1485EF1CC29085D4E4846F36AFC179E708490151F:CB257D829DE2F92559B3136A243523049652B057473A4E89E1C44D583F5BFE82@beta-bridge.simplefin.org/simplefin";

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT,
    currency TEXT,
    type TEXT DEFAULT 'Uncategorized',
    balance TEXT,
    balance_date INTEGER
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    account_id TEXT,
    posted INTEGER,
    amount TEXT,
    description TEXT,
    payee TEXT,
    transacted_at INTEGER,
    pending INTEGER,
    hidden INTEGER DEFAULT 0,
    category TEXT DEFAULT 'Uncategorized',
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );
`);

export async function POST(req: Request) {
  try {
    const urlParts = ACCESS_URL.split('@');
    const authString = urlParts[0].replace('https://', '');
    const baseUrl = urlParts[1];
    const [username, password] = authString.split(':');

    const startDate = Math.floor(new Date('2000-01-01').getTime() / 1000);
    const endDate = Math.floor(Date.now() / 1000);

    const response = await fetch(`https://${baseUrl}/accounts?pending=1&start-date=${startDate}&end-date=${endDate}`, {
      headers: {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors ? errorData.errors.join(', ') : 'Failed to fetch data from SimpleFIN.');
    }

    const data = await response.json();
    const accounts = data.accounts;

    const insertAccount = db.prepare(
      'INSERT INTO accounts (id, name, currency, balance, balance_date) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET currency=excluded.currency, balance=excluded.balance, balance_date=excluded.balance_date'
    );

    db.transaction(() => {
      for (const account of accounts) {
        insertAccount.run(
          account.id,
          account.name,
          account.currency,
          account.balance,
          account['balance-date']
        );

        // Save transactions for each account
        const insertTransaction = db.prepare(
          'INSERT INTO transactions (id, account_id, posted, amount, description, payee, transacted_at, pending, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET account_id=excluded.account_id, posted=excluded.posted, amount=excluded.amount, description=excluded.description, payee=excluded.payee, transacted_at=excluded.transacted_at, pending=excluded.pending, hidden=excluded.hidden'
        );
        for (const transaction of account.transactions) {
          insertTransaction.run(
            transaction.id,
            account.id, // Use the parent account's ID
            transaction.posted,
            transaction.amount,
            transaction.description,
            transaction.payee || null,
            transaction.transacted_at || null,
            transaction.pending ? 1 : 0,
            'Uncategorized' // Default for new, existing untouched by ON CONFLICT
          );
        }
      }
    })();


    return new Response(JSON.stringify({ message: 'Accounts and transactions fetched and saved successfully', accounts }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in refresh API:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 