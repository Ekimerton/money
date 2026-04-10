import Database from 'better-sqlite3';
import path from 'path';

interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  transacted_at: number;
  description: string;
  category: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  balance_date: number;
}

const dbPath = path.join(process.cwd(), './data/user_data.db');
const db = new Database(dbPath);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');

    const accounts = db.prepare('SELECT * FROM accounts').all() as Account[];

    const allHistoriesByAccount: Record<string, Record<string, number>> = {};
    let globalEarliestMs = Infinity;
    let globalLatestMs = -Infinity;

    for (const account of accounts) {
      let histories: { fetched_at: number; balance: string }[] = [];
      try {
        histories = db.prepare(`
          SELECT fetched_at, balance 
          FROM account_history 
          WHERE account_id = ? 
          ORDER BY fetched_at ASC
        `).all(account.id) as { fetched_at: number; balance: string }[];
      } catch (e: any) {
        histories = [];
      }

      const historyByDate: Record<string, number> = {};

      if (account.balance_date) {
        const accountDateObj = new Date(Number(account.balance_date) * 1000);
        const accountDateStr = accountDateObj.toISOString().split('T')[0];
        historyByDate[accountDateStr] = Number(account.balance);
      }

      for (const h of histories) {
        const dateObj = new Date(Number(h.fetched_at) * 1000);
        const dateString = dateObj.toISOString().split('T')[0];
        const val = Number(h.balance);
        if (historyByDate[dateString] === undefined || val > historyByDate[dateString]) {
          historyByDate[dateString] = val;
        }
      }

      allHistoriesByAccount[account.id] = historyByDate;

      for (const dateStr of Object.keys(historyByDate)) {
        const t = new Date(dateStr + 'T00:00:00Z').getTime();
        if (t < globalEarliestMs) globalEarliestMs = t;
        if (t > globalLatestMs) globalLatestMs = t;
      }
    }

    if (globalEarliestMs === Infinity) {
      return new Response(JSON.stringify({ accounts }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const earliestLimitObj = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days + 1));
    const startDateTime = Math.max(globalEarliestMs, earliestLimitObj.getTime());
    
    const datesToProcess: string[] = [];
    const currentObj = new Date(startDateTime);
    while (currentObj.getTime() <= globalLatestMs) {
       datesToProcess.push(currentObj.toISOString().split('T')[0]);
       currentObj.setUTCDate(currentObj.getUTCDate() + 1);
    }

    for (const account of accounts) {
      const historyByDate = allHistoriesByAccount[account.id];
      const balanceHistory: { date: string; balance: number }[] = [];
      const allKnownDates = Object.keys(historyByDate).sort();

      let lastKnownBalance: number | null = null;
      let firstKnownBalance: number | null = null;
      
      const startDateStr = datesToProcess[0];
      if (allKnownDates.length > 0) {
        firstKnownBalance = historyByDate[allKnownDates[0]];
        for (let i = allKnownDates.length - 1; i >= 0; i--) {
           if (allKnownDates[i] <= startDateStr) {
               lastKnownBalance = historyByDate[allKnownDates[i]];
               break;
           }
        }
      }

      for (const dateString of datesToProcess) {
        if (historyByDate[dateString] !== undefined) {
          lastKnownBalance = historyByDate[dateString];
        }

        balanceHistory.push({
          date: dateString,
          balance: lastKnownBalance !== null ? parseFloat(lastKnownBalance.toFixed(2)) : 0
        });
      }

      // Pass 2: Fill early gaps where lastKnownBalance was null because the account wasn't seen yet
      const fallbackBalance = firstKnownBalance !== null ? firstKnownBalance : Number(account.balance);
      for (let j = 0; j < balanceHistory.length; j++) {
         if (balanceHistory[j].balance === 0 && historyByDate[balanceHistory[j].date] === undefined) {
             balanceHistory[j].balance = parseFloat(fallbackBalance.toFixed(2));
         }
      }

      (account as any).balanceHistory = balanceHistory;
    }

    return new Response(JSON.stringify({ accounts }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching accounts and calculating historical balances:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 