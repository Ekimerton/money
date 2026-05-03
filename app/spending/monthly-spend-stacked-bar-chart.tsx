"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Transaction } from "@/lib/types"



function monthKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function firstOfMonthISOFromKey(key: string): string {
    return `${key}-01`
}

function last12MonthKeys(): string[] {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const keys: string[] = []
    for (let i = 11; i >= 0; i--) {
        const d = new Date(start.getFullYear(), start.getMonth() - i, 1)
        keys.push(monthKey(d))
    }
    return keys
}

export function MonthlySpendStackedBarChart({ transactions }: { transactions: Transaction[] }) {
    const { chartData, categories, chartConfig } = React.useMemo(() => {
        const byMonthByCategory: Record<string, Record<string, number>> = {}
        const categoryTotals: Record<string, number> = {}
        const seenIds = new Set<string>()

        const monthKeys = new Set<string>(last12MonthKeys())

        for (const tx of transactions) {
            if (!tx.id || seenIds.has(tx.id)) continue
            seenIds.add(tx.id)

            if (tx.hidden) continue

            const rawCategory = tx.category || "Uncategorized"
            if (rawCategory.trim().toLowerCase() === "internal transfer") continue

            const amount = parseFloat(String(tx.amount || "0").replace(/[^0-9.-]/g, ""))
            if (isNaN(amount) || !(amount < 0)) continue

            const d = new Date(tx.transacted_at * 1000)
            const key = monthKey(new Date(d.getFullYear(), d.getMonth(), 1))
            if (!monthKeys.has(key)) continue

            const category = rawCategory.trim()
            const abs = Math.abs(amount)
            if (!byMonthByCategory[key]) byMonthByCategory[key] = {}
            byMonthByCategory[key][category] = (byMonthByCategory[key][category] || 0) + abs
            categoryTotals[category] = (categoryTotals[category] || 0) + abs
        }

        const keysOrdered = last12MonthKeys()
        const allCategories = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a])

        const rows = keysOrdered.map((k) => {
            const row: Record<string, any> = { date: firstOfMonthISOFromKey(k) }
            const catMap = byMonthByCategory[k] || {}
            for (const cat of allCategories) {
                row[cat] = catMap[cat] || 0
            }
            return row
        })

        const cfg: ChartConfig = {} as ChartConfig
        const palette = [
            "oklch(45% 0.14 155)", // Dark Green
            "oklch(45% 0.15 240)", // Dark Blue
            "oklch(45% 0.13 300)", // Dark Purple
            "oklch(65% 0.14 155)", // Green
            "oklch(65% 0.15 240)", // Blue
            "oklch(65% 0.13 300)", // Purple
            "oklch(85% 0.08 155)", // Light Green
            "oklch(85% 0.08 240)", // Light Blue
            "oklch(85% 0.08 300)", // Light Purple
        ]
        allCategories.forEach((cat, idx) => {
            const color = palette[idx % palette.length]
            ;(cfg as any)[cat] = { label: cat, color }
        })

        return { chartData: rows, categories: allCategories, chartConfig: cfg }
    }, [transactions])

    const tooltipFormatter = React.useCallback(((value: any, name: any, item: any, _index: number, p: any) => {
        const indicatorColor = item?.color
        const key = String(name)
        const labelText = (chartConfig as any)[key]?.label ?? key
        const numericValue = Number(value)
        const sum = Array.isArray(categories) && p
            ? categories.reduce((acc, cat) => acc + (Number(p?.[cat]) || 0), 0)
            : 0
        const percent = sum > 0 ? numericValue / sum : 0
        return (
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: indicatorColor }}
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
        )
    }) as any, [chartConfig, categories])

    return (
        <div className="">
            <ChartContainer config={chartConfig} className="aspect-auto h-[300px] max-sm:h-[160px] w-full">
                <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                        interval={0}
                        tickFormatter={(value) => {
                            const date = new Date(value + "T00:00:00")
                            return date.toLocaleDateString("en-US", {
                                month: "short",
                            })
                        }}
                        className="text-[10px] font-mono text-neutral-500 fill-neutral-500"
                    />
                    <ChartTooltip
                        cursor={{ fill: "var(--color-neutral-100)", opacity: 0.1 }}
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, payload) => {
                                    if (!payload || payload.length === 0) return ""
                                    const row = payload[0].payload as any
                                    const dateValue = row.date as string
                                    const total = Array.isArray(categories)
                                        ? categories.reduce((acc, cat) => acc + (Number(row?.[cat]) || 0), 0)
                                        : 0
                                    return (
                                        <div className="flex justify-between w-full pb-2 text-neutral-950 dark:text-neutral-50">
                                            <p>
                                                {new Date(dateValue + "T00:00:00").toLocaleDateString("en-US", {
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </p>
                                            <p className="font-mono">
                                                {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total)}
                                            </p>
                                        </div>
                                    )
                                }}
                                indicator="dot"
                                formatter={tooltipFormatter}
                            />
                        }
                    />
                    {categories.map((cat, idx) => (
                        <Bar
                            key={cat}
                            dataKey={cat}
                            stackId="a"
                            fill={(chartConfig as any)[cat]?.color}
                            radius={idx === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        />
                    ))}
                    <ChartLegend content={<ChartLegendContent />} className="max-sm:hidden text-neutral-950 dark:text-neutral-50" />
                </BarChart>
            </ChartContainer>
        </div>
    )

}
