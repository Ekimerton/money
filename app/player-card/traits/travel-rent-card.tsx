"use client"

import * as React from "react"
import { TransactionWithAccount, calculatePlayerStats } from "../lib/utils"
import { Plane, Home, Sparkles, Compass, Globe } from "lucide-react"

interface TravelRentCardProps {
    transactions: TransactionWithAccount[]
}

export function TravelRentCard({ transactions }: TravelRentCardProps) {
    const { personality, quip, icon, travelPercent, rentPercent } = React.useMemo(() => {
        const { monthsCount } = calculatePlayerStats(transactions)
        
        let totalTravel = 0
        let totalRent = 0

        for (const t of transactions) {
            if (t.hidden || t.category === "Internal Transfer") continue
            const amount = Math.abs(parseFloat(t.amount as any) || 0)
            const cat = t.category || ""

            if (cat === "Transport") {
                totalTravel += amount
            } else if (cat === "Rent") {
                totalRent += amount
            }
        }

        const combinedTotal = totalTravel + totalRent
        const tPercent = combinedTotal > 0 ? (totalTravel / combinedTotal) * 100 : 0
        const rPercent = combinedTotal > 0 ? (totalRent / combinedTotal) * 100 : 0
        
        const rentMultiplier = totalRent > 0 ? totalTravel / totalRent : 0

        let p = ""
        let q = ""
        let i = null
        const iconClass = "w-12 h-12 opacity-90"
        const iconStyle = { color: "oklch(62% 0.14 155)" }

        if (combinedTotal === 0) {
            p = "Static Soul"
            q = "No travel or housing data detected yet."
            i = <Sparkles className={iconClass} style={iconStyle} />
        } else if (rentMultiplier < 0.1) {
            p = "Homebody"
            q = "You find comfort and value in your home base. Travel is a rare indulgence."
            i = <Home className={iconClass} style={iconStyle} />
        } else if (rentMultiplier < 0.3) {
            p = "Vacationer"
            q = "You balance a stable home life with the occasional getaway."
            i = <Compass className={iconClass} style={iconStyle} />
        } else if (rentMultiplier < 0.6) {
            p = "Jetsetter"
            q = "A significant portion of your lifestyle is spent exploring the world."
            i = <Plane className={iconClass} style={iconStyle} />
        } else {
            p = "Digital Nomad"
            q = "Your travel budget is rivaling your rent. The world is your true home."
            i = <Globe className={iconClass} style={iconStyle} />
        }


        return {
            personality: p,
            quip: q,
            icon: i,
            travelPercent: tPercent,
            rentPercent: rPercent
        }
    }, [transactions])

    return (
        <div className="flex flex-col p-4 rounded-xl border bg-card hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors h-full min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Travel vs Rent
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
                        {Math.round(travelPercent)}% TRAVEL • {Math.round(rentPercent)}% RENT
                    </p>
                </div>
                
                <p className="text-xs text-muted-foreground italic leading-tight px-2">
                    "{quip}"
                </p>
            </div>
        </div>
    )
}
