"use client";

import { TransactionsList } from "@/app/transactions/transactions-list";
import type { Account, Transaction } from "@/lib/types";

interface FetchSession {
    fetched_at: string;
    date: string;
    total_balance: number;
    transactions: Transaction[];
}

export function FetchHistoryClient({ initialHistory, accounts }: { initialHistory: FetchSession[], accounts: Account[] }) {
    const history = initialHistory;

    if (history.length === 0) return null;


    return (
        <div className="w-full max-w-7xl mx-auto pb-4">
            <div className="p-4 space-y-0">
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {history.map((session) => {
                        const date = new Date(isNaN(Number(session.fetched_at)) ? session.fetched_at : Number(session.fetched_at) * 1000);
                        const dateLabel = date.toLocaleString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        });

                        return (
                            <div key={session.fetched_at} className="first:pt-0 pt-4 last:border-b-0">
                                <div className="px-0 pb-1 pt-4 text-xs text-neutral-950 dark:text-neutral-50 font-semibold uppercase tracking-wider">
                                    {dateLabel}
                                </div>
                                <div className="grid gap-1 mb-2">
                                    <h1 className="text-4xl font-bold text-neutral-950 dark:text-neutral-50">
                                        {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(session.total_balance)}
                                    </h1>
                                </div>

                                <div className="space-y-4">
                                    {session.transactions.length > 0 ? (
                                        <div className="-mx-4">
                                            <TransactionsList 
                                                transactions={session.transactions} 
                                                accounts={accounts} 
                                                showIncome={true}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic pl-1 mb-4">No individual transactions recorded for this sync pulse.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
