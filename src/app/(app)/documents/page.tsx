import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/firebase/session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { canAccessDocuments } from "@/lib/permissions";
import { DocumentsView } from "@/components/documents-view";
import { listDocuments } from "@/server/documents-actions";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.pages.documents.title };
}

export default async function DocumentsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !canAccessDocuments(sessionUser.role)) {
    redirect("/dashboard");
  }

  const dict = await getDictionary();
  const result = await listDocuments();
  const documents = result.ok ? result.data : [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{dict.pages.documents.heading}</h1>
      <DocumentsView initialDocuments={documents} />
    </div>
  );
}
