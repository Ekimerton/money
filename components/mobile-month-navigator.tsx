"use client"

import React from "react"
import { Button } from "@/components/ui/button"

interface MobileMonthNavigatorProps {
    currentMonth: Date
    onMonthChange: (month: Date) => void
    minMonth?: Date
    maxMonth?: Date
    className?: string
}

function getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

function formatMonthLabel(date: Date): string {
    return date.toLocaleDateString(undefined, {
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
        <div className={`sm:hidden px-4 pt-4 pb-0 w-full flex justify-center ${className} text-neutral-950 dark:text-neutral-50`}>
            <div className="w-full flex items-center justify-between gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-lg bg-neutral-100 dark:bg-neutral-900"
                    onClick={() => changeMonth(-1)}
                    disabled={!canGoBack}
                    aria-label="Previous month"
                >
                    &lt;
                </Button>
                <div className="flex-1 text-center text-sm font-medium py-2 rounded-lg border bg-neutral-100 dark:bg-neutral-900">
                    {formatMonthLabel(normalizedCurrent)}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-lg bg-neutral-100 dark:bg-neutral-900"
                    onClick={() => changeMonth(1)}
                    disabled={!canGoForward}
                    aria-label="Next month"
                >
                    &gt;
                </Button>
            </div>
        </div>
    )
}


