
import Database from 'better-sqlite3';
import path from 'path';

interface UserConfigRow {
    simplefin_url: string;
}

interface LatestTransactionRow {
    latest_posted: number;
}

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function POST(req: Request) {
    const db = new Database(dbPath);
    try {
        // Retrieve simplefin_url from the single-row user_config table
        const simplefinUrlRow = db
            .prepare('SELECT simplefin_url FROM user_config WHERE id = 1')
            .get() as UserConfigRow;

        if (!simplefinUrlRow || !simplefinUrlRow.simplefin_url) {
            return new Response(JSON.stringify({ error: 'SimpleFIN URL not found in database. Please initialize it first.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const ACCESS_URL = simplefinUrlRow.simplefin_url;

        const urlParts = ACCESS_URL.split('@');
        const authString = urlParts[0].replace('https://', '');
        const baseUrl = urlParts[1];
        const [username, password] = authString.split(':');

        // Get the latest transaction date from the database
        const latestTransactionRow = db.prepare('SELECT MAX(posted) as latest_posted FROM transactions').get() as LatestTransactionRow;
        let startDate = 0;

        if (latestTransactionRow && latestTransactionRow.latest_posted) {
            // Subtract one day from the latest posted date
            startDate = latestTransactionRow.latest_posted - (24 * 60 * 60); // Subtract 1 day in seconds
        } else {
            // If no transactions, default to a very old date
            startDate = Math.floor(new Date('2000-01-01').getTime() / 1000);
        }

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

                const insertTransaction = db.prepare(
                    'INSERT INTO transactions (id, account_id, posted, amount, description, payee, transacted_at, pending, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET account_id=excluded.account_id, posted=excluded.posted, amount=excluded.amount, description=excluded.description, payee=excluded.payee, transacted_at=excluded.transacted_at, pending=excluded.pending, hidden=excluded.hidden'
                );
                for (const transaction of account.transactions) {
                    insertTransaction.run(
                        transaction.id,
                        account.id,
                        transaction.posted,
                        transaction.amount,
                        transaction.description,
                        transaction.payee || null,
                        transaction.transacted_at || null,
                        transaction.pending ? 1 : 0,
                        'Uncategorized'
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
    } finally {
        db.close();
    }
} 