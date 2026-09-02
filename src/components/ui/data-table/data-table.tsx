"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
  IconSelector,
  IconChevronUp,
} from "@tabler/icons-react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Column, TableOptions } from "@tanstack/react-table";
import { DataTablePaging } from "./data-table-paging";

// Sortable header component for columns
// Cycles: default → asc → desc → default
export function SortableHeader<TData>({
  column,
  children,
  className,
}: {
  column: Column<TData>;
  children: React.ReactNode;
  className?: string;
}) {
  const sorted = column.getIsSorted();

  const handleClick = () => {
    if (sorted === false) {
      column.toggleSorting(false); // → asc
    } else if (sorted === "asc") {
      column.toggleSorting(true); // → desc
    } else {
      column.clearSorting(); // → default
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 data-[state=open]:bg-accent", className)}
      onClick={handleClick}
    >
      {children}
      {sorted === "asc" ? (
        <IconChevronUp className="ml-2 size-4" />
      ) : sorted === "desc" ? (
        <IconChevronDown className="ml-2 size-4" />
      ) : (
        <IconSelector className="ml-2 size-4 text-muted-foreground" />
      )}
    </Button>
  );
}

interface DataTableProps<TData extends { id: string | number }> {
  data: TData[];
  columns: ColumnDef<TData>[];
  enableDragAndDrop?: boolean;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  addButtonLabel?: string;
  onAddClick?: () => void;
  onRowClick?: (row: TData) => void;
  onSelectionChange?: (selectedRows: TData[]) => void;
  emptyMessage?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  meta?: TPaginationMeta;
  pagination?: TPaginationQuery;
  setPagination?: React.Dispatch<React.SetStateAction<TPaginationQuery>>;
}

function DragHandle({ id }: { id: string | number }) {
  const { attributes, listeners } = useSortable({ id });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

function DraggableRow<TData extends { id: string | number }>({
  row,
}: {
  row: Row<TData>;
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map(cell => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable<TData extends { id: string | number }>({
  data: initialData,
  columns: userColumns,
  enableDragAndDrop = false,
  enableRowSelection = false,
  enableColumnVisibility = true,
  addButtonLabel,
  onAddClick,
  onRowClick,
  onSelectionChange,
  emptyMessage = "No results.",
  leftContent,
  rightContent,
  meta,
  pagination,
  setPagination,
}: DataTableProps<TData>) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Create a proper PaginationState from TPaginationQuery
  const paginationState = React.useMemo(() => {
    if (pagination) {
      return {
        pageIndex: (pagination.pageIndex ?? 1) - 1, // Convert 1-based to 0-based
        pageSize: pagination.pageSize ?? 10,
      };
    }
    return {
      pageIndex: 1,
      pageSize: 10,
    };
  }, [pagination]);

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  React.useEffect(() => {
    if (!onSelectionChange || !enableRowSelection) return;
    const selected = data.filter(
      row => rowSelection[row.id.toString()] === true
    );
    onSelectionChange(selected);
  }, [rowSelection, data, onSelectionChange, enableRowSelection]);

  const columns = React.useMemo<ColumnDef<TData>[]>(() => {
    const cols: ColumnDef<TData>[] = [];

    if (enableDragAndDrop) {
      cols.push({
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
        enableSorting: false,
        enableHiding: false,
      });
    }

    if (enableRowSelection) {
      cols.push({
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={value =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div
            className="flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={value => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      });
    }

    return [...cols, ...userColumns];
  }, [userColumns, enableDragAndDrop, enableRowSelection]);

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  );

  const tableOptions: TableOptions<TData> = {
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      ...(pagination && {
        pagination: paginationState,
      }),
    },
    getRowId: row => row.id.toString(),
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),

    ...(!pagination && { getPaginationRowModel: getPaginationRowModel() }),
  };

  if (meta && setPagination) {
    tableOptions.manualPagination = true;
    tableOptions.pageCount = meta.totalPages;
    tableOptions.onPaginationChange = updater => {
      if (typeof updater === "function") {
        const currentState = {
          pageIndex: (pagination?.pageIndex ?? 1) - 1,
          pageSize: pagination?.pageSize ?? 10,
        };
        const newState = updater(currentState);
        setPagination({
          ...pagination,
          pageIndex: newState.pageIndex + 1, // Convert 0-based back to 1-based
          pageSize: newState.pageSize,
        });
      }
    };
  }
  const table = useReactTable(tableOptions);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData(data => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  const tableContent = (
    <Table className="w-full">
      <TableHeader className="bg-muted sticky top-0 z-10">
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header, index) => (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                className={cn(index === 0 && enableRowSelection && "w-12")}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          enableDragAndDrop ? (
            <SortableContext
              items={dataIds}
              strategy={verticalListSortingStrategy}
            >
              {table.getRowModel().rows.map(row => (
                <DraggableRow key={row.id} row={row} />
              ))}
            </SortableContext>
          ) : (
            table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => onRowClick?.(row.original)}
                className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">{leftContent}</div>
        <div className="flex items-center gap-2">
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    column =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
                  .map(column => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={value =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {rightContent}
          {addButtonLabel && (
            <Button variant="outline" size="sm" onClick={onAddClick}>
              <IconPlus />
              <span className="hidden lg:inline">{addButtonLabel}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          {enableDragAndDrop ? (
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              {tableContent}
            </DndContext>
          ) : (
            tableContent
          )}
        </div>
      </div>

      <DataTablePaging table={table} enableRowSelection={enableRowSelection} />
    </div>
  );
}
