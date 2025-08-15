"use client"

import * as React from "react"
import { SpendingAnalysisChart } from "@/app/transactions/spending-analysis-chart"
import { TimeRangeSelect, type TimeRangeValue } from "@/components/time-range-select"
import { MobileTimeRangeTabs } from "@/components/mobile-time-range-tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
// import { TransactionsTableClient } from "@/components/transactions-table-client"
import { TransactionsList } from "@/components/transactions-list"
import type { Account, Transaction } from "@/lib/types"

interface TransactionsPageClientProps {
    transactions: Transaction[]
    accounts: Account[]
    categories: string[]
}

export default function TransactionsPageClient({ transactions, accounts, categories }: TransactionsPageClientProps) {
    const [timeRange, setTimeRange] = React.useState<TimeRangeValue>("30d")
    const [chartView, setChartView] = React.useState<"spend" | "income" | "cashFlow">("spend")

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
        }).filter(transaction => !transaction.hidden);
    }, [transactions, timeRange]);

    const { totalSpending, totalIncome, totalCashFlow } = React.useMemo(() => {
        let spend = 0;
        let income = 0;
        let flow = 0;
        for (const transaction of filteredTransactions) {
            const amount = parseFloat(transaction.amount);
            if (amount < 0) spend += Math.abs(amount);
            else if (amount > 0) income += amount;
            flow += amount;
        }
        return { totalSpending: spend, totalIncome: income, totalCashFlow: flow };
    }, [filteredTransactions]);

    const formattedTotal = React.useMemo(() => {
        const value = chartView === "spend" ? totalSpending : chartView === "income" ? totalIncome : totalCashFlow;
        return Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
    }, [chartView, totalSpending, totalIncome, totalCashFlow]);

    return (
        <div className="w-full">
            <div className="flex gap-2 space-y-0 p-4 sm:flex-row max-sm:p-2 max-sm:hidden">
                <div className="grid flex-1 gap-1">
                    <h2 className="font-bold text-muted-foreground uppercase text-sm font-mono">
                        Net {chartView === "spend" ? "Spend" : chartView === "income" ? "Income" : "Cash Flow"}
                    </h2>
                    <h1 className="text-2xl font-bold">
                        {formattedTotal}
                    </h1>
                </div>
                <Select value={chartView} onValueChange={(value: "spend" | "income" | "cashFlow") => setChartView(value)}>
                    <SelectTrigger
                        className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                        aria-label="Select a view type"
                    >
                        <SelectValue placeholder="Select View" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="spend" className="rounded-lg">
                            By Spend
                        </SelectItem>
                        <SelectItem value="income" className="rounded-lg">
                            By Income
                        </SelectItem>
                        <SelectItem value="cashFlow" className="rounded-lg">
                            Cash Flow
                        </SelectItem>
                    </SelectContent>
                </Select>
                <TimeRangeSelect value={timeRange} onValueChange={setTimeRange} />
            </div>
            <SpendingAnalysisChart
                transactions={transactions}
                accounts={accounts}
                timeRange={timeRange}
                chartView={chartView}
            />
            <MobileTimeRangeTabs value={timeRange} onValueChange={setTimeRange} />
            <div>
                {/* <TransactionsTableClient
                    initialTransactions={transactions}
                    initialAccounts={accounts}
                    initialCategories={categories}
                    timeRange={timeRange}
                /> */}
                <TransactionsList
                    transactions={transactions}
                    accounts={accounts}
                    timeRange={timeRange}
                />
            </div>
        </div>
    )
}


