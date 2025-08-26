import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TanStackTable } from "@/components/ui/TanStackTable";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { MaterialTableProps, MaterialWithStock } from "@/types/inventory";
import { highlightText } from "@/utils/highlightText";
import { Edit, Plus, Search, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createColumnHelper, getCoreRowModel, useReactTable, ColumnDef, SortingState, ColumnFiltersState } from "@tanstack/react-table";
import { Category } from "@/types/categories";
import { BulkSelectionToolbar, BulkEditDialog } from "@/components/ui/BulkSelectionToolbar";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/use-media-query";

export function MaterialTable({ filteredMaterials, categories, onEditMaterial, onBulkEdit, onBulkDelete, onAddStock, onDeleteMaterial }: MaterialTableProps) {
  const { setShowMaterialForm } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<{ categoryId?: number | null }>({});
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 600px)");

  const handleBulkEditOpen = () => {
    setBulkEditData({});
    setShowBulkEditDialog(true);
  };

  const handleBulkEditSubmit = async () => {
    const selectedRows = table?.getState().rowSelection || {};
    const selectedIds = Object.keys(selectedRows)
      .filter(index => selectedRows[index])
      .map(index => {
        const material = paginatedMaterials[parseInt(index)];
        return material ? material.id.toString() : null;
      })
      .filter(id => id !== null);
    if (selectedIds.length === 0 || !onBulkEdit) return;
    if (!bulkEditData.categoryId) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
        duration: 1000
      });
      return;
    }

    try {
      setBulkEditLoading(true);
      const categoryId = Number(bulkEditData.categoryId);
      console.log("🔄 Bulk updating materials with categoryId:", categoryId);
      console.log("Selected material IDs:", selectedIds);
      await onBulkEdit(selectedIds, categoryId);
      toast({
        title: "Success",
        description: `Updated ${selectedIds.length} material${selectedIds.length === 1 ? "" : "s"} successfully`,
        duration: 1000
      });
      setShowBulkEditDialog(false);
      table?.setRowSelection({});
    } catch (error) {
      console.error("Error updating items:", error);
      toast({
        title: "Error",
        description: "Failed to update materials",
        variant: "destructive",
        duration: 1000
      });
    } finally {
      setBulkEditLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const selectedRows = table.getState().rowSelection;
    const selectedIds = Object.keys(selectedRows).filter(id => selectedRows[id]);

    if (selectedIds.length === 0 || !onBulkDelete) return;

    try {
      await onBulkDelete(selectedIds);
      toast({
        title: "Success",
        description: `Deleted ${selectedIds.length} material${selectedIds.length === 1 ? "" : "s"} successfully`,
        duration: 1000
      });
      table.setRowSelection({});
    } catch (error) {
      console.error("Error deleting materials:", error);
      toast({
        title: "Error",
        description: "Failed to delete materials",
        variant: "destructive",
        duration: 1000
      });
    }
  };

  const categoriesById = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach(category => {
      map.set(category.id, category);
    });
    return map;
  }, [categories]);

  const categoriesByValue = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(category => {
      map.set(category.value, category);
    });
    return map;
  }, [categories]);

  const visibleMaterials = useMemo(() => {
    return filteredMaterials.filter(material => {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = material.name.toLowerCase().includes(searchLower);
      const matchesSearch = searchTerm === "" || matchesName;

      const matchesCategory =
        categoryFilter === "all" ||
        (() => {
          const materialCategoryId = (material as any).categoryId;
          if (materialCategoryId && categoriesById.has(materialCategoryId)) {
            return categoriesById.get(materialCategoryId)?.value === categoryFilter;
          }
          if (typeof material.category === "string" && material.category) {
            if (material.category === categoryFilter) return true;
            return categoriesByValue.get(material.category)?.value === categoryFilter;
          }
          if (typeof material.category === "object" && material.category !== null) {
            const categoryAsAny = material.category as any;
            if ("value" in categoryAsAny && categoryAsAny.value === categoryFilter) return true;
            if ("id" in categoryAsAny && categoryAsAny.id !== null && categoryAsAny.id !== undefined && categoriesById.has(categoryAsAny.id)) {
              return categoriesById.get(categoryAsAny.id)?.value === categoryFilter;
            }
          }
          return false;
        })();
      return matchesSearch && matchesCategory;
    });
  }, [filteredMaterials, searchTerm, categoryFilter, categoriesById, categoriesByValue]);

  const sortedMaterials = useMemo(() => {
    const arr = [...visibleMaterials];
    arr.sort((a, b) => {
      const aVal = (a as any)[sortBy] ?? "";
      const bVal = (b as any)[sortBy] ?? "";
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const cmp = aStr.localeCompare(bStr);
      return sortOrder === "ASC" ? cmp : -cmp;
    });
    return arr;
  }, [visibleMaterials, sortBy, sortOrder]);

  const paginatedMaterials = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = sortedMaterials.slice(startIndex, endIndex);
    return paginated;
  }, [sortedMaterials, currentPage, pageSize]);

  const paginationInfo = useMemo(() => {
    const totalItems = visibleMaterials.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: pageSize,
      startIndex,
      endIndex,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages
    };
  }, [visibleMaterials.length, currentPage, pageSize]);

  const handleSortChange = useCallback((newSortBy: string, newSortOrder: "ASC" | "DESC") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(paginationInfo.totalPages, prev + 1));
  }, [paginationInfo.totalPages]);

  const goToLastPage = useCallback(() => {
    setCurrentPage(paginationInfo.totalPages);
  }, [paginationInfo.totalPages]);

  const handlePageSizeChange = useCallback((newSize: string) => {
    const size = Number(newSize);
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;
      const currentScrollY = scrollContainer.scrollTop;
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setShowFloatingButton(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowFloatingButton(false);
      }
      setLastScrollY(currentScrollY);
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [lastScrollY]);

  const columnHelper = createColumnHelper<MaterialWithStock>();

  const columns = useMemo<ColumnDef<MaterialWithStock>[]>(
    () => [
      columnHelper.display({
        id: "select",
        enableSorting: false,
        size: 50,
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            ref={el => {
              if (el) {
                el.indeterminate = table.getIsSomeRowsSelected();
              }
            }}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4"
          />
        ),
        cell: ({ row }) => <input type="checkbox" checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} className="w-4 h-4" />
      }),
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "name" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("name", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Material Name
            <span className="ml-2 text-xs">{sortBy === "name" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue }) => <div className="font-medium">{highlightText(getValue(), searchTerm)}</div>,
        enableSorting: false,
        size: 250
      }),

      columnHelper.accessor("category", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "category" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("category", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Category
            <span className="ml-2 text-xs">{sortBy === "category" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue, row }) => {
          const category = getValue();
          const materialCategoryId = (row.original as any).categoryId;

          // Find category by ID first (most reliable for materials)
          let categoryInfo: Category | undefined;
          if (materialCategoryId && categoriesById.has(materialCategoryId)) {
            categoryInfo = categoriesById.get(materialCategoryId);
          }
          // Fallback to category object if present
          else if (typeof category === "object" && category !== null) {
            const categoryObj = category as any;
            if (categoryObj.id && categoriesById.has(categoryObj.id)) {
              categoryInfo = categoriesById.get(categoryObj.id);
            } else if (categoryObj.value && categoriesByValue.has(categoryObj.value)) {
              categoryInfo = categoriesByValue.get(categoryObj.value);
            }
          }
          // Fallback to string category value
          else if (typeof category === "string" && category && categoriesByValue.has(category)) {
            categoryInfo = categoriesByValue.get(category);
          }

          // If no category found, try to map common beverage category IDs to existing categories
          if (!categoryInfo && materialCategoryId === 17) {
            // Try to find a beverage-related category
            const beverageCategory = Array.from(categoriesById.values()).find(cat => cat.name.toLowerCase().includes("cold") || cat.name.toLowerCase().includes("drink") || cat.name.toLowerCase().includes("beverage"));
            if (beverageCategory) {
              categoryInfo = beverageCategory;
            }
          }

          // Handle no category case
          if (!categoryInfo && !category && !materialCategoryId) {
            return (
              <Badge variant="outline" className="text-xs font-medium bg-gray-100 text-gray-500 border-gray-200">
                No Category
              </Badge>
            );
          }

          // Get display values with better fallback logic
          const displayName = categoryInfo?.name || (typeof category === "object" && category !== null && (category as any).name) || (typeof category === "string" && category ? category : "Unknown Category");

          const categoryValue = categoryInfo?.value || (typeof category === "object" && category !== null && (category as any).value) || (typeof category === "string" && category ? category : "unknown");

          return (
            <Badge variant="outline" className={`text-xs font-medium ${getCategoryColor(categoryValue)}`}>
              {displayName}
            </Badge>
          );
        },
        enableSorting: false,
        size: 150
      }),

      columnHelper.accessor("baseUnit", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "baseUnit" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("baseUnit", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Base Unit
            <span className="ml-2 text-xs">{sortBy === "baseUnit" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue }) => <div className="text-gray-700 font-mono text-sm">{getValue()}</div>,
        enableSorting: false,
        size: 120
      }),

      columnHelper.accessor("unitType", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "unitType" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("unitType", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Unit Type
            <span className="ml-2 text-xs">{sortBy === "unitType" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue, row }) => {
          const unitType = getValue();
          return <div className="text-gray-700 capitalize">{unitType || "-"}</div>;
        },
        enableSorting: false,
        size: 120
      }),

      columnHelper.accessor("inputUnit", {
        header: "Input Unit",
        cell: ({ getValue, row }) => {
          const inputUnit = getValue();
          const baseUnit = row.original.baseUnit;
          return <div className="text-gray-700 font-mono text-sm">{inputUnit || baseUnit || "-"}</div>;
        },
        enableSorting: false,
        size: 120
      }),

      columnHelper.display({
        id: "actions",
        enableSorting: false,
        header: ({ column }) => <div className="flex justify-center w-full">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => onEditMaterial(row.original)} className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700">
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={5}>
                <p>Edit {row.original.name}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => onAddStock(row.original.id)} className={`h-8 w-8 p-0 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 ${row.original.stockEntries && row.original.stockEntries.length > 0 ? "bg-teal-300/25 border-teal-300" : "bg-red-500/25 border-red-300 hover:bg-red-300 hover:border-red-500"}`}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={5}>
                <p>{row.original.stockEntries && row.original.stockEntries.length > 0 ? `Add more stock for ${row.original.name} (${row.original.stockEntries.length} entries)` : `No stock entries - Add initial stock for ${row.original.name}`}</p>
              </TooltipContent>
            </Tooltip>
            <AlertDialog>
              <Tooltip>
                <AlertDialogTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                </AlertDialogTrigger>
                <TooltipContent side="top" sideOffset={5}>
                  <p>Delete {row.original.name}</p>
                </TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Material</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to delete "{row.original.name}"? This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeleteMaterial(row.original.id)} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
        size: 200
      })
    ],
    [searchTerm, onEditMaterial, onAddStock, onDeleteMaterial, sortBy, sortOrder, handleSortChange, categories]
  );

  const table = useReactTable({
    data: paginatedMaterials,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection: Object.fromEntries(Array.from(selectedItems).map(id => [id, true]))
    },
    enableRowSelection: true,
    onRowSelectionChange: updater => {
      // Convert the updater function or value to a new selection state
      const newSelection = typeof updater === "function" ? updater(Object.fromEntries(Array.from(selectedItems).map(id => [id, true]))) : updater;

      // Convert the object back to a Set
      const newSelectedItems = new Set(
        Object.entries(newSelection)
          .filter(([_, selected]) => selected)
          .map(([id, _]) => Number(id))
      );

      setSelectedItems(newSelectedItems);
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    // Force table to re-render when categories change
    meta: { categoriesVersion: categories.length }
  });

  useEffect(() => {
    if (categories.length > 0) {
      // Force re-render of the table when categories change
      table.setOptions(prev => ({
        ...prev,
        meta: { categoriesVersion: categories.length + Math.random() }
      }));
    }
  }, [categories, table]);

  // Define these functions after table is initialized
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Create a selection object with all visible materials selected
      const allSelected = Object.fromEntries(filteredMaterials.map(material => [material.id, true]));
      table.setRowSelection(allSelected);
    } else {
      // Clear all selections
      table.setRowSelection({});
    }
  };

  const handleClearSelection = () => {
    table.setRowSelection({});
  };

  const getCategoryColor = useCallback((category: string) => {
    switch (category) {
      case "meat":
        return "bg-red-100 text-red-800 border-red-200";
      case "dairy":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "vegetables":
        return "bg-green-100 text-green-800 border-green-200";
      case "grains":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "spices":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "beverages":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "alcohol":
        return "bg-pink-100 text-pink-800 border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }, []);

  // Helper to consistently resolve category display for a material
  const getCategoryDisplay = useCallback(
    (material: MaterialWithStock) => {
      const materialCategoryId = (material as any).categoryId;

      let categoryInfo: Category | undefined;
      if (materialCategoryId && categoriesById.has(materialCategoryId)) {
        categoryInfo = categoriesById.get(materialCategoryId);
      } else if (typeof material.category === "object" && material.category !== null) {
        const categoryObj = material.category as any;
        if (categoryObj.id && categoriesById.has(categoryObj.id)) {
          categoryInfo = categoriesById.get(categoryObj.id);
        } else if (categoryObj.value && categoriesByValue.has(categoryObj.value)) {
          categoryInfo = categoriesByValue.get(categoryObj.value);
        }
      } else if (typeof material.category === "string" && material.category && categoriesByValue.has(material.category)) {
        categoryInfo = categoriesByValue.get(material.category);
      }

      const name = categoryInfo?.name || (typeof material.category === "object" && material.category !== null && (material.category as any).name) || (typeof material.category === "string" ? material.category : "");
      const value = categoryInfo?.value || (typeof material.category === "object" && material.category !== null && (material.category as any).value) || (typeof material.category === "string" ? material.category : "");
      return { name, value };
    },
    [categoriesById, categoriesByValue]
  );

  const csvEscape = (val: unknown) => {
    const s = val == null ? "" : String(val);
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const handleExportCSV = useCallback(() => {
    // Prefer selected rows on the current page; otherwise export all filtered+sorted results
    const selectedRows = table.getState().rowSelection || {};
    const selectedMaterials: MaterialWithStock[] = Object.keys(selectedRows)
      .filter(k => (selectedRows as any)[k])
      .map(k => paginatedMaterials[parseInt(k, 10)])
      .filter(Boolean) as MaterialWithStock[];

    const dataToExport = selectedMaterials.length > 0 ? selectedMaterials : sortedMaterials;

    if (!dataToExport || dataToExport.length === 0) {
      toast({
        title: "No data",
        description: "There are no materials to export.",
        variant: "destructive",
        duration: 1000
      });
      return;
    }

    const headers = ["ID", "Name", "Category", "Base Unit", "Unit Type", "Input Unit", "POS Item"];

    const rows = dataToExport.map(m => {
      const cat = getCategoryDisplay(m);
      return [m.id, m.name, cat.name || "", (m as any).baseUnit || "", (m as any).unitType || "", (m as any).inputUnit || (m as any).baseUnit || "", (m as any).isPOSItem ? "Yes" : "No"];
    });

    const csv = [headers.map(csvEscape).join(","), ...rows.map(r => r.map(csvEscape).join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const filename = `materials_${selectedMaterials.length > 0 ? "selected_" : ""}export_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.csv`;

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Exported ${dataToExport.length} material${dataToExport.length === 1 ? "" : "s"} to CSV`,
      duration: 1000
    });
  }, [table, paginatedMaterials, sortedMaterials, getCategoryDisplay]);

  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={10}>
      <div className="h-full flex flex-col p-2 relative">
        {selectedItems.size > 0 && (
          <BulkSelectionToolbar
            selectedItems={selectedItems}
            totalItems={filteredMaterials.length}
            selectionLabel="material"
            onClearSelection={handleClearSelection}
            bulkActions={[
              {
                id: "edit",
                label: "Edit",
                icon: <Edit />,
                onClick: handleBulkEditOpen,
                variant: "outline"
              },
              {
                id: "delete",
                label: "Delete",
                icon: <Trash2 />,
                variant: "destructive",
                onClick: handleBulkDelete,
                requiresConfirmation: true,
                confirmationTitle: "Delete Materials",
                confirmationDescription: `Are you sure you want to delete ${selectedItems.size} material${selectedItems.size === 1 ? "" : "s"}? This action cannot be undone.`,
                confirmationActionText: "Delete"
              }
            ]}
            className="mb-4"
          />
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 px-5">
          {/* Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Materials</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <>
                  <span>Total: {paginationInfo.totalItems} materials</span>
                </>
                {(searchTerm || categoryFilter !== "all") && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-medium">
                      Filtered results
                      {categoryFilter !== "all" && ` (${categories.find(c => c.value === categoryFilter)?.name})`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input type="search" placeholder="Search by material name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem]" />
            </div>

            {/* Category Filter */}
            <div className="w-fit shrink-0">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem] w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.value}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page Size Selector */}
            <div className="w-fit shrink-0">
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem] w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                  <SelectItem value="200">200 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export CSV */}
            <div className="w-fit shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-10 px-3">
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={5}>
                  <p>{selectedItems.size > 0 ? "Export selected materials" : "Export all filtered materials"}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Pagination Controls */}
            {paginationInfo.totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={!paginationInfo.hasPreviousPage} className="h-10 px-3">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={!paginationInfo.hasPreviousPage} className="h-10 px-3">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-2 text-sm font-medium bg-gray-50 rounded border">{paginationInfo.currentPage}</span>
                <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!paginationInfo.hasNextPage} className="h-10 px-3">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToLastPage} disabled={!paginationInfo.hasNextPage} className="h-10 px-3">
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div ref={scrollContainerRef} className="flex-1 overflow-hidden overflow-y-auto relative">
          {/* Empty State */}
          {visibleMaterials.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-600 mb-2">No materials found</p>
                {(searchTerm || categoryFilter !== "all") && <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>}
              </div>
            </div>
          )}

          {/* Mobile Card View */}
          {paginatedMaterials.length > 0 && (
            <div className="lg:hidden space-y-4 mt-3">
              {paginatedMaterials.map(material => {
                const materialCategoryId = (material as any).categoryId;

                // Find category by ID first (most reliable for materials)
                let categoryInfo: Category | undefined;
                if (materialCategoryId && categoriesById.has(materialCategoryId)) {
                  categoryInfo = categoriesById.get(materialCategoryId);
                }
                // Fallback to category object if present
                else if (typeof material.category === "object" && material.category !== null) {
                  const categoryObj = material.category as any;
                  if (categoryObj.id && categoriesById.has(categoryObj.id)) {
                    categoryInfo = categoriesById.get(categoryObj.id);
                  } else if (categoryObj.value && categoriesByValue.has(categoryObj.value)) {
                    categoryInfo = categoriesByValue.get(categoryObj.value);
                  }
                }
                // Fallback to string category value
                else if (typeof material.category === "string" && material.category && categoriesByValue.has(material.category)) {
                  categoryInfo = categoriesByValue.get(material.category);
                }

                // Get display values with better fallback logic
                const displayName = categoryInfo?.name || (typeof material.category === "object" && material.category !== null && (material.category as any).name) || (typeof material.category === "string" ? material.category : "Unknown Category");

                const categoryValue = categoryInfo?.value || (typeof material.category === "object" && material.category !== null && (material.category as any).value) || (typeof material.category === "string" ? material.category : "unknown");

                return (
                  <div key={material.id} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(Number(material.id))}
                        onChange={() => {
                          // Use the table's row selection mechanism
                          const isSelected = selectedItems.has(Number(material.id));
                          const newSelection = { ...table.getState().rowSelection };

                          if (isSelected) {
                            delete newSelection[material.id];
                          } else {
                            newSelection[material.id] = true;
                          }

                          table.setRowSelection(newSelection);
                        }}
                        className="w-4 h-4 mr-2"
                      />
                      <div className="flex justify-between items-start mb-3 w-full">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base mb-1 truncate">{highlightText(material.name, searchTerm)}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs font-medium ${getCategoryColor(categoryValue)}`}>
                              {displayName}
                            </Badge>
                            {material.isPOSItem && (
                              <Badge variant="secondary" className="text-xs font-medium">
                                POS
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div className="space-y-1">
                          <span className="text-gray-500 text-xs font-medium">Base Unit</span>
                          <p className="font-mono text-gray-900">{material.baseUnit}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-500 text-xs font-medium">Unit Type</span>
                          <p className="capitalize text-gray-900">{material.unitType}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-500 text-xs font-medium">Input Unit</span>
                          <p className="font-mono text-gray-900">{material.inputUnit || material.baseUnit || "-"}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => onEditMaterial(material)} className="flex-1 h-8 text-xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="z-[9999]">
                            <p>Edit {material.name}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => onAddStock(material.id)} className={`flex-1 h-8 text-xs hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 ${material.stockEntries && material.stockEntries.length > 0 ? "bg-teal-500/25 border-teal-300" : "bg-red-500/25 border-red-300"}`}>
                              <Plus className="h-3 w-3 mr-1" />
                              Stock
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="z-[9999]">
                            <p>{material.stockEntries && material.stockEntries.length > 0 ? `Add more stock for ${material.name} (${material.stockEntries.length} entries)` : `No stock entries - Add initial stock for ${material.name}`}</p>
                          </TooltipContent>
                        </Tooltip>
                        <AlertDialog>
                          <Tooltip>
                            <AlertDialogTrigger asChild>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 px-3 text-xs hover:bg-red-50 hover:border-red-300 hover:text-red-700">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                            </AlertDialogTrigger>
                            <TooltipContent className="z-[9999]">
                              <p>Delete {material.name}</p>
                            </TooltipContent>
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Material</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete "{material.name}"? This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteMaterial(material.id)} className="bg-red-600 hover:bg-red-700">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Desktop Table View - TanStack Virtualized */}
          {paginatedMaterials.length > 0 && (
            <div className="hidden lg:block px-2">
              <div className="h-[calc(100vh-192px)] overflow-y-hidden mt-1">
                <TanStackTable table={table} virtualized={true} customHeaderAlignment={{ actions: "center" }} customCellAlignment={{ actions: "center" }} estimatedRowSize={60} overscan={10} loading={false} emptyMessage="No materials found" maxHeight="calc(100vh-192px)" />
              </div>
            </div>
          )}

          {/* Bottom Pagination Controls for Mobile */}
          {paginationInfo.totalPages > 1 && (
            <div className="lg:hidden mt-6 px-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
                <div className="text-sm text-gray-600">
                  Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={!paginationInfo.hasPreviousPage} className="h-9 px-3">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!paginationInfo.hasNextPage} className="h-9 px-3">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Floating Add Button */}
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out transform ${showFloatingButton ? "translate-y-0 opacity-100 scale-100" : "translate-y-16 opacity-0 scale-95 pointer-events-none"}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setShowMaterialForm(true)} className="bg-primary hover:bg-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full h-14 w-14 p-0 group" size="lg">
                <Plus className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new material</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Standalone Bulk Edit Dialog */}
        <BulkEditDialog isOpen={showBulkEditDialog} onClose={() => setShowBulkEditDialog(false)} title="Bulk Edit Materials" description={`Edit ${selectedItems.size} selected material${selectedItems.size === 1 ? "" : "s"}. Only the fields you modify will be updated.`} onSubmit={handleBulkEditSubmit} isLoading={bulkEditLoading} submitText="Update Materials">
          <div className="space-y-2">
            <Label>Category</Label>
            <select value={bulkEditData.categoryId || ""} onChange={e => setBulkEditData(prev => ({ ...prev, categoryId: e.target.value ? Number(e.target.value) : null }))} className="w-full p-2 border rounded">
              <option value="">Select category...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </BulkEditDialog>
      </div>
    </TooltipProvider>
  );
}
