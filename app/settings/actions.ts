"use server"

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { revalidateTag } from "next/cache";
import { getSettings, updateSettings } from "@/lib/settings";

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
    await updateSettings({ autoCategorize });
    revalidateTag('settings');
}

export async function setAutoMarkInternalTransfers(enabled: boolean): Promise<void> {
    await updateSettings({ autoMarkDuplicates: enabled });
    revalidateTag('settings');
}

export async function setAutoRefreshDaily(enabled: boolean): Promise<void> {
    await updateSettings({ autoRefreshDaily: enabled });
    revalidateTag('settings');
}

export async function refreshRecent(): Promise<{ message: string; classifierOutput?: string; updatedDuplicates?: number; newTransactions?: number; categorizedCount?: number; newTransactionSamples?: Array<{ id: string; title: string; category: string }>; }> {
    const db = new Database(dbPath);
    try {
        const userConfig = db.prepare(
            'SELECT simplefin_url FROM user_config WHERE id = 1'
        ).get() as { simplefin_url?: string } | undefined;

        const settings = await getSettings();

        if (!userConfig || !userConfig.simplefin_url) {
            throw new Error('SimpleFIN URL not found in database. Please initialize it first.');
        }

        const ACCESS_URL = userConfig.simplefin_url;
        const autoCategorize = !!settings.autoCategorize;
        const autoMarkDuplicates = !!settings.autoMarkDuplicates;

        const urlParts = ACCESS_URL.split('@');
        const authString = urlParts[0].replace('https://', '');
        const baseUrl = urlParts[1];
        const [username, password] = authString.split(':');

        const startDate = (() => {
            const latestTransactionRow = db.prepare('SELECT MAX(posted) as latest_posted FROM transactions').get() as { latest_posted?: number };
            if (latestTransactionRow && latestTransactionRow.latest_posted) {
                return latestTransactionRow.latest_posted - (24 * 60 * 60);
            }
            return Math.floor(new Date('2025-01-01').getTime() / 1000);
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
            // No pruning for recent refresh
        })();

        const newTransactions = newTransactionIds.length;

        let updatedDuplicates: number | undefined;
        if (autoMarkDuplicates && newTransactionIds.length > 0) {
            updatedDuplicates = markInternalTransfersForTransactions(db, newTransactionIds);
        }

        let classifierOutput: string | undefined;
        let categorizedCount: number | undefined;
        if (autoCategorize && newTransactionIds.length > 0) {
            const result = await classifyTransactionsByIds(newTransactionIds);
            classifierOutput = result.output;
            categorizedCount = result.categorizedCount;
        }

        // Prepare up to five sample transactions to surface in the UI with their final categories
        let newTransactionSamples: Array<{ id: string; title: string; category: string }> | undefined;
        if (newTransactionIds.length > 0) {
            const sampleIds = newTransactionIds.slice(0, 5);
            const placeholders = sampleIds.map(() => '?').join(',');
            try {
                const rows = db.prepare(
                    `SELECT id, COALESCE(NULLIF(payee, ''), description) AS title, COALESCE(category, 'Uncategorized') AS category
                     FROM transactions
                     WHERE id IN (${placeholders})`
                ).all(...sampleIds) as Array<{ id: string; title: string | null; category: string | null }>;
                newTransactionSamples = rows.map((r) => ({
                    id: String(r.id),
                    title: r.title || 'Transaction',
                    category: r.category || 'Uncategorized',
                }));
            } catch {
                // ignore sample collection failures
            }
        }

        revalidateTag('accounts');
        revalidateTag('transactions');

        return { message: 'Accounts and transactions fetched and saved successfully', classifierOutput, updatedDuplicates, newTransactions, categorizedCount, newTransactionSamples };
    } catch (error: any) {
        console.error('Error in refreshRecent action:', error);
        throw error;
    } finally {
        db.close();
    }
}

