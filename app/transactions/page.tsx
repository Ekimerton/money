'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { CategoryPopover } from "@/components/ui/category-popover";
import { useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { toast } from "sonner";

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
    category: string;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [existingCategories, setExistingCategories] = useState<string[]>([]);
    const searchParams = useSearchParams();

    const updateTransactionCategory = async (transactionId: string, newCategory: string) => {
        try {
            const response = await fetch('/api/update-transaction-category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transactionId, newCategory }),
            });

            if (!response.ok) {
                throw new Error(`Error updating category: ${response.statusText}`);
            }

            const updatedTransaction = await response.json();
            setTransactions(prevTransactions => {
                const updatedTransactions = prevTransactions.map(t =>
                    t.id === transactionId ? { ...t, category: updatedTransaction.category } : t
                );

                const originalTransaction = prevTransactions.find(t => t.id === transactionId);
                if (originalTransaction?.payee) {
                    const transactionsByPayee = updatedTransactions.filter(t => t.payee === originalTransaction.payee);
                    if (transactionsByPayee.length > 3) {
                        toast(`Would you like to categorize all transactions from ${originalTransaction.payee} as ${newCategory}?`, {
                            id: `bulk-category-prompt-${originalTransaction.payee}-${newCategory}`,
                            action: {
                                label: "Yes",
                                onClick: async () => {
                                    try {
                                        const bulkUpdateResponse = await fetch('/api/update-transactions-by-payee', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({ payee: originalTransaction.payee, newCategory }),
                                        });

                                        if (!bulkUpdateResponse.ok) {
                                            throw new Error(`Error bulk updating categories: ${bulkUpdateResponse.statusText}`);
                                        }

                                        setTransactions(prev =>
                                            prev.map(t =>
                                                t.payee === originalTransaction.payee ? { ...t, category: newCategory } : t
                                            )
                                        );
                                        toast.success(`Updated ${transactionsByPayee.length} transactions from ${originalTransaction.payee} to ${newCategory}.`);
                                    } catch (bulkErr: any) {
                                        console.error("Failed to bulk update categories:", bulkErr);
                                        setError(bulkErr.message);
                                        toast.error("Failed to update transactions.");
                                    }
                                },
                            },
                        });
                    }
                }
                return updatedTransactions;
            });
        } catch (err: any) {
            console.error("Failed to update category:", err);
            setError(err.message);
            toast.error("Failed to update category: " + err.message);
        }
    };

    useEffect(() => {
        const loadTransactions = async () => {
            try {
                const accountId = searchParams.get('account');
                const transactionsUrl = accountId ? `/api/get-transactions?accountId=${accountId}` : '/api/get-transactions';
                const transactionsResponse = await fetch(transactionsUrl);
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

                const categoriesResponse = await fetch('/api/get-categories');
                if (!categoriesResponse.ok) {
                    throw new Error(`Error fetching categories: ${categoriesResponse.status}`);
                }
                const categoriesData = await categoriesResponse.json();
                setExistingCategories(categoriesData.categories);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadTransactions();
    }, [searchParams]);

    if (loading) {
        return <div className="p-8">Loading transactions...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">Error: {error}</div>;
    }

    const columns: ColumnDef<Transaction>[] = [
        {
            accessorKey: "transacted_at",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        className="-ml-3"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Date
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const transactedAt = row.original.transacted_at;
                if (typeof transactedAt !== 'number' || transactedAt === null) {
                    return <span className="text-muted-foreground italic">N/A</span>;
                }
                const date = new Date(transactedAt * 1000);
                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            },
        },
        {
            accessorKey: "description",
            header: "Description",
        },
        {
            accessorKey: "payee",
            header: "Payee",
        },
        {
            accessorKey: "amount",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        className="-ml-3"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Amount
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const account = accounts.find(acc => acc.id === row.original.account_id);
                const currency = account?.currency || 'USD';
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                }).format(parseFloat(row.original.amount));
            },
        },
        {
            accessorKey: "category",
            header: "Category",
            cell: ({ row }) => (
                <CategoryPopover
                    defaultValue={row.original.category}
                    suggestions={[...new Set([...existingCategories, 'Groceries', 'Rent', 'Salary', 'Transport', 'Utilities', 'Dining'])]}
                    onSubmit={(newCategory) => updateTransactionCategory(row.original.id, newCategory)}
                />
            ),
        },
        {
            accessorKey: "account_id",
            header: "Account",
            cell: ({ row }) => {
                const account = accounts.find(acc => acc.id === row.original.account_id);
                return account?.name;
            },
        },
    ];

    return (
        <div className="w-full">
            <div className="p-2">
                <DataTable columns={columns} data={transactions} />
            </div>
        </div>
    );
} 