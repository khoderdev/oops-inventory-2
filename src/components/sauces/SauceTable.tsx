import { useState, useMemo } from "react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getSortedRowModel, SortingState, getFilteredRowModel } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff, Search, Filter, ChefHat, Clock, DollarSign, Package, AlertTriangle } from "lucide-react";
import { Sauce, SauceTableProps, Material } from "@/types/inventory";
import { toast } from "@/hooks/use-toast";

export function SauceTable({ sauces, materials, onEditSauce, onDeleteSauce, onBulkDelete, onTogglePOSVisibility }: SauceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sauceToDelete, setSauceToDelete] = useState<Sauce | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Materials lookup for ingredient names
  const materialsById = useMemo(() => {
    const map = new Map<string, Material>();
    materials.forEach(material => map.set(material.id, material));
    return map;
  }, [materials]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(sauces.map(sauce => sauce.category))];
    return uniqueCategories.sort();
  }, [sauces]);

  // Filter sauces
  const filteredSauces = useMemo(() => {
    return sauces.filter(sauce => {
      const matchesSearch = !searchTerm || sauce.name.toLowerCase().includes(searchTerm.toLowerCase()) || sauce.description?.toLowerCase().includes(searchTerm.toLowerCase()) || sauce.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === "all" || sauce.category === categoryFilter;

      const matchesStatus = statusFilter === "all" || (statusFilter === "active" && sauce.isActive) || (statusFilter === "inactive" && !sauce.isActive) || (statusFilter === "pos" && sauce.isPOSItem) || (statusFilter === "non-pos" && !sauce.isPOSItem);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [sauces, searchTerm, categoryFilter, statusFilter]);

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
        <Badge variant="outline" className="flex items-center gap-1">
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
        return (
          <div className="flex flex-col space-y-1">
            <div className="text-sm font-medium">{ingredients.length} ingredients</div>
            <div className="text-xs text-gray-500">
              {ingredients
                .slice(0, 2)
                .map(ing => {
                  const material = materialsById.get(ing.materialId);
                  return material?.name || "Unknown";
                })
                .join(", ")}
              {ingredients.length > 2 && ` +${ingredients.length - 2} more`}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "yieldQuantity",
      header: "Yield",
      cell: ({ row }) => {
        const sauce = row.original;
        return (
          <div className="flex items-center gap-1">
            <Package className="w-3 h-3 text-gray-400" />
            <span>
              {sauce.yieldQuantity} {sauce.unit}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: "totalCost",
      header: "Total Cost",
      cell: ({ row }) => {
        const totalCost = row.getValue<number>("totalCost");
        const cost = typeof totalCost === "number" ? totalCost : parseFloat(totalCost) || 0;
        return (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-gray-400" />
            <span className="font-medium">${cost.toFixed(2)}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "costPerUnit",
      header: "Cost/Unit",
      cell: ({ row }) => {
        const costPerUnit = row.getValue<number>("costPerUnit");
        const cost = typeof costPerUnit === "number" ? costPerUnit : parseFloat(costPerUnit) || 0;
        return (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-gray-400" />
            <span>${cost.toFixed(4)}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "preparationTime",
      header: "Prep Time",
      cell: ({ row }) => {
        const prepTime = row.getValue<number>("preparationTime");
        return prepTime ? (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>{prepTime}min</span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        );
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

  const table = useReactTable({
    data: filteredSauces,
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
  const selectedSauceIds = selectedRows.map(row => row.original.id);

  const handleBulkDelete = () => {
    if (selectedSauceIds.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select sauces to delete",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    onBulkDelete(selectedSauceIds);
    setRowSelection({});
    setBulkDeleteDialogOpen(false);
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
      {/* Header with filters and actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
           
            <div className="flex items-center gap-2">
              {selectedSauceIds.length > 0 && (
                <Button onClick={handleBulkDelete} variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected ({selectedSauceIds.length})
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search sauces..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pos">POS Items</SelectItem>
                  <SelectItem value="non-pos">Non-POS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id} className="font-medium">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
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
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ChefHat className="w-8 h-8 text-gray-400" />
                        <div className="text-gray-500">No sauces found</div>
                        <div className="text-sm text-gray-400">{searchTerm || categoryFilter !== "all" || statusFilter !== "all" ? "Try adjusting your filters" : "Create your first sauce to get started"}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Sauces</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {selectedSauceIds.length} selected sauce(s)? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
