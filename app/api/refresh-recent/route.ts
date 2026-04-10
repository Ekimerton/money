
import Database from 'better-sqlite3';
import path from 'path';
import { spawn } from 'child_process';
import { revalidateTag } from 'next/cache';
import { getSettings } from '@/lib/settings';

interface LatestTransactionRow {
    latest_posted: number;
}

const dbPath = path.join(process.cwd(), './data/user_data.db');
const pythonExecutablePath = path.join(process.cwd(), './data/.venv/bin/python');

export async function POST(req: Request) {
    const db = new Database(dbPath);
    try {
        let autoCategorize = false;
        try {
            const body = await req.json();
            autoCategorize = Boolean(body?.autoCategorize);
        } catch (_) {
            // No body provided; default remains false
        }
        
        const settings = await getSettings();

        if (!settings.simplefinUrl) {
            return new Response(JSON.stringify({ error: 'SimpleFIN URL not found. Please initialize it first.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const ACCESS_URL = settings.simplefinUrl;

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

        revalidateTag('accounts');
        revalidateTag('transactions');

        const data = await response.json();
        const accounts = data.accounts;

        db.exec(`
            CREATE TABLE IF NOT EXISTS account_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id TEXT NOT NULL,
                balance TEXT NOT NULL,
                balance_date INTEGER NOT NULL,
                fetched_at INTEGER NOT NULL,
                FOREIGN KEY (account_id) REFERENCES accounts(id)
            );
            CREATE INDEX IF NOT EXISTS idx_account_history_account_id ON account_history (account_id);
            CREATE INDEX IF NOT EXISTS idx_account_history_fetched_at ON account_history (fetched_at);
        `);

        const insertAccount = db.prepare(
            'INSERT INTO accounts (id, name, currency, balance, balance_date) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET currency=excluded.currency, balance=excluded.balance, balance_date=excluded.balance_date'
        );

        const insertAccountHistory = db.prepare(
            'INSERT INTO account_history (account_id, balance, balance_date, fetched_at) VALUES (?, ?, ?, ?)'
        );

        const fetchedAt = Math.floor(Date.now() / 1000);

        db.transaction(() => {
            for (const account of accounts) {
                insertAccount.run(
                    account.id,
                    account.name,
                    account.currency,
                    account.balance,
                    account['balance-date']
                );

                insertAccountHistory.run(
                    account.id,
                    account.balance,
                    account['balance-date'],
                    fetchedAt
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

        let classifierOutput: string | undefined;
        if (autoCategorize) {
            const dataDir = path.join(process.cwd(), 'data');
            const scriptPath = path.join(dataDir, 'classify_transaction.py');
            classifierOutput = await new Promise<string>((resolve) => {
                const proc = spawn(pythonExecutablePath, [scriptPath, String(startDate)], { cwd: dataDir });
                let stdout = '';
                let stderr = '';
                proc.stdout.on('data', (d) => (stdout += d.toString()));
                proc.stderr.on('data', (d) => (stderr += d.toString()));
                proc.on('close', (code) => {
                    const summary = `Classifier exited with code ${code}.\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`;
                    resolve(summary);
                });
                proc.on('error', (err) => {
                    resolve(`Classifier failed to start: ${err.message}`);
                });
            });
        }

        return new Response(JSON.stringify({ message: 'Accounts and transactions fetched and saved successfully', accounts, classifierOutput }), {
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