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
import { Receipt, Sparkles, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react"

interface BillsBurdenCardProps {
    transactions: TransactionWithAccount[]
}

export function BillsBurdenCard({ transactions }: BillsBurdenCardProps) {
    const { chartData, chartConfig, personality, quip, icon, billsPercent, otherPercent } = React.useMemo(() => {
        const { meanIncome, monthsCount } = calculatePlayerStats(transactions)

        let totalBills = 0
        for (const t of transactions) {
            if (t.hidden || t.category === "Internal Transfer") continue
            if (t.category === "Bills") {
                totalBills += Math.abs(parseFloat(t.amount as any) || 0)
            }
        }
        const meanBills = monthsCount > 0 ? totalBills / monthsCount : 0
        
        const billsTotal = meanBills
        const otherTotal = Math.max(0, meanIncome - meanBills)

        const bPercent = meanIncome > 0 ? (meanBills / meanIncome) * 100 : 0
        const oPercent = Math.max(0, 100 - bPercent)


        const groceriesColor = "oklch(62% 0.14 155)"
        const otherColor = "rgb(212, 212, 212)"     // neutral-300


        const data = [
            { name: "Fixed Costs", value: billsTotal, fill: groceriesColor },
            { name: "Discretionary", value: otherTotal, fill: otherColor },
        ].filter(d => d.value > 0)

        const cfg: ChartConfig = {
            "Fixed Costs": { label: "Fixed Costs", color: groceriesColor },
            "Discretionary": { label: "Discretionary", color: otherColor },
        }

        let p = ""
        let q = ""
        let i = null
        const iconClass = "w-4 h-4 text-neutral-950 dark:text-neutral-50"

        if (meanIncome === 0) {
            p = "Mystery Member"
            q = "Not enough data yet to analyze your fixed costs."
            i = <Sparkles className={iconClass} />

        } else if (bPercent < 25) {
            p = "Lean Flyer"
            q = "Your fixed overhead is remarkably low, giving you maximum financial agility."
            i = <CheckCircle2 className={iconClass} />
        } else if (bPercent < 45) {
            p = "Balanced Budgeter"
            q = "You maintain a healthy ratio between fixed commitments and flexible spending."
            i = <TrendingUp className={iconClass} />
        } else if (bPercent < 65) {
            p = "Committed Spender"
            q = "A significant portion of your income is tied up in recurring bills and housing."
            i = <Receipt className={iconClass} />
        } else {
            p = "Fixed Heavy"
            q = "Most of your spending is locked into fixed costs, leaving limited discretionary room."
            i = <AlertCircle className={iconClass} />
        }

        return {
            chartData: data,
            chartConfig: cfg,
            personality: p,
            quip: q,
            icon: i,
            billsPercent: bPercent,
            otherPercent: oPercent
        }
    }, [transactions])

    return (
        <div className="flex flex-col p-4 rounded-xl border bg-card hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors h-full min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Bills vs Total Spend
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
                        {Math.round(billsPercent)}% Bills • {Math.round(otherPercent)}% Other Spend
                    </p>
                </div>

                <p className="text-xs text-muted-foreground italic leading-tight px-2">
                    "{quip}"
                </p>
            </div>
        </div>
    )
}

