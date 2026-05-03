"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Account } from "@/lib/types"

const chartConfig = {
    cash: {
        label: "Cash",
        color: "oklch(62% 0.14 155)",
    },
    savings: {
        label: "Savings",
        color: "oklch(62% 0.15 240)",
    },
    investments: {
        label: "Investments",
        color: "oklch(62% 0.13 300)",
    },
} satisfies ChartConfig

function matchesType(type: string | undefined, keyword: string): boolean {
    if (!type) return false
    return type.toLowerCase().includes(keyword)
}

export function CashSavingsInvestmentsChart({ accounts, timeRange }: { accounts: Account[]; timeRange: string }) {
    const fullData = React.useMemo(() => {
        const dailyTotals: Record<string, { checking: number; credit: number; savings: number; investments: number; shortTerm: number; total: number }> = {}

        for (const account of accounts) {
            const isChecking = matchesType(account.type, "checking")
            const isCredit = matchesType(account.type, "credit")
            const isSavings = matchesType(account.type, "savings")
            const isInvestment = matchesType(account.type, "investments")
            const isShortTermInvestment = matchesType(account.type, "short-term investments") || matchesType(account.type, "short term investments")

            if (!account.balanceHistory) continue
            for (const entry of account.balanceHistory) {
                const date = new Date(entry.date).toISOString().split("T")[0]
                if (!dailyTotals[date]) {
                    dailyTotals[date] = { checking: 0, credit: 0, savings: 0, investments: 0, shortTerm: 0, total: 0 }
                }
                if (isChecking) dailyTotals[date].checking += entry.balance
                if (isCredit) dailyTotals[date].credit += entry.balance
                if (isSavings) dailyTotals[date].savings += entry.balance
                // Treat short-term investments as cash, not long-term investments
                if (isShortTermInvestment) {
                    dailyTotals[date].shortTerm += entry.balance
                } else if (isInvestment) {
                    dailyTotals[date].investments += entry.balance
                }
                dailyTotals[date].total += entry.balance
            }
        }

        const dates = Object.keys(dailyTotals).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        return dates.map((date) => {
            const { checking, credit, savings, investments, shortTerm, total } = dailyTotals[date]
            const cash = checking + credit + shortTerm
            return { date, cash, savings, investments, total }
        })
    }, [accounts])

    const startDateStr = React.useMemo(() => {
        let daysToSubtract = 90
        if (timeRange === "30d") daysToSubtract = 30
        else if (timeRange === "7d") daysToSubtract = 7
        else if (timeRange === "365d") daysToSubtract = 365
        const now = new Date()
        const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        const startUTC = new Date(utcMidnight)
        startUTC.setUTCDate(startUTC.getUTCDate() - daysToSubtract)
        return startUTC.toISOString().split("T")[0]
    }, [timeRange])

    const filteredData = React.useMemo(() => {
        return fullData.filter((d) => d.date >= startDateStr)
    }, [fullData, startDateStr])

    const tooltipFormatter = React.useCallback(((value: any, name: any, item: any, _index: number, p: any) => {
        const indicatorColor = item?.payload?.fill || item?.color
        const key = String(name)
        const labelText = (chartConfig as any)[key]?.label ?? key
        const sum = (p?.cash ?? 0) + (p?.savings ?? 0) + (p?.investments ?? 0)
        const numericValue = Number(value)
        const percent = sum > 0 ? (numericValue / sum) : 0

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
    }) as any, [chartConfig])

    return (
        <div className="">
            <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[300px] max-sm:h-[200px] w-full max-sm:-mb-8 -z-10"
            >
                <AreaChart data={filteredData} margin={{ left: 0, right: 0 }}>
                    <defs>
                        <linearGradient id="fillInvestments" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartConfig.investments.color} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={chartConfig.investments.color} stopOpacity={0.1} />
                        </linearGradient>

                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
                    <XAxis
                        dataKey="date"
                        tick={false}
                        tickLine={false}
                        axisLine={false}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, payload) => {
                                    if (!payload || payload.length === 0) return ""
                                    const dateValue = payload[0].payload.date
                                    return (
                                        <div className="flex justify-between w-full pb-2 text-neutral-950 dark:text-neutral-50">
                                            <p>
                                                {new Date(dateValue + "T00:00:00Z").toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    timeZone: "UTC",
                                                })}
                                            </p>
                                            <p className="font-mono">
                                                {payload[0].payload.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                                            </p>
                                        </div>
                                    )
                                }}
                                indicator="dot"
                                formatter={tooltipFormatter}
                            />
                        }
                    />
                    <Area
                        dataKey="investments"
                        type="bump"
                        stroke={chartConfig.investments.color}
                        fill="url(#fillInvestments)"
                        strokeWidth={2}
                        dot={false}
                        stackId={1}
                    />
                    <Area
                        dataKey="savings"
                        type="bump"
                        stroke={chartConfig.savings.color}
                        fill={chartConfig.savings.color}
                        fillOpacity={0.15}
                        strokeWidth={2}
                        dot={false}
                        stackId={1}
                    />
                    <Area
                        dataKey="cash"
                        type="bump"
                        stroke={chartConfig.cash.color}
                        fill={chartConfig.cash.color}
                        fillOpacity={0.15}
                        strokeWidth={2}
                        dot={false}
                        stackId={1}
                    />
                    <ChartLegend content={<ChartLegendContent />} className="max-sm:hidden text-neutral-950 dark:text-neutral-50" />
                </AreaChart>
            </ChartContainer>
        </div>
    )
}


