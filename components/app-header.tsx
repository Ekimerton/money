
import * as React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { User, Bell } from "lucide-react"

interface AppHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
}

function AccountCrumb() {
    const searchParams = useSearchParams();
    const accountId = searchParams.get('account');
    const [accountName, setAccountName] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!accountId) {
            setAccountName(null);
            return;
        }
        let isMounted = true;
        const fetchAccountName = async () => {
            try {
                const response = await fetch('/api/get-accounts', {
                    next: {
                        tags: ['accounts', 'transactions']
                    }
                });
                if (!response.ok) {
                    throw new Error(`Error fetching accounts: ${response.statusText}`);
                }
                const data = await response.json();
                const account = data.accounts.find((acc: any) => acc.id === accountId);
                if (isMounted) {
                    setAccountName(account ? account.name : null);
                }
            } catch (error) {
                console.error("Failed to fetch account name:", error);
                if (isMounted) setAccountName(null);
            }
        };
        fetchAccountName();
        return () => {
            isMounted = false;
        };
    }, [accountId]);

    if (!accountId || !accountName) return null;

    return (
        <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbLink href={`/transactions?account=${accountId}`} className="text-lg font-medium whitespace-nowrap">{accountName}</BreadcrumbLink>
            </BreadcrumbItem>
        </>
    );
}

export function AppHeader({ title, className }: AppHeaderProps) {
    const pathname = usePathname()
    const pathSegments = pathname.split("/").filter(Boolean)
    const isDebug = pathname.startsWith("/debug")
    const isInsights = pathname.startsWith("/insights")
    const isAccounts = pathname.startsWith("/accounts")
    const isSpending = pathname.startsWith("/spending")

    return (
        <div className="px-2 h-14 border-b w-full bg-white dark:bg-neutral-950 relative">
            {/* Desktop / tablet navbar */}
            <div className="hidden sm:flex items-center gap-2 h-full">
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
                                    {!isLast && <BreadcrumbSeparator />}
                                </React.Fragment>
                            )
                        })}
                        <Suspense fallback={null}>
                            <AccountCrumb />
                        </Suspense>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* Mobile buttons */}
            <div className="sm:hidden h-full flex items-center justify-center">
                <Button asChild variant={isInsights ? "secondary" : "ghost"} size="sm">
                    <Link href="/insights">Insights</Link>
                </Button>
                <Button asChild variant={isAccounts ? "secondary" : "ghost"} size="sm">
                    <Link href="/accounts">Accounts</Link>
                </Button>
                <Button asChild variant={isSpending ? "secondary" : "ghost"} size="sm">
                    <Link href="/spending">Spending</Link>
                </Button>
            </div>

            {/* Mobile top-left notifications icon */}
            <div className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2">
                <Button variant="ghost" size="sm-icon" aria-label="Notifications">
                    <Bell />
                </Button>
            </div>

            {/* Mobile top-right person icon linking to debug */}
            <div className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2">
                <Button asChild variant={isDebug ? "secondary" : "ghost"} size="sm-icon">
                    <Link href="/debug" aria-label="Debug">
                        <User />
                    </Link>
                </Button>
            </div>
        </div>
    )
} 