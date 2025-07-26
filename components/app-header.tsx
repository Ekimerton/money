
import * as React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { usePathname } from "next/navigation"

interface AppHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
}

export function AppHeader({ title, className, ...props }: AppHeaderProps) {
    const pathname = usePathname()
    const pathSegments = pathname.split("/").filter(Boolean)

    return (
        <div className="flex items-center gap-2 px-2 h-14 border-b border-neutral-800">
            <SidebarTrigger className="mx-1" />
            <div className="h-4 bg-neutral-800 w-[1px]"></div>
            <Breadcrumb>
                <BreadcrumbList className="ml-2">
                    {pathSegments.map((segment, index) => {
                        const href = "/" + pathSegments.slice(0, index + 1).join("/")
                        const isLast = index === pathSegments.length - 1
                        return (
                            <React.Fragment key={href}>
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbPage className="text-lg font-medium">{segment.charAt(0).toUpperCase() + segment.slice(1)}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink href={href} className="text-lg font-medium">{segment.charAt(0).toUpperCase() + segment.slice(1)}</BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </React.Fragment>
                        )
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    )
} 