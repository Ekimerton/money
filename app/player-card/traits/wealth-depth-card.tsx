"use client"

import * as React from "react"
import { TransactionWithAccount, calculatePlayerStats } from "../lib/utils"
import { Shield, Sparkles, Trophy, Landmark } from "lucide-react"

interface WealthDepthCardProps {
    transactions: TransactionWithAccount[]
    totalBalance: number
    savingsBalance: number
}

export function WealthDepthCard({ transactions, totalBalance, savingsBalance }: WealthDepthCardProps) {
    const { personality, quip, icon, monthsSaved } = React.useMemo(() => {
        const { meanIncome } = calculatePlayerStats(transactions)

        // Focused on specific savings accounts
        const mSaved = meanIncome > 0 ? (savingsBalance || 0) / meanIncome : 0

        let p = ""
        let q = ""
        let i = null
        const iconClass = "w-6 h-6 opacity-90"
        const iconStyle = { color: "oklch(62% 0.14 155)" }

        if (meanIncome === 0 || isNaN(meanIncome)) {
            p = "Mystery Player"
            q = "Income data is required to measure your wealth depth."
            i = <Sparkles className={iconClass} style={iconStyle} />
        } else if (mSaved >= 12) {
            p = "Financial Fortress"
            q = "You have over a year's worth of total income stored in reserve."
            i = <Trophy className={iconClass} style={iconStyle} />
        } else if (mSaved >= 6) {
            p = "Secure Reserve"
            q = "A solid half-year of income backup. You're prepared for most lifecycle shifts."
            i = <Landmark className={iconClass} style={iconStyle} />
        } else if (mSaved >= 3) {
            p = "Comfortable Base"
            q = "You've built up a respectable cushion. Enough to weather short-term shocks."
            i = <Shield className={iconClass} style={iconStyle} />
        } else {
            p = "Growth Phase"
            q = "You're in the early stages of building a meaningful financial safety net."
            i = <Sparkles className={iconClass} style={iconStyle} />
        }

        return {
            personality: p,
            quip: q,
            icon: i,
            monthsSaved: isNaN(mSaved) ? 0 : mSaved
        }
    }, [transactions, totalBalance, savingsBalance])

    return (
        <div className="flex flex-col p-4 rounded-xl border bg-card hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors h-full min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Short Term Savings vs Income
                </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-4">
                <div className="flex flex-col items-center">
                    <div 
                        className="p-3 rounded-full mb-3 flex items-center justify-center border transition-all duration-500"
                        style={{ 
                            backgroundColor: "oklch(62% 0.14 155 / 0.08)",
                            borderColor: "oklch(62% 0.14 155 / 0.2)"
                        }}
                    >
                        {icon}
                    </div>
                    <span className="text-6xl font-black font-mono tracking-tighter text-neutral-950 dark:text-neutral-50 tabular-nums leading-none">
                        {monthsSaved.toFixed(1)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-[0.2em] mt-1">
                        Months Saved
                    </span>
                </div>

                
                {/* Progress bar centered in the visual area */}
                <div className="w-full max-w-[160px] h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full mt-6 overflow-hidden">
                    <div 
                        className="h-full transition-all duration-1000"
                        style={{ width: `${Math.min((monthsSaved / 6) * 100, 100)}%`, backgroundColor: "oklch(62% 0.14 155)" }}
                    />
                </div>
            </div>

            <div className="mt-4 text-center space-y-2">
                <div className="space-y-0.5">
                    <h3 className="text-lg font-bold tracking-tight">{personality}</h3>
                    <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-tighter">
                        {monthsSaved.toFixed(1)} months of income saved
                    </p>
                </div>
                
                <p className="text-xs text-muted-foreground italic leading-tight px-2">
                    "{quip}"
                </p>
            </div>
        </div>
    )
}
