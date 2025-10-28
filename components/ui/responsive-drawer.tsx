"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"

export type ResponsiveDrawerProps = {
    trigger: React.ReactNode
    children: React.ReactNode
    title?: React.ReactNode
    description?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    contentClassName?: string
    headerClassName?: string
    bodyClassName?: string
    drawerFooter?: React.ReactNode
    showDrawerCancel?: boolean
}

export function ResponsiveDrawer({
    trigger,
    children,
    title,
    description,
    open: controlledOpen,
    onOpenChange,
    contentClassName,
    headerClassName,
    bodyClassName,
    drawerFooter,
    showDrawerCancel = true,
}: ResponsiveDrawerProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
    const isControlled = controlledOpen !== undefined && onOpenChange !== undefined
    const open = isControlled ? (controlledOpen as boolean) : uncontrolledOpen
    const setOpen = isControlled ? (onOpenChange as (o: boolean) => void) : setUncontrolledOpen
    const [isDesktop, setIsDesktop] = React.useState<boolean>(() => {
        if (typeof window === "undefined") return false
        return window.matchMedia("(min-width: 768px)").matches
    })

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const mql = window.matchMedia("(min-width: 768px)")
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
        // Set initial on mount in case SSR default differed
        setIsDesktop(mql.matches)
        try {
            mql.addEventListener("change", handler)
            return () => mql.removeEventListener("change", handler)
        } catch {
            // Safari fallback for older browsers
            // These methods may exist at runtime even if deprecated
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyMql = mql as any
            anyMql.addListener?.(handler)
            return () => anyMql.removeListener?.(handler)
        }
    }, [])

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent className={cn("sm:max-w-[425px]", contentClassName)}>
                    {(title || description) ? (
                        <DialogHeader className={headerClassName}>
                            {title ? <DialogTitle>{title}</DialogTitle> : null}
                            {description ? (
                                <DialogDescription>{description}</DialogDescription>
                            ) : null}
                        </DialogHeader>
                    ) : null}
                    <div className={bodyClassName}>{children}</div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>{trigger}</DrawerTrigger>
            <DrawerContent className={contentClassName}>
                {(title || description) ? (
                    <DrawerHeader className={headerClassName}>
                        {title ? <DrawerTitle>{title}</DrawerTitle> : null}
                        {description ? (
                            <DrawerDescription>{description}</DrawerDescription>
                        ) : null}
                    </DrawerHeader>
                ) : null}
                <div className={cn("px-4", bodyClassName)}>{children}</div>
                <DrawerFooter className="p-4 pt-8">
                    {drawerFooter}
                    {showDrawerCancel ? (
                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                    ) : null}
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
