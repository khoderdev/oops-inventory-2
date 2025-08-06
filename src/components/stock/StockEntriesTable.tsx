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
import { AlertTriangle, Check, Edit, Eye, EyeOff, FileText, Plus, Printer, RefreshCw, Search, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const [materialFilter, setMaterialFilter] = useState<string>("all");
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
      console.log("🚀 handleWasteFromSpecificEntryOperation called with:", data);
      
      // Convert the data to the format expected by the API
      const wasteData = {
        wasteQuantity: data.wasteQuantity || data.purchasedQuantity || 0,
        unit: data.purchasedUnit || "g",
        wasteReason: data.wasteReason || "unspecified",
        wasteDate: new Date(),
        notes: data.notes
      };
      
      console.log("📤 Calling wasteFromSpecificEntryWithCache with ID:", data.stockEntryId, "and data:", wasteData);
      
      // Call the API to record waste from specific entry
      await inventoryAPIWithPrefetch.stock.wasteFromSpecificEntryWithCache(data.stockEntryId, wasteData);
      
      await refresh("stock");
      await refresh("materials");
      
      // Close the dialog
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
      console.log("🚀 handleAddToSpecificEntryOperation called with:", data);
      
      // Convert the data to the format expected by the API
      const addData = {
        additionalQuantity: data.purchasedQuantity || 0,
        unit: data.purchasedUnit || "g",
        additionDate: new Date(),
        notes: data.notes
      };
      
      console.log("📤 Calling addToSpecificEntryWithCache with ID:", data.stockEntryId, "and data:", addData);
      
      // Call the API to add to specific entry
      await inventoryAPIWithPrefetch.stock.addToSpecificEntryWithCache(data.stockEntryId, addData);
      
      await refresh("stock");
      await refresh("materials");
      
      // Close the dialog
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

  // Get unique materials for filter
  const uniqueMaterials = Array.from(new Set(stockEntries.map(entry => {
    const material = materialsMap.get(entry.materialId);
    return material?.name;
  }).filter(Boolean))).sort();

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
      const matchesMaterial = materialFilter === "all" || entry.material?.name === materialFilter;
      return matchesSearch && matchesMaterial;
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
    <TooltipProvider delayDuration={100} skipDelayDuration={10}>
      <div className="h-full flex flex-col">
        {/* Header Section */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Stock Entries</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>Total: {stockEntries.length} entries</span>
                {(searchTerm || materialFilter !== "all") && (
                  <span className="text-blue-600 font-medium">
                    Filtered: {stockEntriesWithMaterial.length} results
                    {materialFilter !== "all" && ` (${materialFilter})`}
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
              type="search"
                placeholder="Search by material name or supplier..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem]" 
              />
            </div>

            {/* Material Filter */}
            <div className="w-fit shrink-0">
              <Select value={materialFilter} onValueChange={setMaterialFilter}>
                <SelectTrigger className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 !h-10 min-h-[2.5rem] w-full">
                  <SelectValue placeholder="All Materials" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  {uniqueMaterials.map(material => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              {/* Bulk Selection Actions Row */}
              {bulkSelectionMode && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleSelectAllStockEntries} 
                    disabled={stockEntriesWithMaterial.length === 0} 
                    className="flex-1 sm:flex-none border-gray-200 hover:border-gray-300 min-w-0"
                  >
                    <Check className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    <span className="hidden sm:inline">{selectedStockEntries.size === stockEntriesWithMaterial.length ? "Deselect All" : "Select All"}</span>
                    <span className="sm:hidden truncate">{selectedStockEntries.size === stockEntriesWithMaterial.length ? "Deselect" : "Select"}</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleOpenBulkPrinterDialog} 
                    disabled={selectedStockEntries.size === 0} 
                    className="flex-1 sm:flex-none border-gray-200 hover:border-gray-300 min-w-0"
                  >
                    <Printer className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    <span className="hidden sm:inline">Assign Printer ({selectedStockEntries.size})</span>
                    <span className="sm:hidden truncate">Printer ({selectedStockEntries.size})</span>
                  </Button>
                </div>
              )}

              {/* Main Actions Row */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button 
                  size="sm" 
                  variant={bulkSelectionMode ? "default" : "outline"} 
                  onClick={handleToggleBulkSelection} 
                  className={`flex sm:flex-none min-w-0 ${bulkSelectionMode ? "bg-red-600 hover:bg-red-700" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <Check className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span className="hidden sm:inline">{bulkSelectionMode ? "cancel" : "Bulk Select"}</span>
                  <span className="sm:hidden truncate">{bulkSelectionMode ? "Exit" : "Select"}</span>
                </Button>

                {negativeStockCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchNegativeStockReport} 
                    disabled={loadingReport} 
                    className="flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 min-w-0"
                  >
                    {loadingReport ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin flex-shrink-0" /> : <FileText className="h-4 w-4 mr-1.5 flex-shrink-0" />}
                    <span className="hidden sm:inline">Negative Stock Report</span>
                    <span className="sm:hidden truncate">Report</span>
                  </Button>
                )}
              </div>
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

              const isSelected = selectedStockEntries.has(entry.id.toString());

              return (
                <div 
                  key={entry.id} 
                  className={`p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? "border-blue-300 bg-blue-50 shadow-md" 
                      : isNegative 
                      ? "border-l-4 border-l-red-500 border-gray-200" 
                      : isVirtual 
                      ? "border-l-4 border-l-orange-500 border-gray-200" 
                      : isExpired 
                      ? "border-l-4 border-l-gray-500 border-gray-200" 
                      : isExpiringSoon 
                      ? "border-l-4 border-l-yellow-500 border-gray-200" 
                      : "border-gray-200"
                  }`}
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
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => handleSelectStockEntry(entry.id.toString())} 
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                            aria-label={`Select ${material?.name || "stock entry"}`} 
                            onClick={e => e.stopPropagation()} 
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-base text-gray-900">{material?.name || "Unknown Material"}</h3>
                        <p className="text-sm text-gray-600 mt-1">{isVirtual ? "VIRTUAL" : entry.supplier}</p>
                      </div>
                    </div>
                    {renderUnitTypeBadges(material)}
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
                              onClick={(e) => {
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
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                                  onClick={(e) => e.stopPropagation()}
                                >
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
                            <AlertDialogAction 
                              onClick={() => handleDeleteStockEntry(entry.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePOSVisibility(entry);
                              }} 
                              className={`h-8 w-8 p-0 ${entry.isPOSItem ? "bg-teal-600 hover:bg-teal-700 text-white" : "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"}`}
                            >
                              {entry.isPOSItem ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{entry.isPOSItem ? "Hide from POS" : "Show in POS"}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => {
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
                                <TableCell className="w-12 px-6 py-4">
                                  <input type="checkbox" checked={selectedStockEntries.has(entry.id.toString())} onChange={() => handleSelectStockEntry(entry.id.toString())} className="h-4 w-4" aria-label={`Select ${entry.material?.name || "stock entry"}`} onClick={e => e.stopPropagation()} />
                                </TableCell>
                              )}
                              <TableCell className="w-[20%] px-6 py-4 font-medium text-gray-900">
                                <div className="flex items-center gap-2">
                                  {isNegative && <AlertTriangle className="h-4 w-4 text-red-600" />}
                                  {entry.material?.name ? highlightText(entry.material.name, searchTerm) : `Unknown Material (ID: ${entry.materialId})`}
                                </div>
                              </TableCell>
                              <TableCell className="w-[15%] px-4 py-4 text-gray-700">
                                <div className="flex items-center gap-2">
                                  <span className={isVirtual ? "text-red-600 font-medium" : ""}>{isVirtual ? "VIRTUAL" : highlightText(entry.supplier || "", searchTerm)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="w-[12%] px-4 py-4 text-gray-700">{renderQuantityDisplay(entry)}</TableCell>
                              <TableCell className="w-[10%] px-4 py-4 text-gray-700">{renderUnitDisplay(entry)}</TableCell>
                              <TableCell className="w-[10%] px-4 py-4 text-gray-700">
                                <div className="space-y-1">
                                  <div>{formatCurrency(entry.costPerPurchasedUnit)}</div>
                                  {entry.material?.unitType === "package" && <div className="text-xs text-muted-foreground">(per {entry.purchasedUnit})</div>}
                                </div>
                              </TableCell>
                              <TableCell className="w-[10%] px-4 py-4 text-gray-700 font-medium">{formatCurrency(entry.totalCost)}</TableCell>
                              <TableCell className="w-[10%] px-4 py-4 text-gray-700">{new Date(entry.purchaseDate).toLocaleDateString()}</TableCell>
                              <TableCell className="w-[13%] px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant={entry.isPOSItem ? "default" : "outline"}
                                        size="sm"
                                        onClick={e => {
                                          e.stopPropagation();
                                          handleTogglePOSVisibility(entry);
                                        }}
                                        className={`h-8 w-8 p-0 ${entry.isPOSItem ? "bg-teal-600 hover:bg-teal-700 text-white" : "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"}`}
                                      >
                                        {entry.isPOSItem ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{entry.isPOSItem ? "Hide from POS" : "Show in POS"}</p>
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
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                                          >
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
                                          {isNegative && (
                                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                                              <strong>Warning:</strong> This entry has negative stock quantities.
                                            </div>
                                          )}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteStockEntry(entry.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
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

          {/* Negative Stock Report Dialog */}
          <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
            <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Negative Stock Report
                </DialogTitle>
                <DialogDescription>
                  Items with negative stock quantities that need attention
                </DialogDescription>
              </DialogHeader>
              
              {negativeStockReport && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-600">
                        {negativeStockReport.totalNegativeEntries || 0}
                      </div>
                      <div className="text-sm text-red-700">Items with Negative Stock</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-600">
                        {negativeStockReport.summary?.totalVirtualEntries || 0}
                      </div>
                      <div className="text-sm text-orange-700">Virtual Entries</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {negativeStockReport.generatedAt ? new Date(negativeStockReport.generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                      </div>
                      <div className="text-sm text-blue-700">Report Date</div>
                    </div>
                  </div>

                  {/* Negative Items Table */}
                  {negativeStockReport.negativeStockItems && negativeStockReport.negativeStockItems.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Negative Stock Items</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead>Material</TableHead>
                              <TableHead>Supplier</TableHead>
                              <TableHead>Individual Quantity</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead>Purchased Quantity</TableHead>
                              <TableHead>Purchased Unit</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Last Updated</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {negativeStockReport.negativeStockItems.map((item, index) => (
                              <TableRow key={index} className="border-b">
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {item.isVirtualEntry && <AlertTriangle className="h-4 w-4 text-red-600" />}
                                    {item.materialName}
                                    {item.isVirtualEntry && (
                                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                        VIRTUAL
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className={item.isVirtualEntry ? "text-red-600 font-medium" : ""}>
                                  {item.supplier}
                                </TableCell>
                                <TableCell className="text-red-600 font-medium flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  {formatNumber(item.purchasedIndividualQuantity)}
                                </TableCell>
                                <TableCell>{item.purchasedIndividualUnit}</TableCell>
                                <TableCell className="text-red-600 font-medium">
                                  {formatNumber(item.purchasedQuantity)}
                                </TableCell>
                                <TableCell>{item.purchasedUnit}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {item.category}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  {negativeStockReport.message && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Report Summary</h3>
                      <p className="text-blue-800">{negativeStockReport.message}</p>
                    </div>
                  )}

                  {/* Category Summary */}
                  {negativeStockReport.summary?.categorySummary && Object.keys(negativeStockReport.summary.categorySummary).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Negative Stock by Category</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(negativeStockReport.summary.categorySummary).map(([category, count]) => (
                          <div key={category} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="text-lg font-bold text-gray-900">{count}</div>
                            <div className="text-sm text-gray-600 capitalize">{category}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

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
                  onAddToSpecificEntry={handleAddToSpecificEntryOperation}
                  onWasteFromSpecificEntry={handleWasteFromSpecificEntryOperation}
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleAddStock} 
                className="bg-primary hover:bg-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full h-14 w-14 p-0 group"
                size="lg"
              >
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
