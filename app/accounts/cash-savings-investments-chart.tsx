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
import { Account } from "@/lib/types"

const chartConfig = {
    cash: {
        label: "Cash (Checking - Credit)",
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
        const dailyTotals: Record<string, { checking: number; credit: number; savings: number; investments: number, total: number }> = {}

        for (const account of accounts) {
            const isChecking = matchesType(account.type, "checking")
            const isCredit = matchesType(account.type, "credit")
            const isSavings = matchesType(account.type, "savings")
            const isInvestment = matchesType(account.type, "investment") || matchesType(account.type, "brokerage")

            if (!account.balanceHistory) continue
            for (const entry of account.balanceHistory) {
                const date = new Date(entry.date).toISOString().split("T")[0]
                if (!dailyTotals[date]) {
                    dailyTotals[date] = { checking: 0, credit: 0, savings: 0, investments: 0, total: 0 }
                }
                if (isChecking) dailyTotals[date].checking += entry.balance
                if (isCredit) dailyTotals[date].credit += entry.balance
                if (isSavings) dailyTotals[date].savings += entry.balance
                if (isInvestment) dailyTotals[date].investments += entry.balance
                dailyTotals[date].total += entry.balance
            }
        }

        const dates = Object.keys(dailyTotals).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        return dates.map((date) => {
            const { checking, credit, savings, investments, total } = dailyTotals[date]
            const cash = checking + credit
            return { date, cash, savings, investments, total }
        })
    }, [accounts])

    const filteredData = React.useMemo(() => {
        const referenceDate = new Date()
        let daysToSubtract = 90
        if (timeRange === "30d") daysToSubtract = 30
        else if (timeRange === "7d") daysToSubtract = 7
        else if (timeRange === "365d") daysToSubtract = 365
        const startDate = new Date(referenceDate)
        startDate.setDate(startDate.getDate() - daysToSubtract)
        startDate.setHours(0, 0, 0, 0)

        return fullData.filter((d) => new Date(d.date) >= startDate)
    }, [fullData, timeRange])

    return (
        <div className="sm:px-4">
            <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[300px] max-sm:h-[300px] w-full"
            >
                <AreaChart data={filteredData}>
                    <ChartTooltip
                        cursor={false}
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, payload) => {
                                    if (!payload || payload.length === 0) return ""
                                    const dateValue = payload[0].payload.date
                                    return (
                                        <div className="flex justify-between w-full pb-2">
                                            <p>
                                                {new Date(dateValue + "T00:00:00").toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                            <p className="font-mono">
                                                {payload[0].payload.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                                            </p>
                                        </div>
                                    )
                                }}
                                indicator="dot"
                            />
                        }
                    />
                    <Area
                        dataKey="investments"
                        type="natural"
                        stroke={chartConfig.investments.color}
                        fill={chartConfig.investments.color}
                        fillOpacity={0.15}
                        strokeWidth={2}
                        dot={false}
                        stackId={1}
                    />
                    <Area
                        dataKey="savings"
                        type="natural"
                        stroke={chartConfig.savings.color}
                        fill={chartConfig.savings.color}
                        fillOpacity={0.15}
                        strokeWidth={2}
                        dot={false}
                        stackId={1}
                    />
                    <Area
                        dataKey="cash"
                        type="natural"
                        stroke="oklch(62% 0.14 155)"
                        fill="oklch(62% 0.14 155)"
                        fillOpacity={0.15}
                        strokeWidth={2}
                        dot={false}
                        stackId={1}
                    />
                    <ChartLegend content={<ChartLegendContent />} className="max-sm:hidden" />
                </AreaChart>
            </ChartContainer>
        </div>
    )
}


