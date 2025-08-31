"use server"

import Database from "better-sqlite3";
import path from "path";
import { spawn } from "child_process";
import { revalidateTag } from "next/cache";

const dbPath = path.join(process.cwd(), "./data/user_data.db");
const pythonExecutablePath = path.join(process.cwd(), "./data/.venv/bin/python");

async function classifyTransactionsByIds(transactionIds: string[]): Promise<{ output: string; categorizedCount?: number; }> {
    const dataDir = path.join(process.cwd(), 'data');
    const scriptPath = path.join(dataDir, 'classify_transaction.py');
    if (transactionIds.length === 0) {
        return { output: 'No transactions to classify.' };
    }
    const idsArg = transactionIds.join(',');
    const output = await new Promise<string>((resolve) => {
        const proc = spawn(pythonExecutablePath, [scriptPath, '--ids', idsArg], { cwd: dataDir });
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
    let categorizedCount: number | undefined;
    try {
        const match = output.match(/(\d+)\s+transactions were auto-categorized/i);
        if (match && match[1]) {
            categorizedCount = parseInt(match[1], 10);
        }
    } catch { }
    return { output, categorizedCount };
}

function markInternalTransfersForTransactions(db: any, transactionIds: string[]): number {
    if (transactionIds.length === 0) return 0;
    const threeDaysInSeconds = 3 * 24 * 60 * 60;
    const placeholders = transactionIds.map(() => 'SELECT ? AS id').join(' UNION ALL ');
    const updateSql = `
      WITH provided_ids(id) AS (
        ${placeholders}
      ),
      pairs AS (
        SELECT t1.id AS id1, t2.id AS id2
        FROM transactions t1
        JOIN transactions t2
          ON t1.id < t2.id
         AND t1.account_id != t2.account_id
         AND CAST(t1.amount AS REAL) = -CAST(t2.amount AS REAL)
         AND ABS(COALESCE(t1.transacted_at, t1.posted) - COALESCE(t2.transacted_at, t2.posted)) <= ${threeDaysInSeconds}
        WHERE t1.id IN (SELECT id FROM provided_ids) OR t2.id IN (SELECT id FROM provided_ids)
      )
      UPDATE transactions
         SET category = 'Internal Transfer'
       WHERE id IN (
         SELECT id1 FROM pairs
         UNION
         SELECT id2 FROM pairs
       );
    `;
    const result = db.prepare(updateSql).run(...transactionIds);
    return result.changes || 0;
}

export async function setAutoCategorize(autoCategorize: boolean): Promise<void> {
    const db = new Database(dbPath);
    try {
        const stmt = db.prepare(`
            INSERT INTO user_config (id, auto_categorize)
            VALUES (1, ?)
            ON CONFLICT(id) DO UPDATE SET
                auto_categorize = excluded.auto_categorize
        `);
        stmt.run(autoCategorize ? 1 : 0);
    } finally {
        db.close();
    }
}

export async function setAutoMarkInternalTransfers(enabled: boolean): Promise<void> {
    const db = new Database(dbPath);
    try {
        const stmt = db.prepare(`
            INSERT INTO user_config (id, auto_mark_duplicates)
            VALUES (1, ?)
            ON CONFLICT(id) DO UPDATE SET
                auto_mark_duplicates = excluded.auto_mark_duplicates
        `);
        stmt.run(enabled ? 1 : 0);
    } finally {
        db.close();
    }
}

export async function refreshRecent(processAll?: boolean): Promise<{ message: string; classifierOutput?: string; updatedDuplicates?: number; newTransactions?: number; categorizedCount?: number; }> {
    const db = new Database(dbPath);
    try {
        const userConfig = db.prepare(
            'SELECT simplefin_url, auto_categorize, auto_mark_duplicates FROM user_config WHERE id = 1'
        ).get() as { simplefin_url?: string; auto_categorize?: number; auto_mark_duplicates?: number } | undefined;

        if (!userConfig || !userConfig.simplefin_url) {
            throw new Error('SimpleFIN URL not found in database. Please initialize it first.');
        }

        const ACCESS_URL = userConfig.simplefin_url;
        const autoCategorize = Boolean(userConfig.auto_categorize);
        const autoMarkDuplicates = Boolean(userConfig.auto_mark_duplicates);

        const urlParts = ACCESS_URL.split('@');
        const authString = urlParts[0].replace('https://', '');
        const baseUrl = urlParts[1];
        const [username, password] = authString.split(':');

        let startDate = processAll
            ? Math.floor(new Date('2000-01-01').getTime() / 1000)
            : (() => {
                const latestTransactionRow = db.prepare('SELECT MAX(posted) as latest_posted FROM transactions').get() as { latest_posted?: number };
                if (latestTransactionRow && latestTransactionRow.latest_posted) {
                    return latestTransactionRow.latest_posted - (24 * 60 * 60);
                }
                return Math.floor(new Date('2000-01-01').getTime() / 1000);
            })();
        const endDate = Math.floor(Date.now() / 1000);

        const newTransactionIds: string[] = [];

        const authHeader = Buffer.from(`${username}:${password}`).toString('base64');
        const response = await fetch(`https://${baseUrl}/accounts?pending=1&start-date=${startDate}&end-date=${endDate}`, {
            headers: { Authorization: `Basic ${authHeader}` },
        });
        if (!response.ok) {
            let errorMessage = 'Failed to fetch data from SimpleFIN.';
            try {
                const errorData = await response.json();
                if (errorData?.errors) errorMessage = errorData.errors.join(', ');
            } catch {
                // ignore
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        const accounts = data.accounts as Array<any>;

        const insertAccount = db.prepare(
            'INSERT INTO accounts (id, name, currency, balance, balance_date) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET currency=excluded.currency, balance=excluded.balance, balance_date=excluded.balance_date'
        );

        const existsTransaction = db.prepare('SELECT 1 FROM transactions WHERE id = ? LIMIT 1');
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
                    const exists = existsTransaction.get(transaction.id);
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
                    if (!exists) {
                        newTransactionIds.push(String(transaction.id));
                    }
                }
            }
        })();

        const newTransactions = newTransactionIds.length;

        let updatedDuplicates: number | undefined;
        if (autoMarkDuplicates) {
            if (processAll) {
                const threeDaysInSeconds = 3 * 24 * 60 * 60;
                const updateSql = `
      WITH pairs AS (
        SELECT t1.id AS id1, t2.id AS id2
        FROM transactions t1
        JOIN transactions t2
          ON t1.id < t2.id
         AND t1.account_id != t2.account_id
         AND CAST(t1.amount AS REAL) = -CAST(t2.amount AS REAL)
         AND ABS(COALESCE(t1.transacted_at, t1.posted) - COALESCE(t2.transacted_at, t2.posted)) <= ${threeDaysInSeconds}
      )
      UPDATE transactions
         SET category = 'Internal Transfer'
       WHERE id IN (
         SELECT id1 FROM pairs
         UNION
         SELECT id2 FROM pairs
       );
    `;
                const result = db.prepare(updateSql).run();
                updatedDuplicates = result.changes || 0;
            } else if (newTransactionIds.length > 0) {
                updatedDuplicates = markInternalTransfersForTransactions(db, newTransactionIds);
            }
        }

        let classifierOutput: string | undefined;
        let categorizedCount: number | undefined;
        if (autoCategorize) {
            if (processAll) {
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
                try {
                    const match = classifierOutput.match(/(\d+)\s+transactions were auto-categorized/i);
                    if (match && match[1]) {
                        categorizedCount = parseInt(match[1], 10);
                    }
                } catch { }
            } else if (newTransactionIds.length > 0) {
                const result = await classifyTransactionsByIds(newTransactionIds);
                classifierOutput = result.output;
                categorizedCount = result.categorizedCount;
            }
        }

        revalidateTag('accounts');
        revalidateTag('transactions');

        return { message: 'Accounts and transactions fetched and saved successfully', classifierOutput, updatedDuplicates, newTransactions, categorizedCount };
    } catch (error: any) {
        console.error('Error in refreshRecent action:', error);
        throw error;
    } finally {
        db.close();
    }
}


