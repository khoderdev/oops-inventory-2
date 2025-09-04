import { PrinterAssignmentDialog } from "@/components/inventory/PrinterAssignmentDialog";
import { BulkPrinterAssignmentDialog } from "@/components/inventory/BulkPrinterAssignmentDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TanStackTable } from "@/components/ui/TanStackTable";
import { toast } from "@/hooks/use-toast";
import { Material, StockEntry, StockEntryWithMaterial, MaterialWithStock, PaginationInfo, StockEntriesTableProps } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { Check, Edit, Eye, EyeOff, Plus, Printer, RefreshCw, Search, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAtom } from "jotai";
import { selectedStockEntryAtom, showStockFormAtom, selectedMaterialAtom } from "@/store/inventoryAtoms";
import { getCoreRowModel, useReactTable, SortingState, ColumnFiltersState } from "@tanstack/react-table";
import { useStockEntriesTableColumns } from "./StockEntriesTableColumns";
import { hasNegativeStock, renderQuantityDisplay, renderUnitDisplay } from "./StockEntriesDisplayHelpers";
import { calculateCurrentTotalCost } from "./StockEntriesCalculationHelpers";
import { Pagination } from "./Pagination";
import { NegativeStock } from "./NegativeStock";
import { stockAPI } from "@/api/stock.api.ts";
import { materialsAPI } from "@/api/matierials.api.ts.tsx";

const isVirtualEntry = (entry: StockEntryWithMaterial) => {
  // Check if supplier is marked as virtual
  return entry.supplier?.supplierName === "-" || entry.supplier?.supplierName === "-";
};

