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
    const { chartData, chartConfig, personality, quip, icon, monthsSaved } = React.useMemo(() => {
        const { meanIncome } = calculatePlayerStats(transactions)

        // Focused on specific savings accounts
        const mSaved = meanIncome > 0 ? (savingsBalance || 0) / meanIncome : 0


        const mainColor = "oklch(62% 0.14 155)"
        const secondaryColor = "rgb(240, 240, 240)"

        // Target for the gauge is 12 months for 100%
        const displayMonths = Math.min(mSaved, 12)
        const data = [
            { name: "Months Saved", value: isNaN(displayMonths) ? 0 : displayMonths, fill: mainColor },
            { name: "Remaining", value: Math.max(0, 12 - (isNaN(displayMonths) ? 0 : displayMonths)), fill: secondaryColor },
        ]

        const cfg: ChartConfig = {
            "Months Saved": { label: "Months Saved", color: mainColor },
            "Remaining": { label: "Goal (12 Months)", color: secondaryColor },
        }

        let p = ""
        let q = ""
        let i = null
        const iconClass = "w-4 h-4 text-neutral-950 dark:text-neutral-50"

        if (meanIncome === 0 || isNaN(meanIncome)) {
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
            monthsSaved: isNaN(mSaved) ? 0 : mSaved
        }
    }, [transactions, totalBalance, savingsBalance])


    return (
        <div className="flex flex-col p-4 rounded-xl border bg-card hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors h-full min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Wealth Depth
                </span>
                {icon}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-6">
                <div className="relative flex flex-col items-center">
                    <span className="text-6xl font-black font-mono tracking-tighter text-neutral-950 dark:text-neutral-50 tabular-nums">
                        {monthsSaved.toFixed(1)}
                    </span>
                    <span className="text-xs uppercase font-bold text-neutral-500 tracking-[0.2em] -mt-1">
                        Months Saved
                    </span>
                </div>
                
                {/* Subtle progress indicator for the 6-month goal */}
                <div className="w-full max-w-[120px] h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full mt-8 overflow-hidden">
                    <div 
                        className="h-full transition-all duration-1000"
                        style={{ width: `${Math.min((monthsSaved / 6) * 100, 100)}%`, backgroundColor: "oklch(62% 0.14 155)" }}
                    />

                </div>
                <span className="text-[8px] uppercase font-bold text-neutral-400 mt-2 tracking-widest">
                    Goal: 6.0 Months
                </span>
            </div>

            <div className="mt-4 text-center space-y-2">
                <div className="space-y-0.5">
                    <h3 className="text-lg font-bold tracking-tight leading-tight">{personality}</h3>
                </div>
                
                <p className="text-xs text-muted-foreground italic leading-tight px-2">
                    "{quip}"
                </p>
            </div>
        </div>
    )
}

