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
import { Home, Sparkles, AlertCircle, Building, CheckCircle, ShieldCheck, AlertTriangle } from "lucide-react"

interface HousingBurdenCardProps {
    transactions: TransactionWithAccount[]
}

export function HousingBurdenCard({ transactions }: HousingBurdenCardProps) {
    const { chartData, chartConfig, personality, quip, icon, rentPercent, otherPercent, avgIncome, avgRent } = React.useMemo(() => {
        const { meanIncome, monthsCount } = calculatePlayerStats(transactions)
        
        // Rent is specific, so we still iterate for that part
        let totalRent = 0
        for (const t of transactions) {
            if (t.hidden || t.category === "Internal Transfer") continue
            if (t.category === "Rent") {
                totalRent += Math.abs(parseFloat(t.amount as any) || 0)
            }
        }
        const meanRent = monthsCount > 0 ? totalRent / monthsCount : 0

        const rPercent = meanIncome > 0 ? (meanRent / meanIncome) * 100 : 0
        const remainingPercent = Math.max(0, 100 - rPercent)

        const rentColor = "oklch(62% 0.14 155)"
        const incomeColor = "rgb(212, 212, 212)" // neutral-300


        const data = [
            { name: "Rent", value: meanRent, fill: rentColor },
            { name: "Remaining", value: Math.max(0, meanIncome - meanRent), fill: incomeColor },
        ].filter(d => d.value > 0)

        const cfg: ChartConfig = {
            "Rent": { label: "Monthly Rent", color: rentColor },
            "Remaining": { label: "Disposable Income", color: incomeColor },
        }

        let p = ""
        let q = ""
        let i = null
        const iconClass = "w-4 h-4 text-neutral-950 dark:text-neutral-50"

        if (meanIncome === 0) {
            p = "Mystery Resident"
            q = "Income data is required to calculate your housing burden."
            i = <Sparkles className={iconClass} />
        } else if (rPercent < 20) {
            p = "Secure Resident"
            q = "Your housing costs are well below the recommended threshold."
            i = <ShieldCheck className={iconClass} />
        } else if (rPercent < 35) {
            p = "Balanced Tenancy"
            q = "You maintain a sustainable balance between income and housing costs."
            i = <Home className={iconClass} />
        } else {
            p = "House Burdened"
            q = "A large portion of your monthly income is committed to housing."
            i = <AlertTriangle className={iconClass} />
        }

        return {
            chartData: data,
            chartConfig: cfg,
            personality: p,
            quip: q,
            icon: i,
            rentPercent: rPercent,
            otherPercent: remainingPercent,
            avgIncome: meanIncome,
            avgRent: meanRent
        }
    }, [transactions])

    return (
        <div className="flex flex-col p-4 rounded-xl border bg-card hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors h-full min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Rent vs Income
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
                        {Math.round(rentPercent)}% Rent • {Math.round(otherPercent)}% Income
                    </p>
                </div>
                
                <p className="text-xs text-muted-foreground italic leading-tight px-2">
                    "{quip}"
                </p>
            </div>
        </div>
    )
}
