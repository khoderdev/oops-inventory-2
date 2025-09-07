import { DeleteConfirmationModal } from "@/components/dialogs/DeleteConfirmationModal";
import { StockRestorationModal } from "@/components/dialogs/StockRestorationModal";
import { ReceiptPrinter } from "@/components/pos/ReceiptPrinter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalesOperations } from "@/hooks/useSalesOperations";
import { cn } from "@/lib/utils";
import { dateFilterAtom, selectedItemFilterAtom, selectedSectionFilterAtom, uniqueItemNamesAtom, uniqueSectionNamesAtom } from "@/store/salesAtoms";
import { ReceiptData, SaleRecord } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { formatDate } from "@/utils/formatDate";
import { format, isValid } from "date-fns";
import { useAtom, useAtomValue } from "jotai";
import { AlertCircle, CalendarIcon, CheckCircle, CheckSquare, Loader2, Package, Printer, Search, ShoppingBag, ShoppingCart, Square, Trash2, Undo2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo } from "react";
import { salesAPI } from "@/api/sales.api.ts.tsx";

export function SalesHistoryPage({ isOpen }: { isOpen: boolean; onClose: () => void }) {
  const [selectedItem, setSelectedItem] = useAtom(selectedItemFilterAtom);
  const [selectedSection, setSelectedSection] = useAtom(selectedSectionFilterAtom);
  const [dateFilter, setDateFilter] = useAtom(dateFilterAtom);
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [dateTo, setDateTo] = React.useState<Date | undefined>(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  });
  const [dateFromOpen, setDateFromOpen] = React.useState(false);
  const [dateToOpen, setDateToOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"all" | "staff">("all");
  const [staffSales, setStaffSales] = React.useState<typeof sales>([]);
  const [isLoadingStaff, setIsLoadingStaff] = React.useState(false);
  const [staffError, setStaffError] = React.useState<string | null>(null);
  const [selectedItemForDelete, setSelectedItemForDelete] = React.useState<{
    saleId: string;
    itemId: string;
    itemType: "material" | "menu";
    itemName: string;
  } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const start = new Date(today);
      start.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);

      setDateFrom(start);
      setDateTo(end);
    }
  }, [isOpen]);

  const {
    sales,
    error,
    isDeleting,
    isReverting,
    revertSuccess,
    deleteSuccess,
    isBulkDeleting,
    isBulkReverting,
    revertDialogOpen,
    deleteDialogOpen,
    bulkDeleteSuccess,
    bulkRevertSuccess,
    bulkRevertDialogOpen,
    bulkDeleteDialogOpen,
    selectedSaleForRevert,
    selectedSaleForDelete,
    stockRestorationReport,
    stockRestorationModalOpen,
    bulkStockRestorationReport,
    deleteConfirmationModalOpen,
    fetchSales,
    revertSale,
    softDeleteSale,
    deleteSaleItem,
    setDeleteSuccess,
    bulkDeleteSales,
    bulkRevertSales,
    setRevertDialogOpen,
    setDeleteDialogOpen,
    setBulkRevertDialogOpen,
    setBulkDeleteDialogOpen,
    setSelectedSaleForRevert,
    setSelectedSaleForDelete,
    setStockRestorationModalOpen,
    setDeleteConfirmationModalOpen
  } = useSalesOperations();

  const [selectedItemIds, setSelectedItemIds] = React.useState<Set<string>>(new Set());
  const [isPrintingReport, setIsPrintingReport] = React.useState(false);
  const [showSalesReportDialog, setShowSalesReportDialog] = React.useState(false);
  const [salesReportData, setSalesReportData] = React.useState<ReceiptData | null>(null);
  const currentSales = viewMode === "staff" ? staffSales : sales;
  const uniqueItemNames = useAtomValue(uniqueItemNamesAtom);
  const uniqueSectionNames = useAtomValue(uniqueSectionNamesAtom);

  const fetchStaffSales = useCallback(async () => {
    try {
      setIsLoadingStaff(true);
      setStaffError(null);
      const res = await salesAPI.getStaffSales();
      setStaffSales(res?.data || []);
    } catch (e: any) {
      setStaffError(e?.message || "Failed to load staff sales");
    } finally {
      setIsLoadingStaff(false);
    }
  }, []);

  const localFilteredSales = useMemo(() => {
    return currentSales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      const matchesDate = (!dateFrom || saleDate >= dateFrom) && (!dateTo || saleDate <= dateTo);
      const matchesSection = !selectedSection || selectedSection === "all" || sale.section?.name === selectedSection;
      const matchesItem = !selectedItem || selectedItem === "all" || sale.items?.some(item => item.materialName === selectedItem) || sale.menuItems?.some(menuItem => menuItem.menuItemName === selectedItem);
      return matchesDate && matchesSection && matchesItem;
    });
  }, [currentSales, selectedItem, selectedSection, dateFrom, dateTo]);

  const groupedSales = useMemo(() => {
    return localFilteredSales
      .map(sale => {
        const allItems = [
          ...(sale.items || []).map(item => ({
            ...item,
            itemType: "material" as const
          })),
          ...(sale.menuItems || []).map(item => ({
            ...item,
            itemType: "menu" as const,
            itemName: item.menuItemName,
            totalPrice: parseFloat(item.totalPrice.toString())
          }))
        ];

        return {
          saleId: sale.id.toString(),
          items: allItems,
          saleDate: new Date(sale.saleDate),
          total: parseFloat(sale.totalAmount.toString()),
          orderNumber: sale.orderNumber,
          section: sale.section
        };
      })
      .sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());
  }, [localFilteredSales]);



  const filteredTotal = useMemo(() => {
    return groupedSales.reduce((sum, sale) => sum + sale.total, 0);
  }, [groupedSales]);

  const handlePrintSalesReport = useCallback(async () => {
    if (groupedSales.length === 0) return;
    setIsPrintingReport(true);
    try {
      const dateRangeText =
        dateFrom && dateTo
          ? (() => {
              const fromDateStr = format(dateFrom, "yyyy-MM-dd");
              const toDateStr = format(dateTo, "yyyy-MM-dd");
              return fromDateStr === toDateStr ? format(dateFrom, "MMM d, yyyy") : `${format(dateFrom, "MMM d")} - ${format(dateTo, "MMM d, yyyy")}`;
            })()
          : dateFilter
            ? formatDate(new Date(dateFilter))
            : "All Time";

      const filterText = [selectedItem !== "all" ? `Item: ${selectedItem}` : null, selectedSection !== "all" ? `Section: ${selectedSection}` : null].filter(Boolean).join(", ");
      const reportItems: ReceiptData["items"] = [];

      groupedSales.forEach(sale => {
        const saleDate = format(sale.saleDate, "hh:mm a");
        const orderNumber = sale.orderNumber || `ORD-${sale.saleId.toString().padStart(4, "0")}`;
        reportItems.push({
          name: `${orderNumber} (${saleDate})`,
          quantity: sale.items.length,
          unitPrice: sale.total / sale.items.length,
          totalPrice: sale.total,
          type: "material"
        });
      });

      const salesReport: ReceiptData = {
        id: `SALES-REPORT-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        cashier: "",
        items: reportItems,
        subtotal: filteredTotal,
        tax: 0,
        total: filteredTotal,
        paymentAmount: filteredTotal,
        change: 0,
        paymentMethod: `SALES SUMMARY: ${groupedSales.length} transactions, ${localFilteredSales.length} items sold | Period: ${dateRangeText}${filterText ? ` | Filters: ${filterText}` : ""}`
      };
      setSalesReportData(salesReport);
      setShowSalesReportDialog(true);
    } catch (error) {
      console.error("Error generating sales report:", error);
    } finally {
      setIsPrintingReport(false);
    }
  }, [groupedSales, localFilteredSales, filteredTotal, dateFrom, dateTo, selectedItem, selectedSection, dateFilter]);

  const toggleItemSelection = useCallback(
    (itemId: string) => {
      setSelectedItemIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    },
    [setSelectedItemIds]
  );

  const clearSelection = useCallback(() => {
    setSelectedItemIds(new Set());
  }, [setSelectedItemIds]);

  const handleRevertSale = useCallback(
    (saleId: string) => {
      const sale = currentSales.find(s => s.id.toString() === saleId);
      if (sale) {
        setSelectedSaleForRevert(sale);
        setRevertDialogOpen(true);
      }
    },
    [currentSales, setSelectedSaleForRevert, setRevertDialogOpen]
  );

  const handleSoftDeleteSale = useCallback(
    (saleId: string, itemId?: string, itemType?: "material" | "menu", itemName?: string) => {
      const sale = currentSales.find(s => s.id.toString() === saleId);
      if (!sale) return;
      if (itemId && itemType) {
        setSelectedItemForDelete({ saleId, itemId, itemType, itemName: itemName || "this item" });
        setDeleteConfirmationModalOpen(true);
      } else {
        setSelectedSaleForDelete(sale);
        setDeleteConfirmationModalOpen(true);
      }
    },
    [currentSales, setSelectedSaleForDelete, setDeleteDialogOpen]
  );

  const handleBulkRevert = useCallback(() => {
    setBulkRevertDialogOpen(true);
  }, [setBulkRevertDialogOpen]);

  const handleBulkDelete = useCallback(() => {
    setBulkDeleteDialogOpen(true);
  }, [setBulkDeleteDialogOpen]);

  const cancelRevert = useCallback(() => {
    setRevertDialogOpen(false);
    setSelectedSaleForRevert(null);
  }, [setRevertDialogOpen, setSelectedSaleForRevert]);


  const handleDeleteItem = useCallback(
    (item: { saleId: string; itemId: string; itemType: "material" | "menu" }) => {
      const sale = sales.find(s => s.id.toString() === item.saleId);
      if (sale) {
        setSelectedSaleForDelete(sale);
        setSelectedItemForDelete({
          saleId: item.saleId,
          itemId: item.itemId,
          itemType: item.itemType,
          itemName: item.itemType === "material" ? sale.items?.find(i => i.materialId === item.itemId)?.materialName || `Item ${item.itemId}` : sale.menuItems?.find(i => i.menuItemId === item.itemId)?.menuItemName || `Menu Item ${item.itemId}`
        });
        setDeleteConfirmationModalOpen(true);
      }
    },
    [sales, setSelectedSaleForDelete, setSelectedItemForDelete, setDeleteConfirmationModalOpen]
  );

  const cancelBulkRevert = useCallback(() => {
    setBulkRevertDialogOpen(false);
  }, [setBulkRevertDialogOpen]);

  const cancelBulkDelete = useCallback(() => {
    setBulkDeleteDialogOpen(false);
  }, [setBulkDeleteDialogOpen]);

  const confirmRevertSale = useCallback(async () => {
    if (selectedSaleForRevert) {
      await revertSale(selectedSaleForRevert);
      setRevertDialogOpen(false);
      setSelectedSaleForRevert(null);
    }
  }, [selectedSaleForRevert, revertSale, setRevertDialogOpen, setSelectedSaleForRevert]);

  const confirmSoftDeleteSale = useCallback(async () => {
    try {
      if (selectedItemForDelete) {
        const { saleId, itemId, itemType } = selectedItemForDelete;
        await deleteSaleItem(saleId, itemId, itemType);
        setDeleteSuccess(`Item successfully deleted from sale #${saleId}`);
        setTimeout(() => setDeleteSuccess(null), 3000);
      } else if (selectedSaleForDelete) {
        await softDeleteSale(selectedSaleForDelete);
      }
      setDeleteDialogOpen(false);
      setSelectedSaleForDelete(null);
      setSelectedItemForDelete(null);
    } catch (error) {
      console.error("Error during deletion:", error);
    }
  }, [selectedSaleForDelete, selectedItemForDelete, softDeleteSale, deleteSaleItem, setDeleteDialogOpen, setSelectedSaleForDelete]);

  const confirmBulkRevert = useCallback(async () => {
    if (bulkRevertSales && setBulkRevertDialogOpen) {
      const selectedSaleIds = new Set(
        Array.from(selectedItemIds)
          .map(itemId => localFilteredSales.find(item => item.id === itemId)?.id)
          .filter(Boolean) as string[]
      );
      await bulkRevertSales(selectedSaleIds);
      setBulkRevertDialogOpen(false);
      clearSelection();
    }
  }, [bulkRevertSales, selectedItemIds, localFilteredSales, setBulkRevertDialogOpen, clearSelection]);

  const confirmBulkDelete = useCallback(async () => {
    if (bulkDeleteSales && setBulkDeleteDialogOpen) {
      const selectedSaleIds = new Set(
        Array.from(selectedItemIds)
          .map(itemId => localFilteredSales.find(item => item.id === itemId)?.id)
          .filter(Boolean) as string[]
      );
      await bulkDeleteSales(selectedSaleIds);
      setBulkDeleteDialogOpen(false);
      clearSelection();
    }
  }, [bulkDeleteSales, selectedItemIds, localFilteredSales, setBulkDeleteDialogOpen, clearSelection]);

  useEffect(() => {
    if (viewMode === "all") {
      fetchSales();
    } else {
      fetchStaffSales();
    }
  }, [viewMode, fetchSales, fetchStaffSales]);

  const errorToShow = viewMode === "staff" ? staffError : error;

  return (
    <div className="md:px-6">
      <div className="sticky top-0 flex items-center justify-between p-2 bg-gray-50">
        <h1 className="text-3xl font-bold">Sales History</h1>

        <div className="flex items-center gap-2 justify-center">
          <Button variant={viewMode === "all" ? "default" : "outline"} onClick={() => setViewMode("all")}>
            All Sales
          </Button>
          <Button variant={viewMode === "staff" ? "default" : "outline"} onClick={() => setViewMode("staff")}>
            Staff Sales
          </Button>
        </div>
        <div></div>
      </div>

      <div className="h-full p-4">
        {errorToShow && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorToShow}</AlertDescription>
          </Alert>
        )}

        {revertSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {revertSuccess}
              {stockRestorationReport.length > 0 && (
                <div className="mt-2">
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium">View Stock Restoration Details</summary>
                    <div className="mt-2 space-y-1">
                      {stockRestorationReport.map((item, index) => (
                        <div key={index} className="text-xs bg-green-100 p-2 rounded">
                          <strong>{item.materialName}</strong>: {item.quantityRestored} {item.unit} restored
                          {item.type === "individual_item" && (
                            <span>
                              {" "}
                              (Assignment: {item.oldAssignmentQuantity} → {item.newAssignmentQuantity})
                            </span>
                          )}
                          <span>
                            {" "}
                            (Stock: {item.oldStockQuantity} → {item.newStockQuantity})
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {deleteSuccess && (
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">{deleteSuccess}</AlertDescription>
          </Alert>
        )}

        {bulkDeleteSuccess && (
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">{bulkDeleteSuccess}</AlertDescription>
          </Alert>
        )}

        {bulkRevertSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {bulkRevertSuccess}
              {bulkStockRestorationReport.length > 0 && (
                <div className="mt-2">
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium">View Bulk Stock Restoration Details</summary>
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {bulkStockRestorationReport.map((item, index) => (
                        <div key={index} className="text-xs bg-green-100 p-2 rounded">
                          <strong>{item.materialName}</strong>: {item.quantityRestored} {item.unit} restored
                          {item.type === "individual_item" && (
                            <span>
                              {" "}
                              (Assignment: {item.oldAssignmentQuantity} → {item.newAssignmentQuantity})
                            </span>
                          )}
                          <span>
                            {" "}
                            (Stock: {item.oldStockQuantity} → {item.newStockQuantity})
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Sticky filters - moved outside CardContent */}
        <div className="sticky top-14 z-10 flex flex-col gap-4 bg-white p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Select Item</label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select an item to filter by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  {uniqueItemNames.map(itemName => (
                    <SelectItem key={itemName} value={itemName}>
                      {itemName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium">Select Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select a section to filter by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {uniqueSectionNames.map(sectionName => (
                    <SelectItem key={sectionName} value={sectionName}>
                      {sectionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">From Date</Label>
                <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                  <PopoverTrigger className="bg-white" asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={date => {
                        if (isValid(date)) {
                          setDateFrom(date);
                        }
                        setDateFromOpen(false);
                      }}
                      initialFocus
                      disabled={date => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex-1">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">To Date</Label>
                <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                  <PopoverTrigger className="bg-white" asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={date => {
                        if (isValid(date)) {
                          setDateTo(date);
                        }
                        setDateToOpen(false);
                      }}
                      initialFocus
                      disabled={date => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {selectedItem !== "all" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  Item: {selectedItem}
                  <button onClick={() => setSelectedItem("all")} className="ml-2 text-blue-600 hover:text-blue-800">
                    ×
                  </button>
                </Badge>
              )}
              {selectedSection !== "all" && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  Section: {selectedSection}
                  <button onClick={() => setSelectedSection("all")} className="ml-2 text-green-600 hover:text-green-800">
                    ×
                  </button>
                </Badge>
              )}

              {dateFilter && !dateFrom && !dateTo && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                  Date: {formatDate(new Date(dateFilter))}
                  <button onClick={() => setDateFilter("")} className="ml-2 text-purple-600 hover:text-purple-800">
                    ×
                  </button>
                </Badge>
              )}

              {/* Active filters */}
              {(selectedItem !== "all" || selectedSection !== "all" || dateFrom || dateTo || dateFilter) && (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedItem !== "all" && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 font-bold">
                      Item: {selectedItem}
                    </Badge>
                  )}
                  {selectedSection !== "all" && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 font-bold">
                      Section: {selectedSection}
                    </Badge>
                  )}
                  {dateFrom && dateTo && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 font-bold">
                      {format(dateFrom, "MMM d, yyyy")} → {format(dateTo, "MMM d, yyyy")}
                    </Badge>
                  )}
                  {dateFilter && !dateFrom && !dateTo && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 font-bold">
                      {formatDate(new Date(dateFilter))}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 ml-auto">
              <Button
                variant={(() => {
                  if (!dateFrom || !dateTo) return "outline";
                  const today = new Date();
                  const todayStart = new Date(today);
                  todayStart.setHours(0, 0, 0, 0);
                  const todayEnd = new Date(today);
                  todayEnd.setHours(23, 59, 59, 999);

                  const isToday = dateFrom.getTime() === todayStart.getTime() && dateTo.getTime() === todayEnd.getTime();
                  return isToday ? "default" : "outline";
                })()}
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const todayStart = new Date(today);
                  todayStart.setHours(0, 0, 0, 0);
                  const todayEnd = new Date(today);
                  todayEnd.setHours(23, 59, 59, 999);
                  setDateFrom(todayStart);
                  setDateTo(todayEnd);
                  setDateFilter("");
                }}
                className="transition-all duration-200"
              >
                📅 Today
              </Button>

              <Button
                variant={(() => {
                  if (!dateFrom || !dateTo) return "outline";
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  const yesterdayStart = new Date(yesterday);
                  yesterdayStart.setHours(0, 0, 0, 0);
                  const yesterdayEnd = new Date(yesterday);
                  yesterdayEnd.setHours(23, 59, 59, 999);

                  const isYesterday = dateFrom.getTime() === yesterdayStart.getTime() && dateTo.getTime() === yesterdayEnd.getTime();
                  return isYesterday ? "default" : "outline";
                })()}
                size="sm"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  const yesterdayStart = new Date(yesterday);
                  yesterdayStart.setHours(0, 0, 0, 0);
                  const yesterdayEnd = new Date(yesterday);
                  yesterdayEnd.setHours(23, 59, 59, 999);
                  setDateFrom(yesterdayStart);
                  setDateTo(yesterdayEnd);
                  setDateFilter("");
                }}
                className="transition-all duration-200"
              >
                📅 Yesterday
              </Button>

              <Button
                variant={(() => {
                  if (!dateFrom || !dateTo) return "outline";
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay());
                  startOfWeek.setHours(0, 0, 0, 0);
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  endOfWeek.setHours(23, 59, 59, 999);

                  const isThisWeek = dateFrom.getTime() === startOfWeek.getTime() && dateTo.getTime() === endOfWeek.getTime();
                  return isThisWeek ? "default" : "outline";
                })()}
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay());
                  startOfWeek.setHours(0, 0, 0, 0);
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  endOfWeek.setHours(23, 59, 59, 999);
                  setDateFrom(startOfWeek);
                  setDateTo(endOfWeek);
                  setDateFilter("");
                }}
                className="transition-all duration-200"
              >
                📅 This Week
              </Button>

              {(selectedItem !== "all" || selectedSection !== "all" || dateFilter || dateFrom || dateTo) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedItem("all");
                    setSelectedSection("all");
                    setDateFilter("");
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-all duration-200"
                >
                  🗑️ Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        <Card className="h-[calc(100vh-150px)] overflow-y-auto !bg-white !ring-0 !border-none !shadow-none !rounded-lg my-4 mb-12">
          <CardHeader className="sticky top-0 z-10 px-4 bg-white">
            <div className="flex justify-between gap-3">
              {/* Results summary */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <p className="">
                  <span className="font-medium">{groupedSales.length}</span> sales
                  <span className="mx-1">|</span>
                  <span className="font-medium">{localFilteredSales.length}</span> items
                  <span className="mx-1">|</span>
                  <span className="font-medium text-green-600">{formatCurrency(filteredTotal)}</span> total
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedItemIds.size > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {selectedItemIds.size} item{selectedItemIds.size === 1 ? "" : "s"} selected
                    </span>
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      Cancel
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleBulkRevert} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      <Undo2 className="mr-2 h-4 w-4" />
                      Revert Selected ({selectedItemIds.size})
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected ({selectedItemIds.size})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {groupedSales.length > 0 ? (
              <Accordion type="single" collapsible>
                {groupedSales.map(group => (
                  <AccordionItem key={group.saleId} value={group.saleId}>
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1">{group.orderNumber && <span className="font-bold">{group.orderNumber}</span>}</div>
                        <span className="font-bold">{formatCurrency(group.total)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 bg-background">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.items.map((item, index) => {
                            const itemId = item.itemType === "material" ? item.materialId : item.menuItemId;
                            const itemName = item.itemType === "material" ? item.materialName : item.menuItemName;

                            return (
                              <Card key={`${item.itemType}-${itemId}-${index}`} className={`p-4 ${selectedItemIds.has(itemId) ? "bg-blue-50 border-blue-200" : ""}`}>
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="sm" onClick={() => toggleItemSelection(itemId)} className="h-8 w-8 p-0">
                                        {selectedItemIds.has(itemId) ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                                      </Button>
                                      <div className="flex items-center gap-2">
                                        {item.itemType === "material" ? <Package className="h-4 w-4 text-blue-500" /> : <ShoppingBag className="h-4 w-4 text-green-500" />}
                                        <span className="text-xl font-bold">{itemName}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Date:</span>
                                      <span className="block font-medium">{formatDate(group.saleDate)}</span>
                                      <span className="text-xs text-muted-foreground">{group.saleDate ? new Date(group.saleDate).toLocaleTimeString() : "N/A"}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Quantity:</span>
                                      <span className="block font-medium">{item.quantity}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Unit Price:</span>
                                      <span className="block font-medium">{formatCurrency(item.unitPrice)}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Total:</span>
                                      <span className="block font-bold text-green-600">{formatCurrency(item.totalPrice)}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <Button variant="outline" size="sm" onClick={() => handleRevertSale(group.saleId)} className="flex-1" title="Revert Sale">
                                      <Undo2 className="mr-2 h-4 w-4" />
                                      Revert
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (item.itemType === "material") {
                                          handleSoftDeleteSale(group.saleId, item.materialId, "material");
                                        } else {
                                          handleSoftDeleteSale(group.saleId, item.menuItemId, "menu");
                                        }
                                      }}
                                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Delete Item"
                                      disabled={isDeleting}
                                    >
                                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                      Delete Item
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                {currentSales.length === 0 ? (
                  <>
                    <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No item sales recorded yet</p>
                    <p className="text-sm text-muted-foreground">Item sales will appear here after transactions are completed</p>
                  </>
                ) : (
                  <>
                    <Search className="h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No item sales match your filters</p>
                    <p className="text-sm text-muted-foreground">Try selecting a different item or adjusting the date filter</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
          <DialogContent className="p-0 sm:max-w-xl max-h-[90vh] flex flex-col">
            <div className="flex max-h-[90vh] flex-col">
              <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                <DialogTitle>Revert Sale</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                <p>Are you sure you want to revert sale #{selectedSaleForRevert?.id}?</p>
                <div>
                  <strong>This action will:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Permanently delete the sale record</li>
                    <li>Restore all sold items back to inventory</li>
                    <li>Restore ingredient quantities for menu items</li>
                    <li>Update stock levels accordingly</li>
                  </ul>
                </div>
                <p className="text-destructive font-medium">This action cannot be undone.</p>
              </div>
              <DialogFooter className="sticky bottom-0 z-10 bg-background border-t px-6 py-4">
                <Button variant="outline" onClick={cancelRevert} disabled={isReverting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmRevertSale} disabled={isReverting}>
                  {isReverting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reverting...{" "}
                    </>
                  ) : (
                    <>
                      <Undo2 className="mr-2 h-4 w-4" /> Revert Sale{" "}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="p-0 sm:max-w-xl">
            <div className="flex max-h-[80vh] flex-col">
              <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                <DialogTitle>Delete Sale</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                <p>Are you sure you want to Delete Sale #{selectedSaleForDelete?.id}?</p>
                <div>
                  <strong>This action will:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Delete the sale from the sales history view</li>
                    <li>Preserve the sale record in the database</li>
                    <li>Keep all stock levels unchanged</li>
                    <li>Allow the sale to be restored later if needed</li>
                  </ul>
                </div>
                <p className="text-blue-600 font-medium">This is a "soft delete" - the sale data is preserved but hidden from view.</p>
              </div>
              <DialogFooter className="sticky bottom-0 z-10 bg-background border-t px-6 py-4">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmSoftDeleteSale} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <DialogContent className="p-0 sm:max-w-xl">
            <div className="flex max-h-[80vh] flex-col">
              <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                <DialogTitle>Delete Selected Sales</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                <p>
                  Are you sure you want to delete {selectedItemIds.size} selected item{selectedItemIds.size === 1 ? "" : "s"} from{" "}
                  {
                    new Set(
                      Array.from(selectedItemIds)
                        .map(itemId => localFilteredSales.find(item => item.id === itemId)?.id)
                        .filter(Boolean)
                    ).size
                  }
                  sale
                  {new Set(
                    Array.from(selectedItemIds)
                      .map(itemId => localFilteredSales.find(item => item.id === itemId)?.id)
                      .filter(Boolean)
                  ).size === 1
                    ? ""
                    : "s"}
                  ?
                </p>
                <div>
                  <strong>This action will:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Hide the selected items from the sales history view</li>
                    <li>Preserve all sale records in the database</li>
                    <li>Keep all stock levels unchanged</li>
                    <li>Allow the sales to be restored later if needed</li>
                  </ul>
                </div>
                {(selectedItem !== "all" || selectedSection !== "all" || dateFilter || dateFrom || dateTo) && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> You are deleting sales based on current filters:
                      {selectedItem !== "all" && <span className="block">• Item: {selectedItem}</span>}
                      {selectedSection !== "all" && <span className="block">• Section: {selectedSection}</span>}
                      {dateFrom &&
                        dateTo &&
                        (() => {
                          const fromDateStr = format(dateFrom, "yyyy-MM-dd");
                          const toDateStr = format(dateTo, "yyyy-MM-dd");
                          return <span className="block">• {fromDateStr === toDateStr ? `Date: ${format(dateFrom, "MMM d, yyyy")}` : `Date Range: ${format(dateFrom, "MMM d, yyyy")} to ${format(dateTo, "MMM d, yyyy")}`}</span>;
                        })()}
                      {dateFilter && !dateFrom && !dateTo && <span className="block">• Date: {formatDate(new Date(dateFilter))}</span>}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter className="sticky bottom-0 z-10 bg-background border-t px-6 py-4">
                <Button variant="outline" onClick={cancelBulkDelete} disabled={isBulkDeleting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmBulkDelete} disabled={isBulkDeleting}>
                  {isBulkDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting {selectedItemIds.size} Items...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete {selectedItemIds.size} Items
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={bulkRevertDialogOpen} onOpenChange={setBulkRevertDialogOpen}>
          <DialogContent className="p-0 sm:max-w-xl">
            <div className="flex max-h-[80vh] flex-col">
              <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                <DialogTitle>Revert Selected Sales</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                <p>
                  Are you sure you want to revert {selectedItemIds.size} selected item{selectedItemIds.size === 1 ? "" : "s"} from{" "}
                  {
                    new Set(
                      Array.from(selectedItemIds)
                        .map(itemId => localFilteredSales.find(item => item.id === itemId)?.id)
                        .filter(Boolean)
                    ).size
                  }{" "}
                  sale
                  {new Set(
                    Array.from(selectedItemIds)
                      .map(itemId => localFilteredSales.find(item => item.id === itemId)?.id)
                      .filter(Boolean)
                  ).size === 1
                    ? ""
                    : "s"}
                  ?
                </p>
                <div>
                  <strong>This action will:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>
                      Permanently delete the affected sale record
                      {new Set(
                        Array.from(selectedItemIds)
                          .map(itemId => localFilteredSales.find(item => item.id === itemId)?.id)
                          .filter(Boolean)
                      ).size === 1
                        ? ""
                        : "s"}
                    </li>
                    <li>Restore all sold items back to inventory</li>
                    <li>Restore ingredient quantities for menu items</li>
                    <li>Update stock levels accordingly</li>
                  </ul>
                </div>
                <p className="text-destructive font-medium">This action cannot be undone.</p>
                {(selectedItem !== "all" || selectedSection !== "all" || dateFilter || dateFrom || dateTo) && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> You are reverting sales based on current filters:
                      {selectedItem !== "all" && <span className="block">• Item: {selectedItem}</span>}
                      {selectedSection !== "all" && <span className="block">• Section: {selectedSection}</span>}
                      {dateFrom &&
                        dateTo &&
                        (() => {
                          const fromDateStr = format(dateFrom, "yyyy-MM-dd");
                          const toDateStr = format(dateTo, "yyyy-MM-dd");
                          return <span className="block">• {fromDateStr === toDateStr ? `Date: ${format(dateFrom, "MMM d, yyyy")}` : `Date Range: ${format(dateFrom, "MMM d, yyyy")} to ${format(dateTo, "MMM d, yyyy")}`}</span>;
                        })()}
                      {dateFilter && !dateFrom && !dateTo && <span className="block">• Date: {formatDate(new Date(dateFilter))}</span>}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter className="sticky bottom-0 z-10 bg-background border-t px-6 py-4">
                <Button variant="outline" onClick={cancelBulkRevert} disabled={isBulkReverting}>
                  Cancel
                </Button>
                <Button className="text-orange-600" variant="outline" onClick={confirmBulkRevert} disabled={isBulkReverting}>
                  {isBulkReverting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reverting {selectedItemIds.size} Items...
                    </>
                  ) : (
                    <>
                      <Undo2 className="mr-2 h-4 w-4" />
                      Revert {selectedItemIds.size} Items
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stock Restoration Modal */}
        <StockRestorationModal open={stockRestorationModalOpen} onOpenChange={setStockRestorationModalOpen} saleId={selectedSaleForRevert ? String(selectedSaleForRevert.id) : ""} stockRestorationReport={stockRestorationReport} />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          open={deleteConfirmationModalOpen}
          onOpenChange={isOpen => {
            setDeleteConfirmationModalOpen(isOpen);
            if (!isOpen) {
              setSelectedItemForDelete(null);
              setSelectedSaleForDelete(null);
            }
          }}
          onConfirm={async () => {
            if (selectedItemForDelete) {
              // Call deleteSaleItem directly instead of handleDeleteItem
              await deleteSaleItem(
                selectedItemForDelete.saleId,
                selectedItemForDelete.itemId,
                selectedItemForDelete.itemType
              );
            }
            setDeleteConfirmationModalOpen(false);
          }}
          saleRecord={selectedSaleForDelete || (selectedItemForDelete ? sales.find(s => s.id.toString() === selectedItemForDelete.saleId) : null)}
          itemToDelete={selectedItemForDelete}
        />

        {/* Sales Report Printer */}
        <ReceiptPrinter isOpen={showSalesReportDialog} onClose={() => setShowSalesReportDialog(false)} receiptData={salesReportData} autoPrint={false} />

        {/* Footer - only show when used as dialog */}
        {/* {isOpen && onClose && ( */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-100 shadow-lg z-30">
          <div className="px-6 pl-24 py-2">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-500 font-semibold">
                    {groupedSales.length}
                  </Badge>
                  <span className="text-gray-700 font-medium">sale{groupedSales.length !== 1 ? "s" : ""} found</span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-green-600">Total: {formatCurrency(filteredTotal)}</span>
                </div>
                {/* Date range indicator */}
                {dateFrom && dateTo && (
                  <>
                    <div className="h-4 w-px bg-gray-300" />
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {(() => {
                          const fromDateStr = format(dateFrom, "yyyy-MM-dd");
                          const toDateStr = format(dateTo, "yyyy-MM-dd");
                          return fromDateStr === toDateStr ? `${format(dateFrom, "MMM d, yyyy")}` : `${format(dateFrom, "MMM d")} - ${format(dateTo, "MMM d, yyyy")}`;
                        })()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Button onClick={handlePrintSalesReport} disabled={groupedSales.length === 0 || isPrintingReport} className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105">
                  {isPrintingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  <span>{isPrintingReport ? "Generating..." : "Print Report"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
