"use client"

import * as React from "react"
import { Line, LineChart, CartesianAxis } from "recharts"

import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Account } from "@/lib/types";

const COLORS = [
    "oklch(28.2% 0.091 267.935)",
    "oklch(37.9% 0.146 265.522)",
    "oklch(42.4% 0.199 265.638)",
    "oklch(48.8% 0.243 264.376)",
    "oklch(54.6% 0.245 262.881)",
];

export function AccountBalanceChart({
    filteredData,
    dynamicChartConfig,
    chartView,
    sortedAccountsByName,
    sortedAccountTypesByName
}: {
    filteredData: any[];
    dynamicChartConfig: ChartConfig;
    chartView: "account" | "accountType";
    sortedAccountsByName: Account[];
    sortedAccountTypesByName: string[];
}) {
    return (
        <div className="sm:px-6">
            <ChartContainer
                config={dynamicChartConfig} // Use dynamic config here
                className="aspect-auto h-[300px] max-sm:h-[300px] w-full"
            >
                <LineChart data={filteredData}>
                    <ChartTooltip
                        cursor={false}
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, payload) => {
                                    if (!payload || payload.length === 0) return "";
                                    const dateValue = payload[0].payload.date;
                                    return new Date(dateValue + 'T00:00:00').toLocaleDateString("en-US", {
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
        </div >
    )
}
