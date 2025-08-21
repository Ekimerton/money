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
import { TransactionsList } from "@/app/transactions/transactions-list"
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
        }).filter(transaction => !transaction.hidden && transaction.category !== "Internal Transfer");
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

    const { previousSpending, previousIncome, previousCashFlow } = React.useMemo(() => {
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
        let income = 0;
        let flow = 0;
        for (const transaction of prevTx) {
            const amount = parseFloat(transaction.amount);
            if (amount < 0) spend += Math.abs(amount);
            else if (amount > 0) income += amount;
            flow += amount;
        }
        return { previousSpending: spend, previousIncome: income, previousCashFlow: flow };
    }, [transactions, timeRange]);

    const currentTotal = React.useMemo(() => {
        return chartView === "spend" ? totalSpending : chartView === "income" ? totalIncome : totalCashFlow;
    }, [chartView, totalSpending, totalIncome, totalCashFlow]);

    const previousTotal = React.useMemo(() => {
        return chartView === "spend" ? previousSpending : chartView === "income" ? previousIncome : previousCashFlow;
    }, [chartView, previousSpending, previousIncome, previousCashFlow]);

    const changeTotal = currentTotal - previousTotal;
    const isInfinitePercent = previousTotal === 0;
    const percentChangeRounded = isInfinitePercent ? 0 : Math.round((changeTotal / previousTotal) * 100);
    const changeSign = changeTotal > 0 ? "+" : changeTotal < 0 ? "-" : "";
    const formattedAbsChange = Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(changeTotal));
    const formattedPercentChange = isInfinitePercent ? "---" : `${changeSign}${Math.abs(percentChangeRounded)}%`;

    const formattedTotal = React.useMemo(() => {
        const value = chartView === "spend" ? totalSpending : chartView === "income" ? totalIncome : totalCashFlow;
        return Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
    }, [chartView, totalSpending, totalIncome, totalCashFlow]);

    return (
        <div className="w-full">
            <div className="p-4 flex max-sm:pt-12 sm:hidden">
                <div className="grid flex-1 gap-1 max-sm:text-center ">
                    <h2 className="font-bold text-muted-foreground uppercase text-sm font-mono max-sm:hidden">
                        Net {chartView === "spend" ? "Spend" : chartView === "income" ? "Income" : "Cash Flow"}
                    </h2>
                    <h1 className="text-2xl font-bold max-sm:text-4xl">
                        {formattedTotal}
                    </h1>
                    <h2 className={`text-base ml-2 font-medium font-mono sm:hidden ${changeTotal < 0 ? "text-green-700" : changeTotal < 0 ? "text-red-700" : ""}`}>
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
                        Net {chartView === "spend" ? "Spend" : chartView === "income" ? "Income" : "Cash Flow"}
                    </h2>
                    <h1 className="text-2xl font-bold">
                        {formattedTotal}
                        <span className={`text-base ml-2 font-mono max-sm:hidden ${changeTotal < 0 ? "text-green-700" : changeTotal < 0 ? "text-red-700" : ""}`}>
                            {changeSign}
                            {formattedAbsChange}
                            {" "}
                            <span className={isInfinitePercent ? "text-neutral-500" : ""}>({formattedPercentChange})</span>
                        </span>
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


