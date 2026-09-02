"use client";

import { useState } from "react";

import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/ui/data-table/data-table";
import { createRecruitmentsColumns } from "@/components/recruitments-columns";
import { useDictionary } from "@/hooks/use-dictionary";
import {
  deleteRecruitmentSubmission,
  type TRecruitmentSubmission,
} from "@/server/recruitment-actions";

export function RecruitmentsView({
  initialSubmissions,
}: {
  initialSubmissions: TRecruitmentSubmission[];
}) {
  const t = useDictionary();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [deleting, setDeleting] = useState<TRecruitmentSubmission | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (submission: TRecruitmentSubmission) => {
    setDownloadingId(submission.id);
    try {
      const response = await fetch(
        `/api/recruitments/${submission.id}/download`
      );
      if (!response.ok) throw new Error("download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${submission.fullName || "recruitment"}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t.errors.recruitment.exportFailed);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    setSubmissions(prev => prev.filter(s => s.id !== target.id));

    const result = await deleteRecruitmentSubmission(target.id);
    if (!result.ok) {
      setSubmissions(prev => [target, ...prev]);
      toast.error(result.error);
    } else {
      toast.success(t.recruitmentsList.deleted);
    }
  };

  const columns = createRecruitmentsColumns({
    t,
    onDelete: setDeleting,
    onDownload: handleDownload,
    downloadingId,
  });

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        data={submissions.map(s => ({ ...s, id: s.id }))}
        columns={columns}
        emptyMessage={t.recruitmentsList.empty}
        enableColumnVisibility={false}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={open => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.recruitmentsList.deleteDialogTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.recruitmentsList.deleteDialogDescription(deleting?.fullName)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
