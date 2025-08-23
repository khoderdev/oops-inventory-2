import { useMemo, useState } from "react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getSortedRowModel, SortingState, getFilteredRowModel } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff, ChefHat, Search, Settings2 } from "lucide-react";
import { Sauce, SauceTableProps } from "@/types/inventory";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { BulkSelectionToolbar } from "@/components/ui/BulkSelectionToolbar";

export function SauceTable({ sauces, onEditSauce, onDeleteSauce, onBulkDelete, onTogglePOSVisibility }: SauceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [density, setDensity] = useState<"compact" | "comfortable" | "spacious">("comfortable");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sauceToDelete, setSauceToDelete] = useState<Sauce | null>(null);

  const columns: ColumnDef<Sauce>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const all = table.getIsAllRowsSelected();
        const some = table.getIsSomeRowsSelected();
        const checked = all ? true : some ? "indeterminate" : false;
        return (
          <Checkbox checked={checked} onCheckedChange={value => table.toggleAllRowsSelected(!!value)} aria-label="Select all" />
        );
      },
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(!!value)} aria-label="Select row" />
      ),
      enableSorting: false,
      enableHiding: false
    },
    {
      accessorKey: "name",
      header: "Sauce Name",
      cell: ({ row }) => {
        const sauce = row.original;
        return (
          <div className="flex flex-col">
            <div className="font-medium">{sauce.name}</div>
            {sauce.description && <div className="text-sm text-gray-500 truncate max-w-xs">{sauce.description}</div>}
          </div>
        );
      }
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const cat = (row.original as any).category;
        const label = typeof cat === "string" ? cat : cat?.name ?? "uncategorized";
        return (
          <Badge variant="outline" className="flex justify-center w-fit items-center gap-1">
            <ChefHat className="w-3 h-3" />
            {label}
          </Badge>
        );
      }
    },
    {
      accessorKey: "ingredients",
      header: "Ingredients",
      cell: ({ row }) => {
        const ingredients = row.original.ingredients || row.original.baseIngredients || [];
        return <span className="font-medium">{ingredients.length} ingredients</span>;
      }
    },
    {
      accessorKey: "yieldQuantity",
      header: "Yield",
      cell: ({ row }) => {
        const sauce = row.original;
        return (
          <span className="font-medium">
            {sauce.yieldQuantity} {sauce.unit}
          </span>
        );
      }
    },
    {
      accessorKey: "totalCost",
      header: "Total Cost",
      cell: ({ row }) => {
        const totalCost = row.getValue<number>("totalCost");
        const cost = typeof totalCost === "number" ? totalCost : parseFloat(totalCost as unknown as string) || 0;
        return <span className="font-medium">${cost.toFixed(2)}</span>;
      }
    },
    {
      accessorKey: "costPerUnit",
      header: "Cost/Unit",
      cell: ({ row }) => {
        const costPerUnit = row.getValue<number>("costPerUnit");
        const cost = typeof costPerUnit === "number" ? costPerUnit : parseFloat(costPerUnit as unknown as string) || 0;
        return <span className="font-medium">${cost.toFixed(4)}</span>;
      }
    },
    {
      accessorKey: "preparationTime",
      header: "Prep Time",
      cell: ({ row }) => {
        const prepTime = row.getValue<number>("preparationTime");
        return prepTime ? <span className="font-medium">{prepTime} min</span> : <span className="text-gray-400">-</span>;
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const sauce = row.original;
        return (
          <div className="flex flex-col space-y-1">
            <Badge variant={sauce.isActive ? "default" : "secondary"}>{sauce.isActive ? "Active" : "Inactive"}</Badge>
            {sauce.isPOSItem && (
              <Badge variant="outline" className="text-xs">
                POS Item
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const sauce = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditSauce(sauce)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePOSVisibility(sauce)}>
                {sauce.isPOSItem ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide from POS
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Show in POS
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSauceToDelete(sauce);
                  setDeleteDialogOpen(true);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  const filteredData = useMemo(() => {
    const term = globalFilter.trim().toLowerCase();
    if (!term) return sauces;
    return sauces.filter(s => {
      const fields = [s.name, (s as any).category, s.description]?.filter(Boolean) as string[];
      return fields.some(v => v.toLowerCase().includes(term));
    });
  }, [sauces, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      rowSelection,
      columnVisibility
    }
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedSauceIds = useMemo(() => selectedRows.map(row => row.original.id), [selectedRows]);

  const confirmBulkDelete = () => {
    onBulkDelete(selectedSauceIds);
    setRowSelection({});
    toast({
      title: "Deleted",
      description: `${selectedSauceIds.length} sauce(s) deleted successfully`,
      duration: 2000
    });
  };

  const confirmDelete = () => {
    if (sauceToDelete) {
      onDeleteSauce(sauceToDelete.id);
      setDeleteDialogOpen(false);
      setSauceToDelete(null);
      toast({
        title: "Deleted",
        description: `${sauceToDelete.name} deleted successfully`,
        duration: 2000
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls: Search, Column visibility, Density */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 w-full md:max-w-md">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search sauces by name, category, description..."
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {table.getAllLeafColumns()
                    .filter(c => c.id !== "select" && c.id !== "actions")
                    .map(column => (
                      <DropdownMenuItem key={column.id} className="flex items-center justify-between">
                        <span className="capitalize">{column.id}</span>
                        <Checkbox
                          checked={column.getIsVisible()}
                          onCheckedChange={val => column.toggleVisibility(!!val)}
                          aria-label={`Toggle ${column.id}`}
                        />
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden sm:flex items-center rounded-md border overflow-hidden">
                <Button variant={density === "compact" ? "default" : "ghost"} size="sm" onClick={() => setDensity("compact")}>XS</Button>
                <Button variant={density === "comfortable" ? "default" : "ghost"} size="sm" onClick={() => setDensity("comfortable")}>SM</Button>
                <Button variant={density === "spacious" ? "default" : "ghost"} size="sm" onClick={() => setDensity("spacious")}>MD</Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white">
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      const id = header.column.id;
                      const hiddenOnSmall = ["ingredients", "preparationTime", "status"].includes(id) ? "hidden md:table-cell" : "";
                      const hiddenOnXs = id === "costPerUnit" ? "hidden sm:table-cell" : "";
                      return (
                        <TableHead key={header.id} className={`font-medium ${hiddenOnSmall} ${hiddenOnXs}`}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => {
                    const padding = density === "compact" ? "py-1.5" : density === "spacious" ? "py-4" : "py-2.5";
                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="hover:bg-gray-50 data-[state=selected]:bg-indigo-50 data-[state=selected]:ring-1 data-[state=selected]:ring-indigo-200 cursor-pointer"
                        onClick={() => row.toggleSelected()}
                      >
                        {row.getVisibleCells().map(cell => {
                          const id = cell.column.id;
                          const hiddenOnSmall = ["ingredients", "preparationTime", "status"].includes(id) ? "hidden md:table-cell" : "";
                          const hiddenOnXs = id === "costPerUnit" ? "hidden sm:table-cell" : "";
                          const stopClick = id === "select" || id === "actions";
                          return (
                            <TableCell
                              key={cell.id}
                              className={`${padding} ${hiddenOnSmall} ${hiddenOnXs}`}
                              onClick={stopClick ? e => e.stopPropagation() : undefined}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ChefHat className="w-8 h-8 text-gray-400" />
                        <div className="text-gray-500">No sauces found</div>
                        <div className="text-sm text-gray-400">Create your first sauce to get started</div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk selection toolbar */}
      <BulkSelectionToolbar<number>
        selectedItems={useMemo(() => new Set(selectedSauceIds), [selectedSauceIds])}
        totalItems={filteredData.length}
        selectionLabel="sauce"
        onSelectAll={checked => table.toggleAllRowsSelected(!!checked)}
        onClearSelection={() => setRowSelection({})}
        bulkActions={[
          {
            id: "bulk-delete",
            label: "Delete",
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive",
            requiresConfirmation: true,
            confirmationTitle: "Delete selected sauces",
            confirmationDescription: `Are you sure you want to delete ${selectedSauceIds.length} selected sauce(s)? This action cannot be undone.`,
            confirmationActionText: "Delete",
            onClick: confirmBulkDelete
          }
        ]}
        position="bottom"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sauce</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{sauceToDelete?.name}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
