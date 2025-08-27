import { Transaction } from "@/lib/types";
import { CumulativeSpendLineChart } from "@/app/spending/cumulative-spend-line-chart";

export default async function InsightsPage() {
    const transactionsResponse = await fetch('http://localhost:3000/api/get-transactions', {
        next: {
            tags: ['accounts', 'transactions']
        }
    });
    if (!transactionsResponse.ok) {
        throw new Error(`Error: ${transactionsResponse.status}`);
    }
    const transactionsData = await transactionsResponse.json();
    const transactions: Transaction[] = transactionsData.transactions;

    const spendOnly = transactions
        .filter((t) => !t.hidden && t.category !== "Internal Transfer")
        .filter((t) => Number(t.amount) < 0)
    const totalSpending = spendOnly.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0)
    const formattedTotal = Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalSpending)

    return (
        <div className="p-4">
            <div className="flex gap-2 space-y-0 sm:flex-row max-sm:p-2">
                <div className="grid flex-1 gap-1">
                    <h2 className="font-bold text-muted-foreground uppercase text-sm font-mono">All Time Spend</h2>
                    <h1 className="text-2xl font-bold text-neutral-950 dark:text-neutral-50">{formattedTotal}</h1>
                </div>
            </div>
            <CumulativeSpendLineChart transactions={spendOnly} />
        </div>
    );
}


