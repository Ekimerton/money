"use client"

import * as React from "react"
import { CumulativeSpendLineChart } from "@/app/spending/cumulative-spend-line-chart"
import { TimeRangeSelect, type TimeRangeValue } from "@/components/time-range-select"
import { MobileTimeRangeTabs } from "@/components/mobile-time-range-tabs"
import { TransactionsList } from "@/app/transactions/transactions-list"
import type { Account, Transaction } from "@/lib/types"

interface SpendingPageProps {
    transactions: Transaction[]
    accounts: Account[]
}

export default function SpendingPageClient({ transactions, accounts }: SpendingPageProps) {
    const [timeRange, setTimeRange] = React.useState<TimeRangeValue>("30d")

    const filteredTransactions = React.useMemo(() => {
        return transactions.filter((transaction) => {
            const date = new Date(transaction.transacted_at * 1000);
            const referenceDate = new Date();
            let daysToSubtract = 90;
            if (timeRange === "30d") {
                daysToSubtract = 30;
            } else if (timeRange === "7d") {
                daysToSubtract = 7;
            } else if (timeRange === "365d") {
                daysToSubtract = 365;
            }
            const startDate = new Date(referenceDate);
            startDate.setDate(startDate.getDate() - daysToSubtract);
            return date >= startDate;
        }).filter(transaction => !transaction.hidden && transaction.category !== "Internal Transfer");
    }, [transactions, timeRange]);

    const totalSpending = React.useMemo(() => {
        let spend = 0;
        for (const transaction of filteredTransactions) {
            const amount = parseFloat(transaction.amount);
            if (amount < 0) spend += Math.abs(amount);
        }
        return spend;
    }, [filteredTransactions]);

    const previousSpending = React.useMemo(() => {
        const referenceDate = new Date();
        let daysToSubtract = 90;
        if (timeRange === "30d") {
            daysToSubtract = 30;
        } else if (timeRange === "7d") {
            daysToSubtract = 7;
        } else if (timeRange === "365d") {
            daysToSubtract = 365;
        }
        const currentStartDate = new Date(referenceDate);
        currentStartDate.setDate(currentStartDate.getDate() - daysToSubtract);
        const previousStartDate = new Date(currentStartDate);
        previousStartDate.setDate(previousStartDate.getDate() - daysToSubtract);

        const prevTx = transactions
            .filter((transaction) => {
                const date = new Date(transaction.transacted_at * 1000);
                return date >= previousStartDate && date < currentStartDate;
            })
            .filter(transaction => !transaction.hidden && transaction.category !== "Internal Transfer");

        let spend = 0;
        for (const transaction of prevTx) {
            const amount = parseFloat(transaction.amount);
            if (amount < 0) spend += Math.abs(amount);
        }
        return spend;
    }, [transactions, timeRange]);

    const previousTotal = previousSpending;
    const changeTotal = totalSpending - previousTotal;
    const isInfinitePercent = previousTotal === 0;
    const percentChangeRounded = isInfinitePercent ? 0 : Math.round((changeTotal / previousTotal) * 100);
    const changeSign = changeTotal > 0 ? "+" : changeTotal < 0 ? "-" : "";
    const formattedAbsChange = Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(changeTotal));
    const formattedPercentChange = isInfinitePercent ? "---" : `${changeSign}${Math.abs(percentChangeRounded)}%`;
    const formattedTotal = React.useMemo(() => {
        return Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalSpending);
    }, [totalSpending]);

    return (
        <div className="w-full">
            <div className="p-4 flex max-sm:pt-12 sm:hidden">
                <div className="grid flex-1 gap-1 max-sm:text-center ">
                    <h2 className="font-bold text-muted-foreground uppercase text-sm font-mono max-sm:hidden">
                        Net Spend
                    </h2>
                    <h1 className="text-2xl font-bold max-sm:text-4xl">
                        {formattedTotal}
                    </h1>
                    <h2 className={`text-base ml-2 font-medium font-mono sm:hidden ${changeTotal < 0 ? "text-green-700" : changeTotal > 0 ? "text-red-700" : ""}`}>
                        {changeSign}
                        {formattedAbsChange}
                        {" "}
                        <span className={isInfinitePercent ? "text-neutral-500" : ""}>({formattedPercentChange})</span>
                    </h2>
                </div>
            </div>
            <div className="flex gap-2 space-y-0 p-4 sm:flex-row max-sm:p-2 max-sm:hidden">
                <div className="grid flex-1 gap-1">
                    <h2 className="font-bold text-muted-foreground uppercase text-sm font-mono">
                        Net Spend
                    </h2>
                    <h1 className="text-2xl font-bold">
                        {formattedTotal}
                        <span className={`text-base ml-2 font-mono max-sm:hidden ${changeTotal < 0 ? "text-green-700" : changeTotal > 0 ? "text-red-700" : ""}`}>
                            {changeSign}
                            {formattedAbsChange}
                            {" "}
                            <span className={isInfinitePercent ? "text-neutral-500" : ""}>({formattedPercentChange})</span>
                        </span>
                    </h1>
                </div>
                <TimeRangeSelect value={timeRange} onValueChange={setTimeRange} />
            </div>
            <CumulativeSpendLineChart
                transactions={filteredTransactions}
            />
            <MobileTimeRangeTabs value={timeRange} onValueChange={setTimeRange} />
            <div>
                <TransactionsList
                    transactions={transactions}
                    accounts={accounts}
                    timeRange={timeRange}
                />
            </div>
        </div>
    )
}


