"use client"

import * as React from "react"
import { TransactionWithAccount } from "../lib/utils"
import { Pie, PieChart, Cell } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Utensils, ShoppingBasket, Sparkles, Flame } from "lucide-react"

interface EatingHabitCardProps {
    transactions: TransactionWithAccount[]
}


export function EatingHabitCard({ transactions }: EatingHabitCardProps) {

    const { chartData, chartConfig, personality, quip, icon, groceriesPercent, diningPercent } = React.useMemo(() => {
        let groceriesTotal = 0
        let diningTotal = 0

        for (const t of transactions) {
            if (t.hidden || t.category === "Internal Transfer") continue
            const amount = parseFloat(t.amount)
            if (!(amount < 0)) continue

            const abs = Math.abs(amount)
            const cat = t.category || ""
            if (cat === "Groceries") groceriesTotal += abs
            if (cat === "Dining") diningTotal += abs
        }

        const data = [
            { name: "Groceries", value: groceriesTotal, fill: "currentColor" },
            { name: "Dining", value: diningTotal, fill: "var(--neutral-200)" },
        ].filter(d => d.value > 0)

        // Using CSS variables or hex values that work with the theme
        const groceriesColor = "oklch(62% 0.14 155)"
        const diningColor = "rgb(212, 212, 212)" // neutral-300


        const chartDataWithColors = [
            { name: "Groceries", value: groceriesTotal, fill: groceriesColor },
            { name: "Dining", value: diningTotal, fill: diningColor },
        ].filter(d => d.value > 0)

        const cfg: ChartConfig = {
            Groceries: { label: "Groceries", color: groceriesColor },
            Dining: { label: "Dining", color: diningColor },
        }

        const foodTotal = groceriesTotal + diningTotal
        const gPercent = foodTotal > 0 ? (groceriesTotal / foodTotal) * 100 : 50
        const dPercent = foodTotal > 0 ? (diningTotal / foodTotal) * 100 : 50

        let p = ""
        let q = ""
        let i = null

        const iconClass = "w-4 h-4 text-neutral-950 dark:text-neutral-50"

        if (foodTotal === 0) {
            p = "Mystery Member"
            q = "Not enough data yet to determine your culinary footprint."
            i = <Sparkles className={iconClass} />
        } else if (gPercent >= 80) {
            p = "Pantry Purist"
            q = "You rely almost exclusively on your own kitchen. Eating out is a rare exception for you."
            i = <ShoppingBasket className={iconClass} />
        } else if (gPercent >= 60) {
            p = "Home Cook"
            q = "You prefer home-cooked meals most of the week, but you appreciate a night off."
            i = <ShoppingBasket className={iconClass} />
        } else if (gPercent >= 40) {
            p = "Hybrid Diner"
            q = "A steady mix of grocery runs and restaurant visits. You don't lean too heavily in either direction."
            i = <Flame className={iconClass} />
        } else if (dPercent >= 80) {
            p = "Social Epicure"
            i = <Utensils className={iconClass} />
            q = "Most of your meals are handled by professionals. Your kitchen is likely the least-used room in the house."
        } else {
            p = "Urban Resident"
            q = "You find yourself eating out more often than not, likely for the convenience and variety."
            i = <Utensils className={iconClass} />
        }

        return {
            chartData: chartDataWithColors,
            chartConfig: cfg,
            personality: p,
            quip: q,
            icon: i,
            groceriesPercent: gPercent,
            diningPercent: dPercent
        }
    }, [transactions])



    return (
        <div className="flex flex-col p-4 rounded-xl border bg-card hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors h-full min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Groceries vs Dining
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
                        {Math.round(groceriesPercent)}% home cooked • {Math.round(diningPercent)}% dine out
                    </p>
                </div>

                <p className="text-xs text-muted-foreground italic leading-tight px-2">
                    "{quip}"
                </p>
            </div>
        </div>
    )
}


