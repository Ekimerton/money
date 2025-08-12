'use client';

import { Account } from "@/lib/types";

interface AccountsTableClientProps {
    accounts: Account[];
    timeRange: string;
}

export function AccountsTableClient({ accounts, timeRange }: AccountsTableClientProps) {

    const parseTimeRange = (range: string): number => {
        const value = parseInt(range);
        if (range.endsWith("d")) {
            return value;
        } else if (range.endsWith("m")) {
            // Assuming 'm' means months, approximate to 30 days per month
            return value * 30;
        } else if (range.endsWith("y")) {
            // Assuming 'y' means years, approximate to 365 days per year
            return value * 365;
        }
        return value; // Default to days if no suffix or invalid suffix
    };

    // Helper to get balance X days ago
    const getAccountBalanceChange = (account: Account) => {
        if (!account.balanceHistory || account.balanceHistory.length < 2) {
            return { value: "N/A", className: "" };
        }

        const days = parseTimeRange(timeRange);

        const currentDate = new Date(account["balance-date"] * 1000);
        currentDate.setHours(0, 0, 0, 0); // Normalize to start of the day

        const targetDate = new Date(currentDate);
        targetDate.setDate(currentDate.getDate() - days);
        targetDate.setHours(0, 0, 0, 0); // Normalize to start of the day

        let closestBalanceAtTargetDate: { date: string; balance: number } | undefined = undefined;
        let minDiff = Infinity;

        // Find the closest historical balance to the target date
        for (const historyItem of account.balanceHistory) {
            const historyDate = new Date(historyItem.date);
            historyDate.setHours(0, 0, 0, 0); // Normalize to start of the day
            const diff = Math.abs(targetDate.getTime() - historyDate.getTime());

            if (diff < minDiff) {
                minDiff = diff;
                closestBalanceAtTargetDate = historyItem;
            }
        }

        if (!closestBalanceAtTargetDate) {
            return { value: "N/A", className: "" };
        }

        const currentBalance = parseFloat(account.balance);
        const pastBalance = closestBalanceAtTargetDate.balance;

        if (pastBalance === 0) {
            return { value: "N/A", className: "" }; // Avoid division by zero
        }

        const percentageChange = ((currentBalance - pastBalance) / pastBalance) * 100;
        const isPositive = percentageChange >= 0;
        const sign = isPositive ? "+" : "";
        const className = isPositive ? "text-green-700" : "text-red-700";

        return {
            value: `${sign}${percentageChange.toFixed(2)}%`,
            className: className
        };
    };

    return (
        <div className="p-4">
            {accounts.map((account) => (
                <div key={account.id} className="border-b py-2">
                    <div className="flex w-full items-center justify-between text-left font-medium">
                        <div className="flex items-center space-x-2">
                            {account.name}
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="">
                                {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: account.currency || 'USD',
                                }).format(parseFloat(account.balance))}
                            </span>
                        </div>
                    </div>
                    <div className="pt-1 text-sm text-neutral-600">
                        <div className="flex justify-between">
                            {account.type}
                            <span className={getAccountBalanceChange(account).className}>
                                {getAccountBalanceChange(account).value}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}