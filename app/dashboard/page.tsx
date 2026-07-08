import { IncomeExpenseSankeyChart } from '@/components/ui/sankey-chart';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { getTransactions, getAccounts } from '@/lib/data';
import { Transaction, Account } from '@/lib/types';

export default async function DashboardPage() {
    // Get current month and year
    const now = new Date();
    const currentMonth = String(now.getMonth()); // 0-indexed
    const currentYear = String(now.getFullYear());

    // Fetch transactions for the current month
    const transactions = getTransactions(null, currentMonth, currentYear) as any[]; // Not hidden by default

    // Fetch accounts
    const accounts = getAccounts() as any[];

    let income = 0;
    let expenses = 0;

    transactions.forEach(transaction => {
        if (Number(transaction.amount) > 0) {
            income += Number(transaction.amount);
        } else {
            expenses += Number(transaction.amount);
        }
    });

    // Calculate monthly savings and savings rate after income and expenses are set
    const calculatedSavings = income + expenses;
    const monthlySavings = calculatedSavings;

    let savingsRate = 0;
    if (income > 0) {
        savingsRate = (calculatedSavings / income) * 100;
    }

    return (
        <div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-4 pb-0 w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{income.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{expenses.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{monthlySavings.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{savingsRate.toFixed(2)}%</div>
                    </CardContent>
                </Card>
            </div>

            <div className="p-4">
                <IncomeExpenseSankeyChart transactions={transactions} accounts={accounts} />
            </div>
        </div>
    );
}
