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
    // Similar tone to other charts (moderate chroma, consistent lightness)
    "oklch(62% 0.15 155)", // green
    "oklch(62% 0.15 240)", // blue
    "oklch(62% 0.13 300)", // purple
    "oklch(62% 0.14 200)", // teal
    "oklch(62% 0.14 260)", // indigo
    "oklch(62% 0.14 20)",  // orange
    "oklch(62% 0.14 340)", // pink
    "oklch(62% 0.14 120)", // yellow-green
];

// Will be extended dynamically with category labels so the legend shows names
const baseChartConfig = {
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

    const chartConfig: ChartConfig = React.useMemo(() => {
        const dynamicLabels = Object.fromEntries(
            chartData.map((d) => [d.name, { label: d.name }])
        ) as ChartConfig;
        return { ...baseChartConfig, ...dynamicLabels };
    }, [chartData]);

    return (
        <ChartContainer
            config={chartConfig}
            className="mx-auto h-[280px] w-[400px]"
        >
            <PieChart>
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
                    content={<ChartLegendContent nameKey="name" className="flex-col items-start gap-2 max-sm:hidden" />}
                />
            </PieChart>
        </ChartContainer>
    )
}
