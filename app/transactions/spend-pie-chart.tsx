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
import { Transaction } from "@/lib/types";

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

export function SpendPieChart({ transactions }: { transactions: Transaction[] }) {
    const spendingByCategory = transactions
        .filter((transaction) => parseFloat(transaction.amount) < 0)
        .reduce((acc, transaction) => {
            const category = transaction.category || "Uncategorized";
            acc[category] = (acc[category] || 0) + Math.abs(parseFloat(transaction.amount));
            return acc;
        }, {} as Record<string, number>);

    const chartData = Object.entries(spendingByCategory).map(([name, amount]) => ({
        name,
        amount,
    }));

    console.log("Chart Data:", chartData);

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
            </PieChart>
        </ChartContainer>
    )
}
