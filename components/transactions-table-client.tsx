"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { CategoryPopover } from "@/components/ui/category-popover";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import type { TimeRangeValue } from "@/components/time-range-select";

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

interface TransactionsTableClientProps {
    initialTransactions: Transaction[];
    initialAccounts: Account[];
    initialCategories: string[];
    timeRange: TimeRangeValue;
}

export function TransactionsTableClient({
    initialTransactions,
    initialAccounts,
    initialCategories,
    timeRange,
}: TransactionsTableClientProps) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
    const [existingCategories, setExistingCategories] = useState<string[]>(initialCategories);

    const router = useRouter();

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
                                        router.refresh(); // Revalidate data
                                    } catch (bulkErr: any) {
                                        console.error("Failed to bulk update categories:", bulkErr);
                                        toast.error("Failed to update transactions.");
                                    }
                                },
                            },
                        });
                    }
                }
                router.refresh(); // Revalidate data
                return updatedTransactions;
            });
        } catch (err: any) {
            console.error("Failed to update category:", err);
            toast.error("Failed to update category: " + err.message);
        }
    };

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
            cell: ({ row }) => {
                const description: string = row.getValue("description");
                const truncatedDescription = description.length > 50
                    ? `${description.substring(0, 47)}...`
                    : description;
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger className="text-left">
                                <span className="block max-w-[200px] truncate">
                                    {truncatedDescription}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{description}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            },
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

    const filteredTransactions = useMemo(() => {
        let daysToSubtract = 90;
        if (timeRange === "30d") daysToSubtract = 30;
        else if (timeRange === "7d") daysToSubtract = 7;
        else if (timeRange === "365d") daysToSubtract = 365;

        const now = new Date();
        const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const startUTC = new Date(utcMidnight);
        startUTC.setUTCDate(startUTC.getUTCDate() - daysToSubtract);
        const startDateStr = startUTC.toISOString().split("T")[0];

        return transactions.filter(t => {
            if (typeof t.transacted_at !== "number" || t.transacted_at === null) return true;
            const dateStr = new Date(t.transacted_at * 1000).toISOString().split("T")[0];
            return dateStr >= startDateStr;
        });
    }, [transactions, timeRange]);

    return (
        <div className="w-full">
            <div className="p-2">
                <DataTable columns={columns} data={filteredTransactions} />
            </div>
        </div>
    );
}