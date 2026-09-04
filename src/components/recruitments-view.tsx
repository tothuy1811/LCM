"use client";

import { useState } from "react";

import { IconDownload, IconLoader2 } from "@tabler/icons-react";
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
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/data-table";
import { createRecruitmentsColumns } from "@/components/recruitments-columns";
import { useDictionary } from "@/hooks/use-dictionary";
import type { Role } from "@/lib/permissions";
import {
  deleteRecruitmentSubmission,
  updateRecruitmentAdminStatus,
  updateRecruitmentSubmissionStatus,
  type TAdminStatus,
  type TRecruitmentStatus,
  type TRecruitmentSubmission,
} from "@/server/recruitment-actions";

export function RecruitmentsView({
  initialSubmissions,
  currentUserRole,
}: {
  initialSubmissions: TRecruitmentSubmission[];
  currentUserRole: Role;
}) {
  const t = useDictionary();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [deleting, setDeleting] = useState<TRecruitmentSubmission | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState<
    TRecruitmentSubmission[]
  >([]);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExportSelected = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/recruitments/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedSubmissions.map(s => s.id) }),
      });
      if (!response.ok) throw new Error("export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `danh-sach-ung-vien-${selectedSubmissions.length}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t.errors.recruitment.exportFailed);
    } finally {
      setIsExporting(false);
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

  const handleStatusChange = async (
    submission: TRecruitmentSubmission,
    status: TRecruitmentStatus
  ) => {
    const previousStatus = submission.status;
    const previousStatusUpdatedByRole = submission.statusUpdatedByRole;
    setUpdatingStatusId(submission.id);
    setSubmissions(prev =>
      prev.map(s =>
        s.id === submission.id
          ? { ...s, status, statusUpdatedByRole: currentUserRole }
          : s
      )
    );

    const result = await updateRecruitmentSubmissionStatus(
      submission.id,
      status
    );
    if (!result.ok) {
      setSubmissions(prev =>
        prev.map(s =>
          s.id === submission.id
            ? {
                ...s,
                status: previousStatus,
                statusUpdatedByRole: previousStatusUpdatedByRole,
              }
            : s
        )
      );
      toast.error(result.error);
    } else {
      toast.success(t.recruitmentsList.statusUpdated);
    }
    setUpdatingStatusId(null);
  };

  const handleAdminStatusChange = async (
    submission: TRecruitmentSubmission,
    adminStatus: TAdminStatus
  ) => {
    const previousAdminStatus = submission.adminStatus;
    setUpdatingStatusId(submission.id);
    setSubmissions(prev =>
      prev.map(s => (s.id === submission.id ? { ...s, adminStatus } : s))
    );

    const result = await updateRecruitmentAdminStatus(
      submission.id,
      adminStatus
    );
    if (!result.ok) {
      setSubmissions(prev =>
        prev.map(s =>
          s.id === submission.id
            ? { ...s, adminStatus: previousAdminStatus }
            : s
        )
      );
      toast.error(result.error);
    } else {
      toast.success(t.recruitmentsList.statusUpdated);
    }
    setUpdatingStatusId(null);
  };

  const columns = createRecruitmentsColumns({
    t,
    role: currentUserRole,
    onDelete: setDeleting,
    onDownload: handleDownload,
    downloadingId,
    onStatusChange: handleStatusChange,
    onAdminStatusChange: handleAdminStatusChange,
    updatingStatusId,
  });

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        data={submissions}
        columns={columns}
        emptyMessage={t.recruitmentsList.empty}
        enableColumnVisibility={false}
        enableRowSelection
        onSelectionChange={setSelectedSubmissions}
        rightContent={
          selectedSubmissions.length > 0 && (
            <Button
              size="sm"
              disabled={isExporting}
              onClick={handleExportSelected}
            >
              {isExporting ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconDownload className="size-4" />
              )}
              {t.recruitmentsList.exportSelected(selectedSubmissions.length)}
            </Button>
          )
        }
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
