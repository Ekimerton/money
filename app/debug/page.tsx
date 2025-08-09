'use client';

import { useState, useEffect } from "react";

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
  const [simplefinUrl, setSimplefinUrl] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [classifierTrainingDate, setClassifierTrainingDate] = useState<string | null>(null);

  const initializeDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/initialize-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize database.');
      }
      alert('Database initialized successfully!');
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshRecentDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      const refreshResponse = await fetch('/api/refresh-recent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json();
        throw new Error(errorData.error || 'Failed to refresh recent data from SimpleFIN.');
      }
      alert('Recent data refreshed and saved to database!');

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const saveSimplefinUrl = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/save-simplefin-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ SETUP_TOKEN: simplefinUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save SimpleFIN URL.');
      }
      alert('SimpleFIN URL saved successfully!');
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/train-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to train model.');
      }
      alert('Model training initiated and date updated!');
      // Refresh user config to get updated classifier_training_date
      fetchUserConfig();
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUserConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/delete-user-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user_config table.');
      }
      alert('user_config table deleted.');
      // Clear local state since config is gone
      setSimplefinUrl('');
      setUserName('');
      setClassifierTrainingDate(null);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveUserName = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/save-user-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save user name.');
      }
      alert('User name saved successfully!');
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserConfig = async () => {
    try {
      const response = await fetch('/api/get-user-config');
      if (!response.ok) {
        throw new Error('Failed to fetch user configuration.');
      }
      const data = await response.json();
      if (data.userConfig) {
        setSimplefinUrl(data.userConfig.simplefin_url || '');
        setClassifierTrainingDate(data.userConfig.classifier_training_date || null);
        setUserName(data.userConfig.display_name || '');
      }
    } catch (err) {
      console.error('Error fetching user config:', err);
    }
  };

  useEffect(() => {
    fetchUserConfig();
  }, []);

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
            onClick={initializeDatabase}
            disabled={loading}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            {loading ? "Initializing Database..." : "Initialize Database"}
          </button>
          <button
            onClick={refreshRecentDatabase}
            disabled={loading}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            {loading ? "Refreshing Recent..." : "Refresh Recent"}
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
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">To-do:</h2>
          <ul>
            <li>Dashboard</li>
            <li>Cron to fetch new data</li>
            <li>Cron to train classifier model</li>
            <li>Onboarding flow for configuring</li>
            <li>Smarter table filtering, pagination, etc.</li>
          </ul>
        </div>
        <div className="mt-8 text-center sm:text-left">
          <p className="text-gray-700 dark:text-gray-300 mb-2">SimpleFIN is how I pull your financial data. Works great, costs 1.5 dollars per month. Sign up here and get an application token <a href="https://beta-bridge.simplefin.org/" target="_blank" rel="noopener noreferrer">https://beta-bridge.simplefin.org/</a></p>
        </div>
        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <input
            type="text"
            placeholder="Enter SimpleFIN Token"
            value={simplefinUrl}
            onChange={(e) => setSimplefinUrl(e.target.value)}
            className="w-full sm:w-80 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={saveSimplefinUrl}
            disabled={loading}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            {loading ? "Saving URL..." : "Save SimpleFIN Token"}
          </button>
        </div>
        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <input
            type="text"
            placeholder="Enter User Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full sm:w-80 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={saveUserName}
            disabled={loading}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            {loading ? "Saving User Name..." : "Save User Name"}
          </button>
        </div>
        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <button
            onClick={trainModel}
            disabled={loading}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            {loading ? "Training Model..." : "Train Classifier Model"}
          </button>
          <button
            onClick={deleteUserConfig}
            disabled={loading}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-red-600 text-white gap-2 hover:bg-red-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            {loading ? "Deleting user_config..." : "Delete user_config table"}
          </button>
        </div>
        {classifierTrainingDate && (
          <div className="mt-4 text-center sm:text-left">
            <p className="text-gray-700 dark:text-gray-300">Last Classifier Model Training: {new Date(classifierTrainingDate).toLocaleString()}</p>
          </div>
        )}
      </main>
    </div>
  );
} 