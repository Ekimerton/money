'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import * as React from "react"
import { usePathname } from "next/navigation"

export function ShellLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const hideShell = pathname.startsWith('/onboarding')

    if (hideShell) {
        return (
            <div className="overflow-y-auto bg-white dark:bg-neutral-950 h-screen w-full">
                {children}
            </div>
        )
    }

    return (
        <div className="flex h-dvh w-screen bg-background text-foreground">
            <AppSidebar className="h-full" />
            <main className="flex flex-col flex-1">
                <div className="sm:hidden bg-background h-[calc(1*env(safe-area-inset-top))] w-full" />
                <AppHeader />
                <div className="overflow-y-auto bg-background h-full w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}


