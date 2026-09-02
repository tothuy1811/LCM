import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/firebase/session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { canAccessRecruitments } from "@/lib/permissions";
import { listRecruitmentSubmissions } from "@/server/recruitment-actions";
import { RecruitmentsView } from "@/components/recruitments-view";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.pages.recruitments.title };
}

export default async function RecruitmentsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !canAccessRecruitments(sessionUser.role)) {
    redirect("/dashboard");
  }

  const dict = await getDictionary();
  const result = await listRecruitmentSubmissions();
  const submissions = result.ok ? result.data : [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">
        {dict.pages.recruitments.heading}
      </h1>
      <RecruitmentsView initialSubmissions={submissions} />
    </div>
  );
}
