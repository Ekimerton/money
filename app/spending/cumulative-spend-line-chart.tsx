"use client"

import * as React from "react"
import { Area, AreaChart } from "recharts"

import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Transaction } from "@/lib/types"

const COLORS = [
    "oklch(62% 0.15 155)", // green
    "oklch(62% 0.15 240)", // blue
    "oklch(62% 0.13 300)", // purple
    "oklch(62% 0.14 200)", // teal
    "oklch(62% 0.14 260)", // indigo
    "oklch(62% 0.14 20)",  // orange
    "oklch(62% 0.14 340)", // pink
    "oklch(62% 0.14 120)", // yellow-green
]

function formatISODateUTC(d: Date): string {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
        .toISOString()
        .split("T")[0]
}

function enumerateDatesInclusive(startISO: string, endISO: string): string[] {
    const dates: string[] = []
    const start = new Date(startISO + "T00:00:00Z")
    const end = new Date(endISO + "T00:00:00Z")
    const cur = new Date(start)
    while (cur <= end) {
        dates.push(formatISODateUTC(cur))
        cur.setUTCDate(cur.getUTCDate() + 1)
    }
    return dates
}

export function CumulativeSpendLineChart({ transactions }: { transactions: Transaction[] }) {
    const { chartData, categories, chartConfig } = React.useMemo(() => {
        const dailyByCategory: Record<string, Record<string, number>> = {}
        const categoryTotals: Record<string, number> = {}

        let minISO: string | null = null
        let maxISO: string | null = null

        for (const tx of transactions) {
            const amount = Number(tx.amount)
            if (!(amount < 0)) continue
            const d = new Date(tx.transacted_at * 1000)
            const dateISO = formatISODateUTC(d)
            const category = tx.category || "Uncategorized"
            const abs = Math.abs(amount)

            if (!dailyByCategory[dateISO]) dailyByCategory[dateISO] = {}
            dailyByCategory[dateISO][category] = (dailyByCategory[dateISO][category] || 0) + abs
            categoryTotals[category] = (categoryTotals[category] || 0) + abs

            if (!minISO || dateISO < minISO) minISO = dateISO
            if (!maxISO || dateISO > maxISO) maxISO = dateISO
        }

        if (!minISO || !maxISO) {
            return { chartData: [], categories: [], chartConfig: {} as ChartConfig }
        }

        const allCategories = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a])
        const allDates = enumerateDatesInclusive(minISO, maxISO)

        const running: Record<string, number> = {}
        const rows = allDates.map((date) => {
            const row: Record<string, any> = { date }
            const dayMap = dailyByCategory[date] || {}
            for (const cat of allCategories) {
                running[cat] = (running[cat] || 0) + (dayMap[cat] || 0)
                row[cat] = running[cat]
            }
            return row
        })

        const cfg: ChartConfig = {} as ChartConfig
        allCategories.forEach((cat, idx) => {
            ; (cfg as any)[cat] = { label: cat, color: COLORS[idx % COLORS.length] }
        })

        return { chartData: rows, categories: allCategories, chartConfig: cfg }
    }, [transactions])

    const tooltipFormatter = React.useCallback(((value: any, name: any, item: any, _index: number, p: any) => {
        const indicatorColor = item?.payload?.stroke || item?.color
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
        )
    }) as any, [chartConfig, categories])

    return (
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] max-sm:h-[220px] w-full">
            <AreaChart data={chartData}>
                <ChartTooltip
                    cursor={false}
                    content={
                        <ChartTooltipContent
                            labelFormatter={(_, payload) => {
                                if (!payload || payload.length === 0) return ""
                                const row = payload[0].payload
                                const dateValue = row.date
                                const total = Array.isArray(categories)
                                    ? categories.reduce((acc, cat) => acc + (Number(row?.[cat]) || 0), 0)
                                    : 0
                                return (
                                    <div className="flex justify-between w-full pb-2 text-neutral-950 dark:text-neutral-50">
                                        <p>
                                            {new Date(dateValue + "T00:00:00").toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
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
                {categories.map((cat) => (
                    <Area
                        key={cat}
                        dataKey={cat}
                        type="bump"
                        stroke={(chartConfig as any)[cat]?.color}
                        fill={(chartConfig as any)[cat]?.color}
                        fillOpacity={0.15}
                        strokeWidth={2}
                        dot={false}
                        stackId={1}
                    />
                ))}
                <ChartLegend content={<ChartLegendContent />} className="max-sm:hidden text-neutral-950 dark:text-neutral-50" />
            </AreaChart>
        </ChartContainer>
    )
}


