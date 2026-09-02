import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.pages.dashboard.title };
}

export default async function DashboardPage() {
  const dict = await getDictionary();
  return (
    <h1 className="text-2xl font-semibold">{dict.pages.dashboard.heading}</h1>
  );
}
