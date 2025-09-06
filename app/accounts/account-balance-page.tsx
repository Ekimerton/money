"use client"

import * as React from "react"
import { TimeRangeSelect } from "@/components/time-range-select"
import { MobileTimeRangeTabs } from "@/components/mobile-time-range-tabs"
import { Account } from "@/lib/types";
// import { AccountBalanceChart } from "./account-balance-chart";
import { CashSavingsInvestmentsChart } from "./cash-savings-investments-chart";
import { AccountsTableClient } from "./accounts-table-client";

export function AccountBalancePage({ accounts }: { accounts: Account[] }) {
    const [timeRange, setTimeRange] = React.useState("30d");
    const chartView = "account";

    const fullChartData = React.useMemo(() => {
        const dailyData: { [date: string]: { [key: string]: number } } = {};

        accounts.forEach(account => {
            account.balanceHistory?.forEach(history => {
                const date = new Date(history.date).toISOString().split('T')[0];
                if (!dailyData[date]) {
                    dailyData[date] = {};
                }
                if (chartView === "account") {
                    dailyData[date][account.id] = history.balance;
                } else if (chartView === "accountType") {
                    dailyData[date][account.type] = (dailyData[date][account.type] || 0) + history.balance;
                }
            });
        });

        // Calculate total balance for each day and ensure all accounts are present
        const dates = Array.from(new Set(accounts.flatMap(acc => acc.balanceHistory?.map(h => new Date(h.date).toISOString().split('T')[0]) || [])))
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        const processedData = dates.map(date => {
            let totalBalance = 0;
            const dateEntry: { date: string; totalBalance: number;[key: string]: number | string } = { date, totalBalance: 0 };

            if (chartView === "account") {
                accounts.forEach(account => {
                    const balanceForDate = dailyData[date]?.[account.id] || 0;
                    dateEntry[account.id] = balanceForDate;
                    totalBalance += balanceForDate;
                });
            } else if (chartView === "accountType") {
                const accountTypes = Array.from(new Set(accounts.map(a => a.type)));
                accountTypes.forEach(type => {
                    const balanceForType = dailyData[date]?.[type] || 0;
                    dateEntry[type] = balanceForType;
                    totalBalance += balanceForType;
                });
            }

            dateEntry.totalBalance = totalBalance;
            return dateEntry;
        });
        return processedData;
    }, [accounts, chartView]);

    const startDateStr = React.useMemo(() => {
        let daysToSubtract = 90;
        if (timeRange === "30d") {
            daysToSubtract = 30;
        } else if (timeRange === "7d") {
            daysToSubtract = 7;
        } else if (timeRange === "365d") {
            daysToSubtract = 365;
        }
        const now = new Date();
        const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const startUTC = new Date(utcMidnight);
        startUTC.setUTCDate(startUTC.getUTCDate() - daysToSubtract);
        return startUTC.toISOString().split("T")[0];
    }, [timeRange]);

    const filteredData = fullChartData.filter((item) => item.date >= startDateStr);

    const finalNetWorth = filteredData[filteredData.length - 1]?.totalBalance || 0;
    const startNetWorth = filteredData[0]?.totalBalance || 0;
    const changeNetWorth = finalNetWorth - startNetWorth;
    const isInfinitePercent = startNetWorth === 0;
    const percentChangeRounded = isInfinitePercent ? 0 : Math.round(changeNetWorth / startNetWorth * 100);
    const changeSign = changeNetWorth > 0 ? "+" : changeNetWorth < 0 ? "-" : "";
    const formattedAbsChange = Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(changeNetWorth));
    const formattedPercentChange = isInfinitePercent ? "---" : `${changeSign}${Math.abs(percentChangeRounded)}%`;

    return (
        <div className="">
            <div className="p-4 flex max-sm:pt-12">
                <div className="grid flex-1 gap-1 max-sm:text-center ">
                    <h2 className="font-bold text-muted-foreground uppercase text-sm font-mono max-sm:hidden">
                        Net Worth
                    </h2>
                    <h1 className="text-2xl font-bold max-sm:text-4xl text-neutral-900 dark:text-neutral-100">
                        {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(finalNetWorth)}
                        <span className={`text-base ml-2 font-mono max-sm:hidden ${changeNetWorth > 0 ? "text-green-700" : changeNetWorth < 0 ? "text-red-700" : "text-neutral-500"} `}>
                            {changeSign}
                            {formattedAbsChange}
                            {" "}
                            <span className={isInfinitePercent ? "text-neutral-500" : ""}>({formattedPercentChange})</span>
                        </span>
                    </h1>
                    <h2 className={`text-base ml-2 font-medium font-mono sm:hidden ${changeNetWorth > 0 ? "text-green-700" : changeNetWorth < 0 ? "text-red-700" : ""}`}>
                        {changeSign}
                        {formattedAbsChange}
                        {" "}
                        <span className={isInfinitePercent ? "text-neutral-500" : ""}>({formattedPercentChange})</span>
                    </h2>
                </div>
                <div className="flex gap-2">
                    <TimeRangeSelect value={timeRange as any} onValueChange={setTimeRange as any} />
                </div>
            </div >
            <CashSavingsInvestmentsChart accounts={accounts} timeRange={timeRange} />
            <MobileTimeRangeTabs value={timeRange as any} onValueChange={setTimeRange as any} />
            <AccountsTableClient accounts={accounts} timeRange={timeRange} />
        </div >
    )
}
