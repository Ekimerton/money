"use client"

import * as React from "react"
import { CumulativeSpendLineChart } from "@/app/spending/cumulative-spend-line-chart"
import { TimeRangeSelect, type TimeRangeValue } from "@/components/time-range-select"
import { DesktopMonthSelect } from "@/components/desktop-month-select"
import { MobileMonthNavigator } from "@/components/mobile-month-navigator"
import { TransactionsList } from "@/app/transactions/transactions-list"
import type { Account, Transaction } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SpendingPageProps {
    transactions: Transaction[]
    accounts: Account[]
}

export default function SpendingPageClient({ transactions, accounts }: SpendingPageProps) {
    const [timeRange, setTimeRange] = React.useState<TimeRangeValue>("30d")
    const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1)
    })
    const [selectedCategory, setSelectedCategory] = React.useState<string>("")

    const monthStart = React.useMemo(() => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), [currentMonth])
    const monthEnd = React.useMemo(() => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999), [currentMonth])

    const filteredTransactions = React.useMemo(() => {
        return transactions
            .filter((transaction) => {
                const date = new Date(transaction.transacted_at * 1000)
                return date >= monthStart && date <= monthEnd
            })
            .filter(transaction => !transaction.hidden && transaction.category !== "Internal Transfer")
    }, [transactions, monthStart, monthEnd])

    const categories = React.useMemo(() => {
        const set = new Set<string>()
        for (const tx of filteredTransactions) {
            const amount = Number(tx.amount)
            if (!(amount < 0)) continue
            set.add(tx.category || "Uncategorized")
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b))
    }, [filteredTransactions])

    const listTransactions = React.useMemo(() => {
        if (!selectedCategory) return filteredTransactions
        return filteredTransactions.filter(t => (t.category || "Uncategorized") === selectedCategory)
    }, [filteredTransactions, selectedCategory])

    const totalSpending = React.useMemo(() => {
        let spend = 0;
        for (const transaction of filteredTransactions) {
            const amount = parseFloat(transaction.amount);
            if (amount < 0) spend += Math.abs(amount);
        }
        return spend;
    }, [filteredTransactions]);

    const previousSpending = React.useMemo(() => {
        const prevStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1)
        const prevEnd = new Date(monthStart.getFullYear(), monthStart.getMonth(), 0, 23, 59, 59, 999)

        const prevTx = transactions
            .filter((transaction) => {
                const date = new Date(transaction.transacted_at * 1000)
                return date >= prevStart && date <= prevEnd
            })
            .filter(transaction => !transaction.hidden && transaction.category !== "Internal Transfer")

        let spend = 0
        for (const transaction of prevTx) {
            const amount = parseFloat(transaction.amount)
            if (amount < 0) spend += Math.abs(amount)
        }
        return spend
    }, [transactions, monthStart])

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
                    <h1 className="text-2xl font-bold max-sm:text-4xl text-neutral-950 dark:text-neutral-50">
                        {formattedTotal}
                    </h1>
                    <h2 className={`text-base ml-2 font-medium font-mono sm:hidden ${changeTotal < 0 ? "text-green-700" : changeTotal > 0 ? "text-red-700" : "text-neutral-500"} `}>
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
                    <h1 className="text-2xl font-bold text-neutral-950 dark:text-neutral-50">
                        {formattedTotal}
                        <span className={`text-base ml-2 font-mono max-sm:hidden ${changeTotal < 0 ? "text-green-700" : changeTotal > 0 ? "text-red-700" : ""}`}>
                            {changeSign}
                            {formattedAbsChange}
                            {" "}
                            <span className={isInfinitePercent ? "text-neutral-500" : ""}>({formattedPercentChange})</span>
                        </span>
                    </h1>
                </div>
                <DesktopMonthSelect value={currentMonth} onValueChange={setCurrentMonth} monthsBack={6} />
            </div>
            <CumulativeSpendLineChart
                transactions={filteredTransactions}
            />
            <MobileMonthNavigator
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                maxMonth={new Date()}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
            />
            {/* Desktop-only category filter above the transactions list */}
            <div className="hidden sm:flex justify-end px-4 mt-2">
                <Select
                    value={selectedCategory && selectedCategory.trim() !== "" ? selectedCategory : "__ALL__"}
                    onValueChange={(value) => setSelectedCategory(value === "__ALL__" ? "" : value)}
                >
                    <SelectTrigger className="rounded-lg w-40">
                        <SelectValue>{selectedCategory || "All"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__ALL__">All</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <TransactionsList
                    transactions={listTransactions}
                    accounts={accounts}
                />
            </div>
        </div>
    )
}


