"use client"

import { Pie, PieChart, Cell, Tooltip } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltipContent,
} from "@/components/ui/chart"
import * as React from "react";
import { Account, Transaction } from "@/lib/types";

const COLORS = [
    "oklch(28.2% 0.091 267.935)",
    "oklch(37.9% 0.146 265.522)",
    "oklch(42.4% 0.199 265.638)",
    "oklch(48.8% 0.243 264.376)",
    "oklch(54.6% 0.245 262.881)",
];

const chartConfig = {
    amount: {
        label: "Amount",
    },
} satisfies ChartConfig;

export function IncomePieChart({ transactions, accounts }: { transactions: Transaction[], accounts: Account[] }) {
    const accountMap = new Map(accounts.map(account => [account.id, account.name]));

    const incomeByAccount = transactions
        .filter((transaction) => parseFloat(transaction.amount) > 0)
        .reduce((acc, transaction) => {
            const accountName = accountMap.get(transaction.account_id) || "Unknown Account";
            acc[accountName] = (acc[accountName] || 0) + parseFloat(transaction.amount);
            return acc;
        }, {} as Record<string, number>);

    const chartData = Object.entries(incomeByAccount).map(([name, amount]) => ({
        name,
        amount,
    }));

    console.log("Income Chart Data (by Account):"), chartData;

    return (
        <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px]"
        >
            <PieChart>
                <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                <Pie
                    data={chartData}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={80}
                    strokeWidth={2}
                    labelLine={false}
                >
                    {chartData.map((_entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" payload={chartData.map((item) => ({ value: item.name, payload: item }))} />} />
            </PieChart>
        </ChartContainer>
    )
}
