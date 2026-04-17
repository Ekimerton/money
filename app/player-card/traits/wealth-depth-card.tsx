"use client"

import * as React from "react"
import { Transaction } from "@/lib/types"
import { Pie, PieChart, Cell } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Shield, Sparkles, Trophy, Landmark } from "lucide-react"

interface WealthDepthCardProps {
    transactions: Transaction[]
    totalBalance: number
    savingsBalance: number
}

export function WealthDepthCard({ transactions, totalBalance, savingsBalance }: WealthDepthCardProps) {
    const { chartData, chartConfig, personality, quip, icon, monthsSaved } = React.useMemo(() => {
        const monthYear = new Set<string>()
        let totalIncome = 0

        for (const t of transactions) {
            if (t.hidden || t.category === "Internal Transfer") continue
            const amount = parseFloat(t.amount)
            if (amount > 0) {
                totalIncome += amount
            }
            const date = new Date(t.transacted_at * 1000)
            monthYear.add(`${date.getFullYear()}-${date.getMonth()}`)
        }

        const monthsCount = Math.max(1, monthYear.size)
        const meanIncome = totalIncome / monthsCount

        // Focused on specific savings accounts
        const mSaved = meanIncome > 0 ? (savingsBalance || 0) / meanIncome : 0


        const mainColor = "rgb(23, 23, 23)" // neutral-900
        const secondaryColor = "rgb(240, 240, 240)" // very light gray

        // Target for the gauge is 12 months for 100%
        const displayMonths = Math.min(mSaved, 12)
        const data = [
            { name: "Months Saved", value: displayMonths, fill: mainColor },
            { name: "Remaining", value: Math.max(0, 12 - displayMonths), fill: secondaryColor },
        ]

        const cfg: ChartConfig = {
            "Months Saved": { label: "Months Saved", color: mainColor },
            "Remaining": { label: "Goal (12 Months)", color: secondaryColor },
        }

        let p = ""
        let q = ""
        let i = null
        const iconClass = "w-4 h-4 text-neutral-950 dark:text-neutral-50"

        if (meanIncome === 0) {
            p = "Mystery Player"
            q = "Income data is required to measure your wealth depth."
            i = <Sparkles className={iconClass} />
        } else if (mSaved >= 12) {
            p = "Financial Fortress"
            q = "You have over a year's worth of total income stored in reserve."
            i = <Trophy className={iconClass} />
        } else if (mSaved >= 6) {
            p = "Secure Reserve"
            q = "A solid half-year of income backup. You're prepared for most lifecycle shifts."
            i = <Landmark className={iconClass} />
        } else if (mSaved >= 3) {
            p = "Comfortable Base"
            q = "You've built up a respectable cushion. Enough to weather short-term shocks."
            i = <Shield className={iconClass} />
        } else {
            p = "Growth Phase"
            q = "You're in the early stages of building a meaningful financial safety net."
            i = <Sparkles className={iconClass} />
        }

        return {
            chartData: data,
            chartConfig: cfg,
            personality: p,
            quip: q,
            icon: i,
            monthsSaved: mSaved
        }
    }, [transactions, totalBalance])

    return (
        <div className="flex flex-col p-4 rounded-xl border bg-card hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors h-full min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Wealth Depth
                </span>
                {icon}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative py-2">
                <div className="h-28 w-full">
                    <ChartContainer config={chartConfig} className="h-full w-full">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={35}
                                outerRadius={50}
                                startAngle={90}
                                endAngle={-270}
                                strokeWidth={0}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                        </PieChart>
                    </ChartContainer>
                </div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
                    <span className="text-xl font-black font-mono leading-none">
                        {monthsSaved.toFixed(1)}
                    </span>
                    <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-tighter">Months</span>
                </div>
            </div>

            <div className="mt-4 text-center space-y-2">
                <div className="space-y-0.5">
                    <h3 className="text-lg font-bold tracking-tight leading-tight">{personality}</h3>
                    <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-tighter">
                        Saved {monthsSaved.toFixed(1)}x monthly income
                    </p>
                </div>
                
                <p className="text-xs text-muted-foreground italic leading-tight px-2">
                    "{quip}"
                </p>
            </div>
        </div>
    )
}
