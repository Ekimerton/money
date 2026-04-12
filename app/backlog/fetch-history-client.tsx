"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FetchSession {
    fetched_at: number;
    date: string;
    total_balance: number;
    transactions: {
        id: string;
        amount: string;
        description: string;
        payee: string | null;
        transacted_at: number;
        category: string;
    }[];
}

export function FetchHistoryClient({ initialHistory }: { initialHistory: FetchSession[] }) {
    const history = initialHistory;

    if (history.length === 0) return null;


    return (
        <div className="w-full max-w-7xl mx-auto pb-4">
            <div className="p-4 space-y-0">
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {history.map((session) => {
                        const date = new Date(isNaN(Number(session.fetched_at)) ? session.fetched_at : Number(session.fetched_at) * 1000);
                        const dateLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

                        return (
                            <div key={session.fetched_at} className="first:pt-0 pt-4 last:border-b-0">
                                <div className="px-0 pb-1 pt-4 text-xs text-neutral-950 dark:text-neutral-50 font-semibold uppercase tracking-wider">
                                    {dateLabel}
                                </div>
                                <div className="grid gap-1 mb-4">
                                    <h1 className="text-4xl font-bold text-neutral-950 dark:text-neutral-50">
                                        {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(session.total_balance)}
                                    </h1>
                                </div>

                                <div className="space-y-4">
                                    {session.transactions.length > 0 ? (
                                        <div className="space-y-0 border rounded-xl overflow-hidden bg-white dark:bg-neutral-950">
                                            {session.transactions.map((tx) => (
                                                <div key={tx.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                                    <div className="flex flex-col min-w-0 pr-4">
                                                        <span className="text-sm font-semibold truncate text-neutral-900 dark:text-neutral-100">
                                                            {tx.payee || tx.description}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground truncate font-mono uppercase">
                                                            {tx.category} • {new Date(tx.transacted_at * 1000).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <span className={`text-sm font-mono font-bold ${Number(tx.amount) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {Intl.NumberFormat("en-US", {
                                                            style: "currency",
                                                            currency: "USD",
                                                            signDisplay: "always"
                                                        }).format(Number(tx.amount))}
                                                    </span>
                                                </div>
                                            ))}
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
