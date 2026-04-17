"use client"

import * as React from "react"
import { TransactionWithAccount, calculatePlayerStats } from "../lib/utils"
import { Pie, PieChart, Cell } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { TrendingUp, Sparkles, AlertCircle, Zap, ShieldCheck } from "lucide-react"

interface SavingsBurnCardProps {
    transactions: TransactionWithAccount[]
}

export function SavingsBurnCard({ transactions }: SavingsBurnCardProps) {
    const { chartData, chartConfig, personality, quip, icon, savingsRate } = React.useMemo(() => {
        const { meanIncome, meanExpenses, meanSavings, savingsRate: sRate } = calculatePlayerStats(transactions)

        const mainColor = "oklch(62% 0.14 155)"
        const secondaryColor = "rgb(212, 212, 212)" // neutral-300

        let data: any[] = []
        let cfg: ChartConfig = {}

        if (meanSavings >= 0) {
            data = [
                { name: "Saved", value: meanSavings, fill: mainColor },
                { name: "Spent", value: meanExpenses, fill: secondaryColor },
            ].filter(d => d.value > 0)
            cfg = {
                Saved: { label: "Net Savings", color: mainColor },
                Spent: { label: "Total Spend", color: secondaryColor },
            }
        } else {
            // Burn phase gets a cautionary gray/neutral
            data = [
                { name: "Burn", value: Math.abs(meanSavings), fill: "rgb(163, 163, 163)" },
                { name: "Income", value: meanIncome, fill: secondaryColor },
            ].filter(d => d.value > 0)
            cfg = {
                Burn: { label: "Net Burn", color: "rgb(163, 163, 163)" },
                Income: { label: "Total Income", color: secondaryColor },
            }
        }


        let p = ""
        let q = ""
        let i = null
        const iconClass = "w-4 h-4 text-neutral-950 dark:text-neutral-50"

        if (meanIncome === 0 && meanExpenses === 0) {
            p = "Mystery Member"
            q = "Not enough cash flow data to determine your burn rate."
            i = <Sparkles className={iconClass} />
        } else if (sRate > 30) {
            p = "Wealth Builder"
            q = "You're accumulating capital at a high rate. Your burn is well under control."
            i = <ShieldCheck className={iconClass} />
        } else if (sRate >= 10) {
            p = "Stable Accumulator"
            q = "You maintain a consistent surplus month-over-month."
            i = <TrendingUp className={iconClass} />
        } else if (sRate >= 0) {
            p = "Cash Flow Neutral"
            q = "You're spending nearly everything you earn. There's little room for savings."
            i = <Zap className={iconClass} />
        } else {
            p = "Capital Burner"
            q = "Your expenses are outpacing your income. You are currently in a burn phase."
            i = <AlertCircle className={iconClass} />
        }

        return {
            chartData: data,
            chartConfig: cfg,
            personality: p,
            quip: q,
            icon: i,
            savingsRate: sRate
        }
    }, [transactions])

    return (
        <div className="flex flex-col p-4 rounded-xl border bg-card hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors h-full min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Savings vs Burn Rate
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
                                innerRadius={30}
                                outerRadius={45}
                                strokeWidth={2}
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
            </div>

            <div className="mt-4 text-center space-y-2">
                <div className="space-y-0.5">
                    <h3 className="text-lg font-bold tracking-tight leading-tight">{personality}</h3>
                    <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-tighter">
                        {savingsRate >= 0 
                            ? `${Math.round(savingsRate)}% Savings Rate` 
                            : `${Math.abs(Math.round(savingsRate))}% Burn Rate`}
                    </p>
                </div>
                
                <p className="text-xs text-muted-foreground italic leading-tight px-2">
                    "{quip}"
                </p>
            </div>
        </div>
    )
}
