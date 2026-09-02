"use client";

import { IconEdit, IconTrash } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatDate } from "@/lib/utils";
import type { TAppUser } from "@/server/user-actions";

export function createUsersColumns({
  t,
  onEdit,
  onDelete,
}: {
  t: Dictionary;
  onEdit: (user: TAppUser) => void;
  onDelete: (user: TAppUser) => void;
}): ColumnDef<TAppUser & { id: string }>[] {
  return [
    {
      accessorKey: "name",
      header: t.users.columns.name,
    },
    {
      accessorKey: "email",
      header: t.users.columns.email,
    },
    {
      accessorKey: "role",
      header: t.users.columns.role,
      cell: ({ row }) => (
        <Badge variant="secondary">
          {t.permissions.roleLabels[row.original.role]}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: t.users.columns.createdAt,
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(row.original)}
          >
            <IconEdit className="size-4" />
            <span className="sr-only">{t.users.editSr}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(row.original)}
          >
            <IconTrash className="size-4" />
            <span className="sr-only">{t.users.deleteSr}</span>
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
