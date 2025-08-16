"use client"

import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Account, Transaction } from "@/lib/types";
import { SpendPieChart } from "@/app/transactions/spend-pie-chart";
import { IncomePieChart } from "@/app/transactions/income-pie-chart";

interface SpendingAnalysisChartProps {
    transactions: Transaction[];
    accounts: Account[];
    timeRange: "7d" | "30d" | "90d" | "365d";
    chartView: "spend" | "income" | "cashFlow";
}

export function SpendingAnalysisChart({ transactions, accounts, timeRange, chartView }: SpendingAnalysisChartProps) {

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
        }).filter(transaction => transaction.category !== "Internal Transfer")
            ;
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

    return (
        <div className="max-sm:pt-9 max-sm:pb-2">
            {chartView === "spend" && <SpendPieChart transactions={filteredTransactions} total={totalSpending} />}
            {chartView === "income" && <IncomePieChart transactions={filteredTransactions} accounts={accounts} />}
            {chartView === "cashFlow" && null}
        </div>
    )
}
