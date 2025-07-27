"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

interface Account {
    id: string;
    name: string;
    currency: string;
    balance: string;
    "balance-date": number;
    type: string;
    balanceHistory?: { date: string; balance: number }[];
}

export const description = "An area chart with axes"

const COLORS = [
    "hsl(240, 80%, 20%)", // Darkest blue
    "hsl(240, 75%, 30%)",
    "hsl(240, 70%, 40%)",
    "hsl(240, 65%, 50%)",
    "hsl(240, 60%, 60%)",
    "hsl(240, 55%, 70%)",
    "hsl(240, 50%, 80%)",
    "hsl(240, 45%, 90%)"  // Lightest blue
];

interface StackedAccountsChartProps {
    accounts: Account[];
}

export function StackedAccountsChart({ accounts }: StackedAccountsChartProps) {
    const generateChartData = () => {
        // Using 'any' as a temporary workaround for persistent TypeScript errors.
        // A more robust type definition might be explored later if desired.
        type ChartDataPoint = any;

        const chartDataMap: { [date: string]: ChartDataPoint } = {};
        const allDates: Set<string> = new Set();

        accounts.forEach(account => {
            account.balanceHistory?.forEach(entry => {
                allDates.add(entry.date);
            });
        });

        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        sortedDates.forEach(date => {
            const newDailyDataPoint: ChartDataPoint = {
                date: date,
                ...Object.fromEntries(accounts.map(account => [account.id, 0]))
            };
            chartDataMap[date] = newDailyDataPoint;
        });

        accounts.forEach(account => {
            account.balanceHistory?.forEach(entry => {
                if (entry.balance !== null) {
                    chartDataMap[entry.date][account.id] = entry.balance;
                }
            });
        });

        let processedChartData: ChartDataPoint[] = sortedDates.map(date => {
            return chartDataMap[date];
        });

        const weeklyChartDataMap: { [weekKey: string]: ChartDataPoint } = {};

        processedChartData.forEach(dataPoint => {
            const date = new Date(dataPoint.date);
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const weekKey = startOfWeek.toISOString().split('T')[0];

            if (!weeklyChartDataMap[weekKey]) {
                weeklyChartDataMap[weekKey] = {
                    date: weekKey,
                    ...Object.fromEntries(accounts.map(account => [account.id, dataPoint[account.id]]))
                };
            }
        });

        const sortedWeeklyChartData = Object.keys(weeklyChartDataMap)
            .map(weekKey => {
                const dataPoint = weeklyChartDataMap[weekKey];
                accounts.forEach(account => {
                    dataPoint[account.id] = parseFloat(dataPoint[account.id].toFixed(2));
                });
                return dataPoint;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return sortedWeeklyChartData.slice(Math.max(0, sortedWeeklyChartData.length - 13)); // Changed to 13 weeks for 3 months
    };

    const chartData = generateChartData();

    const chartConfig: ChartConfig = accounts.reduce((acc, account, index) => {
        acc[account.id] = {
            label: account.name,
            color: COLORS[index % COLORS.length],
        };
        return acc;
    }, {} as ChartConfig);

    const totalCurrentBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Historical Account Balances</CardTitle>
                <CardDescription>
                    Total balance: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCurrentBalance)}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => {
                                return new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                }).format(value);
                            }}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />}>
                        </ChartTooltip>
                        {accounts.map((account, index) => (
                            <Area
                                key={account.id}
                                dataKey={account.id}
                                type="natural"
                                fill={COLORS[index % COLORS.length]}
                                fillOpacity={0.4}
                                stroke={COLORS[index % COLORS.length]}
                                stackId="a" // This ensures the areas stack
                            />
                        ))}
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
