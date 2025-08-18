import { PrinterAssignmentDialog } from "@/components/inventory/PrinterAssignmentDialog";
import { BulkPrinterAssignmentDialog } from "@/components/inventory/BulkPrinterAssignmentDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TanStackTable } from "@/components/ui/TanStackTable";
import { toast } from "@/hooks/use-toast";
import { Material, NegativeStockReport, StockEntry, StockEntryWithMaterial, MaterialWithStock, PaginationInfo, AddStockData, RecordWasteData, StockFormData } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { highlightText } from "@/utils/highlightText";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Eye, EyeOff, FileText, Plus, Printer, RefreshCw, Search, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAtom } from "jotai";
import { selectedStockEntryAtom, showStockFormAtom, selectedMaterialAtom } from "@/store/inventoryAtoms";
import { createColumnHelper, getCoreRowModel, getSortedRowModel, useReactTable, ColumnDef, SortingState, ColumnFiltersState } from "@tanstack/react-table";
import { stockAPI } from "@/api/stock.api.ts";
import { inventoryAPIWithPrefetch } from "@/api/inventory.api";
import { salesAPI } from "@/api/sales.api.ts";

type StockEntriesTableProps = {
  stockEntries: StockEntry[];
  materials: Material[] | MaterialWithStock[];
  onRefresh?: () => Promise<void> | void;
  onDeleteStockEntry?: (stockEntryId: string | number) => Promise<void> | void;
  onTogglePOSVisibility?: (entry: StockEntry & { material?: Material }) => Promise<void> | void;
  onAssign?: (id: string | number, printerId: number | null) => Promise<StockEntry | void>;
  onBulkAssign?: (ids: (string | number)[], printerId: number | null) => Promise<StockEntry[] | void>;
};

const hasNegativeStock = (entry: StockEntryWithMaterial) => {
  return (entry.purchasedIndividualQuantity && entry.purchasedIndividualQuantity < 0) || (entry.purchasedQuantity && entry.purchasedQuantity < 0);
};

const isVirtualEntry = (entry: StockEntryWithMaterial) => {
  return entry.supplier === "-";
};

