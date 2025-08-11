"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Account {
    id: string;
    name: string;
    currency: string;
    balance: string;
    "balance-date": number;
    type: string;
    balanceHistory?: { date: string; balance: number }[];
}

export const description = "An interactive area chart"

const COLORS = [
    "oklch(28.2% 0.091 267.935)",
    "oklch(37.9% 0.146 265.522)",
    "oklch(42.4% 0.199 265.638)",
    "oklch(48.8% 0.243 264.376)",
    "oklch(54.6% 0.245 262.881)",
];

const chartConfig = {
    totalBalance: {
        label: "Net Worth",
        color: "oklch(82.8% 0.111 230.318)",
    },
} satisfies ChartConfig;

export function AccountBalanceChart({ accounts }: { accounts: Account[] }) {
    const [timeRange, setTimeRange] = React.useState("90d");
    const [chartView, setChartView] = React.useState<"account" | "accountType">("account");

    const sortedAccountsByName = React.useMemo(() => {
        return [...accounts].sort((a, b) => a.name.localeCompare(b.name));
    }, [accounts]);

    const sortedAccountTypesByName = React.useMemo(() => {
        return Array.from(new Set(accounts.map(a => a.type))).sort((a, b) => a.localeCompare(b));
    }, [accounts]);

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

    // Dynamically add account configurations to chartConfig
    const dynamicChartConfig = React.useMemo(() => {
        const newConfig: ChartConfig = { ...chartConfig };
        if (chartView === "account") {
            accounts.forEach((account, index) => {
                newConfig[account.id] = {
                    label: account.name,
                    color: COLORS[index % COLORS.length], // Use gradient colors
                };
            });
        } else if (chartView === "accountType") {
            const accountTypes = Array.from(new Set(accounts.map(a => a.type)));
            accountTypes.forEach((type, index) => {
                newConfig[type] = {
                    label: type,
                    color: COLORS[index % COLORS.length],
                };
            });
        }
        return newConfig;
    }, [accounts, chartView]);

    const filteredData = fullChartData.filter((item) => {
        const date = new Date(item.date);
        const referenceDate = new Date();
        let daysToSubtract = 90;
        if (timeRange === "30d") {
            daysToSubtract = 30;
        } else if (timeRange === "7d") {
            daysToSubtract = 7;
        } else if (timeRange === "365d") {
            daysToSubtract = 365;
        }
        const startDate = new Date(referenceDate);
        startDate.setDate(startDate.getDate() - daysToSubtract);
        return date >= startDate;
    });

    const finalNetWorth = filteredData[filteredData.length - 1].totalBalance;
    const startNetWorth = filteredData[0].totalBalance;
    const changeNetWorth = finalNetWorth - startNetWorth;
    const percentChangeRounded = Math.round(changeNetWorth / startNetWorth * 100);

    return (
        <Card className="pt-0 gap-0">
            <CardHeader className="flex items-center gap-2 space-y-0 py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardDescription className="font-bold text-muted-foreground uppercase text-sm font-mono">
                        Net Worth
                    </CardDescription>
                    <CardTitle className="text-2xl font-bold">
                        {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(filteredData[filteredData.length - 1].totalBalance)}
                        <span className={`text-sm ml-2 font-mono ${changeNetWorth > 0 ? "text-green-700" : "text-red-700"}`}>
                            {changeNetWorth > 0 ? "+" : "-"}
                            {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(changeNetWorth)}
                            {" "}({percentChangeRounded}%)
                        </span>
                    </CardTitle>
                </div>
                <Select value={chartView} onValueChange={(value: "account" | "accountType") => setChartView(value)}>
                    <SelectTrigger
                        className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                        aria-label="Select a view type"
                    >
                        <SelectValue placeholder="Select View" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="account" className="rounded-lg">
                            By Account
                        </SelectItem>
                        <SelectItem value="accountType" className="rounded-lg">
                            By Account Type
                        </SelectItem>
                    </SelectContent>
                </Select>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger
                        className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                        aria-label="Select a value"
                    >
                        <SelectValue placeholder="Last 3 months" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="365d" className="rounded-lg">
                            Last 12 months
                        </SelectItem>
                        <SelectItem value="90d" className="rounded-lg">
                            Last 3 months
                        </SelectItem>
                        <SelectItem value="30d" className="rounded-lg">
                            Last 30 days
                        </SelectItem>
                        <SelectItem value="7d" className="rounded-lg">
                            Last 7 days
                        </SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
                <ChartContainer
                    config={dynamicChartConfig} // Use dynamic config here
                    className="aspect-auto h-[300px] w-full"
                >
                    <LineChart data={filteredData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={20}
                            tickCount={5}
                            className="max-sm:hidden"
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                    }}
                                    indicator="dot"
                                />
                            }
                        />
                        {/* Net Worth first in legend */}
                        <Line
                            dataKey="totalBalance"
                            type="natural"
                            stroke="oklch(82.8% 0.111 230.318)" // Black color
                            dot={false}
                            strokeWidth={2}
                        />
                        {chartView === "account" && sortedAccountsByName.map((account, index) => (
                            <Line
                                key={account.id}
                                dataKey={account.id}
                                type="natural"
                                stroke={COLORS[index % COLORS.length]} // Use gradient colors
                                dot={false}
                                strokeWidth={2}
                            />
                        ))}
                        {chartView === "accountType" && sortedAccountTypesByName.map((type, index) => (
                            <Line
                                key={type}
                                dataKey={type}
                                type="natural"
                                stroke={COLORS[index % COLORS.length]}
                                dot={false}
                                strokeWidth={2}
                            />
                        ))}
                        <ChartLegend content={<ChartLegendContent />} className="max-sm:hidden" />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
