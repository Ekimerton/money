'use client';

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryPopover } from "@/components/ui/category-popover";
import { AccountNamePopover } from "@/components/ui/account-name-popover";
import { useRouter } from "next/navigation";

interface Account {
    id: string;
    name: string;
    currency: string;
    balance: string;
    "balance-date": number;
    type: string;
    balanceHistory?: { date: string; balance: number }[];
}

interface AccountsTableClientProps {
    initialAccounts: Account[];
}

export function AccountsTableClient({ initialAccounts }: AccountsTableClientProps) {
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
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
            // Optionally, handle error state in UI
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
            // Optionally, handle error state in UI
        }
    };

    return (
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
    );
}