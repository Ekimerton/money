"use client"

import * as React from "react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Account, Transaction } from "@/lib/types";
import { SpendPieChart } from "@/app/transactions/spend-pie-chart";
import { IncomePieChart } from "@/app/transactions/income-pie-chart";

interface SpendingAnalysisChartProps {
    transactions: Transaction[];
    accounts: Account[];
}

export function SpendingAnalysisChart({ transactions, accounts }: SpendingAnalysisChartProps) {
    const [timeRange, setTimeRange] = React.useState("30d");
    const [chartView, setChartView] = React.useState<"spend" | "income" | "cashFlow">("spend");

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
        <Card className="pt-0 gap-0 border-none shadow-none">
            <CardHeader className="flex gap-2 space-y-0 py-5 sm:flex-row max-sm:px-3">
                <div className="grid flex-1 gap-1">
                    <CardDescription className="font-bold text-muted-foreground uppercase text-sm font-mono">
                        Spending Analysis
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold">
                        {formattedTotal}
                    </CardTitle>
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
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger
                        className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                        aria-label="Select a value"
                    >
                        <SelectValue placeholder="Last 3 months" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="7d" className="rounded-lg">
                            Last 7 days
                        </SelectItem>
                        <SelectItem value="30d" className="rounded-lg">
                            Last 30 days
                        </SelectItem>
                        <SelectItem value="90d" className="rounded-lg">
                            Last 3 months
                        </SelectItem>
                        <SelectItem value="365d" className="rounded-lg">
                            Last 12 months
                        </SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 max-w-screen">
                {chartView === "spend" && <SpendPieChart transactions={filteredTransactions} />}
                {chartView === "income" && <IncomePieChart transactions={filteredTransactions} accounts={accounts} />}
                {chartView === "cashFlow" && null}
            </CardContent>
        </Card>
    )
}
