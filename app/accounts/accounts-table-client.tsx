'use client';

import { Account } from "@/lib/types";

interface AccountsTableClientProps {
    accounts: Account[];
    timeRange: string;
}

export function AccountsTableClient({ accounts, timeRange }: AccountsTableClientProps) {

    // Match the time window semantics used in `account-balance-page.tsx`
    const getDaysForTimeRange = (range: string): number => {
        switch (range) {
            case "7d":
                return 7;
            case "30d":
                return 30;
            case "365d":
                return 365;
            case "90d":
            default:
                return 90;
        }
    };

    // Compute percent change using first and last history entries inside the selected time window
    const getAccountBalanceChange = (account: Account) => {
        const history = (account.balanceHistory || [])
            .map((h) => ({ ...h, dateObj: new Date(h.date) }))
            .filter((h) => !isNaN(h.dateObj.getTime()))
            .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

        if (history.length === 0) {
            return { percentValue: "N/A", className: "" };
        }

        const daysToSubtract = getDaysForTimeRange(timeRange);
        const referenceDate = new Date();
        referenceDate.setHours(0, 0, 0, 0);
        const startDate = new Date(referenceDate);
        startDate.setDate(startDate.getDate() - daysToSubtract);
        startDate.setHours(0, 0, 0, 0);

        const historyInRange = history.filter((h) => h.dateObj >= startDate);

        // If there is at least one point, use first and last within the range.
        // If there is exactly one point, change is 0.
        // If there are none in range, mirror page semantics by treating change as 0.
        let startBalance = 0;
        let endBalance = 0;

        if (historyInRange.length >= 2) {
            startBalance = historyInRange[0].balance;
            endBalance = historyInRange[historyInRange.length - 1].balance;
        } else if (historyInRange.length === 1) {
            startBalance = historyInRange[0].balance;
            endBalance = historyInRange[0].balance;
        } else {
            // No data in the selected range
            return { percentValue: "N/A", className: "" };
        }

        const change = endBalance - startBalance;
        const className = change > 0 ? "text-green-700" : change < 0 ? "text-red-700" : "";

        // Percent display rules
        if (startBalance === 0) {
            if (change > 0) return { percentValue: "+∞%", className };
            if (change < 0) return { percentValue: "-∞%", className };
            return { percentValue: "0%", className: "" };
        }

        const percentageChange = Math.round((change / startBalance) * 100);
        const percentSign = change > 0 ? "+" : change < 0 ? "-" : "";
        const percentValue = `${percentSign}${Math.abs(percentageChange)}%`;

        return { percentValue, className };
    };

    return (
        <div className="p-4">
            {accounts.map((account) => {
                const change = getAccountBalanceChange(account);
                return (
                    <div key={account.id} className="border-b last:border-b-0 py-2">
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
                                <span className={change.className}>{change.percentValue}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}