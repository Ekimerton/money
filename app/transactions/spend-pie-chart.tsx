"use client"

// NOTE: Original pie chart implementation is kept below but commented out.
// Replaced with a stacked daily spend-by-category area chart similar to accounts chart.

import * as React from "react";
import { Bar, BarChart } from "recharts";
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Transaction } from "@/lib/types";

type AggregateBy = "day" | "week";

interface SpendChartProps {
    transactions: Transaction[];
    total: number; // kept for compatibility, not used in stacked chart
    aggregateBy?: AggregateBy;
}

const COLORS = [
    "oklch(62% 0.15 155)", // green
    "oklch(62% 0.15 240)", // blue
    "oklch(62% 0.13 300)", // purple
    "oklch(62% 0.14 200)", // teal
    "oklch(62% 0.14 260)", // indigo
    "oklch(62% 0.14 20)",  // orange
    "oklch(62% 0.14 340)", // pink
    "oklch(62% 0.14 120)", // yellow-green
];

export function SpendPieChart({ transactions, aggregateBy = "day" }: SpendChartProps) {
    // Build a date -> category -> amount map for negative amounts (spend)
    const { chartData, categories, totalsByDate } = React.useMemo(() => {
        const dateCategoryToAmount: Record<string, Record<string, number>> = {};
        const totals: Record<string, number> = {};
        const categoryTotals: Record<string, number> = {};

        for (const tx of transactions) {
            const amount = Number(tx.amount);
            if (!(amount < 0)) continue;
            const d = new Date(tx.transacted_at * 1000);
            // normalize to grouping key
            let keyDate: string;
            if (aggregateBy === "week") {
                const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
                const day = tmp.getUTCDay();
                const diffToMonday = (day === 0 ? -6 : 1) - day; // Monday as start of week
                tmp.setUTCDate(tmp.getUTCDate() + diffToMonday);
                keyDate = tmp.toISOString().split("T")[0];
            } else {
                keyDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().split("T")[0];
            }
            const category = tx.category || "Uncategorized";
            const abs = Math.abs(amount);

            if (!dateCategoryToAmount[keyDate]) dateCategoryToAmount[keyDate] = {};
            dateCategoryToAmount[keyDate][category] = (dateCategoryToAmount[keyDate][category] || 0) + abs;
            totals[keyDate] = (totals[keyDate] || 0) + abs;
            categoryTotals[category] = (categoryTotals[category] || 0) + abs;
        }

        const allDates = Object.keys(dateCategoryToAmount).sort(
            (a, b) => new Date(a).getTime() - new Date(b).getTime()
        );
        const categoriesSorted = Object.keys(categoryTotals).sort(
            (a, b) => categoryTotals[b] - categoryTotals[a]
        );

        const rows = allDates.map((date) => {
            const row: Record<string, any> = { date, total: totals[date] || 0 };
            for (const cat of categoriesSorted) {
                row[cat] = dateCategoryToAmount[date]?.[cat] || 0;
            }
            return row;
        });

        return { chartData: rows, categories: categoriesSorted, totalsByDate: totals };
    }, [transactions, aggregateBy]);

    const chartConfig: ChartConfig = React.useMemo(() => {
        const dynamic: ChartConfig = {} as ChartConfig;
        categories.forEach((cat, index) => {
            dynamic[cat] = {
                label: cat,
                color: COLORS[index % COLORS.length],
            } as any;
        });
        return dynamic;
    }, [categories]);

    const tooltipFormatter = React.useCallback(((value: any, name: any, item: any, _index: number, p: any) => {
        const indicatorColor = item?.payload?.fill || item?.color;
        const key = String(name);
        const labelText = (chartConfig as any)[key]?.label ?? key;
        const sum = Object.keys(chartConfig).reduce((acc, k) => acc + (p?.[k] ?? 0), 0);
        const numericValue = Number(value);
        const percent = sum > 0 ? (numericValue / sum) : 0;

        return (
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)"
                        style={{ backgroundColor: indicatorColor, borderColor: indicatorColor }}
                    />
                    <span className="text-neutral-500 dark:text-neutral-400">
                        {labelText} ({Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 }).format(percent)})
                    </span>
                </div>
                <div className="flex items-center gap-2 ml-8">
                    <span className="text-neutral-950 font-mono font-medium tabular-nums dark:text-neutral-50">
                        {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(numericValue)}
                    </span>
                </div>
            </div>
        );
    }) as any, [chartConfig]);

    return (
        <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
        >
            <BarChart data={chartData}>
                <ChartTooltip
                    cursor={false}
                    content={
                        <ChartTooltipContent
                            labelFormatter={(_, payload) => {
                                if (!payload || payload.length === 0) return "";
                                const dateValue = payload[0].payload.date;
                                const total = payload[0].payload.total as number;
                                return (
                                    <div className="flex justify-between w-full pb-2">
                                        <p>
                                            {aggregateBy === "week"
                                                ? (() => {
                                                    const start = new Date(dateValue + "T00:00:00Z");
                                                    const end = new Date(start);
                                                    end.setUTCDate(start.getUTCDate() + 6);
                                                    const fmt = (dt: Date) => dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                                    return `${fmt(start)} - ${fmt(end)}`;
                                                })()
                                                : new Date(dateValue + "T00:00:00").toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                        </p>
                                        <p className="font-mono">
                                            {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total)}
                                        </p>
                                    </div>
                                );
                            }}
                            indicator="dot"
                            formatter={tooltipFormatter}
                        />
                    }
                />
                {categories.map((cat) => (
                    <Bar
                        key={cat}
                        dataKey={cat}
                        fill={(chartConfig as any)[cat]?.color}
                        stackId={1}
                    />
                ))}
                <ChartLegend content={<ChartLegendContent />} className="max-sm:hidden" />
            </BarChart>
        </ChartContainer>
    );
}

/*
// Original pie chart implementation (commented out)
import { Pie, PieChart, Cell, Tooltip, Label } from "recharts";
const baseChartConfig = {
    amount: {
        label: "Amount",
    },
} satisfies ChartConfig;
export function SpendPieChart_PIE({ transactions, total }: { transactions: Transaction[]; total: number }) {
    const spendingByCategory = transactions
        .filter((transaction) => parseFloat(transaction.amount) < 0)
        .reduce((acc, transaction) => {
            const category = transaction.category || "Uncategorized";
            acc[category] = (acc[category] || 0) + Math.abs(parseFloat(transaction.amount));
            return acc;
        }, {} as Record<string, number>);
    const chartData = Object.entries(spendingByCategory).map(([name, amount]) => ({ name, amount }));
    const chartConfig: ChartConfig = React.useMemo(() => {
        const dynamicLabels = Object.fromEntries(chartData.map((d) => [d.name, { label: d.name }])) as ChartConfig;
        return { ...baseChartConfig, ...dynamicLabels };
    }, [chartData]);
    return (
        <ChartContainer config={chartConfig} className="mx-auto h-[280px] w-[400px]">
            <PieChart>
                <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                <Pie data={chartData} dataKey="amount" nameKey="name" innerRadius={90} outerRadius={130} strokeWidth={2} labelLine={false}>
                    <Label content={() => null} />
                    {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <ChartLegend layout="vertical" verticalAlign="middle" align="right" content={<ChartLegendContent nameKey="name" className="flex-col items-start gap-2 absolute top-1/2 bottom-1/2 max-sm:hidden" />} />
            </PieChart>
        </ChartContainer>
    );
}
*/