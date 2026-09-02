"use client";

import { Download, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatBytes, formatDate } from "@/lib/utils";
import type { TDocument } from "@/server/documents-actions";

export function createDocumentsColumns({
  t,
  onDownload,
  onDelete,
}: {
  t: Dictionary;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}): ColumnDef<TDocument>[] {
  return [
    {
      accessorKey: "fileName",
      header: t.documents.columns.fileName,
    },
    {
      accessorKey: "size",
      header: t.documents.columns.size,
      cell: ({ row }) => formatBytes(row.original.size),
    },
    {
      accessorKey: "uploadedByEmail",
      header: t.documents.columns.uploadedBy,
    },
    {
      accessorKey: "uploadedAt",
      header: t.documents.columns.uploadedAt,
      cell: ({ row }) => formatDate(row.original.uploadedAt),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDownload(row.original.id)}
          >
            <Download />
            <span className="sr-only">{t.documents.downloadSr}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(row.original.id)}
          >
            <Trash2 />
            <span className="sr-only">{t.documents.deleteSr}</span>
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
