"use client"

import * as React from "react"
import { TransactionWithAccount } from "../lib/utils"
import { Utensils, ShoppingBasket, Sparkles, Flame, ChefHat, Martini } from "lucide-react"

interface EatingHabitCardProps {
    transactions: TransactionWithAccount[]
}

export function EatingHabitCard({ transactions }: EatingHabitCardProps) {
    const { personality, quip, icon, groceriesPercent, diningPercent } = React.useMemo(() => {
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

        const foodTotal = groceriesTotal + diningTotal
        const gPercent = foodTotal > 0 ? (groceriesTotal / foodTotal) * 100 : 50
        const dPercent = foodTotal > 0 ? (diningTotal / foodTotal) * 100 : 50

        let p = ""
        let q = ""
        let i = null

        const iconClass = "w-12 h-12 opacity-90"
        const iconStyle = { color: "oklch(62% 0.14 155)" }

        if (foodTotal === 0) {
            p = "Mystery Member"
            q = "Not enough data yet to determine your culinary footprint."
            i = <Sparkles className={iconClass} style={iconStyle} />
        } else if (gPercent >= 80) {
            p = "Pantry Purist"
            q = "You rely almost exclusively on your own kitchen. Eating out is a rare exception for you."
            i = <ChefHat className={iconClass} style={iconStyle} />
        } else if (gPercent >= 60) {
            p = "Home Cook"
            q = "You prefer home-cooked meals most of the week, but you appreciate a night off."
            i = <ShoppingBasket className={iconClass} style={iconStyle} />
        } else if (gPercent >= 40) {
            p = "Hybrid Diner"
            q = "A steady mix of grocery runs and restaurant visits. You don't lean too heavily in either direction."
            i = <Flame className={iconClass} style={iconStyle} />
        } else if (dPercent >= 80) {
            p = "Social Epicure"
            q = "Most of your meals are handled by professionals. Your kitchen is likely the least-used room in the house."
            i = <Utensils className={iconClass} style={iconStyle} />
        } else {
            p = "Urban Resident"
            q = "You find yourself eating out more often than not, likely for the convenience and variety."
            i = <Martini className={iconClass} style={iconStyle} />
        }

        return {
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
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-6">
                <div 
                    className="p-8 rounded-full shadow-sm flex items-center justify-center border transition-all duration-500"
                    style={{ 
                        backgroundColor: "oklch(62% 0.14 155 / 0.08)",
                        borderColor: "oklch(62% 0.14 155 / 0.2)"
                    }}
                >
                    {icon}
                </div>
            </div>


            <div className="mt-4 text-center space-y-2">
                <div className="space-y-1">
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
