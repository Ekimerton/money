"use client"

import * as React from "react"
import { Transaction } from "@/lib/types"
import { EatingHabitCard } from "./traits/eating-habit-card"
import { BillsBurdenCard } from "./traits/bills-burden-card"
import { HousingBurdenCard } from "./traits/housing-burden-card"
import { SavingsBurnCard } from "./traits/savings-burn-card"
import { WealthDepthCard } from "./traits/wealth-depth-card"
import { Sparkles, Lock } from "lucide-react"

interface PlayerCardClientProps {
    transactions: Transaction[]
    totalBalance: number
    savingsBalance: number
}

export default function PlayerCardClient({ transactions, totalBalance, savingsBalance }: PlayerCardClientProps) {
    return (
        <div className="w-full max-w-7xl mx-auto pb-4">
            {/* Standard Header */}
            <div className="flex gap-2 space-y-0 p-4 sm:flex-row max-sm:p-2 max-sm:text-center max-sm:flex-col max-sm:pt-8">
                <div className="grid flex-1 gap-1 px-0">

                    <h2 className="font-bold text-muted-foreground uppercase text-sm font-mono tracking-wider">
                        Player Profile
                    </h2>
                    <h1 className="text-2xl font-bold text-neutral-950 dark:text-neutral-50 tracking-tight max-sm:text-4xl">
                        Financial Personality
                    </h1>
                </div>
            </div>


            {/* Grid of Cards */}
            <div className="flex flex-wrap gap-4 px-4 overflow-x-hidden">
                {/* Active Traits */}
                <div className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] xl:w-[calc(25%-12px)]">
                    <EatingHabitCard transactions={transactions} />
                </div>
                <div className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] xl:w-[calc(25%-12px)]">
                    <BillsBurdenCard transactions={transactions} />
                </div>
                <div className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] xl:w-[calc(25%-12px)]">
                    <HousingBurdenCard transactions={transactions} />
                </div>
                <div className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] xl:w-[calc(25%-12px)]">
                    <SavingsBurnCard transactions={transactions} />
                </div>
                <div className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] xl:w-[calc(25%-12px)]">
                    <WealthDepthCard transactions={transactions} totalBalance={totalBalance} savingsBalance={savingsBalance} />
                </div>


                {/* Coming Soon Traits to fill the 8-card grid */}
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] xl:w-[calc(25%-12px)]">
                        <ComingSoonCard index={i} />
                    </div>
                ))}
            </div>
        </div>
    )
}

function ComingSoonCard({ index }: { index: number }) {
    const labels = [
        "Risk Profile",
        "Subscription Load",
        "Savings Velocity",
        "Utility Efficiency",
        "Retail Therapy",
        "Gift Giving",
        "Impulse Control"
    ]

    return (
        <div className="flex flex-col p-4 rounded-xl border border-dashed bg-neutral-50/50 dark:bg-neutral-900/20 text-muted-foreground group h-full min-h-[280px]">
            <div className="flex items-center justify-between mb-4 opacity-50">
                <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
                    {labels[index] || "Future Insight"}
                </span>
                <Lock className="w-4 h-4" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-3 opacity-30 group-hover:opacity-100 transition-opacity">
                <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-center px-4">
                    Analyze more data to unlock this behavioral trait.
                </p>
            </div>

            <div className="mt-4 text-center pb-2">
                <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-neutral-300 dark:bg-neutral-700 w-1/3" />
                </div>
                <p className="text-[9px] uppercase font-bold tracking-tighter mt-2 opacity-50">Discovery in progress</p>
            </div>
        </div>
    )
}


