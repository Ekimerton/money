"use client";
import React, { useState, useEffect } from 'react';

interface Transaction {
    id: string;
    account_id: string;
    amount: number;
    transacted_at: number;
    description: string;
    category: string;
}

export default function DashboardPage() {
    const [totalIncome, setTotalIncome] = useState<number>(0);
    const [totalExpenses, setTotalExpenses] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch('/api/get-transactions');
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }
                const data = await response.json();
                const transactions: Transaction[] = data.transactions;

                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                let income = 0;
                let expenses = 0;

                transactions.forEach(transaction => {
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

        fetchTransactions();
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
        </div>
    );
} 