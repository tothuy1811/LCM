"use client";

import Link from "next/link";
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { getSidebarItems } from "@/types/navigation/sidebar";
import type { Role } from "@/lib/permissions";
import { useDictionary } from "@/hooks/use-dictionary";

export function AppSidebar({
  user,
  role,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: TUser; role: Role }) {
  const t = useDictionary();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/recruitments">
                <Image
                  src="/brand/logo/ASAHI_SYMBOL.svg"
                  alt=""
                  width={39}
                  height={33}
                  className="size-5"
                />
                <span className="text-base font-semibold">Asahi Livwell</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={getSidebarItems(role, t)} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
