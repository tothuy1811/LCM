import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getSessionUser } from "@/lib/firebase/session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { canAccessRecruitments } from "@/lib/permissions";
import { getRecruitmentSubmission } from "@/server/recruitment-actions";
import { listRecruitmentManagers } from "@/server/user-actions";
import { RecruitmentDetailView } from "@/components/recruitment-detail-view";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.pages.recruitmentDetail.title };
}

export default async function RecruitmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const sessionUser = await getSessionUser();
  if (!sessionUser || !canAccessRecruitments(sessionUser.role)) {
    redirect("/dashboard");
  }

  const [submissionResult, managersResult] = await Promise.all([
    getRecruitmentSubmission(id),
    listRecruitmentManagers(),
  ]);

  if (!submissionResult.ok) {
    notFound();
  }

  const managers = managersResult.ok ? managersResult.data : [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">
        {submissionResult.data.fullName}
      </h1>
      <RecruitmentDetailView
        submission={submissionResult.data}
        managers={managers}
      />
    </div>
  );
}
