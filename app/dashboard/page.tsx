"use client";
import React, { useState, useEffect } from 'react';
import { IncomeExpenseSankeyChart } from '@/components/ui/sankey-chart';

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

export default function DashboardPage() {
    const [totalIncome, setTotalIncome] = useState<number>(0);
    const [totalExpenses, setTotalExpenses] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch transactions
                const transactionsResponse = await fetch('/api/get-transactions');
                if (!transactionsResponse.ok) {
                    throw new Error(`Error fetching transactions: ${transactionsResponse.status}`);
                }
                const transactionsData = await transactionsResponse.json();
                const fetchedTransactions: Transaction[] = transactionsData.transactions;
                setTransactions(fetchedTransactions);

                // Fetch accounts
                const accountsResponse = await fetch('/api/get-accounts');
                if (!accountsResponse.ok) {
                    throw new Error(`Error fetching accounts: ${accountsResponse.status}`);
                }
                const accountsData = await accountsResponse.json();
                setAccounts(accountsData.accounts);

                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                let income = 0;
                let expenses = 0;

                fetchedTransactions.forEach(transaction => {
                    const transactionDate = new Date(transaction.transacted_at * 1000);
                    if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                        if (Number(transaction.amount) > 0) {
                            income += Number(transaction.amount);
                        } else {
                            expenses += Number(transaction.amount);
                        }
                    }
                });

                setTotalIncome(income);
                setTotalExpenses(expenses);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">Error: {error}</div>;
    }

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Total Income: {totalIncome.toFixed(2)}</p>
            <p>Total Expenses: {totalExpenses.toFixed(2)}</p>
            <div className="mt-8 p-4">
                <IncomeExpenseSankeyChart transactions={transactions} accounts={accounts} />
            </div>
        </div>
    );
} 