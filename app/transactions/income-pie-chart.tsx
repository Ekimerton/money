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
    "oklch(62% 0.15 155)",
    "oklch(62% 0.15 240)",
    "oklch(62% 0.13 300)",
    "oklch(62% 0.14 200)",
    "oklch(62% 0.14 260)",
    "oklch(62% 0.14 20)",
    "oklch(62% 0.14 340)",
    "oklch(62% 0.14 120)",
];

const baseChartConfig = {
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

    const chartConfig: ChartConfig = React.useMemo(() => {
        const dynamicLabels = Object.fromEntries(
            chartData.map((d) => [d.name, { label: d.name }])
        ) as ChartConfig;
        return { ...baseChartConfig, ...dynamicLabels };
    }, [chartData]);

    return (
        <ChartContainer
            config={chartConfig}
            className="mx-auto h-[280px] w-[520px]"
        >
            <PieChart margin={{ right: 140 }}>
                <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                <Pie
                    data={chartData}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={80}
                    outerRadius={120}
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
                <ChartLegend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    content={<ChartLegendContent nameKey="name" className="flex-col items-start gap-2" />}
                />
            </PieChart>
        </ChartContainer>
    )
}
