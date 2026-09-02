import type { Metadata } from "next";
import Image from "next/image";

import { vi } from "@/lib/i18n/dictionaries/vi";
import { RecruitmentForm } from "@/components/recruitment-form";
import { listRecruitmentManagers } from "@/server/user-actions";

// The public application form is always in Vietnamese, regardless of the
// site-wide language preference used by the authenticated admin/AD pages.
const dict = vi;

export const metadata: Metadata = {
  title: dict.pages.recruitmentPublic.title,
};

export default async function RecruitmentPage() {
  const result = await listRecruitmentManagers();
  const managers = result.ok ? result.data : [];

  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat [background-image:url('/brand/images-webp/bg.webp')]" />
      <div className="fixed inset-0 bg-[oklch(0.283_0.121_260.9)]/55" />
      <div className="fixed inset-x-0 top-0 h-40 bg-gradient-to-b from-[oklch(0.283_0.121_260.9)]/80 to-transparent" />

      <main className="relative mx-auto max-w-3xl px-6 pb-10">
        <div className="flex flex-col items-center gap-6 py-16 text-center text-white">
          <Image
            src="/brand/logo/ASAHI_HORIZONTAL_VECTOR.svg"
            alt={dict.pages.recruitmentPublic.logoAlt}
            width={124}
            height={51}
            className="h-9 w-auto"
            priority
          />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-balance sm:text-3xl">
              {dict.pages.recruitmentPublic.heading}
            </h1>
            <p className="mx-auto max-w-xl text-sm text-white/70">
              {dict.pages.recruitmentPublic.subtitle}
            </p>
          </div>
        </div>

        <RecruitmentForm managers={managers} />
      </main>
    </div>
  );
}