export function StockEntriesTable({ stockEntries: prefetchedStockEntries, materials: prefetchedMaterials, loading: prefetchedLoading = false, onRefresh, onDeleteStockEntry, onTogglePOSVisibility }: StockEntriesTableProps) {
  const [stockEntries, setStockEntries] = useState<(StockEntry | StockEntryWithMaterial)[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState("purchaseDate");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchStockEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await stockAPI.getStockEntries({
        limit: 10000,
        _t: Date.now(),
        sortBy: "purchaseDate",
        sortOrder: "DESC"
      });
      setStockEntries(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch stock entries";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 1000
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMaterials = useCallback(async () => {
    try {
      const response = await materialsAPI.getMaterials({ limit: 10000, _t: Date.now() });
      setMaterials(response);
    } catch (err) {
      console.error("Failed to fetch materials:", err);
    }
  }, []);

  useEffect(() => {
    if (prefetchedStockEntries && prefetchedStockEntries.length > 0) {
      setStockEntries(prefetchedStockEntries);
      setLoading(false);
    }
  }, [prefetchedStockEntries]);

  useEffect(() => {
    const handleStockEntryCreated = (event: CustomEvent) => {
      const newEntry = event.detail;
      console.log("📝 StockEntriesTable: New stock entry created:", newEntry);
      setStockEntries(prev => [newEntry, ...prev]);
    };

    const handleStockEntryUpdated = (event: CustomEvent) => {
      const updatedEntry = event.detail;
      console.log("✏️ StockEntriesTable: Stock entry updated:", updatedEntry);
      setStockEntries(prev => prev.map(entry => (entry.id === updatedEntry.id ? { ...entry, ...updatedEntry } : entry)));
    };

    window.addEventListener("stockEntryCreated", handleStockEntryCreated as EventListener);
    window.addEventListener("stockEntryUpdated", handleStockEntryUpdated as EventListener);

    return () => {
      window.removeEventListener("stockEntryCreated", handleStockEntryCreated as EventListener);
      window.removeEventListener("stockEntryUpdated", handleStockEntryUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (prefetchedMaterials && prefetchedMaterials.length > 0) {
      setMaterials(prefetchedMaterials);
    }
  }, [prefetchedMaterials]);

  useEffect(() => {
    if (prefetchedLoading !== undefined) {
      setLoading(prefetchedLoading);
    }
  }, [prefetchedLoading]);

  useEffect(() => {
    if (!prefetchedStockEntries || !prefetchedMaterials) {
      Promise.all([fetchStockEntries(), fetchMaterials()]);
    }
  }, [fetchStockEntries, fetchMaterials, prefetchedStockEntries, prefetchedMaterials]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchStockEntries(), fetchMaterials()]);
    if (onRefresh) {
      await onRefresh();
    }
  }, [fetchStockEntries, fetchMaterials, onRefresh]);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [selectedStockEntries, setSelectedStockEntries] = useState<Set<string>>(new Set());
  const [showBulkPrinterDialog, setShowBulkPrinterDialog] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "purchaseDate", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const materialsMap = useMemo(() => {
    const map = new Map();
    (materials as Material[]).forEach(m => {
      map.set(m.id, m);
      map.set(m.id.toString(), m);
      map.set(parseInt(m.id), m);
    });

    stockEntries.forEach(entry => {
      if ("material" in entry && entry.material && !map.has(entry.materialId)) {
        const material = entry.material;
        map.set(material.id, material);
        map.set(material.id.toString(), material);
        map.set(parseInt(material.id), material);
      }
    });

    return map;
  }, [materials, stockEntries]);

  const [, setShowStockForm] = useAtom(showStockFormAtom);
  const [selectedStockEntry, setSelectedStockEntry] = useAtom(selectedStockEntryAtom) as [StockEntry | null, (value: StockEntry | null) => void];
  const [, setSelectedMaterial] = useAtom(selectedMaterialAtom) as [MaterialWithStock | null, (value: MaterialWithStock | null) => void];

  const filteredStockEntries = useMemo(() => {
    const stockEntriesWithMaterial = stockEntries
      .filter(entry => {
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

    const finalFiltered = stockEntriesWithMaterial.filter(entry => {
      const searchLower = searchTerm.toLowerCase();
      const materialName = entry.material?.name?.toLowerCase() || "";
      const matchesMaterialName = materialName.includes(searchLower);
      // Handle supplier using the new nested structure
      let matchesSupplier = false;
      if (entry.supplier?.supplierName) {
        // If we have the new nested supplier structure
        matchesSupplier = entry.supplier.supplierName.toLowerCase().includes(searchLower);
      } else if (entry.supplier?.supplierName) {
        // Fallback to legacy field for backward compatibility
        matchesSupplier = entry.supplier.supplierName.toLowerCase().includes(searchLower);
      }
      const batchNumber = entry.batchNumber?.toLowerCase() || "";
      const matchesBatchNumber = batchNumber.includes(searchLower);
      const notes = entry.notes?.toLowerCase() || "";
      const matchesNotes = notes.includes(searchLower);
      const matchesSearch = searchTerm === "" || matchesMaterialName || matchesSupplier || matchesBatchNumber || matchesNotes;
      const matchesMaterialFilter = materialFilter === "all" || entry.materialId === materialFilter;
      return matchesSearch && matchesMaterialFilter;
    });
    return finalFiltered;
  }, [stockEntries, materialsMap, searchTerm, materialFilter]);

  const sortedStockEntries = useMemo(() => {
    const sorted = [...filteredStockEntries];
    sorted.sort((a, b) => {
      const dir = sortOrder === "ASC" ? 1 : -1;
      switch (sortBy) {
        case "materialName": {
          const an = (a.material?.name || "").toLowerCase();
          const bn = (b.material?.name || "").toLowerCase();
          const nameComparison = an.localeCompare(bn) * dir;
          if (nameComparison === 0) {
            return Number(b.id) - Number(a.id);
          }
          return nameComparison;
        }
        case "costPerPurchasedUnit": {
          const costComparison = ((a.costPerPurchasedUnit || 0) - (b.costPerPurchasedUnit || 0)) * dir;
          if (costComparison === 0) {
            return Number(b.id) - Number(a.id);
          }
          return costComparison;
        }
        case "totalCost": {
          const totalComparison = ((a.totalCost || 0) - (b.totalCost || 0)) * dir;
          if (totalComparison === 0) {
            return Number(b.id) - Number(a.id);
          }
          return totalComparison;
        }
        case "purchaseDate":
        default: {
          const ad = new Date(a.purchaseDate as any).getTime();
          const bd = new Date(b.purchaseDate as any).getTime();
          const dateComparison = (ad - bd) * dir;
          if (dateComparison === 0) {
            return Number(b.id) - Number(a.id);
          }
          return dateComparison;
        }
      }
    });
    return sorted;
  }, [filteredStockEntries, sortBy, sortOrder]);

  const totalItems = sortedStockEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedStockEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const paginated = sortedStockEntries.slice(start, start + pageSize);
    return paginated;
  }, [sortedStockEntries, currentPage, pageSize]);

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
      endIndex: end
    } as PaginationInfo;
  }, [currentPage, pageSize, totalItems, totalPages]);

  // Helper function to add new stock entry to local state
  const addStockEntry = useCallback((newEntry: StockEntry) => {
    console.log("➕ StockEntriesTable: Adding new stock entry to local state:", newEntry);
    setStockEntries(prev => [newEntry, ...prev]);
  }, []);

  // Helper function to update existing stock entry in local state
  const updateStockEntry = useCallback((updatedEntry: Partial<StockEntry> & { id: string | number }) => {
    console.log("🔄 StockEntriesTable: Updating stock entry in local state:", updatedEntry);
    setStockEntries(prev => prev.map(entry => (entry.id === updatedEntry.id ? { ...entry, ...updatedEntry } : entry)));
  }, []);

  // Expose methods for external components to trigger instant updates
  useEffect(() => {
    (window as any).stockEntriesTableActions = {
      addStockEntry,
      updateStockEntry,
      deleteStockEntry: (entryId: string | number) => {
        setStockEntries(prev => prev.filter(entry => entry.id !== entryId));
      }
    };

    return () => {
      delete (window as any).stockEntriesTableActions;
    };
  }, [addStockEntry, updateStockEntry]);

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


  const isAllowedPOSCategory = (material: Material | undefined) => {
    if (!material || !material.category) return false;
    const allowedCategories = ["beverages", "cold", "hot", "alcohol"];
    let categoryName: string;
    if (typeof material.category === "string") {
      categoryName = material.category;
    } else if (typeof material.category === "object" && material.category !== null && "name" in material.category) {
      categoryName = (material.category as any).name;
    } else {
      return false;
    }
    return allowedCategories.includes(categoryName.toLowerCase());
  };

  const handleTogglePOSVisibility = async (entry: StockEntry & { material?: Material }) => {
    if (!entry.material) {
      toast({
        title: "Error",
        description: "Material information not found",
        variant: "destructive",
        duration: 1000
      });
      return;
    }
    const newPOSStatus = !entry.isPOSItem;

    setStockEntries(prev => prev.map(stockEntry => (stockEntry.id === entry.id ? { ...stockEntry, isPOSItem: newPOSStatus } : stockEntry)));

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
    } catch (error) {
      setStockEntries(prev => prev.map(stockEntry => (stockEntry.id === entry.id ? { ...stockEntry, isPOSItem: !newPOSStatus } : stockEntry)));
      console.error("Error updating stock entry POS visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update POS visibility. Changes have been reverted.",
        variant: "destructive",
        duration: 1000
      });
    }
  };

  const handleOpenPrinterDialog = (entry: StockEntryWithMaterial) => {
    setSelectedStockEntry(entry);
    setShowPrinterDialog(true);
  };

  const handleEditStockEntry = async (stockEntry: StockEntry) => {
    setSelectedStockEntry(stockEntry);

    let material = (materials as (MaterialWithStock | Material)[]).find(m => String(m.id) === String(stockEntry.materialId)) as MaterialWithStock | undefined;
    if (!material) {
      try {
        const freshMaterials = await materialsAPI.getMaterials({ limit: 10000, _t: Date.now() });
        setMaterials(freshMaterials);
        material = freshMaterials.find(m => String(m.id) === String(stockEntry.materialId)) as MaterialWithStock | undefined;
      } catch (err) {
        console.error("❌ Failed to fetch fresh materials data:", err);
      }
    }
    if (material) {
      setSelectedMaterial(material);
    } else {
      console.warn("⚠️ Could not find material with ID:", stockEntry.materialId);
    }
    setShowStockForm(true);
  };

  const handleDeleteStockEntry = async (stockEntryId: string | number) => {
    const originalEntries = [...stockEntries];
    setStockEntries(prev => prev.filter(entry => entry.id !== stockEntryId));
    try {
      if (onDeleteStockEntry) {
        await onDeleteStockEntry(stockEntryId);
      } else {
        await stockAPI.deleteStockEntry(stockEntryId.toString());
      }
      toast({
        title: "Stock Entry Deleted",
        description: "Stock entry has been successfully deleted",
        variant: "default",
        duration: 1000
      });
      setSelectedStockEntries(new Set());
      if (bulkSelectionMode) {
        table.toggleAllRowsSelected(false);
      }
    } catch (error) {
      setStockEntries(originalEntries);
      console.error("Error deleting stock entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete stock entry",
        variant: "destructive",
        duration: 1000
      });
    }
  };

  const columns = useStockEntriesTableColumns({
    searchTerm,
    bulkSelectionMode,
    sortBy,
    sortOrder,
    handleSortChange,
    handleTogglePOSVisibility,
    handleOpenPrinterDialog,
    handleEditStockEntry,
    handleDeleteStockEntry,
    isAllowedPOSCategory,
    hasNegativeStock,
    renderQuantityDisplay,
    renderUnitDisplay
  });

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

  const materialsById = useMemo(() => {
    const map = new Map<string, Material>();
    materials.forEach(m => map.set(m.id, m));
    return map;
  }, [materials]);

  const uniqueMaterials = useMemo(() => materials.map(m => ({ id: m.id, name: m.name })).sort((a, b) => a.name.localeCompare(b.name)), [materials]);
  const table = useReactTable({
    data: sortedStockEntries,
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

  const negativeStockCount = useMemo(() => filteredStockEntries.filter(hasNegativeStock).length, [filteredStockEntries]);

  const handlePrinterAssignmentChange = async (updatedEntry?: StockEntry) => {
    if (updatedEntry) {
      setStockEntries(prev => prev.map(stockEntry => (stockEntry.id === updatedEntry.id ? { ...stockEntry, assignedPrinter: updatedEntry.assignedPrinter } : stockEntry)));
      setSelectedStockEntries(new Set());
      if (bulkSelectionMode) {
        table.toggleAllRowsSelected(false);
      }
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
      setStockEntries(prev =>
        prev.map(stockEntry => {
          const updatedEntry = updatedEntries.find(updated => updated.id === stockEntry.id);
          return updatedEntry ? { ...stockEntry, assignedPrinter: updatedEntry.assignedPrinter } : stockEntry;
        })
      );
    }
    setSelectedStockEntries(new Set());
    setBulkSelectionMode(false);
    setShowBulkPrinterDialog(false);
  };

  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={10}>
      <div className="h-full flex flex-col">
        <div className="p-2 px-4 sm:px-8 space-y-4">
          <div className="flex justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Stock Entries</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <>
                  <span>Total: {pagination.totalItems} entries</span>
                </>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col lg:flex-row-reverse items-center gap-3 lg:flex-shrink-0">
                <div className="flex justify-end  items-center gap-2">
                  <Button size="sm" variant={bulkSelectionMode ? "default" : "outline"} onClick={handleToggleBulkSelection} className={`${bulkSelectionMode ? "bg-red-600 hover:bg-red-700" : "border-gray-200 hover:border-gray-300"}`}>
                    <Check className="h-4 w-4 mr-1.5" />
                    <span className="hidden lg:inline">{bulkSelectionMode ? "Cancel" : "Bulk Select"}</span>
                    <span className="lg:hidden">{bulkSelectionMode ? "Cancel" : "Select"}</span>
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleRefresh} className="border-gray-200 hover:border-gray-300" disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    <span className="hidden lg:inline">Refresh</span>
                    <span className="lg:hidden">Refresh</span>
                  </Button>

                  <NegativeStock negativeStockCount={negativeStockCount} />
                </div>

                <div className="flex justify-end items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <Input key="stock-search-input" type="search" placeholder="Search by material name or supplier..." value={searchTerm} onChange={handleSearchChange} className="pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem] w-32 sm:w-52" />
                  </div>

                  <div className="w-fit shrink-0">
                    <Select value={materialFilter} onValueChange={setMaterialFilter}>
                      <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem] w-28 sm:w-32">
                        <SelectValue placeholder="All Materials">{materialFilter === "all" ? "All Materials" : materialsById.get(materialFilter)?.name || "All Materials"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Materials</SelectItem>
                        {uniqueMaterials.map(material => (
                          <SelectItem key={material.id} value={String(material.id)}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Pagination pagination={pagination} pageSize={pageSize} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange} />
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
          {sortedStockEntries.length === 0 && (
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
          {sortedStockEntries.length > 0 && (
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
                          <p className="text-sm text-gray-600 mt-1">{isVirtual ? "VIRTUAL" : (entry.supplier?.supplierName || entry.supplierName || "Unknown Supplier")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantity</span>
                        <p className={`text-sm font-medium ${isNegative ? "text-red-600" : isVirtual ? "text-orange-600" : "text-gray-900"}`}>
                          {(() => {
                            // Use backend calculated values directly
                            if (entry.totalVolume && entry.volumeUnit) {
                              return `${formatNumber(entry.totalVolume)} ${entry.volumeUnit}`;
                            } else if (entry.totalMass && entry.massUnit) {
                              return `${formatNumber(entry.totalMass)} ${entry.massUnit}`;
                            } else if (entry.totalPieces && entry.unitDescription) {
                              return `${formatNumber(entry.totalPieces)} ${entry.unitDescription}`;
                            } else if (entry.totalPieces) {
                              return `${formatNumber(entry.totalPieces)} pieces`;
                            }

                            // Fallback to raw purchase data if no calculated values
                            return `${formatNumber(entry.purchasedIndividualQuantity)} ${entry.purchasedIndividualUnit}`;
                          })()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unit Cost</span>
                        <p className="text-sm font-medium text-gray-900">{Number(entry.costPerPurchasedUnit) > 0 ? formatCurrency(Number(entry.costPerPurchasedUnit)) : entry.costPerBaseUnit ? `${formatCurrency(Number(entry.costPerBaseUnit))} per ${entry.material?.baseUnit || "unit"}` : "$0.00"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Cost</span>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(calculateCurrentTotalCost(entry))}</p>
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
          {sortedStockEntries.length > 0 && (
            <div className="hidden lg:block px-2">
              <div className="h-[calc(100vh-225px)] overflow-y-hidden">
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
                  maxHeight="calc(100vh-225px)"
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
