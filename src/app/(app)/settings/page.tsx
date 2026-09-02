import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/firebase/session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { canAccessSettings } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.pages.settings.title };
}

export default async function SettingsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !canAccessSettings(sessionUser.role)) {
    redirect("/dashboard");
  }

  const dict = await getDictionary();
  return (
    <h1 className="text-2xl font-semibold">{dict.pages.settings.heading}</h1>
  );
}
