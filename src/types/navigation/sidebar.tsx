import { type LucideIcon, UserCheck, Users } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionaries";
import { canAccessUsers, type Role } from "@/lib/permissions";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export function getSidebarItems(role: Role, t: Dictionary): NavGroup[] {
  const items: NavMainItem[] = [
    { title: t.nav.recruitments, url: "/recruitments", icon: UserCheck },
  ];

  if (canAccessUsers(role)) {
    items.push({ title: t.nav.users, url: "/users", icon: Users });
  }

  return [{ id: 1, items }];
}
