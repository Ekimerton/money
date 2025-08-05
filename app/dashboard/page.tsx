"use client";
import React, { useState, useEffect } from 'react';
import { IncomeExpenseSankeyChart } from '@/components/ui/sankey-chart';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

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
    const [monthlySavings, setMonthlySavings] = useState<number>(0); // Initialize state for monthlySavings
    const [savingsRate, setSavingsRate] = useState<number>(0); // Initialize state for savingsRate

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Get current month and year
                const now = new Date();
                const currentMonth = now.getMonth(); // 0-indexed
                const currentYear = now.getFullYear();

                // Fetch transactions for the current month
                const transactionsResponse = await fetch(`/api/get-transactions?month=${currentMonth}&year=${currentYear}`);
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

                let income = 0;
                let expenses = 0;

                fetchedTransactions.forEach(transaction => {
                    if (Number(transaction.amount) > 0) {
                        income += Number(transaction.amount);
                    } else {
                        expenses += Number(transaction.amount);
                    }
                });

                setTotalIncome(income);
                setTotalExpenses(expenses);

                // Calculate monthly savings and savings rate after income and expenses are set
                const calculatedSavings = income + expenses;
                setMonthlySavings(calculatedSavings);

                if (income > 0) {
                    setSavingsRate((calculatedSavings / income) * 100);
                } else {
                    setSavingsRate(0);
                }

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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-4 pb-0 w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalIncome.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalExpenses.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{monthlySavings.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{savingsRate.toFixed(2)}%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="p-4">
                <IncomeExpenseSankeyChart transactions={transactions} accounts={accounts} />
            </div>
        </div>
    );
} 