"use client";
import * as React from "react";

import {
  ChartBar,
  Forklift,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  Search,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useDictionary } from "@/hooks/use-dictionary";
import type { Dictionary } from "@/lib/i18n/dictionaries";

function getSearchItems(t: Dictionary) {
  return [
    {
      group: t.searchDialog.dashboardGroup,
      icon: LayoutDashboard,
      label: t.searchDialog.default,
    },
    {
      group: t.searchDialog.dashboardGroup,
      icon: ChartBar,
      label: t.searchDialog.crm,
      disabled: true,
    },
    {
      group: t.searchDialog.dashboardGroup,
      icon: Gauge,
      label: t.searchDialog.analytics,
      disabled: true,
    },
    {
      group: t.searchDialog.dashboardGroup,
      icon: ShoppingBag,
      label: t.searchDialog.ecommerce,
      disabled: true,
    },
    {
      group: t.searchDialog.dashboardGroup,
      icon: GraduationCap,
      label: t.searchDialog.academy,
      disabled: true,
    },
    {
      group: t.searchDialog.dashboardGroup,
      icon: Forklift,
      label: t.searchDialog.logistics,
      disabled: true,
    },
    { group: t.searchDialog.authGroup, label: t.searchDialog.loginV1 },
    { group: t.searchDialog.authGroup, label: t.searchDialog.loginV2 },
    { group: t.searchDialog.authGroup, label: t.searchDialog.signupV1 },
    { group: t.searchDialog.authGroup, label: t.searchDialog.signupV2 },
  ];
}

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const t = useDictionary();
  const searchItems = getSearchItems(t);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button
        variant="link"
        className="text-muted-foreground !px-0 font-normal hover:no-underline"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        {t.searchDialog.trigger}
        <kbd className="bg-muted inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium select-none">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t.searchDialog.placeholder} />
        <CommandList>
          <CommandEmpty>{t.searchDialog.empty}</CommandEmpty>
          {[...new Set(searchItems.map(item => item.group))].map((group, i) => (
            <React.Fragment key={group}>
              {i !== 0 && <CommandSeparator />}
              <CommandGroup heading={group} key={group}>
                {searchItems
                  .filter(item => item.group === group)
                  .map(item => (
                    <CommandItem
                      className="!py-1.5"
                      key={item.label}
                      onSelect={() => setOpen(false)}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.label}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
