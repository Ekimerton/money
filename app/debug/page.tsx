'use client';

import { useState } from "react";

interface Account {
  id: string;
  name: string;
  currency: string;
  balance: string;
  "balance-date": number;
}

interface Transaction {
  id: string;
  account_id: string;
  posted: number;
  amount: string;
  description: string;
  payee: string | null;
  transacted_at: number | null;
  pending: boolean;
  hidden: boolean;
}

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refreshDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      // Trigger the refresh endpoint to fetch and save data to DB
      const refreshResponse = await fetch('/api/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json();
        throw new Error(errorData.error || 'Failed to refresh data from SimpleFIN.');
      }
      alert('Data refreshed and saved to database!');

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDataFromDb = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load accounts from the database
      const accountsResponse = await fetch('/api/get-accounts');
      if (!accountsResponse.ok) {
        const errorData = await accountsResponse.json();
        throw new Error(errorData.error || 'Failed to load accounts from database.');
      }
      const accountsData = await accountsResponse.json();
      setAccounts(accountsData.accounts);

      // Load transactions from the database
      const transactionsResponse = await fetch('/api/get-transactions');
      if (!transactionsResponse.ok) {
        const errorData = await transactionsResponse.json();
        throw new Error(errorData.error || 'Failed to load transactions from database.');
      }
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData.transactions);

      alert('Data loaded from database!');

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <button
            onClick={refreshDatabase}
            disabled={loading}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            {loading ? "Refreshing Database..." : "Refresh Database"}
          </button>
          <button
            onClick={loadDataFromDb}
            disabled={loading}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            {loading ? "Loading Data from DB..." : "Fetch Data from DB"}
          </button>
          {error && <p className="text-red-500">Error: {error}</p>}
          {accounts.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Accounts:</h2>
              <ul>
                {accounts.map((account: any) => (
                  <li key={account.id} className="mb-2">
                    {account.name} (Balance: {' '
                    }{new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: account.currency || 'USD',
                    }).format(parseFloat(account.balance))})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {transactions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Transactions:</h2>
              <ul>
                {transactions.map((transaction) => (
                  <li key={transaction.id} className="mb-2">
                    {new Date(transaction.posted * 1000).toLocaleDateString()}: {transaction.description} - {
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: accounts.find(acc => acc.id === transaction.account_id)?.currency || 'USD',
                      }).format(parseFloat(transaction.amount))} {transaction.pending ? '(Pending)' : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 