import React from "react";
import { salesAPI } from "@/api/sales.api.ts.tsx";
import { stockAPI } from "@/api/stock.api.ts.tsx";
import { PrinterAssignmentDialog } from "@/components/inventory/PrinterAssignmentDialog";
import { BulkPrinterAssignmentDialog } from "@/components/inventory/BulkPrinterAssignmentDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { usePrefetch } from "@/hooks/usePrefetch";
import { inventoryAPIWithPrefetch } from "@/api/inventory.api";
import { Material, NegativeStockReport, StockEntry, StockEntryWithMaterial, StockFormData, AddStockData, RecordWasteData, MaterialWithStock } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { highlightText } from "@/utils/highlightText";
import { AlertTriangle, Check, Edit, Eye, FileText, Plus, Printer, RefreshCw, Search, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { selectedStockEntryAtom, showStockFormAtom, selectedMaterialAtom } from "@/store/inventoryAtoms";
import { StockForm } from "@/components/stock/StockForm";

export function StockEntriesTable() {
  const { stock: stockEntries, materials: materialsWithStock, refresh } = usePrefetch();
  const materials = materialsWithStock;

  // Atom states for form management
  const [showStockForm, setShowStockForm] = useAtom(showStockFormAtom);
  const [selectedStockEntry, setSelectedStockEntry] = useAtom(selectedStockEntryAtom) as [StockEntry | null, (value: StockEntry | null) => void];
  const [selectedMaterial, setSelectedMaterial] = useAtom(selectedMaterialAtom) as [MaterialWithStock | null, (value: MaterialWithStock | null) => void];

  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"materialName" | "supplier" | "purchaseDate">("purchaseDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [negativeStockReport, setNegativeStockReport] = useState<NegativeStockReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [selectedStockEntries, setSelectedStockEntries] = useState<Set<string>>(new Set());
  const [showBulkPrinterDialog, setShowBulkPrinterDialog] = useState(false);
  const materialsMap = new Map(materials.map(m => [m.id, m]));

  // Handle sorting
  const handleSort = (field: "materialName" | "supplier" | "purchaseDate") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

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
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  // Handler functions
  const handleEditStockEntry = (stockEntry: StockEntry) => {
    console.log("Edit stock entry:", stockEntry);
    setSelectedStockEntry(stockEntry);
    // Find and set the associated material
    const material = materialsWithStock.find(m => m.id === stockEntry.materialId);
    if (material) {
      setSelectedMaterial(material);
    }
    setShowStockForm(true);
  };

  const handleDeleteStockEntry = async (stockEntryId: string | number) => {
    try {
      await inventoryAPIWithPrefetch.stock.deleteStockEntryWithCache(stockEntryId.toString());
      await refresh("stock");
      await refresh("materials");
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

  const handleAddStock = () => {
    setSelectedStockEntry(null);
    setSelectedMaterial(null);
    setShowStockForm(true);
  };

  // Stock form handlers
  const handleStockSubmit = async (data: StockFormData) => {
    console.log("🚀 handleStockSubmit called with data:", data);
    console.log("📝 selectedStockEntry:", selectedStockEntry);

    try {
      if (selectedStockEntry) {
        console.log("🔄 Updating existing stock entry with ID:", selectedStockEntry.id);
        // Update existing stock entry
        const result = await inventoryAPIWithPrefetch.stock.updateStockEntryWithCache(selectedStockEntry.id, data);
        console.log("✅ Update result:", result);
        toast({
          title: "Stock Entry Updated",
          description: "Stock entry has been updated successfully.",
          variant: "default"
        });
      } else {
        console.log("➕ Creating new stock entry");
        // Create new stock entry
        const result = await inventoryAPIWithPrefetch.stock.createStockEntryWithCache(data);
        console.log("✅ Create result:", result);
        toast({
          title: "Stock Entry Created",
          description: "New stock entry has been created successfully.",
          variant: "default"
        });
      }

      console.log("🔄 Refreshing data...");
      // Reset form state
      setShowStockForm(false);
      setSelectedStockEntry(null);
      setSelectedMaterial(null);

      // Refresh data
      await refresh("stock");
      await refresh("materials");
      console.log("✅ Data refresh completed");
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
      await refresh("stock");
      await refresh("materials");
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
      await refresh("stock");
      await refresh("materials");
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

  // Get unique suppliers for filter
  const uniqueSuppliers = Array.from(new Set(stockEntries.map(entry => entry.supplier).filter(Boolean)));

  // Filter and sort stock entries
  const stockEntriesWithMaterial = stockEntries
    .map(entry => ({
      ...entry,
      material: materialsMap.get(entry.materialId)
    }))
    .filter(entry => {
      const materialName = entry.material?.name;
      const supplier = entry.supplier;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || materialName?.toLowerCase().includes(searchLower) || supplier?.toLowerCase().includes(searchLower);
      const matchesSupplier = supplierFilter === "all" || entry.supplier === supplierFilter;
      return matchesSearch && matchesSupplier;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "materialName": {
          const nameA = a.material?.name || "";
          const nameB = b.material?.name || "";
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case "supplier": {
          const supplierA = a.supplier || "";
          const supplierB = b.supplier || "";
          comparison = supplierA.localeCompare(supplierB);
          break;
        }
        case "purchaseDate":
        default: {
          const dateA = new Date(a.purchaseDate || 0).getTime();
          const dateB = new Date(b.purchaseDate || 0).getTime();
          comparison = dateA - dateB;
          break;
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

  const hasNegativeStock = (entry: (typeof stockEntriesWithMaterial)[0]) => {
    return (entry.purchasedIndividualQuantity && entry.purchasedIndividualQuantity < 0) || (entry.purchasedQuantity && entry.purchasedQuantity < 0);
  };

  const isVirtualEntry = (entry: (typeof stockEntriesWithMaterial)[0]) => {
    return entry.supplier === "VIRTUAL - Negative Stock";
  };

  const isExpiredEntry = (entry: (typeof stockEntriesWithMaterial)[0]) => {
    if (!entry.expiryDate) return false;
    const today = new Date();
    const expiryDate = new Date(entry.expiryDate);
    return expiryDate < today;
  };

  const isExpiringSoonEntry = (entry: (typeof stockEntriesWithMaterial)[0]) => {
    if (!entry.expiryDate) return false;
    const today = new Date();
    const expiryDate = new Date(entry.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    // Consider items expiring within 7 days as "expiring soon"
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  const renderUnitTypeBadges = (material: Material | undefined) => {
    if (!material) return null;

    const getUnitTypeColor = (unitType: string) => {
      switch (unitType) {
        case "mass":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "volume":
          return "bg-green-100 text-green-800 border-green-200";
        case "piece":
          return "bg-purple-100 text-purple-800 border-purple-200";
        case "package":
          return "bg-orange-100 text-orange-800 border-orange-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    return (
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className={`text-xs ${getUnitTypeColor(material.unitType)}`}>
          {material.unitType}
        </Badge>
        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-300">
          {material.baseUnit}
        </Badge>
        {material.inputUnit && material.inputUnit !== material.baseUnit && (
          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
            {material.inputUnit}
          </Badge>
        )}
      </div>
    );
  };

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

  const renderQuantityDisplay = (entry: (typeof stockEntriesWithMaterial)[0]) => {
    const { material } = entry;
    const isNegative = hasNegativeStock(entry);
    const isVirtual = isVirtualEntry(entry);

    return (
      <div className="space-y-1">
        {(() => {
          if (material?.unitType === "mass" && entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualUnit) {
            return (
              <>
                <div className={`font-medium flex items-center gap-2 ${isNegative ? "text-red-600" : ""}`}>
                  {isNegative && <AlertTriangle className="h-4 w-4" />}
                  {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                </div>
                <div className="text-sm text-muted-foreground">
                  (from {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit})
                </div>
              </>
            );
          } else if (material?.unitType === "volume" && entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualUnit) {
            return (
              <>
                <div className={`font-medium flex items-center gap-2 ${isNegative ? "text-red-600" : ""}`}>
                  {isNegative && <AlertTriangle className="h-4 w-4" />}
                  {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                </div>
                <div className="text-sm text-muted-foreground">
                  (from {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit})
                </div>
              </>
            );
          } else if (material?.unitType === "package" && entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualUnit) {
            return (
              <>
                <div className={`font-medium flex items-center gap-2 ${isNegative ? "text-red-600" : ""}`}>
                  {isNegative && <AlertTriangle className="h-4 w-4" />}
                  {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                </div>
                {/* Only show "(from X pack)" if individual quantity is positive */}
                {entry.purchasedIndividualQuantity > 0 && material?.packageQuantity && (
                  <div className="text-sm text-muted-foreground">
                    (from {formatNumber(Math.ceil(entry.purchasedIndividualQuantity / material.packageQuantity))} {entry.purchasedUnit})
                  </div>
                )}
              </>
            );
          } else {
            return (
              <div className={`font-medium flex items-center gap-2 ${isNegative ? "text-red-600" : ""}`}>
                {isNegative && <AlertTriangle className="h-4 w-4" />}
                {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit}
              </div>
            );
          }
        })()}
      </div>
    );
  };

  const renderUnitDisplay = (entry: (typeof stockEntriesWithMaterial)[0]) => {
    const { material } = entry;

    return (
      <div className="flex items-center gap-2">
        <div className="space-y-1">
          <div>{entry.purchasedUnit}</div>
          {(() => {
            // For package units, show individual unit (e.g., piece)
            if (material?.unitType === "package" && entry.purchasedIndividualUnit) {
              return <div className="text-sm text-muted-foreground">{entry.purchasedIndividualUnit}</div>;
            }
            // For mass and volume units, show converted unit (e.g., g for mass, ml for volume)
            else if (entry.purchasedConvertedUnit && entry.purchasedConvertedUnit !== entry.purchasedUnit) {
              return <div className="text-sm text-muted-foreground">{entry.purchasedConvertedUnit}</div>;
            }
            // Fallback: show base unit if different from purchased unit
            else if (material?.baseUnit && material.baseUnit !== entry.purchasedUnit) {
              return <div className="text-sm text-muted-foreground">{material.baseUnit}</div>;
            }
            return null;
          })()}
        </div>
        {material?.unitType === "package" && (
          <Badge variant="outline" className="text-xs">
            Package
          </Badge>
        )}
        {material?.unitType === "volume" && (
          <Badge variant="outline" className="text-xs">
            Volume
          </Badge>
        )}
      </div>
    );
  };

  const negativeStockCount = stockEntriesWithMaterial.filter(hasNegativeStock).length;
  const virtualEntryCount = stockEntriesWithMaterial.filter(isVirtualEntry).length;

  const handleRowClick = (entryId: string) => {
    setSelectedRowId(selectedRowId === entryId ? null : entryId);
  };

  const handleTogglePOSVisibility = async (entry: StockEntry & { material?: Material }) => {
    if (!entry.material) {
      toast({
        title: "Error",
        description: "Material information not found",
        variant: "destructive"
      });
      return;
    }

    try {
      const newPOSStatus = !entry.isPOSItem;

      // Update the stock entry's POS visibility
      const response = await stockAPI.updateStockEntryPOS(entry.id.toString(), {
        isPOSItem: newPOSStatus
      });

      if (!response) {
        throw new Error("Failed to update stock entry POS visibility");
      }

      toast({
        title: "Success",
        description: `${entry.material.name} stock entry is now ${newPOSStatus ? "available in" : "hidden from"} POS`,
        variant: "default"
      });

      // Refresh the data to show updated state
      await refresh("stock");
    } catch (error) {
      console.error("Error updating stock entry POS visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update POS visibility",
        variant: "destructive"
      });
    }
  };

  const handleOpenPrinterDialog = (entry: StockEntryWithMaterial) => {
    setSelectedStockEntry(entry);
    setShowPrinterDialog(true);
  };

  const handlePrinterAssignmentChange = async () => {
    // Refresh the data to show updated printer assignments
    await refresh("stock");
  };

  const handleToggleBulkSelection = () => {
    setBulkSelectionMode(prev => !prev);
    setSelectedStockEntries(new Set());
  };

  const handleSelectStockEntry = (entryId: string) => {
    setSelectedStockEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const handleSelectAllStockEntries = () => {
    if (selectedStockEntries.size === stockEntriesWithMaterial.length) {
      setSelectedStockEntries(new Set());
    } else {
      setSelectedStockEntries(new Set(stockEntriesWithMaterial.map(entry => entry.id.toString())));
    }
  };

  const handleOpenBulkPrinterDialog = () => {
    if (selectedStockEntries.size > 0) {
      setShowBulkPrinterDialog(true);
    }
  };

  const handleCloseBulkPrinterDialog = () => {
    setShowBulkPrinterDialog(false);
  };

  const handleBulkPrinterAssignmentComplete = async () => {
    // Refresh the stock entries data to show updated printer assignments
    await refresh("stock");
    setSelectedStockEntries(new Set());
    setBulkSelectionMode(false);
    setShowBulkPrinterDialog(false);
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header Section */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Stock Entries</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>Total: {stockEntries.length} entries</span>
                {(searchTerm || supplierFilter !== "all") && (
                  <span className="text-blue-600 font-medium">
                    Filtered: {stockEntriesWithMaterial.length} results
                    {supplierFilter !== "all" && ` (${supplierFilter})`}
                  </span>
                )}
                {negativeStockCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {negativeStockCount} negative
                      {virtualEntryCount > 0 && ` (${virtualEntryCount} virtual)`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input 
                placeholder="Search by material name or supplier..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem]" 
              />
            </div>

            {/* Supplier Filter */}
            <div className="w-fit shrink-0">
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem] w-full">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {uniqueSuppliers.map(supplier => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {bulkSelectionMode && (
                <>
                  <Button size="sm" variant="outline" onClick={handleSelectAllStockEntries} disabled={stockEntriesWithMaterial.length === 0} className="border-gray-200 hover:border-gray-300">
                    <Check className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">{selectedStockEntries.size === stockEntriesWithMaterial.length ? "Deselect All" : "Select All"}</span>
                    <span className="sm:hidden">{selectedStockEntries.size === stockEntriesWithMaterial.length ? "Deselect" : "Select"}</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleOpenBulkPrinterDialog} disabled={selectedStockEntries.size === 0} className="border-gray-200 hover:border-gray-300">
                    <Printer className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Assign Printer ({selectedStockEntries.size})</span>
                    <span className="sm:hidden">Printer ({selectedStockEntries.size})</span>
                  </Button>
                </>
              )}

              <Button size="sm" variant={bulkSelectionMode ? "default" : "outline"} onClick={handleToggleBulkSelection} className={bulkSelectionMode ? "bg-blue-600 hover:bg-blue-700" : "border-gray-200 hover:border-gray-300"}>
                <Check className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">{bulkSelectionMode ? "Exit Selection" : "Bulk Select"}</span>
                <span className="sm:hidden">{bulkSelectionMode ? "Exit" : "Select"}</span>
              </Button>

              {negativeStockCount > 0 && (
                <Button variant="outline" size="sm" onClick={fetchNegativeStockReport} disabled={loadingReport} className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300">
                  {loadingReport ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <FileText className="h-4 w-4 mr-1.5" />}
                  <span className="hidden sm:inline">Negative Stock Report</span>
                  <span className="sm:hidden">Report</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div ref={scrollContainerRef} className="px-4 sm:px-6 pb-4 sm:pb-6 flex-1 overflow-hidden overflow-y-auto relative">
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {stockEntriesWithMaterial.map(entry => {
              const material = materialsMap.get(entry.materialId);
              const isNegative = hasNegativeStock(entry);
              const isVirtual = isVirtualEntry(entry);
              const isExpired = isExpiredEntry(entry);
              const isExpiringSoon = isExpiringSoonEntry(entry);

              return (
                <div key={entry.id} className={`p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${isNegative ? "border-l-4 border-l-red-500" : isVirtual ? "border-l-4 border-l-orange-500" : isExpired ? "border-l-4 border-l-gray-500" : isExpiringSoon ? "border-l-4 border-l-yellow-500" : ""}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{material?.name || "Unknown Material"}</h3>
                      <p className="text-xs text-muted-foreground">{entry.supplier}</p>
                    </div>
                    {renderUnitTypeBadges(material)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">Qty:</span>
                      <span className={`ml-1 font-medium ${isNegative ? "text-red-600" : isVirtual ? "text-orange-600" : ""}`}>
                        {formatNumber(entry.purchasedIndividualQuantity)} {entry.purchasedIndividualUnit}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost/Unit:</span>
                      <span className="ml-1 font-medium">{formatCurrency(entry.costPerPurchasedUnit)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-1 font-medium">{formatCurrency(entry.totalCost)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <span className="ml-1">{new Date(entry.purchaseDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 justify-between items-center">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleEditStockEntry(entry)} className="h-7 px-2 text-xs">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Stock Entry</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete this stock entry for "{material?.name}"? This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteStockEntry(entry.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className="flex gap-1">
                      <Button variant={entry.isPOSItem ? "default" : "outline"} size="sm" onClick={() => handleTogglePOSVisibility(entry)} className="h-7 px-2 text-xs">
                        {entry.isPOSItem ? <Check className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenPrinterDialog(entry)} className="h-7 px-2 text-xs">
                        <Printer className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="w-full h-[calc(100vh-260px)] border rounded-lg overflow-hidden bg-white shadow-sm">
              <Table className="w-full">
                <TableHeader className="bg-gray-50/80 sticky top-0 z-10">
                  <TableRow className="border-b border-gray-200">
                    {bulkSelectionMode && (
                      <TableHead className="w-12 px-6 py-4 text-left font-semibold text-gray-900">
                        <input type="checkbox" checked={selectedStockEntries.size === stockEntriesWithMaterial.length && stockEntriesWithMaterial.length > 0} onChange={handleSelectAllStockEntries} className="h-4 w-4" aria-label="Select all stock entries" />
                      </TableHead>
                    )}
                    <TableHead className="w-[20%] px-6 py-4 text-left font-semibold text-gray-900">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold text-gray-900 hover:text-gray-700 flex items-center justify-between w-full group transition-colors duration-200 hover:bg-transparent" 
                        onClick={() => handleSort("materialName")}
                      >
                        <span>Material Name</span>
                        <div className="flex items-center justify-center w-5 h-5 ml-2">
                          {sortField === "materialName" ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4 text-emerald-600 transition-all duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-emerald-600 transition-all duration-200" />
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center opacity-60 group-hover:opacity-80 transition-opacity duration-200">
                              <ChevronUp className="h-2.5 w-2.5 text-gray-400 -mb-0.5" />
                              <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Button>
                    </TableHead>
                    <TableHead className="w-[15%] px-4 py-4 text-left font-semibold text-gray-900">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold text-gray-900 hover:text-gray-700 flex items-center justify-between w-full group transition-colors duration-200 hover:bg-transparent" 
                        onClick={() => handleSort("supplier")}
                      >
                        <span>Supplier</span>
                        <div className="flex items-center justify-center w-5 h-5 ml-2">
                          {sortField === "supplier" ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4 text-emerald-600 transition-all duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-emerald-600 transition-all duration-200" />
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center opacity-60 group-hover:opacity-80 transition-opacity duration-200">
                              <ChevronUp className="h-2.5 w-2.5 text-gray-400 -mb-0.5" />
                              <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Button>
                    </TableHead>
                    <TableHead className="w-[12%] px-4 py-4 text-left font-semibold text-gray-900">Remaining Qty</TableHead>
                    <TableHead className="w-[10%] px-4 py-4 text-left font-semibold text-gray-900">Unit</TableHead>
                    <TableHead className="w-[10%] px-4 py-4 text-left font-semibold text-gray-900">Cost/Unit</TableHead>
                    <TableHead className="w-[10%] px-4 py-4 text-left font-semibold text-gray-900">Total Cost</TableHead>
                    <TableHead className="w-[10%] px-4 py-4 text-left font-semibold text-gray-900">
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 font-semibold text-gray-900 hover:text-gray-700 flex items-center justify-between w-full group transition-colors duration-200 hover:bg-transparent" 
                        onClick={() => handleSort("purchaseDate")}
                      >
                        <span>Purchase Date</span>
                        <div className="flex items-center justify-center w-5 h-5 ml-2">
                          {sortField === "purchaseDate" ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4 text-emerald-600 transition-all duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-emerald-600 transition-all duration-200" />
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center opacity-60 group-hover:opacity-80 transition-opacity duration-200">
                              <ChevronUp className="h-2.5 w-2.5 text-gray-400 -mb-0.5" />
                              <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </Button>
                    </TableHead>
                    <TableHead className="w-[13%] px-6 py-4 text-center font-semibold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>

              <div className="h-[calc(100%-60px)] overflow-y-auto">
                <Table className="w-full">
                  <TableBody>
                      {stockEntriesWithMaterial
                        .map(entry => {
                          const isNegative = hasNegativeStock(entry);
                          const isVirtual = isVirtualEntry(entry);
                          const isSelected = selectedRowId === entry.id;

                          return (
                            <TableRow
                              key={entry.id}
                              onClick={bulkSelectionMode ? () => handleSelectStockEntry(entry.id.toString()) : () => handleRowClick(entry.id)}
                              className={`transition-colors ${isSelected ? "bg-blue-100 border-l-4 border-l-blue-500 hover:bg-blue-150" : selectedStockEntries.has(entry.id.toString()) ? "bg-green-50 border-l-4 border-l-green-500 hover:bg-green-100" : isNegative ? "bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100" : "hover:bg-gray-50"} ${isVirtual && !isSelected ? "border-l-red-600" : ""}`}
                            >
                              {bulkSelectionMode && (
                                <TableCell className="w-12">
                                  <input type="checkbox" checked={selectedStockEntries.has(entry.id.toString())} onChange={() => handleSelectStockEntry(entry.id.toString())} className="h-4 w-4" aria-label={`Select ${entry.material?.name || "stock entry"}`} onClick={e => e.stopPropagation()} />
                                </TableCell>
                              )}
                              <TableCell className="font-medium min-w-[200px]">
                                <div className="flex items-center gap-2">
                                  {isNegative && <AlertTriangle className="h-4 w-4 text-red-600" />}
                                  {entry.material?.name ? highlightText(entry.material.name, searchTerm) : `Unknown Material (ID: ${entry.materialId})`}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[150px]">
                                <div className="flex items-center gap-2">
                                  <span className={isVirtual ? "text-red-600 font-medium" : ""}>{isVirtual ? "" : highlightText(entry.supplier || "", searchTerm)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[150px]">{renderQuantityDisplay(entry)}</TableCell>
                              <TableCell className="min-w-[120px]">{renderUnitDisplay(entry)}</TableCell>
                              <TableCell className="min-w-[120px]">
                                {formatCurrency(entry.costPerPurchasedUnit)}
                                {entry.material?.unitType === "package" && <span className="text-xs text-muted-foreground ml-1">(per {entry.purchasedUnit})</span>}
                              </TableCell>
                              <TableCell className="min-w-[120px]">{formatCurrency(entry.totalCost)}</TableCell>
                              <TableCell className="min-w-[140px]">{new Date(entry.purchaseDate).toLocaleDateString()}</TableCell>
                              <TableCell className="min-w-[220px]">
                                <div className="flex gap-2">
                                  <Button
                                    variant={entry.isPOSItem ? "default" : "outline"}
                                    size="sm"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleTogglePOSVisibility(entry);
                                    }}
                                    title={entry.isPOSItem ? "Hide from POS" : "Show in POS"}
                                    className={entry.isPOSItem ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleOpenPrinterDialog(entry);
                                    }}
                                    title={entry.assignedPrinter ? `Assigned to: ${entry.assignedPrinter.name}` : "Assign printer"}
                                    className={entry.assignedPrinter ? "border-blue-500 text-blue-600" : ""}
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleEditStockEntry(entry as StockEntry)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Stock Entry</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this stock entry? This action cannot be undone.
                                          {isNegative && (
                                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                                              <strong>Warning:</strong> This entry has negative stock quantities.
                                            </div>
                                          )}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteStockEntry(entry.id)}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>

          {/* Printer Assignment Dialog */}
          <PrinterAssignmentDialog open={showPrinterDialog} onOpenChange={setShowPrinterDialog} item={selectedStockEntry} itemType="stock" onAssignmentChange={handlePrinterAssignmentChange} />

          {/* Bulk Printer Assignment Dialog */}
          <BulkPrinterAssignmentDialog open={showBulkPrinterDialog} onOpenChange={setShowBulkPrinterDialog} selectedItems={selectedStockEntries} itemType="stock" onAssignmentChange={handleBulkPrinterAssignmentComplete} />

          {/* Stock Form Dialog */}
          {showStockForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <StockForm
                  materials={materialsWithStock}
                  stockEntry={selectedStockEntry || undefined}
                  selectedMaterialId={selectedMaterial?.id}
                  onSubmit={handleStockSubmit}
                  onAddStock={handleAddStockOperation}
                  onRecordWaste={handleRecordWasteOperation}
                  onCancel={() => {
                    setShowStockForm(false);
                    setSelectedStockEntry(null);
                    setSelectedMaterial(null);
                  }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Floating Add Button */}
        <div 
          className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out transform ${
            showFloatingButton 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-16 opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <Button 
            onClick={handleAddStock} 
            className="bg-primary hover:bg-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full h-14 w-14 p-0 group"
            size="lg"
          >
            <Plus className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
          </Button>
        </div>
    </>
  );
}
