"use client"

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Pie, PieChart, Cell } from "recharts";

type ChartType = "cumulative" | "pie";

type ApiResponse = {
    chart: ChartType;
    rows: any[];
    sql: string;
    error?: string;
};

const COLORS = [
    "oklch(62% 0.15 155)",
    "oklch(62% 0.15 240)",
    "oklch(62% 0.13 300)",
    "oklch(62% 0.14 200)",
    "oklch(62% 0.14 260)",
    "oklch(62% 0.14 20)",
    "oklch(62% 0.14 340)",
    "oklch(62% 0.14 120)",
];

export default function InsightsClient() {
    const [prompt, setPrompt] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [data, setData] = React.useState<ApiResponse | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch("/api/ai-insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            const json: ApiResponse = await res.json();
            if (!res.ok) {
                throw new Error(json?.error || "Failed to generate insight");
            }
            setData(json);
        } catch (err: any) {
            setError(err?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const EmptyChartSpace = () => (
        <div className="sm:px-4">
            <div className="aspect-auto h-[300px] max-sm:h-[220px] w-full" />
        </div>
    );

    const renderChart = () => {
        if (!data) return <EmptyChartSpace />;
        if (data.chart === "cumulative") {
            // Expect rows to include: date, and one or more series columns
            const rows = data.rows as any[];
            if (!rows.length) return <EmptyChartSpace />;
            const categories = Object.keys(rows[0]).filter((k) => k !== "date");
            const chartConfig: any = {};
            categories.forEach((cat, idx) => {
                chartConfig[cat] = { label: cat, color: COLORS[idx % COLORS.length] };
            });
            const tooltipFormatter = ((value: any, name: any, item: any, _index: number, p: any) => {
                const indicatorColor = item?.payload?.stroke || item?.color;
                const key = String(name);
                const labelText = chartConfig[key]?.label ?? key;
                const numericValue = Number(value);
                const sum = Array.isArray(categories) && p
                    ? categories.reduce((acc, cat) => acc + (Number(p?.[cat]) || 0), 0)
                    : 0;
                const percent = sum > 0 ? numericValue / sum : 0;
                return (
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)"
                                style={{ backgroundColor: indicatorColor, borderColor: indicatorColor }}
                            />
                            <span className="text-neutral-500 dark:text-neutral-400">
                                {labelText} ({Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 }).format(percent)})
                            </span>
                        </div>
                        <div className="flex items-center gap-2 ml-8">
                            <span className="text-neutral-950 font-mono font-medium tabular-nums dark:text-neutral-50">
                                {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(numericValue)}
                            </span>
                        </div>
                    </div>
                );
            }) as any;

            return (
                <div className="sm:px-4">
                    <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
                        <AreaChart data={rows}>
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(_, payload) => {
                                            if (!payload || payload.length === 0) return "";
                                            const row = payload[0].payload as any;
                                            const dateValue = row.date;
                                            const total = Array.isArray(categories)
                                                ? categories.reduce((acc, cat) => acc + (Number(row?.[cat]) || 0), 0)
                                                : 0;
                                            return (
                                                <div className="flex justify-between w-full pb-2 text-neutral-950 dark:text-neutral-50">
                                                    <p>
                                                        {new Date(String(dateValue) + "T00:00:00").toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </p>
                                                    <p className="font-mono">
                                                        {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total)}
                                                    </p>
                                                </div>
                                            );
                                        }}
                                        indicator="dot"
                                        formatter={tooltipFormatter}
                                    />
                                }
                            />
                            {categories.map((cat) => (
                                <Area
                                    key={cat}
                                    dataKey={cat}
                                    type="bump"
                                    stroke={chartConfig[cat]?.color}
                                    fill={chartConfig[cat]?.color}
                                    fillOpacity={0.15}
                                    strokeWidth={2}
                                    dot={false}
                                    stackId={1}
                                />
                            ))}
                            <ChartLegend content={<ChartLegendContent />} className="max-sm:hidden text-neutral-950 dark:text-neutral-50" />
                        </AreaChart>
                    </ChartContainer>
                </div>
            );
        }
        if (data.chart === "pie") {
            // Expect rows with label and value columns; try to infer keys
            const rows = data.rows as any[];
            if (!rows.length) return <EmptyChartSpace />;
            const first = rows[0];
            const keys = Object.keys(first);
            const labelKey = keys.find((k) => /label|name|category|payee/i.test(k)) || keys[0];
            const valueKey = keys.find((k) => /value|amount|total|sum/i.test(k)) || keys[1] || keys[0];
            const total = rows.reduce((acc, r) => acc + Number(r?.[valueKey] || 0), 0);
            return (
                <div className="sm:px-4">
                    <ChartContainer config={{}} className="aspect-auto h-[300px] w-full">
                        <PieChart>
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        formatter={(value: any, name: any) => {
                                            const numericValue = Number(value);
                                            const pct = total > 0 ? numericValue / total : 0;
                                            return (
                                                <div className="flex w-full items-center justify-between">
                                                    <span className="text-neutral-500 dark:text-neutral-400">{name}</span>
                                                    <span className="text-neutral-950 font-mono font-medium tabular-nums dark:text-neutral-50">
                                                        {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(numericValue)} ({Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 }).format(pct)})
                                                    </span>
                                                </div>
                                            );
                                        }}
                                    />
                                }
                            />
                            <Pie data={rows} dataKey={valueKey} nameKey={labelKey} outerRadius={120}>
                                {rows.map((_e, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid min-h-[100svh] grid-rows-[1fr_auto]">
            <div className="flex flex-col gap-2 overflow-auto">
                {error ? (
                    <div className="px-4 text-sm text-red-600 dark:text-red-400">{error}</div>
                ) : null}

                {renderChart()}
            </div>

            <form onSubmit={onSubmit} className="p-4 flex gap-2">
                <Input
                    placeholder="Ask: show me my spending on Amazon over time"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <Button type="submit" disabled={loading || !prompt.trim()}>
                    {loading ? "Thinking..." : "Generate"}
                </Button>
            </form>
        </div>
    );
}


