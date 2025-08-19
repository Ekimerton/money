"use client"

import React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TimeRangeValue } from "@/components/time-range-select"

interface MobileTimeRangeTabsProps {
    value: TimeRangeValue
    onValueChange: (value: TimeRangeValue) => void
}

export function MobileTimeRangeTabs({ value, onValueChange }: MobileTimeRangeTabsProps) {
    return (
        <div className="sm:hidden px-2 flex justify-center w-full pt-4 pb-0">
            <Tabs value={value} onValueChange={(v) => onValueChange(v as TimeRangeValue)} className="w-full justify-center flex">
                <TabsList className="w-full">
                    <TabsTrigger value="7d" className="flex-1">7D</TabsTrigger>
                    <TabsTrigger value="30d" className="flex-1">30D</TabsTrigger>
                    <TabsTrigger value="90d" className="flex-1">3M</TabsTrigger>
                    <TabsTrigger value="365d" className="flex-1">12M</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    )
}


