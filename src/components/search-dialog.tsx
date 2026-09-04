"use client";
import * as React from "react";

import { useRouter } from "next/navigation";

import { IconLoader2 } from "@tabler/icons-react";
import { Search, Settings, UserCheck, Users } from "lucide-react";

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
import {
  canAccessSettings,
  canAccessUsers,
  type Role,
} from "@/lib/permissions";
import {
  listRecruitmentSubmissions,
  type TRecruitmentSubmission,
} from "@/server/recruitment-actions";
import { listUsers, type TAppUser } from "@/server/user-actions";

function getNavigationItems(t: Dictionary, role: Role) {
  const items = [
    {
      icon: UserCheck,
      label: t.nav.recruitments,
      url: "/recruitments",
    },
  ];

  if (canAccessUsers(role)) {
    items.push({
      icon: Users,
      label: t.nav.users,
      url: "/users",
    });
  }

  if (canAccessSettings(role)) {
    items.push({
      icon: Settings,
      label: t.nav.settings,
      url: "/settings",
    });
  }

  return items;
}

export function SearchDialog({ role }: { role: Role }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [submissions, setSubmissions] = React.useState<
    TRecruitmentSubmission[]
  >([]);
  const [users, setUsers] = React.useState<TAppUser[]>([]);
  const t = useDictionary();
  const router = useRouter();
  const navigationItems = getNavigationItems(t, role);
  const showUsers = canAccessUsers(role);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [submissionsResult, usersResult] = await Promise.all([
        listRecruitmentSubmissions(),
        showUsers ? listUsers() : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setSubmissions(submissionsResult.ok ? submissionsResult.data : []);
      setUsers(usersResult?.ok ? usersResult.data : []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, showUsers]);

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

  const handleNavigate = (url: string) => {
    setOpen(false);
    router.push(url);
  };

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
          {!loading && <CommandEmpty>{t.searchDialog.empty}</CommandEmpty>}
          <CommandGroup heading={t.searchDialog.navigationGroup}>
            {navigationItems.map(item => (
              <CommandItem
                className="!py-1.5"
                key={item.url}
                value={item.label}
                onSelect={() => handleNavigate(item.url)}
              >
                <item.icon />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {submissions.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t.searchDialog.recruitmentsGroup}>
                {submissions.map(submission => (
                  <CommandItem
                    className="!py-1.5"
                    key={submission.id}
                    value={`${submission.fullName} ${submission.mobile1} ${submission.email}`}
                    onSelect={() =>
                      handleNavigate(`/recruitments/${submission.id}`)
                    }
                  >
                    <UserCheck />
                    <div className="flex flex-col">
                      <span>{submission.fullName}</span>
                      <span className="text-muted-foreground text-xs">
                        {submission.mobile1} · {submission.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {users.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t.searchDialog.usersGroup}>
                {users.map(user => (
                  <CommandItem
                    className="!py-1.5"
                    key={user.uid}
                    value={`${user.name} ${user.email}`}
                    onSelect={() => handleNavigate("/users")}
                  >
                    <Users />
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {user.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {loading && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
              <IconLoader2 className="size-4 animate-spin" />
              {t.searchDialog.loading}
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
