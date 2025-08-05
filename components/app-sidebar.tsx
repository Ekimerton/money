import * as React from "react"
import { Cog, Banknote, Landmark, LayoutDashboard } from "lucide-react"

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
  return (
    <Sidebar {...props} className="border-r z-10 bg-white dark:bg-neutral-950">
      <SidebarHeader className="h-14 px-4 flex justify-center border-b">
        <h1 className="text-xl font-bold">Money App</h1>
      </SidebarHeader>
      <SidebarContent className="p-2 z-10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href={"/"}>
                <LayoutDashboard />
                Dashboard
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href={"/accounts"}>
                <Landmark />
                Accounts
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href={"/transactions"}>
                <Banknote />
                Transactions
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href={"/debug"}>
                <Cog />
                Debug
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
