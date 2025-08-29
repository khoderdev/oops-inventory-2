import { useEffect, useState } from "react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getSortedRowModel, SortingState, getFilteredRowModel } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff, ChefHat } from "lucide-react";
import { Sauce, SauceTableProps } from "@/types/inventory";
import { toast } from "@/hooks/use-toast";

export function SauceTable({ sauces, onEditSauce, onDeleteSauce, onTogglePOSVisibility, onSelectionChange }: SauceTableProps & { onSelectionChange?: (selectedIds: string[]) => void }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sauceToDelete, setSauceToDelete] = useState<Sauce | null>(null);

  useEffect(() => {
    if (onSelectionChange) {
      const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
      onSelectionChange(selectedIds);
    }
  }, [rowSelection, onSelectionChange]);

  const columns: ColumnDef<Sauce>[] = [
    {
      id: "select",
      header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(!!value)} aria-label="Select row" />,
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
      cell: ({ row }) => (
        <Badge variant="outline" className="flex justify-center w-fit items-center gap-1">
          <ChefHat className="w-3 h-3" />
          {row.getValue("category")}
        </Badge>
      )
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
      header: "Total Qty",
      cell: ({ row }) => {
        const sauce = row.original;
        const isLowYield = sauce.yieldQuantity < 10;
        return (
          <span className={`font-medium ${isLowYield ? "text-red-600 font-semibold" : ""}`}>
            {sauce.yieldQuantity} {sauce.unit}
            {isLowYield && " (Low)"}
          </span>
        );
      }
    },
    {
      accessorKey: "totalCost",
      header: "Total Cost",
      cell: ({ row }) => {
        const totalCost = row.getValue<number>("totalCost");
        const cost = typeof totalCost === "number" ? totalCost : parseFloat(totalCost) || 0;
        return <span className="font-medium">${cost.toFixed(2)}</span>;
      }
    },
    {
      accessorKey: "costPerUnit",
      header: "Cost/Unit",
      cell: ({ row }) => {
        const costPerUnit = row.getValue<number>("costPerUnit");
        const cost = typeof costPerUnit === "number" ? costPerUnit : parseFloat(costPerUnit) || 0;
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
          <div className="flex  space-x-2">
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

  const table = useReactTable({
    data: sauces,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection
    }
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const confirmDelete = () => {
    if (sauceToDelete) {
      onDeleteSauce(sauceToDelete.id);
      setDeleteDialogOpen(false);
      setSauceToDelete(null);
      toast({
        title: "Deleted",
        description: `${sauceToDelete.name} deleted successfully`,
        duration: 1000
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with filters and actions */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="rounded-md border">
            {/* Header outside the scroll container */}
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map(header => (
                        <TableHead
                          key={header.id}
                          className="font-medium bg-muted/50 sticky top-0" // Add sticky here too
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
              </Table>
            </div>

            {/* Scroll container for body only */}
            <div className="relative overflow-y-auto h-[calc(100vh-350px)]">
              <Table>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map(row => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-muted/50">
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id} className="py-3 border-t border-border">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-[400px] text-center">
                        <div className="flex flex-col items-center justify-center space-y-2 h-full">
                          <ChefHat className="w-12 h-12 text-muted-foreground/50" />
                          <div className="text-lg font-medium text-muted-foreground">No sauces found</div>
                          <div className="text-sm text-muted-foreground/70">Create your first sauce to get started</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

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
