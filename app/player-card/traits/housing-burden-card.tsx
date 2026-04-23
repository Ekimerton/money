"use client"

import * as React from "react"
import { TransactionWithAccount, calculatePlayerStats } from "../lib/utils"
import { Home, Sparkles, ShieldCheck, AlertTriangle, Building, Construction } from "lucide-react"

interface HousingBurdenCardProps {
    transactions: TransactionWithAccount[]
}

export function HousingBurdenCard({ transactions }: HousingBurdenCardProps) {
    const { personality, quip, icon, rentPercent, otherPercent } = React.useMemo(() => {
        const { meanIncome, monthsCount } = calculatePlayerStats(transactions)
        
        // Rent is specific
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

        let p = ""
        let q = ""
        let i = null
        const iconClass = "w-12 h-12 opacity-90"
        const iconStyle = { color: "oklch(62% 0.14 155)" }

        if (meanIncome === 0) {
            p = "Mystery Resident"
            q = "Income data is required to calculate your housing burden."
            i = <Sparkles className={iconClass} style={iconStyle} />
        } else if (rPercent < 20) {
            p = "Secure Resident"
            q = "Your housing costs are well below the recommended threshold."
            i = <ShieldCheck className={iconClass} style={iconStyle} />
        } else if (rPercent < 35) {
            p = "Balanced Tenancy"
            q = "You maintain a sustainable balance between income and housing costs."
            i = <Home className={iconClass} style={iconStyle} />
        } else if (rPercent < 50) {
            p = "Committed Foundation"
            q = "A significant portion of your income goes to housing, but it's still manageable."
            i = <Building className={iconClass} style={iconStyle} />
        } else {
            p = "House Burdened"
            q = "A large portion of your monthly income is committed to housing."
            i = <Construction className={iconClass} style={iconStyle} />
        }

        return {
            personality: p,
            quip: q,
            icon: i,
            rentPercent: rPercent,
            otherPercent: remainingPercent
        }
    }, [transactions])

    return (
        <div className="flex flex-col p-4 rounded-xl border bg-card hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors h-full min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Rent vs Income
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
