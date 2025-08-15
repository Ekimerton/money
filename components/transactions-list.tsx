"use client"

import * as React from "react"
import type { Account, Transaction } from "@/lib/types"
import type { TimeRangeValue } from "@/components/time-range-select"

interface TransactionsListProps {
    transactions: Transaction[]
    accounts: Account[]
    timeRange: TimeRangeValue
}

export function TransactionsList({ transactions, accounts, timeRange }: TransactionsListProps) {
    const filteredTransactions = React.useMemo(() => {
        const referenceDate = new Date();
        let daysToSubtract = 90;
        if (timeRange === "30d") daysToSubtract = 30;
        else if (timeRange === "7d") daysToSubtract = 7;
        else if (timeRange === "365d") daysToSubtract = 365;
        const startDate = new Date(referenceDate);
        startDate.setDate(startDate.getDate() - daysToSubtract);
        return transactions.filter(t => {
            if (t.hidden) return false;
            if (typeof t.transacted_at !== "number" || t.transacted_at === null) return true;
            const date = new Date(t.transacted_at * 1000);
            return date >= startDate;
        });
    }, [transactions, timeRange]);

    type Group = { key: string; label: string; sortKey: number; items: Transaction[] };

    const groups = React.useMemo<Group[]>(() => {
        const map = new Map<string, Group>();
        for (const t of filteredTransactions) {
            let key = "N/A";
            let sortKey = -Infinity;
            let label = "N/A";
            if (typeof t.transacted_at === "number" && t.transacted_at !== null) {
                const d = new Date(t.transacted_at * 1000);
                // Group by day (YYYY-MM-DD)
                key = d.toISOString().slice(0, 10);
                sortKey = new Date(key + "T00:00:00Z").getTime();
                label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            }
            if (!map.has(key)) {
                map.set(key, { key, label, sortKey, items: [] });
            }
            map.get(key)!.items.push(t);
        }
        const arr = Array.from(map.values());
        // Sort groups by date desc, with N/A last
        arr.sort((a, b) => (b.sortKey - a.sortKey));
        // Sort items within group by transacted_at desc
        for (const g of arr) {
            g.items.sort((a, b) => {
                const at = (typeof a.transacted_at === 'number' && a.transacted_at !== null) ? a.transacted_at : -Infinity;
                const bt = (typeof b.transacted_at === 'number' && b.transacted_at !== null) ? b.transacted_at : -Infinity;
                return bt - at;
            });
        }
        return arr;
    }, [filteredTransactions]);

    const getAccountFor = React.useCallback((accountId: string) => accounts.find(a => a.id === accountId), [accounts]);

    return (
        <div className="p-4">
            {groups.map(group => (
                <div key={group.key}>
                    <div className="px-0 pb-1 pt-4 text-xs text-muted-foreground font-semibold">{group.label}</div>
                    {group.items.map((t) => {
                        const account = getAccountFor(t.account_id);
                        const currency = account?.currency || 'USD';
                        const amountNumber = parseFloat(t.amount);
                        const categoryClass = t.category === "Uncategorized" ? "text-red-700" : "text-neutral-700";

                        return (
                            <div key={t.id} className="block border-b last:border-b-0 pt-1 pb-2 hover:bg-muted/60">
                                <div className="flex w-full items-center justify-between text-left font-medium">
                                    <div className="flex items-center space-x-1">
                                        <span className="truncate max-w-[60vw]">{t.payee} [{t.description}]</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <span>
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amountNumber)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-neutral-600">
                                    <div className="flex justify-between">
                                        <span className={`truncate max-w-[60vw] ${categoryClass}`}>{t.category}</span>
                                        <span className="truncate max-w-[40vw]">{ }</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    )
}


