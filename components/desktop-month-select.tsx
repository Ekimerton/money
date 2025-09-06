"use client"

import React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface DesktopMonthSelectProps {
    value: Date
    onValueChange: (value: Date) => void
    monthsBack?: number
    triggerClassName?: string
    menuClassName?: string
    ariaLabel?: string
}

function getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

function formatMonthLabel(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export function DesktopMonthSelect({
    value,
    onValueChange,
    monthsBack = 6,
    triggerClassName = "hidden rounded-lg sm:ml-auto sm:flex",
    menuClassName = "rounded-xl",
    ariaLabel = "Select month",
}: DesktopMonthSelectProps) {
    const now = React.useMemo(() => getStartOfMonth(new Date()), [])
    const normalizedValue = React.useMemo(() => getStartOfMonth(value), [value])

    const options = React.useMemo(() => {
        const arr: Date[] = []
        for (let i = 0; i < monthsBack; i++) {
            arr.push(new Date(now.getFullYear(), now.getMonth() - i, 1))
        }
        return arr
    }, [monthsBack, now])

    const selectedValue = `${normalizedValue.getFullYear()}-${normalizedValue.getMonth()}`

    function handleChange(v: string) {
        const [yearStr, monthStr] = v.split("-")
        const y = Number(yearStr)
        const m = Number(monthStr)
        onValueChange(new Date(y, m, 1))
    }

    return (
        <Select value={selectedValue} onValueChange={handleChange}>
            <SelectTrigger className={triggerClassName} aria-label={ariaLabel}>
                <SelectValue placeholder="Select month">
                    {formatMonthLabel(normalizedValue)}
                </SelectValue>
            </SelectTrigger>
            <SelectContent className={menuClassName}>
                {options.map((d) => {
                    const key = `${d.getFullYear()}-${d.getMonth()}`
                    return (
                        <SelectItem key={key} value={key} className="rounded-lg">
                            {formatMonthLabel(d)}
                        </SelectItem>
                    )
                })}
            </SelectContent>
        </Select>
    )
}


