import React, { useMemo, useState } from "react";
import { ColumnDef, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, flexRender } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit, Trash2, User2, Hash } from "lucide-react";
import type { Department, DepartmentTableProps } from "@/types/department";

export const DepartmentTable: React.FC<DepartmentTableProps> = ({ data, total, page, limit, loading = false, search = "", isActive, onEdit, onDelete, onBulkDelete, onFiltersChange, onPageChange, onPageSizeChange }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, limit)));

  const columns = useMemo<ColumnDef<Department>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
        cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(!!value)} aria-label="Select row" />,
        enableSorting: false,
        enableHiding: false
      },
      {
        accessorKey: "name",
        header: "Department",
        cell: ({ row }) => {
          const dept = row.original;
          return (
            <div className="flex flex-col">
              <div className="font-medium">{dept.name}</div>
              {dept.description ? <div className="text-xs text-muted-foreground truncate max-w-xs">{dept.description}</div> : null}
            </div>
          );
        }
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <Badge variant="outline" className="flex items-center gap-1 w-fit">
            <Hash className="w-3 h-3" /> {row.getValue("code")}
          </Badge>
        )
      },
      {
        id: "manager",
        header: "Manager",
        cell: ({ row }) => {
          const manager = row.original.manager;
          if (!manager) return <span className="text-muted-foreground">-</span>;
          return (
            <div className="flex items-center gap-2">
              <User2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">
                {manager.firstName} {manager.lastName}
              </span>
            </div>
          );
        }
      },
      {
        accessorKey: "costCenter",
        header: "Cost Center",
        cell: ({ row }) => row.original.costCenter ?? <span className="text-muted-foreground">-</span>
      },
      {
        accessorKey: "employeeCount",
        header: "Employees",
        cell: ({ row }) => <span className="font-medium">{row.original.employeeCount ?? 0}</span>
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <Badge variant={row.original.isActive ? "default" : "secondary"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const dept = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(dept)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => onDelete(dept)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
      }
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection
    }
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map(r => r.original.id);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              {onBulkDelete && selectedIds.length > 0 && (
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete Selected ({selectedIds.length})
                </Button>
              )}
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
              <div className="flex-1 md:w-64">
                <Input value={search} onChange={e => onFiltersChange?.({ search: e.target.value, page: 1 })} placeholder="Search departments..." />
              </div>
              <Select
                value={isActive === undefined ? "all" : isActive ? "active" : "inactive"}
                onValueChange={val => {
                  const next = val === "all" ? undefined : val === "active";
                  onFiltersChange?.({ isActive: next, page: 1 });
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(limit)} onValueChange={val => onPageSizeChange?.(Number(val))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map(sz => (
                    <SelectItem key={sz} value={String(sz)}>
                      {sz} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground flex items-center justify-between">
          <div>
            Showing {(page - 1) * limit + (data.length ? 1 : 0)}-{(page - 1) * limit + data.length} of {total}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(hg => (
                  <TableRow key={hg.id}>
                    {hg.headers.map(h => (
                      <TableHead key={h.id} className="font-medium">
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No departments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} of {pageCount}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => onPageChange?.(Math.max(1, page - 1))} />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext onClick={() => onPageChange?.(Math.min(pageCount, page + 1))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      {onBulkDelete && (
        <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Multiple Departments</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete {selectedIds.length} selected department(s)? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  onBulkDelete(selectedIds);
                  setRowSelection({});
                  setBulkDeleteDialogOpen(false);
                }}
              >
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
