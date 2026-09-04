"use client";

import Link from "next/link";

import {
  IconCheck,
  IconDotsVertical,
  IconDownload,
  IconEye,
  IconFileText,
  IconLoader2,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatDate } from "@/lib/utils";
import type {
  TRecruitmentStatus,
  TRecruitmentSubmission,
} from "@/server/recruitment-actions";

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "secondary",
  agreed: "default",
  rejected: "destructive",
  needs_documents: "outline",
};

const STATUS_TRANSITIONS: Record<TRecruitmentStatus, TRecruitmentStatus[]> = {
  new: ["agreed", "rejected", "needs_documents"],
  needs_documents: ["agreed", "rejected"],
  agreed: ["rejected", "needs_documents"],
  rejected: ["agreed", "needs_documents"],
};

const STATUS_ICONS: Record<TRecruitmentStatus, typeof IconCheck> = {
  new: IconCheck,
  agreed: IconCheck,
  rejected: IconX,
  needs_documents: IconFileText,
};

export function createRecruitmentsColumns({
  t,
  onDelete,
  onDownload,
  downloadingId,
  onStatusChange,
  updatingStatusId,
}: {
  t: Dictionary;
  onDelete: (submission: TRecruitmentSubmission) => void;
  onDownload: (submission: TRecruitmentSubmission) => void;
  downloadingId: string | null;
  onStatusChange: (
    submission: TRecruitmentSubmission,
    status: TRecruitmentStatus
  ) => void;
  updatingStatusId: string | null;
}): ColumnDef<TRecruitmentSubmission & { id: string }>[] {
  return [
    {
      accessorKey: "fullName",
      header: t.recruitmentsList.columns.name,
    },
    {
      accessorKey: "mobile1",
      header: t.recruitmentsList.columns.phone,
    },
    {
      accessorKey: "email",
      header: t.recruitmentsList.columns.email,
    },
    {
      accessorKey: "positionApplied",
      header: t.recruitmentsList.columns.position,
      cell: ({ row }) =>
        t.recruitmentsList.positionLabels[row.original.positionApplied] ??
        row.original.positionApplied,
    },
    {
      accessorKey: "managerName",
      header: t.recruitmentsList.columns.manager,
    },
    {
      accessorKey: "status",
      header: t.recruitmentsList.columns.status,
      cell: ({ row }) => {
        const { status, statusUpdatedByRole } = row.original;
        const adLabel =
          statusUpdatedByRole === "ad" &&
          (status === "agreed" || status === "rejected")
            ? t.recruitmentsList.adStatusLabels[status]
            : undefined;
        return (
          <Badge variant={STATUS_VARIANTS[status]}>
            {adLabel ?? t.recruitmentsList.statusLabels[status] ?? status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "submittedAt",
      header: t.recruitmentsList.columns.submittedAt,
      cell: ({ row }) => formatDate(row.original.submittedAt),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const isUpdatingStatus = updatingStatusId === row.original.id;
        const isDownloading = downloadingId === row.original.id;
        const transitions = STATUS_TRANSITIONS[row.original.status] ?? [];
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isUpdatingStatus || isDownloading}
                >
                  {isUpdatingStatus || isDownloading ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : (
                    <IconDotsVertical className="size-4" />
                  )}
                  <span className="sr-only">{t.recruitmentsList.actions}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/recruitments/${row.original.id}`}>
                    <IconEye className="size-4" />
                    {t.recruitmentsList.viewSr}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDownload(row.original)}>
                  <IconDownload className="size-4" />
                  {t.recruitmentsList.downloadSr}
                </DropdownMenuItem>
                {transitions.length > 0 && <DropdownMenuSeparator />}
                {transitions.map(target => {
                  const Icon = STATUS_ICONS[target];
                  const label = t.recruitmentsList.statusLabels[target];
                  return (
                    <DropdownMenuItem
                      key={target}
                      onSelect={() => onStatusChange(row.original, target)}
                    >
                      <Icon className="size-4" />
                      {label}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDelete(row.original)}
                >
                  <IconTrash className="size-4" />
                  {t.recruitmentsList.deleteSr}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
