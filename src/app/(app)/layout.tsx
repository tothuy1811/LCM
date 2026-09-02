import { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  CONTENT_LAYOUT_VALUES,
  type ContentLayout,
  NAVBAR_STYLE_VALUES,
  type NavbarStyle,
  SIDEBAR_COLLAPSIBLE_VALUES,
  SIDEBAR_VARIANT_VALUES,
  type SidebarCollapsible,
  type SidebarVariant,
} from "@/types/preferences/layout";

import { getPreference } from "@/server/server-actions";
import { getSessionUser } from "@/lib/firebase/session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AppSidebar } from "@/components/app-sidebar";
import { SearchDialog } from "@/components/search-dialog";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LayoutControls } from "@/components/layout-controls";
import { AuthStoreProvider } from "@/stores/auth/auth-provider";

export default async function Layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const dict = await getDictionary();

  const user: TUser = {
    uid: sessionUser.uid,
    name:
      sessionUser.name ??
      sessionUser.email?.split("@")[0] ??
      dict.common.userFallback,
    email: sessionUser.email ?? "",
    avatar: sessionUser.picture,
  };

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const [sidebarVariant, sidebarCollapsible, contentLayout, navbarStyle] =
    await Promise.all([
      getPreference<SidebarVariant>(
        "sidebar_variant",
        SIDEBAR_VARIANT_VALUES,
        "inset"
      ),
      getPreference<SidebarCollapsible>(
        "sidebar_collapsible",
        SIDEBAR_COLLAPSIBLE_VALUES,
        "icon"
      ),
      getPreference<ContentLayout>(
        "content_layout",
        CONTENT_LAYOUT_VALUES,
        "centered"
      ),
      getPreference<NavbarStyle>("navbar_style", NAVBAR_STYLE_VALUES, "scroll"),
    ]);

  const layoutPreferences = {
    contentLayout,
    variant: sidebarVariant,
    collapsible: sidebarCollapsible,
    navbarStyle,
  };

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      className="bg-cover bg-center bg-no-repeat [background-image:url('/brand/images-webp/bg.webp')]"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AuthStoreProvider
        initialUser={{ uid: user.uid, email: sessionUser.email }}
      >
        <AppSidebar
          variant={sidebarVariant}
          collapsible={sidebarCollapsible}
          user={user}
          role={sessionUser.role}
        />
        <SidebarInset
          data-content-layout={contentLayout}
          className="dark:text-white"
        >
          <header
            data-navbar-style={navbarStyle}
            className={cn(
              "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
              // Handle sticky navbar style with conditional classes so blur, background, z-index, and rounded corners remain consistent across all SidebarVariant layouts.
              "data-[navbar-style=sticky]:bg-background/50 data-[navbar-style=sticky]:sticky data-[navbar-style=sticky]:top-0 data-[navbar-style=sticky]:z-50 data-[navbar-style=sticky]:overflow-hidden data-[navbar-style=sticky]:rounded-t-[inherit] data-[navbar-style=sticky]:backdrop-blur-md"
            )}
          >
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mx-2 data-[orientation=vertical]:h-4"
                />
                <SearchDialog />
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <LayoutControls {...layoutPreferences} />
                <ThemeSwitcher />
              </div>
            </div>
          </header>
          <div className="h-full p-4 md:p-6">{children}</div>
        </SidebarInset>
      </AuthStoreProvider>
    </SidebarProvider>
  );
}
