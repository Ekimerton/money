"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Area,
    AreaChart,
    Pie,
    PieChart,
    Cell,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import {
    Collapsible,
    CollapsibleContent,
} from "@/components/ui/collapsible";
import {
    Sparkles,
    ArrowUp,
    Loader2,
    Trash2,
    Code2,
    Copy,
    Check,
    BarChart3,
    PieChart as PieChartIcon,
    TrendingUp,
    Table as TableIcon,
    ArrowDown,
    RotateCcw,
    ArrowLeft,
    Layers,
    ChevronRight,
    MessageSquare,
} from "lucide-react";
import type {
    InsightChartPayload,
    InsightChartType,
    InsightChatMessage,
    InsightThread,
} from "@/lib/settings";

export type ChartType = InsightChartType;
type ViewMode = ChartType | "table";
export type ChartPayload = InsightChartPayload;
type ChatMessage = InsightChatMessage;

const COLORS = [
    "oklch(62% 0.15 155)",
    "oklch(62% 0.15 240)",
    "oklch(62% 0.13 300)",
    "oklch(62% 0.14 200)",
    "oklch(62% 0.14 45)",
    "oklch(62% 0.14 20)",
    "oklch(62% 0.14 340)",
    "oklch(62% 0.14 120)",
];

const formatLabel = (str: string) => {
    if (!str) return "";
    return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatCurrency = (val: number) =>
    Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: Math.abs(val) >= 100 ? 0 : 2,
    }).format(val);

