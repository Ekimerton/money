"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MobileMonthNavigatorProps {
    currentMonth: Date
    onMonthChange: (month: Date) => void
    minMonth?: Date
    maxMonth?: Date
    className?: string
    categories?: string[]
    selectedCategory?: string
    onCategoryChange?: (category: string) => void
}

function getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

function formatMonthLabel(date: Date): string {
    return date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
    })
}

export function MobileMonthNavigator({
    currentMonth,
    onMonthChange,
    minMonth,
    maxMonth,
    className = "",
    categories = [],
    selectedCategory = "",
    onCategoryChange,
}: MobileMonthNavigatorProps) {
    const normalizedCurrent = React.useMemo(() => getStartOfMonth(currentMonth), [currentMonth])
    const normalizedMin = React.useMemo(() => (minMonth ? getStartOfMonth(minMonth) : undefined), [minMonth])
    const normalizedMax = React.useMemo(
        () => getStartOfMonth(maxMonth ?? new Date()),
        [maxMonth]
    )

    const canGoBack = React.useMemo(() => {
        if (!normalizedMin) return true
        return normalizedCurrent > normalizedMin
    }, [normalizedCurrent, normalizedMin])

    const canGoForward = React.useMemo(() => {
        return normalizedCurrent < normalizedMax
    }, [normalizedCurrent, normalizedMax])

    function changeMonth(delta: number) {
        const next = new Date(normalizedCurrent.getFullYear(), normalizedCurrent.getMonth() + delta, 1)
        if (normalizedMin && next < normalizedMin) return
        if (next > normalizedMax) return
        onMonthChange(next)
    }

    return (
        <div className={`sm:hidden px-4 pt-4 pb-0 flex justify-center ${className} text-neutral-950 dark:text-neutral-50`}>
            <div className="flex-1"></div>
            <div className="flex items-center justify-between gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-lg "
                    onClick={() => changeMonth(-1)}
                    disabled={!canGoBack}
                    aria-label="Previous month"
                >
                    &lt;
                </Button>
                <Button type="button" variant="outline" className="rounded-lg w-20">
                    {formatMonthLabel(normalizedCurrent)}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-lg"
                    onClick={() => changeMonth(1)}
                    disabled={!canGoForward}
                    aria-label="Next month"
                >
                    &gt;
                </Button>
            </div>
            <div className="flex-1 flex justify-end">
                {/** Radix Select does not allow empty string as an item value, use a sentinel */}
                <Select
                    value={selectedCategory && selectedCategory.trim() !== "" ? selectedCategory : "__ALL__"}
                    onValueChange={(value) => onCategoryChange?.(value === "__ALL__" ? "" : value)}
                >
                    <SelectTrigger className="ml-auto rounded-lg w-20">
                        <SelectValue>{selectedCategory || "All"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__ALL__">All</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}


