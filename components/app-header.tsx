
import * as React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname, useSearchParams } from "next/navigation"

interface AppHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
}

export function AppHeader({ title, className, ...props }: AppHeaderProps) {
    const pathname = usePathname()
    const pathSegments = pathname.split("/").filter(Boolean)
    const searchParams = useSearchParams();
    const accountId = searchParams.get('account');
    const [accountName, setAccountName] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (accountId) {
            const fetchAccountName = async () => {
                try {
                    const response = await fetch('/api/get-accounts');
                    if (!response.ok) {
                        throw new Error(`Error fetching accounts: ${response.statusText}`);
                    }
                    const data = await response.json();
                    const account = data.accounts.find((acc: any) => acc.id === accountId);
                    if (account) {
                        setAccountName(account.name);
                    } else {
                        setAccountName(null);
                    }
                } catch (error) {
                    console.error("Failed to fetch account name:", error);
                    setAccountName(null);
                }
            };
            fetchAccountName();
        } else {
            setAccountName(null);
        }
    }, [accountId]);

    return (
        <div className="flex items-center gap-2 px-2 h-14 border-b">
            <SidebarTrigger className="mx-1" />
            <div className="h-4 bg-neutral-800 w-[1px]"></div>
            <Breadcrumb className="flex-1 overflow-x-auto">
                <BreadcrumbList className="ml-2 flex-nowrap">
                    {pathSegments.map((segment, index) => {
                        const href = "/" + pathSegments.slice(0, index + 1).join("/")
                        const isLast = index === pathSegments.length - 1
                        return (
                            <React.Fragment key={href}>
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbLink href={href} className="text-lg font-medium whitespace-nowrap">{segment.charAt(0).toUpperCase() + segment.slice(1)}</BreadcrumbLink>
                                    ) : (
                                        <BreadcrumbLink href={href} className="text-lg font-medium whitespace-nowrap">{segment.charAt(0).toUpperCase() + segment.slice(1)}</BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {(!isLast || (isLast && accountId)) && <BreadcrumbSeparator />}
                            </React.Fragment>
                        )
                    })}
                    {accountId && accountName && (
                        <BreadcrumbItem>
                            <BreadcrumbLink href={`/transactions?account=${accountId}`} className="text-lg font-medium whitespace-nowrap">{accountName}</BreadcrumbLink>
                        </BreadcrumbItem>
                    )}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    )
} 