const formatCompactCurrency = (val: number) => {
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `$${(val / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
    return `$${Math.round(val)}`;
};

function formatDateAxis(val: any, isMonthly: boolean): string {
    const s = String(val ?? "").trim();
    if (!s) return "";
    if (/^\d{4}-\d{2}$/.test(s)) {
        const d = new Date(`${s}-01T00:00:00`);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const d = new Date(`${s}T00:00:00`);
        if (!isNaN(d.getTime())) {
            if (isMonthly) {
                return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
            }
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
    }
    return s;
}

function formatDateTooltip(val: any, isMonthly: boolean): string {
    const s = String(val ?? "").trim();
    if (!s) return "";
    if (/^\d{4}-\d{2}$/.test(s)) {
        const d = new Date(`${s}-01T00:00:00`);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const d = new Date(`${s}T00:00:00`);
        if (!isNaN(d.getTime())) {
            if (isMonthly) {
                return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
            }
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        }
    }
    return s;
}

/**
 * Normalizes SQL result rows into a structure suitable for time-series or categorical charts.
 * Automatically pivots 3-column (date, series, value) long-format rows into wide format.
 */
function normalizeChartData(rawRows: any[], targetMode: ChartType) {
    if (!Array.isArray(rawRows) || rawRows.length === 0) {
        return {
            isTimeSeries: false,
            dateKey: "date",
            categories: [] as string[],
            labelKey: "label",
            valueKey: "value",
            rows: [] as any[],
            isMonthly: false,
            grandTotal: 0,
        };
    }

    const keys = Object.keys(rawRows[0]);
    const dateKey =
        keys.find((k) => /^(date|day|month|week|year|period|posted|transacted_at)$/i.test(k)) ||
        "date";
    const hasDateKey = keys.includes(dateKey);

    if (hasDateKey && targetMode !== "pie") {
        const otherKeys = keys.filter((k) => k !== dateKey);

        let workingRows = rawRows;
        let seriesCategories = otherKeys;

        if (otherKeys.length === 2) {
            const [k1, k2] = otherKeys;
            const sample = rawRows.find((r) => r[k1] != null && r[k2] != null) || rawRows[0];
            const k1IsNum = !isNaN(Number(sample?.[k1])) && typeof sample?.[k1] !== "boolean";
            const k2IsNum = !isNaN(Number(sample?.[k2])) && typeof sample?.[k2] !== "boolean";

            if (!k1IsNum && k2IsNum) {
                const pivotMap = new Map<string, Record<string, any>>();
                const catTotals: Record<string, number> = {};
                for (const r of rawRows) {
                    const dVal = String(r[dateKey] ?? "");
                    const catVal = String(r[k1] ?? "Other");
                    const numVal = Number(r[k2] ?? 0) || 0;
                    if (!pivotMap.has(dVal)) {
                        pivotMap.set(dVal, { [dateKey]: dVal });
                    }
                    const entry = pivotMap.get(dVal)!;
                    entry[catVal] = (entry[catVal] || 0) + numVal;
                    catTotals[catVal] = (catTotals[catVal] || 0) + numVal;
                }
                seriesCategories = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);
                workingRows = Array.from(pivotMap.values()).map((entry) => {
                    const filled: Record<string, any> = { [dateKey]: entry[dateKey] };
                    for (const c of seriesCategories) {
                        filled[c] = Number(entry[c] || 0);
                    }
                    return filled;
                });
            }
        } else {
            workingRows = rawRows.map((r) => {
                const copy: Record<string, any> = { [dateKey]: r[dateKey] };
                for (const c of seriesCategories) {
                    copy[c] = Number(r[c] ?? 0) || 0;
                }
                return copy;
            });
        }

        workingRows = [...workingRows].sort((a, b) =>
            String(a[dateKey] ?? "").localeCompare(String(b[dateKey] ?? ""))
        );

        const isMonthly =
            workingRows.length > 1 &&
            workingRows.every(
                (r) =>
                    /^\d{4}-\d{2}-01$/.test(String(r[dateKey] ?? "")) ||
                    /^\d{4}-\d{2}$/.test(String(r[dateKey] ?? ""))
            );

        let grandTotal = 0;
        for (const r of workingRows) {
            for (const c of seriesCategories) {
                grandTotal += Number(r[c] || 0);
            }
        }

        return {
            isTimeSeries: true,
            dateKey,
            categories: seriesCategories,
            labelKey: dateKey,
            valueKey: seriesCategories[0] || "value",
            rows: workingRows,
            isMonthly,
            grandTotal,
        };
    }

    if (hasDateKey && targetMode === "pie") {
        const otherKeys = keys.filter((k) => k !== dateKey);
        if (otherKeys.length > 1) {
            const sums: Record<string, number> = {};
            for (const r of rawRows) {
                for (const c of otherKeys) {
                    sums[c] = (sums[c] || 0) + (Number(r[c]) || 0);
                }
            }
            const pieRows = Object.entries(sums)
                .map(([label, value]) => ({ label: formatLabel(label), value }))
                .filter((r) => r.value > 0)
                .sort((a, b) => b.value - a.value);
            const grandTotal = pieRows.reduce((acc, r) => acc + r.value, 0);
            return {
                isTimeSeries: false,
                dateKey,
                categories: ["value"],
                labelKey: "label",
                valueKey: "value",
                rows: pieRows,
                isMonthly: false,
                grandTotal,
            };
        }
    }

    const labelKey =
        keys.find((k) => /label|name|category|payee|merchant|account|type/i.test(k)) || keys[0];
    const valueKey =
        keys.find((k) => k !== labelKey && /value|amount|total|spend|sum|balance|count/i.test(k)) ||
        keys.find((k) => k !== labelKey) ||
        keys[0];

    const normalizedRows = rawRows.map((r) => ({
        ...r,
        [labelKey]: formatLabel(String(r[labelKey] ?? "Unknown")),
        [valueKey]: Number(r[valueKey] ?? 0) || 0,
    }));

    const grandTotal = normalizedRows.reduce((acc, r) => acc + (Number(r[valueKey]) || 0), 0);

    return {
        isTimeSeries: false,
        dateKey,
        categories: [valueKey],
        labelKey,
        valueKey,
        rows: normalizedRows,
        isMonthly: false,
        grandTotal,
    };
}

/**
 * Lightweight, zero-dependency Markdown renderer for financial insights responses
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
    return parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            return (
                <strong key={idx} className="font-semibold text-neutral-950 dark:text-neutral-50">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
            return (
                <code
                    key={idx}
                    className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-xs text-neutral-800 dark:text-neutral-200"
                >
                    {part.slice(1, -1)}
                </code>
            );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return (
                <em key={idx} className="italic">
                    {part.slice(1, -1)}
                </em>
            );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
}

function MarkdownContent({ content }: { content: string }) {
    if (!content) return null;
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
            i++;
            continue;
        }

        // Code block
        if (trimmed.startsWith("```")) {
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            i++;
            elements.push(
                <pre
                    key={`code-${i}`}
                    className="my-2.5 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70 p-3 font-mono text-xs text-neutral-800 dark:text-neutral-200"
                >
                    {codeLines.join("\n")}
                </pre>
            );
            continue;
        }

        // Markdown Table
        if (
            trimmed.startsWith("|") &&
            i + 1 < lines.length &&
            /^\s*\|?[\s:-]+\|/.test(lines[i + 1])
        ) {
            const parseRow = (rowStr: string) =>
                rowStr
                    .trim()
                    .replace(/^\|/, "")
                    .replace(/\|$/, "")
                    .split("|")
                    .map((c) => c.trim());

            const headers = parseRow(lines[i]);
            i += 2;
            const bodyRows: string[][] = [];
            while (i < lines.length && lines[i].trim().startsWith("|")) {
                bodyRows.push(parseRow(lines[i]));
                i++;
            }
            elements.push(
                <div
                    key={`table-${i}`}
                    className="my-3 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800"
                >
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead className="bg-neutral-100/80 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                {headers.map((h, hIdx) => (
                                    <th
                                        key={hIdx}
                                        className="px-3 py-2 font-semibold text-neutral-700 dark:text-neutral-300"
                                    >
                                        {renderInlineMarkdown(h)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
                            {bodyRows.map((row, rIdx) => (
                                <tr
                                    key={rIdx}
                                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40"
                                >
                                    {row.map((cell, cIdx) => (
                                        <td
                                            key={cIdx}
                                            className="px-3 py-2 text-neutral-700 dark:text-neutral-300"
                                        >
                                            {renderInlineMarkdown(cell)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            continue;
        }

        // Headings
        if (trimmed.startsWith("### ")) {
            elements.push(
                <h4
                    key={`h3-${i}`}
                    className="mt-3 mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100"
                >
                    {renderInlineMarkdown(trimmed.slice(4))}
                </h4>
            );
            i++;
            continue;
        }
        if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
            const text = trimmed.replace(/^#+\s*/, "");
            elements.push(
                <h3
                    key={`h2-${i}`}
                    className="mt-3.5 mb-1.5 text-base font-semibold text-neutral-950 dark:text-neutral-50"
                >
                    {renderInlineMarkdown(text)}
                </h3>
            );
            i++;
            continue;
        }

        // Unordered list
        if (/^[-*•]\s+/.test(trimmed)) {
            const items: string[] = [];
            while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
                items.push(lines[i].trim().replace(/^[-*•]\s+/, ""));
                i++;
            }
            elements.push(
                <ul
                    key={`ul-${i}`}
                    className="my-2 space-y-1.5 pl-4 list-disc marker:text-neutral-400 dark:marker:text-neutral-500"
                >
                    {items.map((item, idx) => (
                        <li
                            key={idx}
                            className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
                        >
                            {renderInlineMarkdown(item)}
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Ordered list
        if (/^\d+\.\s+/.test(trimmed)) {
            const items: string[] = [];
            while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
                items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
                i++;
            }
            elements.push(
                <ol
                    key={`ol-${i}`}
                    className="my-2 space-y-1.5 pl-5 list-decimal marker:text-neutral-400 dark:marker:text-neutral-500"
                >
                    {items.map((item, idx) => (
                        <li
                            key={idx}
                            className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
                        >
                            {renderInlineMarkdown(item)}
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // Paragraph
        elements.push(
            <p
                key={`p-${i}`}
                className="my-1.5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
            >
                {renderInlineMarkdown(trimmed)}
            </p>
        );
        i++;
    }

    return <div className="space-y-1">{elements}</div>;
}

/**
 * Embedded interactive chart card rendered inside an assistant turn
 */
function EmbeddedChartCard({ chartPayload }: { chartPayload: ChartPayload }) {
    const [viewMode, setViewMode] = React.useState<ViewMode>(chartPayload.chart);
    const [sqlOpen, setSqlOpen] = React.useState(false);
    const [copiedSql, setCopiedSql] = React.useState(false);

    const activeChartType: ChartType = viewMode === "table" ? chartPayload.chart : viewMode;

    const normalized = React.useMemo(() => {
        const base = normalizeChartData(chartPayload.rows, activeChartType);
        if (
            activeChartType === "cumulative" &&
            chartPayload.chart !== "cumulative" &&
            base.isTimeSeries
        ) {
            const running: Record<string, number> = {};
            const cumRows = base.rows.map((r) => {
                const nextRow: Record<string, any> = { [base.dateKey]: r[base.dateKey] };
                for (const c of base.categories) {
                    running[c] = (running[c] || 0) + (Number(r[c]) || 0);
                    nextRow[c] = running[c];
                }
                return nextRow;
            });
            return { ...base, rows: cumRows };
        }
        return base;
    }, [chartPayload.rows, chartPayload.chart, activeChartType]);

    const copySql = async () => {
        try {
            await navigator.clipboard.writeText(chartPayload.sql);
            setCopiedSql(true);
            setTimeout(() => setCopiedSql(false), 1800);
        } catch {
            // ignore
        }
    };

    const renderVisualization = () => {
        if (!chartPayload.rows || chartPayload.rows.length === 0) {
            return (
                <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
                    No rows returned for this chart.
                </div>
            );
        }

        if (viewMode === "table") {
            const cols = Object.keys(chartPayload.rows[0]);
            return (
                <div className="max-h-[300px] overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                {cols.map((col) => (
                                    <th
                                        key={col}
                                        className="px-3 py-2 font-mono font-semibold text-neutral-700 dark:text-neutral-300"
                                    >
                                        {formatLabel(col)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
                            {chartPayload.rows.map((r, rIdx) => (
                                <tr
                                    key={rIdx}
                                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                                >
                                    {cols.map((col) => {
                                        const val = r[col];
                                        const isNum =
                                            typeof val === "number" ||
                                            (typeof val === "string" &&
                                                val.trim() !== "" &&
                                                !isNaN(Number(val)) &&
                                                !/^\d{4}/.test(val));
                                        return (
                                            <td
                                                key={col}
                                                className="px-3 py-1.5 font-mono text-neutral-700 dark:text-neutral-300"
                                            >
                                                {isNum ? formatCurrency(Number(val)) : String(val ?? "")}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        const { isTimeSeries, dateKey, categories, labelKey, valueKey, rows, isMonthly } =
            normalized;

        if (viewMode === "pie") {
            const total = rows.reduce((acc, r) => acc + (Number(r?.[valueKey]) || 0), 0);
            return (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div className="md:col-span-3">
                        <ChartContainer config={{}} className="aspect-auto h-[240px] w-full">
                            <PieChart>
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value: any, name: any) => {
                                                const numericValue = Number(value);
                                                const pct = total > 0 ? numericValue / total : 0;
                                                return (
                                                    <div className="flex w-full items-center justify-between gap-4">
                                                        <span className="text-neutral-500 dark:text-neutral-400">
                                                            {formatLabel(String(name))}
                                                        </span>
                                                        <span className="text-neutral-950 font-mono font-medium tabular-nums dark:text-neutral-50">
                                                            {formatCurrency(numericValue)} (
                                                            {Intl.NumberFormat("en-US", {
                                                                style: "percent",
                                                                maximumFractionDigits: 0,
                                                            }).format(pct)}
                                                            )
                                                        </span>
                                                    </div>
                                                );
                                            }}
                                        />
                                    }
                                />
                                <Pie
                                    data={rows}
                                    dataKey={valueKey}
                                    nameKey={labelKey}
                                    innerRadius={56}
                                    outerRadius={94}
                                    paddingAngle={2}
                                >
                                    {rows.map((_e, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </div>
                    <div className="md:col-span-2 max-h-[220px] overflow-y-auto pr-1 space-y-1.5">
                        {rows.slice(0, 10).map((r, i) => {
                            const val = Number(r?.[valueKey] || 0);
                            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                            return (
                                <div
                                    key={i}
                                    className="flex items-center justify-between text-xs gap-2 py-0.5"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                        />
                                        <span className="truncate text-neutral-700 dark:text-neutral-300">
                                            {String(r?.[labelKey] ?? "")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 font-mono">
                                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                            {formatCurrency(val)}
                                        </span>
                                        <span className="text-neutral-400 dark:text-neutral-500 w-9 text-right">
                                            {pct}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // Time-series Area / Cumulative / Bar
        if (isTimeSeries || viewMode === "area" || viewMode === "cumulative") {
            const xKey = isTimeSeries ? dateKey : labelKey;
            const seriesKeys = isTimeSeries ? categories : [valueKey];
            const chartConfig: any = {};
            seriesKeys.forEach((cat, idx) => {
                chartConfig[cat] = {
                    label: formatLabel(cat),
                    color: COLORS[idx % COLORS.length],
                };
            });

            const tooltipFormatter = ((
                value: any,
                name: any,
                item: any,
                _index: number,
                p: any
            ) => {
                const indicatorColor = item?.payload?.stroke || item?.payload?.fill || item?.color;
                const key = String(name);
                const labelText = chartConfig[key]?.label ?? formatLabel(key);
                const numericValue = Number(value);
                const sum =
                    seriesKeys.length > 1 && p
                        ? seriesKeys.reduce((acc, cat) => acc + (Number(p?.[cat]) || 0), 0)
                        : 0;
                const percent = sum > 0 ? numericValue / sum : 0;
                return (
                    <div className="flex w-full items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                style={{ backgroundColor: indicatorColor }}
                            />
                            <span className="text-neutral-500 dark:text-neutral-400">
                                {labelText}
                                {seriesKeys.length > 1
                                    ? ` (${Intl.NumberFormat("en-US", {
                                          style: "percent",
                                          maximumFractionDigits: 0,
                                      }).format(percent)})`
                                    : ""}
                            </span>
                        </div>
                        <span className="text-neutral-950 font-mono font-medium tabular-nums dark:text-neutral-50">
                            {formatCurrency(numericValue)}
                        </span>
                    </div>
                );
            }) as any;

            const renderLabelHeader = (_: any, payload: any) => {
                if (!payload || payload.length === 0) return "";
                const row = payload[0].payload as any;
                const rawX = row[xKey];
                const total = seriesKeys.reduce((acc, cat) => acc + (Number(row?.[cat]) || 0), 0);
                return (
                    <div className="flex justify-between gap-4 w-full pb-1.5 border-b border-neutral-100 dark:border-neutral-800 mb-1 text-neutral-950 dark:text-neutral-50">
                        <span>{isTimeSeries ? formatDateTooltip(rawX, isMonthly) : String(rawX)}</span>
                        {seriesKeys.length > 1 && (
                            <span className="font-mono font-semibold">{formatCurrency(total)}</span>
                        )}
                    </div>
                );
            };

            if (viewMode === "area" || viewMode === "cumulative") {
                return (
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-[260px] max-sm:h-[210px] w-full"
                    >
                        <AreaChart data={rows} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                className="stroke-neutral-200/70 dark:stroke-neutral-800/70"
                            />
                            <XAxis
                                dataKey={xKey}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={6}
                                minTickGap={28}
                                tickFormatter={(v) =>
                                    isTimeSeries ? formatDateAxis(v, isMonthly) : String(v).slice(0, 12)
                                }
                                className="text-[10px] font-mono text-neutral-500"
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                width={48}
                                tickFormatter={(v) => formatCompactCurrency(Number(v))}
                                className="text-[10px] font-mono text-neutral-500"
                            />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={renderLabelHeader}
                                        indicator="dot"
                                        formatter={tooltipFormatter}
                                    />
                                }
                            />
                            {seriesKeys.map((cat) => (
                                <Area
                                    key={cat}
                                    dataKey={cat}
                                    type="monotone"
                                    stroke={chartConfig[cat]?.color}
                                    fill={chartConfig[cat]?.color}
                                    fillOpacity={0.16}
                                    strokeWidth={2}
                                    dot={false}
                                    stackId={seriesKeys.length > 1 ? "1" : undefined}
                                />
                            ))}
                            {seriesKeys.length > 1 && (
                                <ChartLegend
                                    content={<ChartLegendContent />}
                                    className="max-sm:hidden text-neutral-950 dark:text-neutral-50 pt-2"
                                />
                            )}
                        </AreaChart>
                    </ChartContainer>
                );
            }

            // Time-series BarChart
            return (
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[260px] max-sm:h-[210px] w-full"
                >
                    <BarChart data={rows} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
                        <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            className="stroke-neutral-200/70 dark:stroke-neutral-800/70"
                        />
                        <XAxis
                            dataKey={xKey}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={6}
                            minTickGap={24}
                            tickFormatter={(v) => formatDateAxis(v, isMonthly)}
                            className="text-[10px] font-mono text-neutral-500"
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            width={48}
                            tickFormatter={(v) => formatCompactCurrency(Number(v))}
                            className="text-[10px] font-mono text-neutral-500"
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    indicator="dot"
                                    labelFormatter={renderLabelHeader}
                                    formatter={tooltipFormatter}
                                />
                            }
                        />
                        {seriesKeys.map((cat, idx) => (
                            <Bar
                                key={cat}
                                dataKey={cat}
                                fill={chartConfig[cat]?.color}
                                radius={
                                    idx === seriesKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
                                }
                                stackId="1"
                            />
                        ))}
                        {seriesKeys.length > 1 && (
                            <ChartLegend
                                content={<ChartLegendContent />}
                                className="max-sm:hidden text-neutral-950 dark:text-neutral-50 pt-2"
                            />
                        )}
                    </BarChart>
                </ChartContainer>
            );
        }

        // Categorical BarChart
        const total = rows.reduce((acc, r) => acc + Number(r?.[valueKey] || 0), 0);
        return (
            <ChartContainer
                config={{}}
                className="aspect-auto h-[260px] max-sm:h-[210px] w-full"
            >
                <BarChart data={rows} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
                    <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        className="stroke-neutral-200/70 dark:stroke-neutral-800/70"
                    />
                    <XAxis
                        dataKey={labelKey}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={6}
                        interval={0}
                        tickFormatter={(v) => {
                            const s = String(v ?? "");
                            return s.length > 12 ? `${s.slice(0, 11)}…` : s;
                        }}
                        className="text-[10px] font-mono text-neutral-500"
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={48}
                        tickFormatter={(v) => formatCompactCurrency(Number(v))}
                        className="text-[10px] font-mono text-neutral-500"
                    />
                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                indicator="dot"
                                formatter={(value: any, name: any, item: any) => {
                                    const numericValue = Number(value);
                                    const pct = total > 0 ? numericValue / total : 0;
                                    const realName = item?.payload?.[labelKey] ?? name;
                                    return (
                                        <div className="flex w-full items-center justify-between gap-4">
                                            <span className="text-neutral-500 dark:text-neutral-400">
                                                {formatLabel(String(realName))}
                                            </span>
                                            <span className="text-neutral-950 font-mono font-medium tabular-nums dark:text-neutral-50">
                                                {formatCurrency(numericValue)} (
                                                {Intl.NumberFormat("en-US", {
                                                    style: "percent",
                                                    maximumFractionDigits: 0,
                                                }).format(pct)}
                                                )
                                            </span>
                                        </div>
                                    );
                                }}
                            />
                        }
                    />
                    <Bar dataKey={valueKey} name={labelKey} radius={[4, 4, 0, 0]}>
                        {rows.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ChartContainer>
        );
    };

    const modeOptions: Array<{ mode: ViewMode; label: string; icon: React.ComponentType<any> }> = [
        { mode: "bar", label: "Bar", icon: BarChart3 },
        { mode: "area", label: "Area", icon: TrendingUp },
        { mode: "cumulative", label: "Cumulative", icon: Layers },
        { mode: "pie", label: "Pie", icon: PieChartIcon },
        { mode: "table", label: "Table", icon: TableIcon },
    ];

    return (
        <div className="my-3 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 p-4 shadow-xs backdrop-blur-xs">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-2 pb-3 mb-3 border-b border-neutral-100 dark:border-neutral-800/80">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                            {chartPayload.title}
                        </h4>
                        {normalized.grandTotal > 0 && viewMode !== "cumulative" && (
                            <span className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 font-mono text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                {formatCurrency(normalized.grandTotal)}
                            </span>
                        )}
                    </div>
                    {chartPayload.subtitle && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {chartPayload.subtitle}
                        </p>
                    )}
                </div>

                {/* Controls: View mode pills + SQL toggle */}
                <div className="flex items-center gap-1 flex-wrap">
                    <div className="inline-flex items-center rounded-lg bg-neutral-100 dark:bg-neutral-800/90 p-0.5">
                        {modeOptions.map((opt) => {
                            const Icon = opt.icon;
                            const active = viewMode === opt.mode;
                            return (
                                <button
                                    key={opt.mode}
                                    type="button"
                                    onClick={() => setViewMode(opt.mode)}
                                    title={`View as ${opt.label}`}
                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                                        active
                                            ? "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 shadow-2xs"
                                            : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                                    }`}
                                >
                                    <Icon className="size-3" />
                                    <span className="max-sm:hidden">{opt.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSqlOpen((o) => !o)}
                        title="Toggle SQL query"
                        className={`h-7 px-2 text-xs ${
                            sqlOpen
                                ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                        }`}
                    >
                        <Code2 className="size-3.5 mr-1" />
                        SQL
                    </Button>
                </div>
            </div>

            {/* Chart body */}
            {renderVisualization()}

            {/* Collapsible SQL Drawer */}
            <Collapsible open={sqlOpen} onOpenChange={setSqlOpen}>
                <CollapsibleContent>
                    <div className="mt-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/80 p-3 relative group">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                                Executed SQLite Query ({chartPayload.rows.length} rows)
                            </span>
                            <button
                                type="button"
                                onClick={copySql}
                                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                            >
                                {copiedSql ? (
                                    <>
                                        <Check className="size-3 text-emerald-500" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-3" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                        <pre className="whitespace-pre-wrap break-words font-mono text-xs text-neutral-700 dark:text-neutral-300 overflow-x-auto">
                            {chartPayload.sql}
                        </pre>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}

interface InsightsClientProps {
    initialDisplayName?: string;
    initialThreads?: InsightThread[];
}

export default function InsightsClient({
    initialDisplayName = "",
    initialThreads = [],
}: InsightsClientProps) {
    const [threads, setThreads] = React.useState<InsightThread[]>(initialThreads);
    const [activeThreadId, setActiveThreadId] = React.useState<string | null>(null);
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [prompt, setPrompt] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [copiedMsgId, setCopiedMsgId] = React.useState<string | null>(null);
    const [showScrollBottom, setShowScrollBottom] = React.useState(false);

    const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
    const bottomEndRef = React.useRef<HTMLDivElement | null>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
        bottomEndRef.current?.scrollIntoView({ behavior, block: "end" });
    }, []);

    React.useEffect(() => {
        if (messages.length > 0 || loading) {
            scrollToBottom("smooth");
        }
    }, [messages.length, loading, scrollToBottom]);

    const handleScroll = React.useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        setShowScrollBottom(distanceFromBottom > 180);
    }, []);

    // Auto-resize textarea fallback for browsers without CSS field-sizing: content
    React.useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("field-sizing", "content")) {
            return;
        }
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [prompt]);

    const persistThread = async (thread: InsightThread) => {
        try {
            const res = await fetch("/api/ai-insights", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "save_thread",
                    thread,
                }),
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data?.threads)) {
                setThreads(data.threads);
            }
        } catch {
            // ignore background persistence errors
        }
    };

    const handleDeleteThread = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setThreads((prev) => prev.filter((t) => t.id !== id));
        if (activeThreadId === id) {
            setActiveThreadId(null);
            setMessages([]);
        }
        try {
            const res = await fetch("/api/ai-insights", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "delete_thread",
                    id,
                }),
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data?.threads)) {
                setThreads(data.threads);
            }
        } catch {
            // ignore
        }
    };

    const handleOpenThread = (thread: InsightThread) => {
        setActiveThreadId(thread.id);
        setMessages(thread.messages || []);
    };

    const startNewChat = () => {
        setActiveThreadId(null);
        setMessages([]);
        setPrompt("");
        textareaRef.current?.focus();
    };

    const sendMessage = async (textToSend: string) => {
        const trimmed = textToSend.trim();
        if (!trimmed || loading) return;

        const now = Date.now();
        const threadId = activeThreadId || `thread_${now}_${Math.random().toString(36).slice(2, 7)}`;
        if (!activeThreadId) {
            setActiveThreadId(threadId);
        }

        const userMsg: ChatMessage = {
            id: `user_${now}`,
            role: "user",
            content: trimmed,
            createdAt: now,
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setPrompt("");
        setLoading(true);

        const firstPromptText =
            updatedMessages.find((m) => m.role === "user")?.content || trimmed;
        const existingThread = threads.find((t) => t.id === threadId);
        const createdAt = existingThread?.createdAt || now;

        try {
            const payloadMessages = updatedMessages.map((m) => ({
                role: m.role,
                content: m.content,
                charts: m.charts?.map((c) => ({
                    title: c.title,
                    subtitle: c.subtitle,
                    chart: c.chart,
                    sql: c.sql,
                })),
            }));

            const res = await fetch("/api/ai-insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: payloadMessages,
                    prompt: trimmed,
                }),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json?.error || "Failed to generate insight");
            }

            const assistantMsg: ChatMessage = {
                id: `assistant_${Date.now()}`,
                role: "assistant",
                content: json.text || "",
                charts: Array.isArray(json.charts) ? json.charts : [],
                followUps: Array.isArray(json.followUps) ? json.followUps : [],
                promptContext: trimmed,
                createdAt: Date.now(),
            };

            const finalMessages = [...updatedMessages, assistantMsg];
            setMessages(finalMessages);

            const updatedThread: InsightThread = {
                id: threadId,
                firstPrompt: firstPromptText,
                createdAt,
                updatedAt: Date.now(),
                messages: finalMessages,
            };
            setThreads((prev) => [
                updatedThread,
                ...prev.filter((t) => t.id !== threadId),
            ]);
            persistThread(updatedThread);
        } catch (err: any) {
            const errorMsg: ChatMessage = {
                id: `assistant_err_${Date.now()}`,
                role: "assistant",
                content: "",
                error: err?.message || "Something went wrong while analyzing your data.",
                promptContext: trimmed,
                createdAt: Date.now(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(prompt);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (prompt.trim() && !loading) {
                sendMessage(prompt);
            }
        }
    };

    const handleCopyMessage = async (msg: ChatMessage) => {
        try {
            await navigator.clipboard.writeText(msg.content);
            setCopiedMsgId(msg.id);
            setTimeout(() => setCopiedMsgId(null), 1800);
        } catch {
            // ignore
        }
    };

    const isEmpty = messages.length === 0;

    return (
        <div className="relative flex flex-col h-full w-full bg-background overflow-hidden">
            {/* Main Scrollable Chat Area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4"
            >
                {isEmpty ? (
                    /* Gemini-style Empty Greeting State + Previous Queries List */
                    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center py-8 sm:py-12">
                        <div className="mb-8 space-y-2">
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 dark:from-indigo-400 dark:via-purple-400 dark:to-emerald-400 bg-clip-text text-transparent">
                                Hello{initialDisplayName ? `, ${initialDisplayName}` : " there"}
                            </h1>
                            <p className="text-lg sm:text-xl font-medium text-neutral-500 dark:text-neutral-400">
                                What would you like to know about your finances today?
                            </p>
                        </div>

                        {/* Previous Queries List (displaying the first prompt) */}
                        {threads.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
                                    Previous Queries
                                </p>
                                <div className="divide-y divide-neutral-200/70 dark:divide-neutral-800/80 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/90 bg-neutral-50/50 dark:bg-neutral-900/40 overflow-hidden">
                                    {threads.map((thread) => (
                                        <div
                                            key={thread.id}
                                            onClick={() => handleOpenThread(thread)}
                                            className="group flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <MessageSquare className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors" />
                                                <span className="text-sm text-neutral-800 dark:text-neutral-200 truncate">
                                                    {thread.firstPrompt}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteThread(thread.id, e)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-opacity"
                                                    title="Delete query"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                                <ChevronRight className="size-4 text-neutral-400 dark:text-neutral-600" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Active Conversation Thread */
                    <div className="mx-auto max-w-3xl py-4 sm:py-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={startNewChat}
                                className="h-8 gap-1.5 px-2.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Previous queries</span>
                            </Button>
                        </div>

                        {messages.map((msg, idx) => {
                            const isLastAssistant =
                                msg.role === "assistant" && idx === messages.length - 1;

                            if (msg.role === "user") {
                                return (
                                    <div key={msg.id} className="flex justify-end">
                                        <div className="max-w-[88%] sm:max-w-[75%] rounded-3xl rounded-br-md bg-neutral-100 dark:bg-neutral-800/90 px-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100">
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={msg.id} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-emerald-500/20 text-indigo-600 dark:text-indigo-400">
                                        <Sparkles className="size-4" />
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-2">
                                        {msg.error ? (
                                            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/30 p-3.5 text-sm text-red-600 dark:text-red-400 flex items-center justify-between gap-3">
                                                <span>{msg.error}</span>
                                                {msg.promptContext && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            sendMessage(msg.promptContext!)
                                                        }
                                                        className="h-7 text-xs shrink-0"
                                                    >
                                                        <RotateCcw className="size-3 mr-1" />
                                                        Retry
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                {msg.content && (
                                                    <MarkdownContent content={msg.content} />
                                                )}

                                                {msg.charts &&
                                                    msg.charts.map((chartItem) => (
                                                        <EmbeddedChartCard
                                                            key={chartItem.id}
                                                            chartPayload={chartItem}
                                                        />
                                                    ))}

                                                {/* Message footer actions */}
                                                <div className="flex items-center gap-1 pt-1">
                                                    {msg.content && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyMessage(msg)}
                                                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
                                                            title="Copy response"
                                                        >
                                                            {copiedMsgId === msg.id ? (
                                                                <>
                                                                    <Check className="size-3 text-emerald-500" />
                                                                    <span>Copied</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="size-3" />
                                                                    <span>Copy</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Suggested Follow-Up Chips on latest turn */}
                                                {isLastAssistant &&
                                                    !loading &&
                                                    msg.followUps &&
                                                    msg.followUps.length > 0 && (
                                                        <div className="pt-2">
                                                            <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 mb-2">
                                                                Follow-up questions
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {msg.followUps.map((q) => (
                                                                    <button
                                                                        key={q}
                                                                        type="button"
                                                                        onClick={() =>
                                                                            sendMessage(q)
                                                                        }
                                                                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 hover:bg-neutral-100 dark:bg-neutral-900/70 dark:hover:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 transition-colors"
                                                                    >
                                                                        <span>{q}</span>
                                                                        <ChevronRight className="size-3 text-neutral-400" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Gemini Thinking State */}
                        {loading && (
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-emerald-500/20 text-indigo-600 dark:text-indigo-400 animate-pulse">
                                    <Sparkles className="size-4 animate-spin" />
                                </div>
                                <div className="space-y-2.5 pt-1 flex-1 max-w-md">
                                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        <span>Analyzing your transactions & generating insights...</span>
                                    </div>
                                    <div className="h-3 w-3/4 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                                    <div className="h-3 w-1/2 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                                </div>
                            </div>
                        )}

                        <div ref={bottomEndRef} className="h-2" />
                    </div>
                )}
            </div>

            {/* Floating Scroll-to-Bottom Button */}
            {showScrollBottom && !isEmpty && (
                <button
                    type="button"
                    onClick={() => scrollToBottom("smooth")}
                    aria-label="Scroll to bottom"
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                >
                    <ArrowDown className="size-4" />
                </button>
            )}

            {/* Sticky Gemini Bottom Composer */}
            <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent px-4 pb-4 pt-2">
                <form
                    onSubmit={onSubmit}
                    className="mx-auto max-w-3xl relative"
                >
                    <div className="relative flex items-end gap-2 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/90 px-4 py-2.5 shadow-[0_2px_18px_-4px_rgba(0,0,0,0.06)] focus-within:border-neutral-400 dark:focus-within:border-neutral-700 focus-within:bg-white dark:focus-within:bg-neutral-900 transition-all">
                        <Sparkles
                            className={`mb-1.5 size-4 shrink-0 transition-colors ${
                                loading
                                    ? "text-indigo-500 animate-pulse"
                                    : "text-neutral-400 dark:text-neutral-500"
                            }`}
                        />

                        <textarea
                            ref={textareaRef}
                            rows={1}
                            placeholder={
                                isEmpty
                                    ? "Ask anything about your spending, budgets, or accounts..."
                                    : "Ask a follow-up question..."
                            }
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            style={{ fieldSizing: "content" } as React.CSSProperties}
                            className="flex-1 h-auto min-h-[1.5rem] resize-none bg-transparent border-none px-1 py-0.5 text-sm leading-6 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 disabled:opacity-50 max-h-40 overflow-y-auto"
                        />

                        <Button
                            type="submit"
                            size="icon"
                            disabled={loading || !prompt.trim()}
                            className="h-8 w-8 rounded-full shrink-0"
                        >
                            {loading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <ArrowUp className="size-4" />
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
