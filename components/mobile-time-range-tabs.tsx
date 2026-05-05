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
        <div className="sm:hidden px-4 flex justify-center w-full pb-0 relative z-10">
            <Tabs value={value} onValueChange={(v) => onValueChange(v as TimeRangeValue)} className="w-full justify-center flex">
                <TabsList className="w-full !bg-transparent border-0 dark:!border-0 gap-2 p-0 h-14 items-center">
                    <TabsTrigger value="7d" className="flex-1 h-8 rounded-lg !bg-transparent data-[state=active]:!bg-white dark:data-[state=active]:!bg-neutral-950 data-[state=active]:border data-[state=active]:border-neutral-200 dark:data-[state=active]:border-neutral-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-50 text-neutral-900 dark:text-neutral-100 data-[state=active]:shadow-xs transition-all">7D</TabsTrigger>
                    <TabsTrigger value="30d" className="flex-1 h-8 rounded-lg !bg-transparent data-[state=active]:!bg-white dark:data-[state=active]:!bg-neutral-950 data-[state=active]:border data-[state=active]:border-neutral-200 dark:data-[state=active]:border-neutral-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-50 text-neutral-900 dark:text-neutral-100 data-[state=active]:shadow-xs transition-all">30D</TabsTrigger>
                    <TabsTrigger value="90d" className="flex-1 h-8 rounded-lg !bg-transparent data-[state=active]:!bg-white dark:data-[state=active]:!bg-neutral-950 data-[state=active]:border data-[state=active]:border-neutral-200 dark:data-[state=active]:border-neutral-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-50 text-neutral-900 dark:text-neutral-100 data-[state=active]:shadow-xs transition-all">3M</TabsTrigger>
                    <TabsTrigger value="365d" className="flex-1 h-8 rounded-lg !bg-transparent data-[state=active]:!bg-white dark:data-[state=active]:!bg-neutral-950 data-[state=active]:border data-[state=active]:border-neutral-200 dark:data-[state=active]:border-neutral-800 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-50 text-neutral-900 dark:text-neutral-100 data-[state=active]:shadow-xs transition-all">12M</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    )
}


