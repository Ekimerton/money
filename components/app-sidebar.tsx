"use client"
import * as React from "react"
import { Cog, Banknote, Landmark, Brain, BanknoteArrowDown, Bell } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  return (
    <Sidebar {...props} className="border-r z-10 bg-white dark:bg-neutral-950">
      <SidebarHeader className="h-14 px-4 flex justify-center border-b items-center">
        <h1 className="text-xl font-bold">Money App</h1>
      </SidebarHeader>
      <SidebarContent className="p-3 z-10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/accounts")}>
              <Link href={"/accounts"}>
                <Landmark className="mx-1 !size-5" />
                Accounts
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/spending")}>
              <Link href={"/spending"}>
                <BanknoteArrowDown className="mx-1 !size-5" />
                Spending
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/insights")}>
              <Link href={"/insights"}>
                <Brain className="mx-1 !size-5" />
                Insights
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/transactions")}>
              <Link href={"/transactions"}>
                <Banknote className="mx-1 !size-5" />
                Transactions
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/backlog")}>
              <Link href={"/backlog"}>
                <Bell className="mx-1 !size-5" />
                Backlog
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/settings")}>
              <Link href={"/settings"}>
                <Cog className="mx-1 !size-5" />
                Settings
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
