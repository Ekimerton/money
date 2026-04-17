import { Transaction, Account } from "@/lib/types"

export interface TransactionWithAccount extends Transaction {
    accountType?: string
}

export interface PlayerStats {
    meanIncome: number
    meanExpenses: number
    meanSavings: number
    savingsRate: number
    monthsCount: number
}

export function calculatePlayerStats(transactions: TransactionWithAccount[]): PlayerStats {
    const monthYear = new Set<string>()
    let totalIncome = 0
    let totalExpenses = 0

    for (const t of transactions) {
        if (t.hidden || t.category === "Internal Transfer") continue

        const transactedAt = Number(t.transacted_at)
        if (isNaN(transactedAt)) continue

        const date = new Date(transactedAt * 1000)
        monthYear.add(`${date.getFullYear()}-${date.getMonth()}`)

        const amount = parseFloat(t.amount as any)
        if (isNaN(amount)) continue

        if (amount > 0) {
            // EXCLUDE: Money added to long-term investments from income stats
            if (t.accountType?.toLowerCase().includes("investments")) continue
            totalIncome += amount
        } else if (amount < 0) {
            totalExpenses += Math.abs(amount)
        }
    }

    const monthsCount = Math.max(1, monthYear.size)
    const meanIncome = totalIncome / monthsCount
    const meanExpenses = totalExpenses / monthsCount
    const meanSavings = meanIncome - meanExpenses
    const savingsRate = meanIncome > 0 ? (meanSavings / meanIncome) * 100 : (meanSavings < 0 ? -100 : 0)

    return {
        meanIncome,
        meanExpenses,
        meanSavings,
        savingsRate,
        monthsCount
    }
}
