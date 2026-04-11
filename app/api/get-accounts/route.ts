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
    const uniqueDates = new Set<string>();

    for (const account of accounts) {
      let histories: { fetched_at: number; balance: string }[] = [];
      try {
        // TODO: [CLEANUP] Consider moving this fetching logic to a shared repository pattern.
        histories = db.prepare(`
          SELECT balance, fetched_at 
          FROM account_history 
          WHERE account_id = ? 
          ORDER BY fetched_at ASC
        `).all(account.id) as { fetched_at: number; balance: string }[];
      } catch (e: any) {
        console.error(`Error fetching history for account ${account.id}:`, e);
        histories = [];
      }

      const historyByDate: Record<string, { balance: number; fetchedAt: number }> = {};

      // Seed with the current balance from the accounts table
      const seedDate = Number(account.balance_date);
      if (seedDate && !isNaN(seedDate)) {
        try {
          const accountDateObj = new Date(seedDate * 1000);
          if (!isNaN(accountDateObj.getTime())) {
            const accountDateStr = accountDateObj.toISOString().split('T')[0];
            historyByDate[accountDateStr] = { 
              balance: Number(account.balance), 
              fetchedAt: seedDate 
            };
          }
        } catch (e) {
          console.warn(`Failed to parse seed date for account ${account.id}:`, account.balance_date);
        }
      }

      // Merge snapshots from account_history
      for (const h of histories) {
        const fetchedAt = Number(h.fetched_at);
        if (isNaN(fetchedAt)) continue;
        
        try {
          const dateObj = new Date(fetchedAt * 1000);
          if (isNaN(dateObj.getTime())) continue;
          
          const dateString = dateObj.toISOString().split('T')[0];
          const val = Number(h.balance);

          // If we don't have an entry for this date yet, or if this entry is newer (larger fetchedAt), use it
          if (historyByDate[dateString] === undefined || fetchedAt >= historyByDate[dateString].fetchedAt) {
            historyByDate[dateString] = { balance: val, fetchedAt: fetchedAt };
          }
        } catch (e) {
          continue;
        }
      }

      // Convert back to simple balance mapping for the rest of the logic
      const finalHistoryByDate: Record<string, number> = {};
      for (const [date, entry] of Object.entries(historyByDate)) {
          finalHistoryByDate[date] = entry.balance;
      }

      allHistoriesByAccount[account.id] = finalHistoryByDate;

      for (const dateStr of Object.keys(finalHistoryByDate)) {
        uniqueDates.add(dateStr);
      }
    }

    const sortedDates = Array.from(uniqueDates).sort();
    if (sortedDates.length === 0) {
      return new Response(JSON.stringify({ accounts }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const firstDateStr = sortedDates[0];
    const lastDateStr = sortedDates[sortedDates.length - 1];
    
    const earliestMs = new Date(firstDateStr + 'T00:00:00Z').getTime();
    const latestMs = new Date(lastDateStr + 'T00:00:00Z').getTime();

    const now = new Date();
    const earliestLimitObj = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days + 1));
    const startDateTime = Math.max(earliestMs, earliestLimitObj.getTime());
    
    const datesToProcess: string[] = [];
    const currentObj = new Date(startDateTime);
    while (currentObj.getTime() <= latestMs) {
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