export function StockEntriesTable({ stockEntries: stockEntriesProp, materials, onRefresh, onDeleteStockEntry, onTogglePOSVisibility, onAssign, onBulkAssign }: StockEntriesTableProps) {
  const stockEntries = stockEntriesProp as (StockEntry | StockEntryWithMaterial)[];

  const [searchTerm, setSearchTerm] = useState("");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState("purchaseDate");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [negativeStockReport, setNegativeStockReport] = useState<NegativeStockReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [selectedStockEntries, setSelectedStockEntries] = useState<Set<string>>(new Set());
  const [showBulkPrinterDialog, setShowBulkPrinterDialog] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "purchaseDate", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [reportSorting, setReportSorting] = useState<SortingState>([]);
  const materialsMap = useMemo(() => {
    const map = new Map();
    (materials as Material[]).forEach(m => {
      map.set(m.id, m);
      map.set(m.id.toString(), m);
      map.set(parseInt(m.id), m);
    });
    
    stockEntries.forEach(entry => {
      if ('material' in entry && entry.material && !map.has(entry.materialId)) {
        const material = entry.material;
        map.set(material.id, material);
        map.set(material.id.toString(), material);
        map.set(parseInt(material.id), material);
      }
    });
    
    return map;
  }, [materials, stockEntries]);

  const negativeStockColumns = useMemo(
    () => [
      {
        id: "material",
        header: "Material",
        accessorKey: "materialName",
        cell: ({ row }: any) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2">
              {item.isVirtualEntry && <AlertTriangle className="h-4 w-4 text-red-600" />}
              {item.materialName}
              {item.isVirtualEntry && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  VIRTUAL
                </Badge>
              )}
            </div>
          );
        }
      },
      {
        id: "supplier",
        header: "Supplier",
        accessorKey: "supplier",
        cell: ({ row }: any) => {
          const item = row.original;
          return <span className={item.isVirtualEntry ? "text-red-600 font-medium" : ""}>{item.supplier}</span>;
        }
      },
      {
        id: "individualQuantity",
        header: "Individual Quantity",
        accessorKey: "purchasedIndividualQuantity",
        cell: ({ getValue }: any) => (
          <div className="text-red-600 font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {formatNumber(getValue())}
          </div>
        )
      },
      {
        id: "unit",
        header: "Unit",
        accessorKey: "purchasedIndividualUnit"
      },
      {
        id: "purchasedQuantity",
        header: "Purchased Quantity",
        accessorKey: "purchasedQuantity",
        cell: ({ getValue }: any) => <span className="text-red-600 font-medium">{formatNumber(getValue())}</span>
      },
      {
        id: "purchasedUnit",
        header: "Purchased Unit",
        accessorKey: "purchasedUnit"
      },
      {
        id: "categoryId",
        header: "Category ID",
        accessorKey: "categoryId",
        cell: ({ getValue }: any) => (
          <Badge variant="outline" className="text-xs">
            {getValue() || "N/A"}
          </Badge>
        )
      },
      {
        id: "lastUpdated",
        header: "Last Updated",
        accessorKey: "lastUpdated",
        cell: ({ getValue }: any) => {
          const date = getValue();
          return date ? new Date(date).toLocaleDateString() : "N/A";
        }
      }
    ],
    []
  );

  // Negative stock report table
  const negativeStockTable = useReactTable({
    data: negativeStockReport?.negativeStockItems || [],
    columns: negativeStockColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: reportSorting
    },
    onSortingChange: setReportSorting
  });
  const [showStockForm, setShowStockForm] = useAtom(showStockFormAtom);
  const [selectedStockEntry, setSelectedStockEntry] = useAtom(selectedStockEntryAtom) as [StockEntry | null, (value: StockEntry | null) => void];
  const [selectedMaterial, setSelectedMaterial] = useAtom(selectedMaterialAtom) as [MaterialWithStock | null, (value: MaterialWithStock | null) => void];
  const optimisticUpdatesRef = useRef<Map<string | number, Partial<StockEntry>>>(new Map());
  const [updateCounter, setUpdateCounter] = useState(0);

  const optimisticStockEntries = useMemo(() => {
    return stockEntries.map(entry => {
      const optimisticUpdate = optimisticUpdatesRef.current.get(entry.id);
      return optimisticUpdate ? { ...entry, ...optimisticUpdate } : entry;
    });
  }, [stockEntries, updateCounter]);



  // Client-side filtering like MenuBuilder - instant search without API calls
  const filteredStockEntries = useMemo(() => {
    // First create stockEntriesWithMaterial structure
    const stockEntriesWithMaterial = optimisticStockEntries
      .filter(entry => {
        // Filter out entries where the material no longer exists
        const material = materialsMap.get(entry.materialId);
        return material !== undefined;
      })
      .map(entry => {
        const material = materialsMap.get(entry.materialId);
        return {
          ...entry,
          material: material!
        } as StockEntryWithMaterial;
      });

    // Then apply search and filter logic
    return stockEntriesWithMaterial.filter(entry => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search in material name
      const materialName = entry.material?.name?.toLowerCase() || '';
      const matchesMaterialName = materialName.includes(searchLower);
      
      // Search in supplier
      const supplier = entry.supplier?.toLowerCase() || '';
      const matchesSupplier = supplier.includes(searchLower);
      
      // Search in batch number
      const batchNumber = entry.batchNumber?.toLowerCase() || '';
      const matchesBatchNumber = batchNumber.includes(searchLower);
      
      // Search in notes
      const notes = entry.notes?.toLowerCase() || '';
      const matchesNotes = notes.includes(searchLower);
      
      const matchesSearch = searchTerm === "" || matchesMaterialName || matchesSupplier || matchesBatchNumber || matchesNotes;
      
      // Material filter - now using material IDs correctly
      const matchesMaterialFilter = materialFilter === "all" || entry.materialId === materialFilter;
      
      return matchesSearch && matchesMaterialFilter;
    });
  }, [optimisticStockEntries, materialsMap, searchTerm, materialFilter]);

  // Sort client-side based on sortBy/sortOrder
  const sortedStockEntries = useMemo(() => {
    const sorted = [...filteredStockEntries];
    sorted.sort((a, b) => {
      const dir = sortOrder === "ASC" ? 1 : -1;
      switch (sortBy) {
        case "materialName": {
          const an = (a.material?.name || "").toLowerCase();
          const bn = (b.material?.name || "").toLowerCase();
          return an.localeCompare(bn) * dir;
        }
        case "costPerPurchasedUnit":
          return ((a.costPerPurchasedUnit || 0) - (b.costPerPurchasedUnit || 0)) * dir;
        case "totalCost":
          return ((a.totalCost || 0) - (b.totalCost || 0)) * dir;
        case "purchaseDate":
        default: {
          const ad = new Date(a.purchaseDate as any).getTime();
          const bd = new Date(b.purchaseDate as any).getTime();
          return (ad - bd) * dir;
        }
      }
    });
    return sorted;
  }, [filteredStockEntries, sortBy, sortOrder]);

  // Clamp current page when total pages change
  const totalItems = sortedStockEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Paginate client-side
  const paginatedStockEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStockEntries.slice(start, start + pageSize);
  }, [sortedStockEntries, currentPage, pageSize]);

  // Build local pagination info for UI
  const pagination: PaginationInfo = useMemo(() => {
    const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);
    return {
      currentPage,
      itemsPerPage: pageSize,
      totalItems,
      totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
      startIndex: start,
      endIndex: end,
    } as PaginationInfo;
  }, [currentPage, pageSize, totalItems, totalPages]);

  const applyOptimisticUpdate = useCallback((entryId: string | number, updates: Partial<StockEntry>) => {
    optimisticUpdatesRef.current.set(entryId, updates);
    setUpdateCounter(prev => prev + 1);
  }, []);

  const clearOptimisticUpdate = useCallback((entryId: string | number) => {
    optimisticUpdatesRef.current.delete(entryId);
    setUpdateCounter(prev => prev + 1);
  }, []);

  // Client-side sorting + pagination derived from filtered results

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((newSortBy: string, newSortOrder: "ASC" | "DESC") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  }, []);

  const refreshData = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
    }
  }, [onRefresh]);

  const isAllowedPOSCategory = (material: Material | undefined) => {
    if (!material || !material.category) return false;
    const allowedCategories = ["beverages", "cold", "hot", "alcohol"];
    
    // Handle different category formats
    let categoryName: string;
    if (typeof material.category === 'string') {
      categoryName = material.category;
    } else if (typeof material.category === 'object' && material.category !== null && 'name' in material.category) {
      // Handle category objects from API responses
      categoryName = (material.category as any).name;
    } else {
      return false;
    }
    
    return allowedCategories.includes(categoryName.toLowerCase());
  };

  const columnHelper = createColumnHelper<StockEntryWithMaterial>();

  const handleTogglePOSVisibility = async (entry: StockEntry & { material?: Material }) => {
    if (!entry.material) {
      toast({
        title: "Error",
        description: "Material information not found",
        variant: "destructive"
      });
      return;
    }
    const newPOSStatus = !entry.isPOSItem;
    applyOptimisticUpdate(entry.id, { isPOSItem: newPOSStatus });
    try {
      if (onTogglePOSVisibility) {
        await onTogglePOSVisibility(entry);
      } else {
        const response = await stockAPI.updateStockEntryPOS(entry.id.toString(), {
          isPOSItem: newPOSStatus
        });
        if (!response) {
          throw new Error("Failed to update stock entry POS visibility");
        }
      }
      clearOptimisticUpdate(entry.id);
    } catch (error) {
      console.error("Error updating stock entry POS visibility:", error);
      clearOptimisticUpdate(entry.id);
      toast({
        title: "Error",
        description: "Failed to update POS visibility. Changes have been reverted.",
        variant: "destructive"
      });
    }
  };

  const handleOpenPrinterDialog = (entry: StockEntryWithMaterial) => {
    setSelectedStockEntry(entry);
    setShowPrinterDialog(true);
  };

  const handleEditStockEntry = (stockEntry: StockEntry) => {
    setSelectedStockEntry(stockEntry);
    const material = (materials as (MaterialWithStock | Material)[]).find(m => (m as any).id === stockEntry.materialId) as MaterialWithStock | undefined;
    if (material) {
      setSelectedMaterial(material);
    }
    setShowStockForm(true);
  };

  const handleDeleteStockEntry = async (stockEntryId: string | number) => {
    try {
      if (onDeleteStockEntry) {
        await onDeleteStockEntry(stockEntryId);
      } else {
        await inventoryAPIWithPrefetch.stock.deleteStockEntryWithCache(stockEntryId.toString());
        await refreshData();
      }
      toast({
        title: "Stock Entry Deleted",
        description: "Stock entry has been successfully deleted",
        variant: "default"
      });
    } catch (error) {
      console.error("Error deleting stock entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete stock entry",
        variant: "destructive"
      });
    }
  };

  const columns = useMemo<ColumnDef<StockEntryWithMaterial>[]>(
    () => [
      ...(bulkSelectionMode
        ? [
            columnHelper.display({
              id: "select",
              size: 50,
              header: ({ table }) => <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} className="h-4 w-4" aria-label="Select all stock entries" />,
              cell: ({ row }) => <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="h-4 w-4" aria-label={`Select ${row.original.material?.name || "stock entry"}`} onClick={e => e.stopPropagation()} />
            })
          ]
        : []),

      columnHelper.display({
        id: "materialName",
        size: 220,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "materialName" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("materialName", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent justify-start w-full"
          >
            Material Name
            <span className="ml-2 text-xs">{sortBy === "materialName" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ row }) => {
          const entry = row.original;
          const materialName = entry.material?.name;
          const isNegativeStock = hasNegativeStock(entry);
          return (
            <div className="flex items-center gap-2 w-full">
              {isNegativeStock && <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />}
              <span className="truncate">{materialName ? highlightText(materialName, searchTerm) : `Unknown Material (ID: ${entry.materialId})`}</span>
            </div>
          );
        },
        enableSorting: false
      }),

      columnHelper.display({
        id: "remainingQty",
        size: 120,
        header: ({ column }) => <div className="text-center w-full font-semibold">Remaining Qty</div>,
        cell: ({ row }) => <div className="text-center w-full">{renderQuantityDisplay(row.original)}</div>
      }),

      columnHelper.display({
        id: "unit",
        size: 80,
        header: ({ column }) => <div className="text-center w-full font-semibold">Unit</div>,
        cell: ({ row }) => <div className="text-center w-full">{renderUnitDisplay(row.original)}</div>
      }),

      columnHelper.accessor("costPerPurchasedUnit", {
        id: "costPerUnit",
        size: 110,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "costPerPurchasedUnit" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("costPerPurchasedUnit", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent justify-center w-full"
          >
            Cost/Unit
            <span className="ml-2 text-xs">{sortBy === "costPerPurchasedUnit" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ row, getValue }) => {
          const cost = getValue();
          return (
            <div className="space-y-1 text-center w-full px-2">
              <div className="font-medium">{formatCurrency(cost)}</div>
              {row.original.material?.unitType === "package" && <div className="text-xs text-muted-foreground">(per {row.original.purchasedUnit})</div>}
            </div>
          );
        },
        enableSorting: false
      }),

      columnHelper.accessor("totalCost", {
        id: "totalCost",
        size: 110,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "totalCost" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("totalCost", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent justify-center w-full"
          >
            Total Cost
            <span className="ml-2 text-xs">{sortBy === "totalCost" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="text-center w-full px-2">
            <span className="font-medium">{formatCurrency(getValue())}</span>
          </div>
        ),
        enableSorting: false
      }),

      columnHelper.accessor("purchaseDate", {
        id: "purchaseDate",
        size: 130,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "purchaseDate" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("purchaseDate", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent justify-center w-full"
          >
            Purchase Date
            <span className="ml-2 text-xs">{sortBy === "purchaseDate" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="text-center w-full px-2">
            <span className="font-medium">{new Date(getValue()).toLocaleDateString()}</span>
          </div>
        ),
        enableSorting: false
      }),

      columnHelper.display({
        id: "actions",
        size: 140,
        enableSorting: false,
        header: ({ column }) => <div className="text-center w-full font-semibold">Actions</div>,
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <div className="flex items-center justify-center gap-1 w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={entry.isPOSItem ? "default" : "outline"}
                    size="sm"
                    disabled={!isAllowedPOSCategory(entry.material)}
                    onClick={e => {
                      e.stopPropagation();
                      handleTogglePOSVisibility(entry);
                    }}
                    className={`h-8 w-8 p-0 ${!isAllowedPOSCategory(entry.material) ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400" : entry.isPOSItem ? "bg-teal-600 hover:bg-teal-700 text-white" : "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"}`}
                  >
                    {entry.isPOSItem ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{!isAllowedPOSCategory(entry.material) ? "Only beverage items can be shown in POS" : entry.isPOSItem ? "Hide from POS" : "Show in POS"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      handleOpenPrinterDialog(entry);
                    }}
                    className={`h-8 w-8 p-0 ${entry.assignedPrinter ? "border-blue-500 text-blue-600" : "hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"}`}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{entry.assignedPrinter ? `Assigned to: ${entry.assignedPrinter.name}` : "Assign printer to " + (entry.material?.name || "stock entry")}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      handleEditStockEntry(entry as StockEntry);
                    }}
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit {entry.material?.name || "stock entry"}</p>
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
                  <TooltipContent>
                    <p>Delete {entry.material?.name || "stock entry"}</p>
                  </TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Stock Entry</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this stock entry? This action cannot be undone.
                      {hasNegativeStock(entry) && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                          <strong>Warning:</strong> This entry has negative stock quantities.
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteStockEntry(entry.id)} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        }
      })
    ],
    [searchTerm, bulkSelectionMode, handleTogglePOSVisibility, handleOpenPrinterDialog, handleEditStockEntry, handleDeleteStockEntry, isAllowedPOSCategory, sortBy, sortOrder, handleSortChange]
  );

  // Handle scroll for floating button
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

  const handleAddStock = () => {
    setSelectedStockEntry(null);
    setSelectedMaterial(null);
    setShowStockForm(true);
  };

  const handleStockSubmit = async (data: StockFormData) => {
    try {
      if (selectedStockEntry) {
        await inventoryAPIWithPrefetch.stock.updateStockEntryWithCache(selectedStockEntry.id, data);
        toast({
          title: "Stock Entry Updated",
          description: "Stock entry has been updated successfully.",
          variant: "default"
        });
      } else {
        await inventoryAPIWithPrefetch.stock.createStockEntryWithCache(data);
        toast({
          title: "Stock Entry Created",
          description: "New stock entry has been created successfully.",
          variant: "default"
        });
      }
      setShowStockForm(false);
      setSelectedStockEntry(null);
      setSelectedMaterial(null);
      await refreshData();
    } catch (error) {
      console.error("❌ Error submitting stock form:", error);
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      toast({
        title: "Error",
        description: `Failed to ${selectedStockEntry ? "update" : "create"} stock entry: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleAddStockOperation = async (data: AddStockData) => {
    try {
      await inventoryAPIWithPrefetch.stock.addToStockWithCache(data);
      await refreshData();
      toast({
        title: "Stock Added",
        description: "Stock has been added successfully",
        variant: "default"
      });
    } catch (error) {
      console.error("Error adding stock:", error);
      toast({
        title: "Error",
        description: "Failed to add stock",
        variant: "destructive"
      });
    }
  };

  const handleRecordWasteOperation = async (data: RecordWasteData) => {
    try {
      await inventoryAPIWithPrefetch.stock.recordWasteWithCache(data);
      await refreshData();
      toast({
        title: "Waste Recorded",
        description: "Waste has been recorded successfully",
        variant: "default"
      });
    } catch (error) {
      console.error("Error recording waste:", error);
      toast({
        title: "Error",
        description: "Failed to record waste",
        variant: "destructive"
      });
    }
  };

  const handleWasteFromSpecificEntryOperation = async (
    data: {
      materialId?: string;
      supplier?: string;
      purchasedQuantity?: number;
      costPerPurchasedUnit?: number;
      totalCost?: number;
      purchasedUnit?: string;
      wasteQuantity?: number;
      purchaseDate?: Date;
      expiryDate?: Date;
      batchNumber?: string;
      notes?: string;
      wasteReason?: string;
    } & { stockEntryId: string }
  ) => {
    try {
      const wasteData = {
        wasteQuantity: data.wasteQuantity || data.purchasedQuantity || 0,
        unit: data.purchasedUnit || "g",
        wasteReason: data.wasteReason || "unspecified",
        wasteDate: new Date(),
        notes: data.notes
      };
      await inventoryAPIWithPrefetch.stock.wasteFromSpecificEntryWithCache(data.stockEntryId, wasteData);
      await refreshData();
      setShowStockForm(false);
      toast({
        title: "Recorded",
        description: "Waste recorded",
        duration: 1500
      });
    } catch (error) {
      console.error("❌ Error recording waste from specific entry:", error);
      toast({
        title: "Error",
        description: "Failed to record waste",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  const handleAddToSpecificEntryOperation = async (
    data: {
      materialId?: string;
      supplier?: string;
      purchasedQuantity?: number;
      costPerPurchasedUnit?: number;
      totalCost?: number;
      purchasedUnit?: string;
      wasteQuantity?: number;
      purchaseDate?: Date;
      expiryDate?: Date;
      batchNumber?: string;
      notes?: string;
      wasteReason?: string;
    } & { stockEntryId: string }
  ) => {
    try {
      const addData = {
        additionalQuantity: data.purchasedQuantity || 0,
        unit: data.purchasedUnit || "g",
        additionDate: new Date(),
        notes: data.notes
      };
      await inventoryAPIWithPrefetch.stock.addToSpecificEntryWithCache(data.stockEntryId, addData);
      await refreshData();
      setShowStockForm(false);
      toast({
        title: "Added",
        description: "Stock added",
        duration: 1500
      });
    } catch (error) {
      console.error("❌ Error adding to specific entry:", error);
      toast({
        title: "Error",
        description: "Failed to add stock",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  // Create a map of material IDs to material objects for lookup
const materialsById = useMemo(() => {
  const map = new Map<string, Material>();
  materials.forEach(m => map.set(m.id, m));
  return map;
}, [materials]);

// Create a sorted array of material objects for the dropdown
const uniqueMaterials = useMemo(() => 
  materials
    .map(m => ({ id: m.id, name: m.name }))
    .sort((a, b) => a.name.localeCompare(b.name)), 
  [materials]
);
  const table = useReactTable({
    data: filteredStockEntries,
    columns,
    state: {
      sorting,
      columnFilters
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: bulkSelectionMode,
    getRowId: row => row.id.toString(),
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true
  });

  const fetchNegativeStockReport = async () => {
    setLoadingReport(true);
    try {
      const response = await salesAPI.getNegativeStockReport();
      setNegativeStockReport(response.data);
      setShowReportDialog(true);
    } catch (error) {
      console.error("Error fetching negative stock report:", error);
      toast({
        title: "Error",
        description: "Failed to fetch negative stock report",
        variant: "destructive"
      });
    } finally {
      setLoadingReport(false);
    }
  };

  const renderQuantityDisplay = (entry: StockEntryWithMaterial) => {
    const { material } = entry;
    const isNegative = hasNegativeStock(entry);

    return (
      <div className="space-y-1">
        {(() => {
          if (material?.unitType === "mass" && entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualUnit) {
            return (
              <>
                <div className={`font-medium flex items-center justify-center gap-1 ${isNegative ? "text-red-600" : ""}`}>
                  {isNegative && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                  <span>
                    {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  (from {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit})
                </div>
              </>
            );
          } else if (material?.unitType === "volume" && entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualUnit) {
            return (
              <>
                <div className={`font-medium flex items-center justify-center gap-1 ${isNegative ? "text-red-600" : ""}`}>
                  {isNegative && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                  <span>
                    {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  (from {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit})
                </div>
              </>
            );
          } else if (material?.unitType === "package" && entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualUnit) {
            return (
              <>
                <div className={`font-medium flex items-center justify-center gap-1 ${isNegative ? "text-red-600" : ""}`}>
                  {isNegative && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                  <span>
                    {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                  </span>
                </div>
                {/* Only show "(from X pack)" if individual quantity is positive */}
                {entry.purchasedIndividualQuantity > 0 && material?.packageQuantity && (
                  <div className="text-xs text-muted-foreground text-center">
                    (from {formatNumber(Math.ceil(entry.purchasedIndividualQuantity / material.packageQuantity))} {entry.purchasedUnit})
                  </div>
                )}
              </>
            );
          } else {
            return (
              <div className={`font-medium flex items-center justify-center gap-1 ${isNegative ? "text-red-600" : ""}`}>
                {isNegative && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                <span>
                  {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit}
                </span>
              </div>
            );
          }
        })()}
      </div>
    );
  };

  const renderUnitDisplay = (entry: StockEntryWithMaterial) => {
    const { material } = entry;
    const formatUnit = (unit: string) => {
      if (unit === "piece") return "pc";
      if (unit === "pieces") return "pcs";
      return unit;
    };
    return (
      <div className="flex items-center gap-1">
        <div className="space-y-1 text-center">
          <div className="font-medium">{formatUnit(entry.purchasedUnit)}</div>
          {(() => {
            if (material?.unitType === "package" && entry.purchasedIndividualUnit) {
              return <div className="text-xs text-muted-foreground">{formatUnit(entry.purchasedIndividualUnit)}</div>;
            } else if (entry.purchasedConvertedUnit && entry.purchasedConvertedUnit !== entry.purchasedUnit) {
              return <div className="text-xs text-muted-foreground">{formatUnit(entry.purchasedConvertedUnit)}</div>;
            } else if (material?.baseUnit && material.baseUnit !== entry.purchasedUnit) {
              return <div className="text-xs text-muted-foreground">{formatUnit(material.baseUnit)}</div>;
            }
            return null;
          })()}
        </div>
      </div>
    );
  };

  const negativeStockCount = useMemo(() => filteredStockEntries.filter(hasNegativeStock).length, [filteredStockEntries]);

  const handlePrinterAssignmentChange = async (updatedEntry?: StockEntry) => {
    if (updatedEntry) {
      applyOptimisticUpdate(updatedEntry.id, { assignedPrinter: updatedEntry.assignedPrinter });
    }
  };

  const handleToggleBulkSelection = () => {
    setBulkSelectionMode(prev => !prev);
    setSelectedStockEntries(new Set());
  };

  useEffect(() => {
    if (bulkSelectionMode) {
      const selectedRows = table.getSelectedRowModel().rows;
      setSelectedStockEntries(new Set(selectedRows.map(row => row.id)));
    }
  }, [table.getSelectedRowModel().rows, bulkSelectionMode]);

  const handleSelectStockEntry = useCallback(
    (entryId: string) => {
      const row = table.getRow(entryId);
      row?.toggleSelected();
    },
    [table]
  );

  const handleSelectAllStockEntries = useCallback(() => {
    table.toggleAllRowsSelected();
  }, [table]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
  };

  const handleOpenBulkPrinterDialog = useCallback(() => {
    if (selectedStockEntries.size > 0) {
      setShowBulkPrinterDialog(true);
    }
  }, [selectedStockEntries.size]);

  const handleBulkPrinterAssignmentComplete = async (updatedEntries?: StockEntry[]) => {
    if (updatedEntries && updatedEntries.length > 0) {
      updatedEntries.forEach(updatedEntry => {
        applyOptimisticUpdate(updatedEntry.id, { assignedPrinter: updatedEntry.assignedPrinter });
      });
    }
    setSelectedStockEntries(new Set());
    setBulkSelectionMode(false);
    setShowBulkPrinterDialog(false);
  };

  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={10}>
      <div className="h-full flex flex-col">
        <div className="p-4 px-4 sm:px-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Stock Entries</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <>
                  <span>Total: {pagination.totalItems} entries</span>
                  <span className="text-blue-600 font-medium">
                    Showing {pagination.startIndex}-{pagination.endIndex} of {pagination.totalItems}
                    {(searchTerm || materialFilter !== "all") && " (filtered)"}
                    {materialFilter !== "all" && materialsById.get(materialFilter) && ` by ${materialsById.get(materialFilter)?.name}`}
                  </span>
                </>
              </div>
            </div>

            <div className="flex flex-col gap-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <Input 
                      key="stock-search-input"
                      type="search" 
                      placeholder="Search by material name or supplier..." 
                      value={searchTerm} 
                      onChange={handleSearchChange} 
                      className="pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem] w-64 lg:w-80" 
                    />
                  </div>

                  <div className="w-fit shrink-0">
                    <Select value={materialFilter} onValueChange={setMaterialFilter}>
                      <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem] w-48">
                        <SelectValue placeholder="All Materials">
                          {materialFilter === "all" ? "All Materials" : materialsById.get(materialFilter)?.name || "All Materials"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Materials</SelectItem>
                        {uniqueMaterials.map(material => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant={bulkSelectionMode ? "default" : "outline"} onClick={handleToggleBulkSelection} className={`${bulkSelectionMode ? "bg-red-600 hover:bg-red-700" : "border-gray-200 hover:border-gray-300"}`}>
                    <Check className="h-4 w-4 mr-1.5" />
                    <span className="hidden lg:inline">{bulkSelectionMode ? "Cancel" : "Bulk Select"}</span>
                    <span className="lg:hidden">{bulkSelectionMode ? "Cancel" : "Select"}</span>
                  </Button>

                  <Button variant="outline" size="sm" onClick={refreshData} className="border-gray-200 hover:border-gray-300">
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    <span className="hidden lg:inline">Refresh</span>
                    <span className="lg:hidden">Refresh</span>
                  </Button>

                  {negativeStockCount > 0 && (
                    <Button variant="outline" size="sm" onClick={fetchNegativeStockReport} disabled={loadingReport} className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300">
                      {loadingReport ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <FileText className="h-4 w-4 mr-1.5" />}
                      <span className="hidden lg:inline">Negative Stock Report</span>
                      <span className="lg:hidden">Report</span>
                    </Button>
                  )}
                </div>
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-end gap-4">
                  {/* Page Size Selector */}
                  <div className="w-fit shrink-0">
                    <Select value={pageSize.toString()} onValueChange={value => handlePageSizeChange(parseInt(value))}>
                      <SelectTrigger>
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

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={!pagination.hasPreviousPage} className="h-10 px-3">
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination.hasPreviousPage} className="h-10 px-3">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 py-2 text-sm font-medium bg-gray-50 rounded border">{pagination.currentPage}</span>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination.hasNextPage} className="h-10 px-3">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.totalPages)} disabled={!pagination.hasNextPage} className="h-10 px-3">
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {bulkSelectionMode && (
            <div className="flex items-center gap-3">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button size="sm" variant="outline" onClick={handleSelectAllStockEntries} disabled={filteredStockEntries.length === 0} className="flex-1 sm:flex-none border-gray-200 hover:border-gray-300 min-w-0">
                  <Check className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span className="hidden sm:inline">{selectedStockEntries.size === filteredStockEntries.length ? "Deselect All" : "Select All"}</span>
                  <span className="sm:hidden truncate">{selectedStockEntries.size === filteredStockEntries.length ? "Deselect" : "Select"}</span>
                </Button>
                <Button size="sm" variant="outline" onClick={handleOpenBulkPrinterDialog} disabled={selectedStockEntries.size === 0} className="flex-1 sm:flex-none border-gray-200 hover:border-gray-300 min-w-0">
                  <Printer className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span className="hidden sm:inline">Assign Printer ({selectedStockEntries.size})</span>
                  <span className="sm:hidden truncate">Printer ({selectedStockEntries.size})</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        <div ref={scrollContainerRef} className="px-4 sm:px-6 pb-4 sm:pb-6 flex-1 overflow-hidden overflow-y-auto relative">
          {filteredStockEntries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-gray-100 rounded-full p-3 mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{searchTerm || materialFilter !== "all" ? "No matching stock entries" : "No stock entries found"}</h3>
              <p className="text-gray-500 mb-4">{searchTerm || materialFilter !== "all" ? "Try adjusting your search or filter criteria" : "Get started by adding your first stock entry"}</p>
              {!searchTerm && materialFilter === "all" && (
                <Button onClick={handleAddStock} className="bg-primary hover:bg-primary/80">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stock Entry
                </Button>
              )}
            </div>
          )}
          {filteredStockEntries.length > 0 && (
            <div className="lg:hidden space-y-4">
              {paginatedStockEntries.map(entry => {
                const material = materialsMap.get(entry.materialId);

                const isNegative = hasNegativeStock(entry);
                const isVirtual = isVirtualEntry(entry);
                const isSelected = selectedStockEntries.has(entry.id.toString());

                return (
                  <div
                    key={entry.id}
                    className={`p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${isSelected ? "border-blue-300 bg-blue-50 shadow-md" : isNegative ? "border-l-4 border-l-red-500 border-gray-200" : isVirtual ? "border-l-4 border-l-orange-500 border-gray-200" : "border-gray-200"}`}
                    onClick={() => {
                      if (bulkSelectionMode) {
                        handleSelectStockEntry(entry.id.toString());
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        {bulkSelectionMode && (
                          <div className="pt-1">
                            <input type="checkbox" checked={isSelected} onChange={() => handleSelectStockEntry(entry.id.toString())} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" aria-label={`Select ${material?.name || "stock entry"}`} onClick={e => e.stopPropagation()} />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-base text-gray-900">{material?.name || "Unknown Material"}</h3>
                          <p className="text-sm text-gray-600 mt-1">{isVirtual ? "VIRTUAL" : entry.supplier}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantity</span>
                        <p className={`text-sm font-medium ${isNegative ? "text-red-600" : isVirtual ? "text-orange-600" : "text-gray-900"}`}>
                          {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unit Cost</span>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(entry.costPerPurchasedUnit)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Cost</span>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(entry.totalCost)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Purchase Date</span>
                        <p className="text-sm font-medium text-gray-900">{new Date(entry.purchaseDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {!bulkSelectionMode && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleEditStockEntry(entry);
                                }}
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit {material?.name} stock entry</p>
                            </TooltipContent>
                          </Tooltip>
                          <AlertDialog>
                            <Tooltip>
                              <AlertDialogTrigger asChild>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-700" onClick={e => e.stopPropagation()}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                              </AlertDialogTrigger>
                              <TooltipContent>
                                <p>Delete {material?.name} stock entry</p>
                              </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Stock Entry</AlertDialogTitle>
                                <AlertDialogDescription>Are you sure you want to delete this stock entry for "{material?.name}"? This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteStockEntry(entry.id)} className="bg-red-600 hover:bg-red-700">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={entry.isPOSItem ? "default" : "outline"}
                                size="sm"
                                disabled={!isAllowedPOSCategory(material)}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleTogglePOSVisibility(entry);
                                }}
                                className={`h-8 w-8 p-0 ${!isAllowedPOSCategory(material) ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400" : entry.isPOSItem ? "bg-teal-600 hover:bg-teal-700 text-white" : "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"}`}
                              >
                                {entry.isPOSItem ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{!isAllowedPOSCategory(material) ? "Only beverage items can be shown in POS" : entry.isPOSItem ? "Hide from POS" : "Show in POS"}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleOpenPrinterDialog(entry);
                                }}
                                className={`h-8 w-8 p-0 ${entry.assignedPrinter ? "border-blue-500 text-blue-600" : "hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"}`}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{entry.assignedPrinter ? `Assigned to: ${entry.assignedPrinter.name}` : "Assign printer to " + material?.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Desktop Table View - TanStack Virtualized */}
          {filteredStockEntries.length > 0 && (
            <div className="hidden lg:block px-2">
              <div className="h-[calc(100vh-260px)] overflow-y-hidden">
                <TanStackTable
                  table={table}
                  virtualized={true}
                  customHeaderAlignment={{
                    materialName: "left",
                    remainingQty: "center",
                    unit: "center",
                    costPerUnit: "center",
                    totalCost: "center",
                    purchaseDate: "center",
                    actions: "center"
                  }}
                  customCellAlignment={{
                    materialName: "left",
                    remainingQty: "center",
                    unit: "center",
                    costPerUnit: "center",
                    totalCost: "center",
                    purchaseDate: "center",
                    actions: "center"
                  }}
                  estimatedRowSize={60}
                  overscan={10}
                  loading={false}
                  emptyMessage="No stock entries found"
                  maxHeight="calc(100vh-260px)"
                  rowClassName={row => {
                    const entry = row.original;
                    const isNegative = hasNegativeStock(entry);
                    const isVirtual = isVirtualEntry(entry);
                    const isSelected = row.getIsSelected();
                    return isSelected ? "bg-green-50 border-l-4 border-l-green-500" : isNegative ? "bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100" : isVirtual ? "border-l-4 border-l-orange-500 hover:bg-gray-50" : "";
                  }}
                  className=""
                />
              </div>
            </div>
          )}
        </div>

        <PrinterAssignmentDialog open={showPrinterDialog} onOpenChange={setShowPrinterDialog} item={selectedStockEntry} itemType="stock" onAssignmentChange={handlePrinterAssignmentChange} />

        <BulkPrinterAssignmentDialog open={showBulkPrinterDialog} onOpenChange={setShowBulkPrinterDialog} selectedItems={selectedStockEntries} itemType="stock" onAssignmentChange={handleBulkPrinterAssignmentComplete} />

        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Negative Stock Report
              </DialogTitle>
              <DialogDescription>Items with negative stock quantities that need attention</DialogDescription>
            </DialogHeader>

            {negativeStockReport && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">{negativeStockReport.totalNegativeEntries || 0}</div>
                    <div className="text-sm text-red-700">Items with Negative Stock</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-600">{negativeStockReport.summary?.totalVirtualEntries || 0}</div>
                    <div className="text-sm text-orange-700">Virtual Entries</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{negativeStockReport.generatedAt ? new Date(negativeStockReport.generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                    <div className="text-sm text-blue-700">Report Date</div>
                  </div>
                </div>

                {negativeStockReport.negativeStockItems && negativeStockReport.negativeStockItems.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Negative Stock Items</h3>
                    <TanStackTable table={negativeStockTable} virtualized={false} loading={false} emptyMessage="No negative stock items found" maxHeight="400px" showSortIcons={true} className="" />
                  </div>
                )}

                {negativeStockReport.message && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Report Summary</h3>
                    <p className="text-blue-800">{negativeStockReport.message}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ease-in-out transform ${showFloatingButton ? "translate-y-0 opacity-100 scale-100" : "translate-y-16 opacity-0 scale-95 pointer-events-none"}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleAddStock} className="bg-primary hover:bg-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full h-14 w-14 p-0 group" size="lg">
              <Plus className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add new stock entry</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