export async function refreshAll(): Promise<{ message: string; classifierOutput?: string; updatedDuplicates?: number; newTransactions?: number; categorizedCount?: number; }> {
    const db = new Database(dbPath);
    try {
        const userConfig = db.prepare(
            'SELECT simplefin_url FROM user_config WHERE id = 1'
        ).get() as { simplefin_url?: string } | undefined;

        const settings = await getSettings();

        if (!userConfig || !userConfig.simplefin_url) {
            throw new Error('SimpleFIN URL not found in database. Please initialize it first.');
        }

        const ACCESS_URL = userConfig.simplefin_url;
        const autoCategorize = !!settings.autoCategorize;
        const autoMarkDuplicates = !!settings.autoMarkDuplicates;

        const urlParts = ACCESS_URL.split('@');
        const authString = urlParts[0].replace('https://', '');
        const baseUrl = urlParts[1];
        const [username, password] = authString.split(':');
        const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

        const earliestStartDate = Math.floor(new Date('2000-01-01').getTime() / 1000);
        const now = Math.floor(Date.now() / 1000);

        const windowDays = 60; // two months
        const windowSeconds = windowDays * 24 * 60 * 60;

        const fetchedAccountIds = new Set<string>();
        const newTransactionIds = new Set<string>();

        const insertAccount = db.prepare(
            'INSERT INTO accounts (id, name, currency, balance, balance_date) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET currency=excluded.currency, balance=excluded.balance, balance_date=excluded.balance_date'
        );
        const existsTransaction = db.prepare('SELECT 1 FROM transactions WHERE id = ? LIMIT 1');
        const insertTransaction = db.prepare(
            'INSERT INTO transactions (id, account_id, posted, amount, description, payee, transacted_at, pending, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET account_id=excluded.account_id, posted=excluded.posted, amount=excluded.amount, description=excluded.description, payee=excluded.payee, transacted_at=excluded.transacted_at, pending=excluded.pending, hidden=excluded.hidden'
        );

        let windowEnd = now;
        let consecutiveEmptyWindows = 0;
        let sawAnyTransactions = false;
        while (windowEnd > earliestStartDate) {
            const windowStart = Math.max(earliestStartDate, windowEnd - windowSeconds);

            const response = await fetch(`https://${baseUrl}/accounts?pending=1&start-date=${windowStart}&end-date=${windowEnd}`, {
                headers: { Authorization: `Basic ${authHeader}` },
            });
            if (!response.ok) {
                let errorMessage = 'Failed to fetch data from SimpleFIN.';
                try {
                    const errorData = await response.json();
                    if (errorData?.errors) errorMessage = errorData.errors.join(', ');
                } catch { }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const accounts = (data.accounts as Array<any>) || [];
            const transactionsCountInWindow = accounts.reduce((sum: number, a: any) => {
                const txs = Array.isArray(a.transactions) ? a.transactions : [];
                return sum + txs.length;
            }, 0);

            db.transaction(() => {
                for (const account of accounts) {
                    fetchedAccountIds.add(String(account.id));
                    insertAccount.run(
                        account.id,
                        account.name,
                        account.currency,
                        account.balance,
                        account['balance-date']
                    );

                    const transactions = Array.isArray(account.transactions) ? account.transactions : [];
                    for (const transaction of transactions) {
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
                        if (!exists) newTransactionIds.add(String(transaction.id));
                    }
                }
            })();

            if (transactionsCountInWindow === 0) {
                consecutiveEmptyWindows += 1;
                if (sawAnyTransactions && consecutiveEmptyWindows >= 2) {
                    break;
                }
            } else {
                sawAnyTransactions = true;
                consecutiveEmptyWindows = 0;
            }

            windowEnd = windowStart - 1; // avoid overlap
        }

        // Prune only missing accounts and their transactions
        db.transaction(() => {
            db.prepare('CREATE TEMP TABLE IF NOT EXISTS temp_fetched_accounts (id TEXT PRIMARY KEY)').run();
            db.prepare('DELETE FROM temp_fetched_accounts').run();
            const insertTempAccount = db.prepare('INSERT OR IGNORE INTO temp_fetched_accounts (id) VALUES (?)');
            for (const id of fetchedAccountIds) insertTempAccount.run(id);

            db.prepare('DELETE FROM transactions WHERE account_id NOT IN (SELECT id FROM temp_fetched_accounts)').run();
            db.prepare('DELETE FROM accounts WHERE id NOT IN (SELECT id FROM temp_fetched_accounts)').run();

            db.prepare('DROP TABLE IF EXISTS temp_fetched_accounts').run();
        })();

        // Mark internal transfers across entire dataset if enabled
        let updatedDuplicates: number | undefined;
        if (autoMarkDuplicates) {
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
        }

        // Auto-categorize whole dataset if enabled
        let classifierOutput: string | undefined;
        let categorizedCount: number | undefined;
        if (autoCategorize) {
            const dataDir = path.join(process.cwd(), 'data');
            const scriptPath = path.join(dataDir, 'classify_transaction.py');
            classifierOutput = await new Promise<string>((resolve) => {
                const proc = spawn(pythonExecutablePath, [scriptPath, String(earliestStartDate)], { cwd: dataDir });
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
        }

        revalidateTag('accounts');
        revalidateTag('transactions');

        return { message: 'Full refresh completed successfully', updatedDuplicates, newTransactions: newTransactionIds.size, classifierOutput, categorizedCount };
    } catch (error: any) {
        console.error('Error in refreshAll action:', error);
        throw error;
    } finally {
        db.close();
    }
}

export async function getUncategorizedCount(): Promise<number> {
    const db = new Database(dbPath);
    try {
        const row = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE category = 'Uncategorized' AND hidden = 0").get() as any;
        return Number(row?.count ?? 0);
    } finally {
        db.close();
    }
}

export async function getTop3PredictionsForTransaction(tx: { payee: string | null; description: string | null; amount: string | number; account_id: string; }): Promise<Array<{ category: string; confidence: number }>> {
    const dataDir = path.join(process.cwd(), 'data');
    const scriptPath = path.join(dataDir, 'classify_transaction.py');
    const payee = (tx.payee ?? '').toString();
    const description = (tx.description ?? '').toString();
    const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : (tx.amount ?? 0);
    const accountId = tx.account_id;

    const output = await new Promise<string>((resolve, reject) => {
        const args = [scriptPath, '--topk', payee, description, String(amount), accountId];
        const proc = spawn(pythonExecutablePath, args, { cwd: dataDir });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (d) => (stdout += d.toString()));
        proc.stderr.on('data', (d) => (stderr += d.toString()));
        proc.on('close', (_code) => resolve((stdout + '\n' + stderr).trim()));
        proc.on('error', (err) => reject(err));
    });

    // Extract first JSON object from mixed output
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed && Array.isArray(parsed.predictions)) return parsed.predictions;
        } catch { }
    }
    return [];
}
export async function migrateSettingsToJson(): Promise<{ message: string }> {
    const db = new Database(dbPath);
    const jsonPath = path.join(process.cwd(), './data/user-settings.json');
    
    try {
        const userConfig = db.prepare(
            'SELECT display_name, simplefin_url, classifier_training_date, auto_categorize, auto_mark_duplicates, onboarding_completed, auto_refresh_daily FROM user_config WHERE id = 1'
        ).get() as any;

        if (!userConfig) {
            throw new Error('No settings found in database to migrate.');
        }

        let currentSettings: any = {};
        if (fs.existsSync(jsonPath)) {
            const fileContent = fs.readFileSync(jsonPath, 'utf-8');
            try {
                currentSettings = JSON.parse(fileContent);
            } catch (e) {
                console.error('Error parsing existing settings JSON:', e);
            }
        }

        const updatedSettings = {
            ...currentSettings,
            displayName: userConfig.display_name,
            simplefinUrl: userConfig.simplefin_url,
            classifierTrainingDate: userConfig.classifier_training_date,
            autoCategorize: Boolean(userConfig.auto_categorize),
            autoMarkDuplicates: Boolean(userConfig.auto_mark_duplicates),
            onboardingCompleted: Boolean(userConfig.onboarding_completed),
            autoRefreshDaily: Boolean(userConfig.auto_refresh_daily),
        };

        fs.writeFileSync(jsonPath, JSON.stringify(updatedSettings, null, 4), 'utf-8');

        return { message: 'Settings successfully copied to user-settings.json' };
    } catch (error: any) {
        console.error('Error migrating settings:', error);
        throw error;
    } finally {
        db.close();
    }
}
