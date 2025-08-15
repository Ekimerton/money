"use client"

import React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export type TimeRangeValue = "7d" | "30d" | "90d" | "365d"

interface TimeRangeSelectProps {
    value: TimeRangeValue
    onValueChange: (value: TimeRangeValue) => void
    placeholder?: string
    triggerClassName?: string
    menuClassName?: string
    ariaLabel?: string
}

export function TimeRangeSelect({
    value,
    onValueChange,
    placeholder = "Last 3 months",
    triggerClassName = "hidden w-[160px] rounded-lg sm:ml-auto sm:flex",
    menuClassName = "rounded-xl",
    ariaLabel = "Select a value",
}: TimeRangeSelectProps) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={triggerClassName} aria-label={ariaLabel}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className={menuClassName}>
                <SelectItem value="7d" className="rounded-lg">
                    Last 7 days
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                    Last 30 days
                </SelectItem>
                <SelectItem value="90d" className="rounded-lg">
                    Last 3 months
                </SelectItem>
                <SelectItem value="365d" className="rounded-lg">
                    Last 12 months
                </SelectItem>
            </SelectContent>
        </Select>
    )
}


