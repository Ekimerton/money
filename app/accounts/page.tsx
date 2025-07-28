'use client';

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryPopover } from "@/components/ui/category-popover";
import { AccountNamePopover } from "@/components/ui/account-name-popover";
import { useRouter } from "next/navigation";
import { AccountBalanceChart } from "./account-balance-chart";

interface Account {
    id: string;
    name: string;
    currency: string;
    balance: string;
    "balance-date": number;
    type: string;
    balanceHistory?: { date: string; balance: number }[]; // Re-add balanceHistory to the interface
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const updateAccountType = async (accountId: string, newType: string) => {
        try {
            const response = await fetch('/api/update-account-type', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accountId, newType }),
            });

            if (!response.ok) {
                throw new Error(`Error updating account type: ${response.statusText}`);
            }

            const updatedAccount = await response.json();
            setAccounts(prevAccounts =>
                prevAccounts.map(a =>
                    a.id === accountId ? { ...a, type: updatedAccount.type } : a
                )
            );
        } catch (err: any) {
            console.error("Failed to update account type:", err);
            setError(err.message);
        }
    };

    const updateAccountName = async (accountId: string, newName: string) => {
        try {
            const response = await fetch('/api/update-account-name', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accountId, newName }),
            });

            if (!response.ok) {
                throw new Error(`Error updating account name: ${response.statusText}`);
            }

            const updatedAccount = await response.json();
            setAccounts(prevAccounts =>
                prevAccounts.map(a =>
                    a.id === accountId ? { ...a, name: updatedAccount.name } : a
                )
            );
        } catch (err: any) {
            console.error("Failed to update account name:", err);
            setError(err.message);
        }
    };

    useEffect(() => {
        const loadAccounts = async () => {
            try {
                // Request 365 days of data for the chart
                const accountsResponse = await fetch('/api/get-accounts?days=365');
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

        loadAccounts();
    }, []);

    if (loading) {
        return <div className="p-8">Loading accounts...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="w-full ">
            <div className="p-4">
                { /* <div className="sm:w-1/2 pb-2">
                    <StackedAccountsChart accounts={accounts} />
                </div> */}

                <AccountBalanceChart accounts={accounts} />
                <Table className="mt-4">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Account Name</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Account Type</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {accounts.map((account) => (
                            <TableRow key={account.id}>
                                <TableCell>
                                    <AccountNamePopover
                                        defaultValue={account.name}
                                        onSubmit={(newName) => updateAccountName(account.id, newName)}
                                    />
                                </TableCell>
                                <TableCell onClick={() => router.push(`/transactions?account=${account.id}`)} className="cursor-pointer hover:underline">
                                    {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: account.currency || 'USD',
                                    }).format(parseFloat(account.balance))}
                                </TableCell>
                                <TableCell>
                                    <CategoryPopover
                                        defaultValue={account.type}
                                        suggestions={['Checking', 'Savings', 'Credit Card', 'Investments']}
                                        onSubmit={(newType) => updateAccountType(account.id, newType)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
} 