import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/firebase/session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { canAccessUsers } from "@/lib/permissions";
import { listUsers } from "@/server/user-actions";
import { UsersView } from "@/components/users-view";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.pages.users.title };
}

export default async function UsersPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !canAccessUsers(sessionUser.role)) {
    redirect("/dashboard");
  }

  const dict = await getDictionary();
  const result = await listUsers();
  const users = result.ok ? result.data : [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{dict.pages.users.heading}</h1>
      <UsersView initialUsers={users} />
    </div>
  );
}
