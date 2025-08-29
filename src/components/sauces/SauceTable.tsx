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

  // const columns: ColumnDef<Sauce>[] = [
  //   {
  //     id: "select",
  //     header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
  //     cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(!!value)} aria-label="Select row" />,
  //     enableSorting: false,
  //     enableHiding: false
  //   },
  //   {
  //     accessorKey: "name",
  //     header: "Sauce Name",
  //     cell: ({ row }) => {
  //       const sauce = row.original;
  //       return (
  //         <div className="flex flex-col">
  //           <div className="font-medium">{sauce.name}</div>
  //           {sauce.description && <div className="text-sm text-gray-500 truncate max-w-xs">{sauce.description}</div>}
  //         </div>
  //       );
  //     }
  //   },
  //   {
  //     accessorKey: "category",
  //     header: "Category",
  //     cell: ({ row }) => (
  //       <Badge variant="outline" className="flex justify-center w-fit items-center gap-1">
  //         <ChefHat className="w-3 h-3" />
  //         {row.getValue("category")}
  //       </Badge>
  //     )
  //   },
  //   {
  //     accessorKey: "ingredients",
  //     header: "Ingredients",
  //     cell: ({ row }) => {
  //       const ingredients = row.original.ingredients || row.original.baseIngredients || [];
  //       return <span className="font-medium">{ingredients.length} ingredients</span>;
  //     }
  //   },
  //   {
  //     accessorKey: "yieldQuantity",
  //     header: "Total Qty",
  //     cell: ({ row }) => {
  //       const sauce = row.original;
  //       const isLowYield = sauce.yieldQuantity < 10;
  //       return (
  //         <span className={`font-medium ${isLowYield ? "text-red-600 font-semibold" : ""}`}>
  //           {sauce.yieldQuantity} {sauce.unit}
  //           {isLowYield && " (Low)"}
  //         </span>
  //       );
  //     }
  //   },
  //   {
  //     accessorKey: "totalCost",
  //     header: "Total Cost",
  //     cell: ({ row }) => {
  //       const totalCost = row.getValue<number>("totalCost");
  //       const cost = typeof totalCost === "number" ? totalCost : parseFloat(totalCost) || 0;
  //       return <span className="font-medium">${cost.toFixed(2)}</span>;
  //     }
  //   },
  //   {
  //     accessorKey: "costPerUnit",
  //     header: "Cost/Unit",
  //     cell: ({ row }) => {
  //       const costPerUnit = row.getValue<number>("costPerUnit");
  //       const cost = typeof costPerUnit === "number" ? costPerUnit : parseFloat(costPerUnit) || 0;
  //       return <span className="font-medium text-left">${cost.toFixed(4)}</span>;
  //     }
  //   },
  //   {
  //     accessorKey: "preparationTime",
  //     header: "Prep Time",
  //     cell: ({ row }) => {
  //       const prepTime = row.getValue<number>("preparationTime");
  //       return prepTime ? <span className="font-medium">{prepTime} min</span> : <span className="text-gray-400">-</span>;
  //     }
  //   },
  //   {
  //     accessorKey: "status",
  //     header: ({ table }) => <div className="text-center">Status</div>,
  //     cell: ({ row }) => {
  //       const sauce = row.original;
  //       return (
  //         <div className="flex justify-end border space-x-2">
  //           <Badge variant={sauce.isActive ? "default" : "secondary"}>{sauce.isActive ? "Active" : "Inactive"}</Badge>
  //           {sauce.isPOSItem && (
  //             <Badge variant="outline" className="text-xs">
  //               POS Item
  //             </Badge>
  //           )}
  //         </div>
  //       );
  //     }
  //   },
  //   {
  //     id: "actions",
  //     header: ({ table }) => <div className="text-center">Actions</div>,
  //     cell: ({ row }) => {
  //       const sauce = row.original;
  //       return (
  //         <DropdownMenu>
  //           <DropdownMenuTrigger asChild>
  //             <Button variant="ghost" className="h-8 w-8 p-0">
  //               <span className="sr-only">Open menu</span>
  //               <MoreHorizontal className="h-4 w-4" />
  //             </Button>
  //           </DropdownMenuTrigger>
  //           <DropdownMenuContent align="end">
  //             <DropdownMenuItem onClick={() => onEditSauce(sauce)}>
  //               <Edit className="mr-2 h-4 w-4" />
  //               Edit
  //             </DropdownMenuItem>
  //             <DropdownMenuItem onClick={() => onTogglePOSVisibility(sauce)}>
  //               {sauce.isPOSItem ? (
  //                 <>
  //                   <EyeOff className="mr-2 h-4 w-4" />
  //                   Hide from POS
  //                 </>
  //               ) : (
  //                 <>
  //                   <Eye className="mr-2 h-4 w-4" />
  //                   Show in POS
  //                 </>
  //               )}
  //             </DropdownMenuItem>
  //             <DropdownMenuSeparator />
  //             <DropdownMenuItem
  //               onClick={() => {
  //                 setSauceToDelete(sauce);
  //                 setDeleteDialogOpen(true);
  //               }}
  //               className="text-red-600"
  //             >
  //               <Trash2 className="mr-2 h-4 w-4" />
  //               Delete
  //             </DropdownMenuItem>
  //           </DropdownMenuContent>
  //         </DropdownMenu>
  //       );
  //     }
  //   }
  // ];

  const columns: ColumnDef<Sauce>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex justify-center w-full">
          <Checkbox 
            checked={table.getIsAllPageRowsSelected()} 
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)} 
            aria-label="Select all" 
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center w-full">
          <Checkbox 
            checked={row.getIsSelected()} 
            onCheckedChange={value => row.toggleSelected(!!value)} 
            aria-label="Select row" 
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 60
    },
    {
      accessorKey: "name",
      header: () => <div className="text-left w-full">Sauce Name</div>,
      cell: ({ row }) => {
        const sauce = row.original;
        return (
          <div className="flex flex-col w-full">
            <div className="font-medium text-foreground">{sauce.name}</div>
            {sauce.description && (
              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                {sauce.description}
              </div>
            )}
          </div>
        );
      },
      size: 250
    },
    {
      accessorKey: "category",
      header: () => <div className="text-center w-full">Category</div>,
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        return (
          <div className="flex justify-center w-full">
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
              <ChefHat className="w-3 h-3" />
              {category}
            </Badge>
          </div>
        );
      },
      size: 140
    },
    {
      accessorKey: "ingredients",
      header: () => <div className="text-center w-full">Ingredients</div>,
      cell: ({ row }) => {
        const ingredients = row.original.ingredients || row.original.baseIngredients || [];
        return (
          <div className="flex justify-center w-full">
            <span className="font-medium text-foreground">
              {ingredients.length} {ingredients.length === 1 ? 'ingredient' : 'ingredients'}
            </span>
          </div>
        );
      },
      size: 120
    },
    {
      accessorKey: "yieldQuantity",
      header: () => <div className="text-center w-full">Total Qty</div>,
      cell: ({ row }) => {
        const sauce = row.original;
        const isLowYield = sauce.yieldQuantity < 10;
        return (
          <div className="flex justify-center w-full">
            <span className={`font-medium ${isLowYield ? "text-destructive font-semibold" : "text-foreground"}`}>
              {sauce.yieldQuantity} {sauce.unit}
              {isLowYield && <span className="text-xs ml-1">(Low)</span>}
            </span>
          </div>
        );
      },
      size: 120
    },
    {
      accessorKey: "totalCost",
      header: () => <div className="text-right w-full">Total Cost</div>,
      cell: ({ row }) => {
        const totalCost = row.getValue<number>("totalCost");
        const cost = typeof totalCost === "number" ? totalCost : parseFloat(totalCost) || 0;
        return (
          <div className="flex justify-end w-full pr-4">
            <span className="font-medium text-foreground">${cost.toFixed(2)}</span>
          </div>
        );
      },
      size: 120
    },
    {
      accessorKey: "costPerUnit",
      header: () => <div className="text-right w-full">Cost/Unit</div>,
      cell: ({ row }) => {
        const costPerUnit = row.getValue<number>("costPerUnit");
        const cost = typeof costPerUnit === "number" ? costPerUnit : parseFloat(costPerUnit) || 0;
        return (
          <div className="flex justify-end w-full pr-4">
            <span className="font-medium text-foreground">${cost.toFixed(4)}</span>
          </div>
        );
      },
      size: 120
    },
    {
      accessorKey: "preparationTime",
      header: () => <div className="text-center w-full">Prep Time</div>,
      cell: ({ row }) => {
        const prepTime = row.getValue<number>("preparationTime");
        return (
          <div className="flex justify-center w-full">
            {prepTime ? (
              <span className="font-medium text-foreground">{prepTime} min</span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
      size: 100
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center w-full">Status</div>,
      cell: ({ row }) => {
        const sauce = row.original;
        return (
          <div className="flex justify-center w-full gap-2">
            <Badge variant={sauce.isActive ? "default" : "secondary"}>
              {sauce.isActive ? "Active" : "Inactive"}
            </Badge>
            {sauce.isPOSItem && (
              <Badge variant="outline" className="text-xs">
                POS
              </Badge>
            )}
          </div>
        );
      },
      size: 140
    },
    {
      id: "actions",
      header: () => <div className="text-center w-full">Actions</div>,
      cell: ({ row }) => {
        const sauce = row.original;
        return (
          <div className="flex justify-center w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
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
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      size: 100,
      enableSorting: false
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
