'use client';

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    category: string; // Add category field
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTransactions = async () => {
            try {
                const transactionsResponse = await fetch('/api/get-transactions');
                if (!transactionsResponse.ok) {
                    throw new Error(`Error: ${transactionsResponse.status}`);
                }
                const transactionsData = await transactionsResponse.json();
                setTransactions(transactionsData.transactions);

                const accountsResponse = await fetch('/api/get-accounts');
                if (!accountsResponse.ok) {
                    throw new Error(`Error: ${accountsResponse.status}`);
                }
                const accountsData = await accountsResponse.json();
                setAccounts(accountsData.accounts);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadTransactions();
    }, []);

    if (loading) {
        return <div className="p-8">Loading transactions...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="w-full bg-neutral-950">
            <div className="p-2">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Payee</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Account</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction) => {
                            const account = accounts.find(acc => acc.id === transaction.account_id);
                            const currency = account?.currency || 'USD';
                            return (
                                <TableRow key={transaction.id}>
                                    <TableCell>{new Date(transaction.posted * 1000).toLocaleDateString()}</TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell>{transaction.payee}</TableCell>
                                    <TableCell>
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: currency,
                                        }).format(parseFloat(transaction.amount))}
                                    </TableCell>
                                    <TableCell>{transaction.category}</TableCell>
                                    <TableCell>{account?.name}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
} 