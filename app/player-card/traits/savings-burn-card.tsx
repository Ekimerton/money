"use client"

import * as React from "react"
import { TransactionWithAccount, calculatePlayerStats } from "../lib/utils"
import { TrendingUp, Sparkles, AlertCircle, Zap, ShieldCheck, Wallet, PiggyBank } from "lucide-react"

interface SavingsBurnCardProps {
    transactions: TransactionWithAccount[]
}

export function SavingsBurnCard({ transactions }: SavingsBurnCardProps) {
    const { personality, quip, icon, savingsRate } = React.useMemo(() => {
        const { meanIncome, meanExpenses, meanSavings, savingsRate: sRate } = calculatePlayerStats(transactions)

        let p = ""
        let q = ""
        let i = null
        const iconClass = "w-12 h-12 opacity-90"
        const iconStyle = { color: "oklch(62% 0.14 155)" }

        if (meanIncome === 0) {
            p = "Mystery Player"
            q = "Income data is required to calculate your savings rate."
            i = <Sparkles className={iconClass} style={iconStyle} />
        } else if (sRate >= 20) {
            p = "Wealth Builder"
            q = "You're consistently putting away a significant portion of your income."
            i = <TrendingUp className={iconClass} style={iconStyle} />
        } else if (sRate >= 10) {
            p = "Steady Saver"
            q = "A solid savings habit that builds a strong future over time."
            i = <PiggyBank className={iconClass} style={iconStyle} />
        } else if (sRate >= 0) {
            p = "Conservative Spender"
            q = "You're living within your means, with a small cushion to spare."
            i = <Wallet className={iconClass} style={iconStyle} />
        } else {
            p = "Deficit Spender"
            q = "Your monthly spending is currently exceeding your income."
            i = <AlertCircle className={iconClass} style={iconStyle} />
        }

        return {
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
                    Savings vs Spend
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
                        {savingsRate > 0 ? `${Math.round(savingsRate)}% Saved` : `${Math.abs(Math.round(savingsRate))}% Deficit`}
                    </p>
                </div>
                
                <p className="text-xs text-muted-foreground italic leading-tight px-2">
                    "{quip}"
                </p>
            </div>
        </div>
    )
}
