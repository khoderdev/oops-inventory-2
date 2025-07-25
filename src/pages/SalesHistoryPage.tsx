import { DeleteConfirmationModal } from "@/components/dialogs/DeleteConfirmationModal";
import { StockRestorationModal } from "@/components/dialogs/StockRestorationModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSalesOperations } from "@/hooks/useSalesOperations";
import { dateFilterAtom, selectedItemFilterAtom, selectedSectionFilterAtom, uniqueItemNamesAtom, uniqueSectionNamesAtom } from "@/store/salesAtoms";
import { SaleRecord } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { formatDate } from "@/utils/formatDate";
import { useAtom, useAtomValue } from "jotai";
import { AlertCircle, ArrowRight, Calendar, CheckCircle, CheckSquare, Clock, DollarSign, Loader2, MapPin, Package, Receipt, Search, ShoppingBag, ShoppingCart, Square, Trash2, Undo2 } from "lucide-react";
import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function SalesHistoryPage() {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useAtom(selectedItemFilterAtom);
  const [selectedSection, setSelectedSection] = useAtom(selectedSectionFilterAtom);
  const [dateFilter, setDateFilter] = useAtom(dateFilterAtom);
  const {
    sales,
    isLoading,
    error,
    isReverting,
    isDeleting,
    isBulkReverting,
    isBulkDeleting,
    revertSuccess,
    deleteSuccess,
    bulkRevertSuccess,
    bulkDeleteSuccess,
    stockRestorationReport,
    bulkStockRestorationReport,
    revertDialogOpen,
    deleteDialogOpen,
    bulkRevertDialogOpen,
    bulkDeleteDialogOpen,
    stockRestorationModalOpen,
    deleteConfirmationModalOpen,
    selectedSaleForRevert,
    selectedSaleForDelete,
    setRevertDialogOpen,
    setDeleteDialogOpen,
    setBulkRevertDialogOpen,
    setBulkDeleteDialogOpen,
    setStockRestorationModalOpen,
    setDeleteConfirmationModalOpen,
    setSelectedSaleForRevert,
    setSelectedSaleForDelete,
    fetchSales,
    revertSale,
    softDeleteSale,
    bulkDeleteSales,
    bulkRevertSales
  } = useSalesOperations();

  const [selectedSaleIds, setSelectedSaleIds] = React.useState<Set<string>>(new Set());

  // Group sales by Sale ID with filtering
  const groupedSales = React.useMemo(() => {
    const filteredSales = sales.filter(sale => {
      // Date filter
      if (dateFilter) {
        const saleDate = new Date(sale.saleDate).toISOString().split("T")[0];
        if (saleDate !== dateFilter) return false;
      }

      // Section filter
      if (selectedSection && selectedSection !== "all") {
        const saleSectionName = sale.section?.name || `Section ${sale.sectionId}`;
        if (saleSectionName !== selectedSection) return false;
      }

      // Item filter
      if (selectedItem && selectedItem !== "all") {
        const hasMatchingItem = [...(sale.items || []).map(item => item.materialName || `Item ${item.materialId}`), ...(sale.menuItems || []).map(menuItem => menuItem.menuItemName || `Menu Item ${menuItem.menuItemId}`)].some(itemName => itemName === selectedItem);
        if (!hasMatchingItem) return false;
      }

      return true;
    });

    return filteredSales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }, [sales, selectedItem, selectedSection, dateFilter]);

  // Calculate totals from grouped sales
  const { totalSalesAmount, totalItemsCount, totalSalesCount } = React.useMemo(() => {
    let totalAmount = 0;
    let totalItems = 0;
    const salesCount = groupedSales.length;

    groupedSales.forEach(sale => {
      totalAmount += parseFloat(String(sale.totalAmount || 0));

      // Count individual items
      (sale.items || []).forEach(item => {
        totalItems += parseInt(String(item.quantity || 0));
      });

      // Count menu items
      (sale.menuItems || []).forEach(menuItem => {
        totalItems += parseInt(String(menuItem.quantity || 0));
      });
    });

    return {
      totalSalesAmount: totalAmount,
      totalItemsCount: totalItems,
      totalSalesCount: salesCount
    };
  }, [groupedSales]);

  const uniqueItemNames = useAtomValue(uniqueItemNamesAtom);
  const uniqueSectionNames = useAtomValue(uniqueSectionNamesAtom);

  const allVisibleSalesSelected = React.useMemo(() => {
    return groupedSales.length > 0 && groupedSales.every(sale => selectedSaleIds.has(sale.id.toString()));
  }, [groupedSales, selectedSaleIds]);

  const someVisibleSalesSelected = React.useMemo(() => {
    return groupedSales.some(sale => selectedSaleIds.has(sale.id.toString()));
  }, [groupedSales, selectedSaleIds]);

  const toggleSaleSelection = useCallback((saleId: string) => {
    setSelectedSaleIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(saleId)) {
        newSet.delete(saleId);
      } else {
        newSet.add(saleId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAllSales = useCallback(() => {
    const visibleSaleIds = groupedSales.map(sale => sale.id.toString());
    const allSelected = visibleSaleIds.every(id => selectedSaleIds.has(id));

    if (allSelected) {
      setSelectedSaleIds(new Set());
    } else {
      setSelectedSaleIds(new Set(visibleSaleIds));
    }
  }, [groupedSales, selectedSaleIds]);

  const clearSelection = useCallback(() => {
    setSelectedSaleIds(new Set());
  }, []);

  const handleRevertSale = useCallback(
    (sale: SaleRecord) => {
      setSelectedSaleForRevert(sale);
      setRevertDialogOpen(true);
    },
    [setSelectedSaleForRevert, setRevertDialogOpen]
  );

  const handleSoftDeleteSale = useCallback(
    (sale: SaleRecord) => {
      setSelectedSaleForDelete(sale);
      setDeleteDialogOpen(true);
    },
    [setSelectedSaleForDelete, setDeleteDialogOpen]
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

  const cancelSoftDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedSaleForDelete(null);
  }, [setDeleteDialogOpen, setSelectedSaleForDelete]);

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
    if (selectedSaleForDelete) {
      await softDeleteSale(selectedSaleForDelete);
      setDeleteDialogOpen(false);
      setSelectedSaleForDelete(null);
    }
  }, [selectedSaleForDelete, softDeleteSale, setDeleteDialogOpen, setSelectedSaleForDelete]);

  const confirmBulkRevert = useCallback(async () => {
    if (bulkRevertSales && setBulkRevertDialogOpen) {
      await bulkRevertSales(selectedSaleIds);
      setBulkRevertDialogOpen(false);
      clearSelection();
    }
  }, [bulkRevertSales, selectedSaleIds, setBulkRevertDialogOpen, clearSelection]);

  const confirmBulkDelete = useCallback(async () => {
    if (bulkDeleteSales && setBulkDeleteDialogOpen) {
      await bulkDeleteSales(selectedSaleIds);
      setBulkDeleteDialogOpen(false);
      clearSelection();
    }
  }, [bulkDeleteSales, selectedSaleIds, setBulkDeleteDialogOpen, clearSelection]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading sales history...</span>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="flex items-center w-full justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold">Sales History</h1>
          <p className="text-muted-foreground">View all completed sales</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white">
          Back
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Individual Success Alerts */}
      {revertSuccess && (
        <Alert className="border-green-200 bg-green-50 mb-4">
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
        <Alert className="border-blue-200 bg-blue-50 mb-4">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">{deleteSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Bulk Success Alerts */}
      {bulkDeleteSuccess && (
        <Alert className="border-blue-200 bg-blue-50 mb-4">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">{bulkDeleteSuccess}</AlertDescription>
        </Alert>
      )}

      {bulkRevertSuccess && (
        <Alert className="border-green-200 bg-green-50 mb-4">
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

      {/* Filters */}
      <Card className="rounded-none">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-4 py-2">
          <Card className="py-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">Total Sales</CardTitle>
              <DollarSign className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-1 pb-3">
              <div className="text-lg font-bold">{formatCurrency(totalSalesAmount)}</div>
              <p className="text-[10px] text-muted-foreground">From {totalSalesCount} sales</p>
            </CardContent>
          </Card>

          <Card className="py-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">Sales Count</CardTitle>
              <Receipt className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-1 pb-3">
              <div className="text-lg font-bold">{totalSalesCount}</div>
              <p className="text-[10px] text-muted-foreground">Total transactions</p>
            </CardContent>
          </Card>

          <Card className="py-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">Items Sold</CardTitle>
              <ShoppingBag className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-1 pb-3">
              <div className="text-lg font-bold">{totalItemsCount}</div>
              <p className="text-[10px] text-muted-foreground">Total quantity</p>
            </CardContent>
          </Card>

          <Card className="py-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">Average Sale</CardTitle>
              <Package className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-1 pb-3">
              <div className="text-lg font-bold">{totalSalesCount > 0 ? formatCurrency(totalSalesAmount / totalSalesCount) : formatCurrency(0)}</div>
              <p className="text-[10px] text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex  justify-start items-center gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Item</label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger className="w-full">
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Section</label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-full">
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
            </div>

            <div className="flex items-center gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-auto" />
                </div>
              </div>
              {(selectedItem !== "all" || selectedSection !== "all" || dateFilter) && (
                <div className="mt-8">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedItem("all");
                      setSelectedSection("all");
                      setDateFilter("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Accordion */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Sales History
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {totalSalesCount} sales
                {selectedItem !== "all" && ` for "${selectedItem}"`}
                {selectedSection !== "all" && ` in "${selectedSection}"`}
                {dateFilter && ` on ${formatDate(new Date(dateFilter))}`}
              </p>
            </div>
            {selectedSaleIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedSaleIds.size} sale{selectedSaleIds.size === 1 ? "" : "s"} selected
                </span>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkRevert} className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                  <Undo2 className="h-4 w-4" />
                  Revert Selected ({selectedSaleIds.size})
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selectedSaleIds.size})
                </Button>
              </div>
            )}
          </div>
          {groupedSales.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={toggleSelectAllSales} className="h-8 px-2 text-xs">
                {allVisibleSalesSelected ? (
                  <>
                    <CheckSquare className="h-3 w-3 mr-1" /> Deselect All
                  </>
                ) : someVisibleSalesSelected ? (
                  <>
                    <CheckSquare className="h-3 w-3 mr-1 opacity-50" /> Select All
                  </>
                ) : (
                  <>
                    <Square className="h-3 w-3 mr-1" /> Select All
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {groupedSales.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {groupedSales.map(sale => {
                const saleDate = new Date(sale.saleDate);
                const totalItems = (sale.items?.length || 0) + (sale.menuItems?.length || 0);
                const isSelected = selectedSaleIds.has(sale.id.toString());

                return (
                  <AccordionItem key={sale.id} value={sale.id.toString()} className={`border-l-4 ${isSelected ? "border-l-blue-500 bg-blue-50/30" : "border-l-transparent"}`}>
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              toggleSaleSelection(sale.id.toString());
                            }}
                            className="h-8 w-8 p-0"
                          >
                            {isSelected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                          </Button>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-start">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  #{sale.id}
                                </Badge>
                                <span className="font-semibold text-lg">{formatCurrency(parseFloat(String(sale.totalAmount || 0)))}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(saleDate)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{saleDate.toLocaleTimeString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{sale.section?.name || `Section ${sale.sectionId}`}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ShoppingBag className="h-3 w-3" />
                                  <span>
                                    {totalItems} item{totalItems !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              handleRevertSale(sale);
                            }}
                            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title="Revert Sale"
                          >
                            <Undo2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              handleSoftDeleteSale(sale);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Sale"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <div className="space-y-4">
                        {/* Individual Items */}
                        {sale.items && sale.items.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Individual Items ({sale.items.length})
                            </h4>
                            <div className="grid gap-2">
                              {sale.items.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                  <div className="flex items-center gap-3">
                                    <Package className="h-4 w-4 text-blue-600" />
                                    <div>
                                      <div className="font-medium">{item.materialName || `Item ${item.materialId}`}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="text-center">
                                      <div className="font-medium">{item.quantity}</div>
                                      <div className="text-xs text-muted-foreground">{item.unit || "units"}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-medium">{formatCurrency(parseFloat(String(item.unitPrice || 0)))}</div>
                                      <div className="text-xs text-muted-foreground">per unit</div>
                                    </div>
                                    <div className="text-center min-w-[80px]">
                                      <div className="font-bold text-blue-700">{formatCurrency(parseFloat(String(item.totalPrice || 0)))}</div>
                                      <div className="text-xs text-muted-foreground">total</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Menu Items */}
                        {sale.menuItems && sale.menuItems.length > 0 && (
                          <div>
                            {sale.items && sale.items.length > 0 && <Separator className="my-4" />}
                            <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                              <ShoppingBag className="h-4 w-4" />
                              Menu Items ({sale.menuItems.length})
                            </h4>
                            <div className="grid gap-2">
                              {sale.menuItems.map((menuItem, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg border border-green-100">
                                  <div className="flex items-center gap-3">
                                    <ShoppingBag className="h-4 w-4 text-green-600" />
                                    <div>
                                      <div className="font-medium">{menuItem.menuItemName || `Menu Item ${menuItem.menuItemId}`}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="text-center">
                                      <div className="font-medium">{menuItem.quantity}</div>
                                      <div className="text-xs text-muted-foreground">items</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-medium">{formatCurrency(parseFloat(String(menuItem.unitPrice || 0)))}</div>
                                      <div className="text-xs text-muted-foreground">per item</div>
                                    </div>
                                    <div className="text-center min-w-[80px]">
                                      <div className="font-bold text-green-700">{formatCurrency(parseFloat(String(menuItem.totalPrice || 0)))}</div>
                                      <div className="text-xs text-muted-foreground">total</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="text-center py-12">
              {sales.length === 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground opacity-50" />
                  <div>
                    <p className="text-lg font-medium text-muted-foreground">No sales recorded yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Sales will appear here after transactions are completed</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Search className="h-16 w-16 text-muted-foreground opacity-50" />
                  <div>
                    <p className="text-lg font-medium text-muted-foreground">No sales match your filters</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or selecting different criteria</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revert Confirmation Dialog */}
      <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revert Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to revert sale #{selectedSaleForRevert?.id}?
              <br />
              <br />
              <strong>This action will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Permanently delete the sale record</li>
                <li>Restore all sold items back to inventory</li>
                <li>Restore ingredient quantities for menu items</li>
                <li>Update stock levels accordingly</li>
              </ul>
              <br />
              <span className="text-destructive font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelRevert} disabled={isReverting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRevertSale} disabled={isReverting}>
              {isReverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reverting...
                </>
              ) : (
                <>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Revert Sale
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Soft Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete sale #{selectedSaleForDelete?.id}?
              <br />
              <br />
              <strong>This action will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Delete the sale from the sales history view</li>
                <li>Preserve the sale record in the database</li>
                <li>Keep all stock levels unchanged</li>
                <li>Allow the sale to be restored later if needed</li>
              </ul>
              <br />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelSoftDelete} disabled={isDeleting}>
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
                  Delete Sale
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Sales</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedSaleIds.size} selected sale{selectedSaleIds.size === 1 ? "" : "s"}?
              <br />
              <br />
              <strong>This action will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Delete the selected sales from the sales history view</li>
                <li>Preserve all sale records in the database</li>
                <li>Keep all stock levels unchanged</li>
                <li>Allow the sales to be restored later if needed</li>
              </ul>
              <br />
              {(selectedItem !== "all" || selectedSection !== "all" || dateFilter) && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You are deleting sales based on current filters:
                    {selectedItem !== "all" && <span className="block">• Item: {selectedItem}</span>}
                    {selectedSection !== "all" && <span className="block">• Section: {selectedSection}</span>}
                    {dateFilter && <span className="block">• Date: {formatDate(new Date(dateFilter))}</span>}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelBulkDelete} disabled={isBulkDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting {selectedSaleIds.size} Sales...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedSaleIds.size} Sales
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Revert Confirmation Dialog */}
      <Dialog open={bulkRevertDialogOpen} onOpenChange={setBulkRevertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revert Selected Sales</DialogTitle>
            <DialogDescription>
              Are you sure you want to revert {selectedSaleIds.size} selected sale{selectedSaleIds.size === 1 ? "" : "s"}?
              <br />
              <br />
              <strong>This action will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  Permanently delete the affected sale record
                  {new Set(
                    Array.from(selectedSaleIds)
                      .map(itemId => groupedSales.find(item => item.id === itemId)?.id)
                      .filter(Boolean)
                  ).size === 1
                    ? ""
                    : "s"}
                </li>
                <li>Restore all sold items back to inventory</li>
                <li>Restore ingredient quantities for menu items</li>
                <li>Update stock levels accordingly</li>
              </ul>
              <br />
              <span className="text-destructive font-medium">This action cannot be undone.</span>
              {(selectedItem !== "all" || selectedSection !== "all" || dateFilter) && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You are reverting sales based on current filters:
                    {selectedItem !== "all" && <span className="block">• Item: {selectedItem}</span>}
                    {selectedSection !== "all" && <span className="block">• Section: {selectedSection}</span>}
                    {dateFilter && <span className="block">• Date: {formatDate(new Date(dateFilter))}</span>}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelBulkRevert} disabled={isBulkReverting}>
              Cancel
            </Button>
            <Button className="text-orange-600" variant="outline" onClick={confirmBulkRevert} disabled={isBulkReverting}>
              {isBulkReverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reverting {selectedSaleIds.size} Sales...
                </>
              ) : (
                <>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Revert {selectedSaleIds.size} Sales
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Restoration Modal */}
      <StockRestorationModal open={stockRestorationModalOpen} onOpenChange={setStockRestorationModalOpen} saleId={selectedSaleForRevert?.id?.toString() || ""} stockRestorationReport={stockRestorationReport} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal open={deleteConfirmationModalOpen} onOpenChange={setDeleteConfirmationModalOpen} saleRecord={selectedSaleForDelete} />
    </div>
  );
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useSalesOperations } from "@/hooks/useSalesOperations";
// import { dateFilterAtom, itemSalesAtom, selectedItemFilterAtom, selectedSectionFilterAtom, totalQuantityAtom, totalSalesAtom, uniqueItemNamesAtom, uniqueSectionNamesAtom } from "@/store/salesAtoms";
// import { ItemSale } from "@/types/inventory";
// import { formatCurrency } from "@/utils/conversionLogic";
// import { formatDate } from "@/utils/formatDate";
// import { useAtom, useAtomValue } from "jotai";
// import { AlertCircle, ArrowRight, CheckCircle, CheckSquare, DollarSign, Loader2, Package, Search, ShoppingBag, ShoppingCart, Square, Trash2, Undo2 } from "lucide-react";
// import React, { useCallback, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";

// export function SalesHistoryPage() {
//   const navigate = useNavigate();
//   const [selectedItem, setSelectedItem] = useAtom(selectedItemFilterAtom);
//   const [selectedSection, setSelectedSection] = useAtom(selectedSectionFilterAtom);
//   const [dateFilter, setDateFilter] = useAtom(dateFilterAtom);
//   const {
//     sales,
//     isLoading,
//     error,
//     isReverting,
//     isDeleting,
//     isBulkReverting,
//     isBulkDeleting,
//     revertSuccess,
//     deleteSuccess,
//     bulkRevertSuccess,
//     bulkDeleteSuccess,
//     stockRestorationReport,
//     bulkStockRestorationReport,
//     revertDialogOpen,
//     deleteDialogOpen,
//     bulkRevertDialogOpen,
//     bulkDeleteDialogOpen,
//     selectedSaleForRevert,
//     selectedSaleForDelete,
//     setRevertDialogOpen,
//     setDeleteDialogOpen,
//     setBulkRevertDialogOpen,
//     setBulkDeleteDialogOpen,
//     setSelectedSaleForRevert,
//     setSelectedSaleForDelete,
//     fetchSales,
//     revertSale,
//     softDeleteSale,
//     bulkDeleteSales,
//     bulkRevertSales
//   } = useSalesOperations();

//   const [selectedItemIds, setSelectedItemIds] = React.useState<Set<string>>(new Set());

//   const localFilteredSales = useMemo(() => {
//     const items: ItemSale[] = [];
//     sales.forEach(sale => {
//       sale.items?.forEach((item: any, index: number) => {
//         items.push({
//           id: `${sale.id}-item-${index}`,
//           saleId: sale.id.toString(),
//           saleDate: new Date(sale.saleDate),
//           sectionId: sale.sectionId,
//           sectionName: sale.section?.name,
//           itemName: item.materialName || `Item ${item.materialId}`,
//           itemType: "individual",
//           quantity: item.quantity,
//           unit: item.unit,
//           unitPrice: parseFloat(String(item.unitPrice || 0)),
//           totalPrice: parseFloat(String(item.totalPrice || 0)),
//           materialId: item.materialId
//         });
//       });
//       sale.menuItems?.forEach((menuItem: any, index: number) => {
//         items.push({
//           id: `${sale.id}-menu-${index}`,
//           saleId: sale.id.toString(),
//           saleDate: new Date(sale.saleDate),
//           sectionId: sale.sectionId,
//           sectionName: sale.section?.name,
//           itemName: menuItem.menuItemName || `Menu Item ${menuItem.menuItemId}`,
//           itemType: "menu",
//           quantity: menuItem.quantity,
//           unitPrice: parseFloat(String(menuItem.unitPrice || 0)),
//           totalPrice: parseFloat(String(menuItem.totalPrice || 0)),
//           menuItemId: menuItem.menuItemId
//         });
//       });
//     });

//     let filtered = [...items];
//     if (selectedItem && selectedItem !== "all") {
//       filtered = filtered.filter(item => item.itemName === selectedItem);
//     }
//     if (selectedSection && selectedSection !== "all") {
//       filtered = filtered.filter(item => {
//         const itemSectionName = item.sectionName || `Section ${item.sectionId}`;
//         return itemSectionName === selectedSection;
//       });
//     }
//     if (dateFilter) {
//       filtered = filtered.filter(item => {
//         const itemDate = item.saleDate.toISOString().split("T")[0];
//         return itemDate === dateFilter;
//       });
//     }
//     return filtered.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());
//   }, [sales, selectedItem, selectedSection, dateFilter]);

//   // Group sales by Sale ID for accordion
//   const groupedSales = useMemo(() => {
//     const grouped = new Map<string, ItemSale[]>();
//     localFilteredSales.forEach(item => {
//       if (!grouped.has(item.saleId)) {
//         grouped.set(item.saleId, []);
//       }
//       grouped.get(item.saleId)!.push(item);
//     });
//     return Array.from(grouped.entries()).map(([saleId, items]) => ({
//       saleId,
//       items,
//       saleDate: items[0].saleDate,
//       total: items.reduce((sum, item) => sum + item.totalPrice, 0)
//     }));
//   }, [localFilteredSales]);

//   const uniqueItemNames = useAtomValue(uniqueItemNamesAtom);
//   const uniqueSectionNames = useAtomValue(uniqueSectionNamesAtom);
//   const visibleItemIds = useMemo(() => {
//     return new Set(localFilteredSales.map(item => item.id));
//   }, [localFilteredSales]);

//   const allVisibleSelected = useMemo(() => {
//     return visibleItemIds.size > 0 && Array.from(visibleItemIds).every(id => selectedItemIds.has(id));
//   }, [visibleItemIds, selectedItemIds]);

//   const someVisibleSelected = useMemo(() => {
//     return Array.from(visibleItemIds).some(id => selectedItemIds.has(id));
//   }, [visibleItemIds, selectedItemIds]);

//   const totalSales = useAtomValue(totalSalesAtom);
//   const totalQuantity = useAtomValue(totalQuantityAtom);
//   const itemSales = useAtomValue(itemSalesAtom);

//   const toggleItemSelection = useCallback(
//     (itemId: string) => {
//       setSelectedItemIds(prev => {
//         const newSet = new Set(prev);
//         if (newSet.has(itemId)) {
//           newSet.delete(itemId);
//         } else {
//           newSet.add(itemId);
//         }
//         return newSet;
//       });
//     },
//     [setSelectedItemIds]
//   );

//   const toggleSelectAll = useCallback(() => {
//     const visibleIds = Array.from(visibleItemIds);
//     const allSelected = visibleIds.every(id => selectedItemIds.has(id));

//     if (allSelected) {
//       setSelectedItemIds(prev => {
//         const newSet = new Set(prev);
//         visibleIds.forEach(id => newSet.delete(id));
//         return newSet;
//       });
//     } else {
//       setSelectedItemIds(prev => {
//         const newSet = new Set(prev);
//         visibleIds.forEach(id => newSet.add(id));
//         return newSet;
//       });
//     }
//   }, [visibleItemIds, selectedItemIds, setSelectedItemIds]);

//   const clearSelection = useCallback(() => {
//     setSelectedItemIds(new Set());
//   }, [setSelectedItemIds]);

//   const handleRevertSale = useCallback(
//     (saleId: string) => {
//       const sale = sales.find(s => s.id.toString() === saleId);
//       if (sale) {
//         setSelectedSaleForRevert(sale);
//         setRevertDialogOpen(true);
//       }
//     },
//     [sales, setSelectedSaleForRevert, setRevertDialogOpen]
//   );

//   const handleSoftDeleteSale = useCallback(
//     (saleId: string) => {
//       const sale = sales.find(s => s.id.toString() === saleId);
//       if (sale) {
//         setSelectedSaleForDelete(sale);
//         setDeleteDialogOpen(true);
//       }
//     },
//     [sales, setSelectedSaleForDelete, setDeleteDialogOpen]
//   );

//   const handleBulkRevert = useCallback(() => {
//     setBulkRevertDialogOpen(true);
//   }, [setBulkRevertDialogOpen]);

//   const handleBulkDelete = useCallback(() => {
//     setBulkDeleteDialogOpen(true);
//   }, [setBulkDeleteDialogOpen]);

//   const cancelRevert = useCallback(() => {
//     setRevertDialogOpen(false);
//     setSelectedSaleForRevert(null);
//   }, [setRevertDialogOpen, setSelectedSaleForRevert]);

//   const cancelSoftDelete = useCallback(() => {
//     setDeleteDialogOpen(false);
//     setSelectedSaleForDelete(null);
//   }, [setDeleteDialogOpen, setSelectedSaleForDelete]);

//   const cancelBulkRevert = useCallback(() => {
//     setBulkRevertDialogOpen(false);
//   }, [setBulkRevertDialogOpen]);

//   const cancelBulkDelete = useCallback(() => {
//     setBulkDeleteDialogOpen(false);
//   }, [setBulkDeleteDialogOpen]);

//   const confirmRevertSale = useCallback(async () => {
//     if (selectedSaleForRevert) {
//       await revertSale(selectedSaleForRevert);
//       setRevertDialogOpen(false);
//       setSelectedSaleForRevert(null);
//     }
//   }, [selectedSaleForRevert, revertSale, setRevertDialogOpen, setSelectedSaleForRevert]);

//   const confirmSoftDeleteSale = useCallback(async () => {
//     if (selectedSaleForDelete) {
//       await softDeleteSale(selectedSaleForDelete);
//       setDeleteDialogOpen(false);
//       setSelectedSaleForDelete(null);
//     }
//   }, [selectedSaleForDelete, softDeleteSale, setDeleteDialogOpen, setSelectedSaleForDelete]);

//   const confirmBulkRevert = useCallback(async () => {
//     if (bulkRevertSales && setBulkRevertDialogOpen) {
//       const selectedSaleIds = new Set(
//         Array.from(selectedItemIds)
//           .map(itemId => localFilteredSales.find(item => item.id === itemId)?.saleId)
//           .filter(Boolean) as string[]
//       );
//       await bulkRevertSales(selectedSaleIds);
//       setBulkRevertDialogOpen(false);
//       clearSelection();
//     }
//   }, [bulkRevertSales, selectedItemIds, localFilteredSales, setBulkRevertDialogOpen, clearSelection]);

//   const confirmBulkDelete = useCallback(async () => {
//     if (bulkDeleteSales && setBulkDeleteDialogOpen) {
//       const selectedSaleIds = new Set(
//         Array.from(selectedItemIds)
//           .map(itemId => localFilteredSales.find(item => item.id === itemId)?.saleId)
//           .filter(Boolean) as string[]
//       );
//       await bulkDeleteSales(selectedSaleIds);
//       setBulkDeleteDialogOpen(false);
//       clearSelection();
//     }
//   }, [bulkDeleteSales, selectedItemIds, localFilteredSales, setBulkDeleteDialogOpen, clearSelection]);

//   useEffect(() => {
//     fetchSales();
//   }, [fetchSales]);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <Loader2 className="h-8 w-8 animate-spin" />
//         <span className="ml-2">Loading sales history...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-4 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold">Sales History</h1>
//           <p className="text-muted-foreground">View and manage all completed sales</p>
//         </div>
//         <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
//           Back
//           <ArrowRight className="h-4 w-4" />
//         </Button>
//       </div>

//       {/* Error Alert */}
//       {error && (
//         <Alert variant="destructive">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       {/* Success Alerts */}
//       {revertSuccess && (
//         <Alert className="border-green-200 bg-green-50">
//           <CheckCircle className="h-4 w-4 text-green-600" />
//           <AlertDescription className="text-green-800">
//             {revertSuccess}
//             {stockRestorationReport.length > 0 && (
//               <div className="mt-2">
//                 <details className="text-sm">
//                   <summary className="cursor-pointer font-medium">View Stock Restoration Details</summary>
//                   <div className="mt-2 space-y-1">
//                     {stockRestorationReport.map((item, index) => (
//                       <div key={index} className="text-xs bg-green-100 p-2 rounded">
//                         <strong>{item.materialName}</strong>: {item.quantityRestored} {item.unit} restored
//                         {item.type === "individual_item" && (
//                           <span>
//                             {" "}
//                             (Assignment: {item.oldAssignmentQuantity} → {item.newAssignmentQuantity})
//                           </span>
//                         )}
//                         <span>
//                           {" "}
//                           (Stock: {item.oldStockQuantity} → {item.newStockQuantity})
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </details>
//               </div>
//             )}
//           </AlertDescription>
//         </Alert>
//       )}

//       {deleteSuccess && (
//         <Alert className="border-blue-200 bg-blue-50">
//           <CheckCircle className="h-4 w-4 text-blue-600" />
//           <AlertDescription className="text-blue-800">{deleteSuccess}</AlertDescription>
//         </Alert>
//       )}

//       {bulkDeleteSuccess && (
//         <Alert className="border-blue-200 bg-blue-50">
//           <CheckCircle className="h-4 w-4 text-blue-600" />
//           <AlertDescription className="text-blue-800">{bulkDeleteSuccess}</AlertDescription>
//         </Alert>
//       )}

//       {bulkRevertSuccess && (
//         <Alert className="border-green-200 bg-green-50">
//           <CheckCircle className="h-4 w-4 text-green-600" />
//           <AlertDescription className="text-green-800">
//             {bulkRevertSuccess}
//             {bulkStockRestorationReport.length > 0 && (
//               <div className="mt-2">
//                 <details className="text-sm">
//                   <summary className="cursor-pointer font-medium">View Bulk Stock Restoration Details</summary>
//                   <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
//                     {bulkStockRestorationReport.map((item, index) => (
//                       <div key={index} className="text-xs bg-green-100 p-2 rounded">
//                         <strong>{item.materialName}</strong>: {item.quantityRestored} {item.unit} restored
//                         {item.type === "individual_item" && (
//                           <span>
//                             {" "}
//                             (Assignment: {item.oldAssignmentQuantity} → {item.newAssignmentQuantity})
//                           </span>
//                         )}
//                         <span>
//                           {" "}
//                           (Stock: {item.oldStockQuantity} → {item.newStockQuantity})
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </details>
//               </div>
//             )}
//           </AlertDescription>
//         </Alert>
//       )}

//       {/* Filters and Summary */}
//       <Card>
//         <CardContent className="pt-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//             <Card className="p-4">
//               <div className="flex items-center justify-between">
//                 <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
//                 <DollarSign className="h-4 w-4 text-muted-foreground" />
//               </div>
//               <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
//               <p className="text-xs text-muted-foreground">From {localFilteredSales.length} item sales</p>
//             </Card>
//             <Card className="p-4">
//               <div className="flex items-center justify-between">
//                 <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
//                 <ShoppingBag className="h-4 w-4 text-muted-foreground" />
//               </div>
//               <div className="text-2xl font-bold">{totalQuantity}</div>
//               <p className="text-xs text-muted-foreground">{selectedItem !== "all" || selectedSection !== "all" || dateFilter ? `Filtered from ${itemSales.length} total` : "Total quantity sold"}</p>
//             </Card>
//             <Card className="p-4">
//               <div className="flex items-center justify-between">
//                 <CardTitle className="text-sm font-medium">Average Price</CardTitle>
//                 <Package className="h-4 w-4 text-muted-foreground" />
//               </div>
//               <div className="text-2xl font-bold">{totalQuantity > 0 ? formatCurrency(totalSales / totalQuantity) : formatCurrency(0)}</div>
//               <p className="text-xs text-muted-foreground">Per item</p>
//             </Card>
//           </div>

//           <div className="flex flex-col sm:flex-row gap-4 items-end">
//             <div className="flex flex-col sm:flex-row gap-4 w-full">
//               <div className="flex-1">
//                 <label className="text-sm font-medium">Select Item</label>
//                 <Select value={selectedItem} onValueChange={setSelectedItem}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select an item to filter by..." />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Items</SelectItem>
//                     {uniqueItemNames.map(itemName => (
//                       <SelectItem key={itemName} value={itemName}>
//                         {itemName}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="flex-1">
//                 <label className="text-sm font-medium">Select Section</label>
//                 <Select value={selectedSection} onValueChange={setSelectedSection}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select a section to filter by..." />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Sections</SelectItem>
//                     {uniqueSectionNames.map(sectionName => (
//                       <SelectItem key={sectionName} value={sectionName}>
//                         {sectionName}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="flex-1">
//                 <label className="text-sm font-medium">Date</label>
//                 <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
//               </div>
//             </div>
//             {(selectedItem !== "all" || selectedSection !== "all" || dateFilter) && (
//               <Button
//                 variant="outline"
//                 onClick={() => {
//                   setSelectedItem("all");
//                   setSelectedSection("all");
//                   setDateFilter("");
//                 }}
//               >
//                 Clear Filters
//               </Button>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Sales Accordion */}
//       <Card>
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle>Item Sales Records</CardTitle>
//               <p className="text-sm text-muted-foreground">
//                 Showing {localFilteredSales.length} of {itemSales.length} item sales
//                 {selectedItem !== "all" && ` for "${selectedItem}"`}
//                 {dateFilter && ` on ${formatDate(new Date(dateFilter))}`}
//               </p>
//             </div>
//             {selectedItemIds.size > 0 && (
//               <div className="flex items-center gap-2">
//                 <span className="text-sm text-muted-foreground">
//                   {selectedItemIds.size} item{selectedItemIds.size === 1 ? "" : "s"} selected
//                 </span>
//                 <Button variant="outline" size="sm" onClick={clearSelection}>
//                   Clear Selection
//                 </Button>
//                 <Button variant="outline" size="sm" onClick={handleBulkRevert} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
//                   <Undo2 className="mr-2 h-4 w-4" />
//                   Revert Selected ({selectedItemIds.size})
//                 </Button>
//                 <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
//                   <Trash2 className="mr-2 h-4 w-4" />
//                   Delete Selected ({selectedItemIds.size})
//                 </Button>
//               </div>
//             )}
//           </div>
//         </CardHeader>
//         <CardContent>
//           {groupedSales.length > 0 ? (
//             <Accordion type="single" collapsible className="w-full">
//               {groupedSales.map(({ saleId, items, saleDate, total }) => (
//                 <AccordionItem key={saleId} value={saleId} className="border-b">
//                   <AccordionTrigger className="hover:no-underline py-4">
//                     <div className="flex items-center justify-between w-full px-4">
//                       <div className="flex items-center gap-4">
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={e => {
//                             e.stopPropagation();
//                             items.forEach(item => toggleItemSelection(item.id));
//                           }}
//                           className="h-8 w-8 p-0"
//                         >
//                           {items.every(item => selectedItemIds.has(item.id)) ? <CheckSquare className="h-4 w-4 text-blue-600" /> : items.some(item => selectedItemIds.has(item.id)) ? <CheckSquare className="h-4 w-4 opacity-50" /> : <Square className="h-4 w-4" />}
//                         </Button>
//                         <span className="font-medium text-muted-foreground">Sale #{saleId}</span>
//                         <span className="text-sm">{formatDate(saleDate)}</span>
//                         <Badge variant="outline">{items.length} items</Badge>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <span className="font-bold">{formatCurrency(total)}</span>
//                       </div>
//                     </div>
//                   </AccordionTrigger>
//                   <AccordionContent>
//                     <div className="px-4 pb-4">
//                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                         {items.map(item => (
//                           <Card key={item.id} className={`p-4 ${selectedItemIds.has(item.id) ? "bg-blue-50 border-blue-200" : ""}`}>
//                             <div className="flex flex-col gap-2">
//                               <div className="flex items-center justify-between">
//                                 <div className="flex items-center gap-2">
//                                   <Button variant="ghost" size="sm" onClick={() => toggleItemSelection(item.id)} className="h-8 w-8 p-0">
//                                     {selectedItemIds.has(item.id) ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
//                                   </Button>
//                                   <div className="flex items-center gap-2">
//                                     {item.itemType === "individual" ? <Package className="h-4 w-4 text-blue-500" /> : <ShoppingBag className="h-4 w-4 text-green-500" />}
//                                     <span className="font-medium">{item.itemName}</span>
//                                   </div>
//                                 </div>
//                               </div>
//                               <div className="grid grid-cols-2 gap-2 text-sm">
//                                 <div>
//                                   <span className="text-muted-foreground">Date:</span>
//                                   <span className="block font-medium">{formatDate(item.saleDate)}</span>
//                                   <span className="text-xs text-muted-foreground">{item.saleDate.toLocaleTimeString()}</span>
//                                 </div>
//                                 <div>
//                                   <span className="text-muted-foreground">Section:</span>
//                                   <span className="block">{item.sectionName ? <Badge variant="outline">{item.sectionName}</Badge> : item.sectionId ? <Badge variant="outline">Section {item.sectionId}</Badge> : <span className="text-muted-foreground">-</span>}</span>
//                                 </div>
//                                 <div>
//                                   <span className="text-muted-foreground">Quantity:</span>
//                                   <span className="block font-medium">{item.quantity}</span>
//                                   {item.unit && <span className="text-xs text-muted-foreground">{item.unit}</span>}
//                                 </div>
//                                 <div>
//                                   <span className="text-muted-foreground">Unit Price:</span>
//                                   <span className="block font-medium">{formatCurrency(item.unitPrice)}</span>
//                                 </div>
//                                 <div>
//                                   <span className="text-muted-foreground">Total:</span>
//                                   <span className="block font-bold text-green-600">{formatCurrency(item.totalPrice)}</span>
//                                 </div>
//                               </div>
//                               <div className="flex gap-2 mt-2">
//                                 <Button variant="outline" size="sm" onClick={() => handleRevertSale(item.saleId)} className="flex-1" title="Revert Sale">
//                                   <Undo2 className="mr-2 h-4 w-4" />
//                                   Revert
//                                 </Button>
//                                 <Button variant="outline" size="sm" onClick={() => handleSoftDeleteSale(item.saleId)} className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete Sale">
//                                   <Trash2 className="mr-2 h-4 w-4" />
//                                   Delete
//                                 </Button>
//                               </div>
//                             </div>
//                           </Card>
//                         ))}
//                       </div>
//                     </div>
//                   </AccordionContent>
//                 </AccordionItem>
//               ))}
//             </Accordion>
//           ) : (
//             <div className="flex flex-col items-center gap-2 py-8">
//               {itemSales.length === 0 ? (
//                 <>
//                   <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-50" />
//                   <p className="text-muted-foreground">No item sales recorded yet</p>
//                   <p className="text-sm text-muted-foreground">Item sales will appear here after transactions are completed</p>
//                 </>
//               ) : (
//                 <>
//                   <Search className="h-12 w-12 text-muted-foreground opacity-50" />
//                   <p className="text-muted-foreground">No item sales match your filters</p>
//                   <p className="text-sm text-muted-foreground">Try selecting a different item or adjusting the date filter</p>
//                 </>
//               )}
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Dialogs */}
//       <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Revert Sale</DialogTitle>
//             <DialogDescription>
//               Are you sure you want to revert sale #{selectedSaleForRevert?.id}?
//               <br />
//               <br />
//               <strong>This action will:</strong>
//               <ul className="list-disc list-inside mt-2 space-y-1">
//                 <li>Permanently delete the sale record</li>
//                 <li>Restore all sold items back to inventory</li>
//                 <li>Restore ingredient quantities for menu items</li>
//                 <li>Update stock levels accordingly</li>
//               </ul>
//               <br />
//               <span className="text-destructive font-medium">This action cannot be undone.</span>
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button variant="outline" onClick={cancelRevert} disabled={isReverting}>
//               Cancel
//             </Button>
//             <Button variant="destructive" onClick={confirmRevertSale} disabled={isReverting}>
//               {isReverting ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Reverting...
//                 </>
//               ) : (
//                 <>
//                   <Undo2 className="mr-2 h-4 w-4" />
//                   Revert Sale
//                 </>
//               )}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Delete Sale</DialogTitle>
//             <DialogDescription>
//               Are you sure you want to Delete Sale #{selectedSaleForDelete?.id}?
//               <br />
//               <br />
//               <strong>This action will:</strong>
//               <ul className="list-disc list-inside mt-2 space-y-1">
//                 <li>Delete the sale from the sales history view</li>
//                 <li>Preserve the sale record in the database</li>
//                 <li>Keep all stock levels unchanged</li>
//                 <li>Allow the sale to be restored later if needed</li>
//               </ul>
//               <br />
//               <span className="text-blue-600 font-medium">This is a "soft delete" - the sale data is preserved but hidden from view.</span>
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button variant="outline" onClick={cancelSoftDelete} disabled={isDeleting}>
//               Cancel
//             </Button>
//             <Button variant="destructive" onClick={confirmSoftDeleteSale} disabled={isDeleting}>
//               {isDeleting ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Hiding...
//                 </>
//               ) : (
//                 <>
//                   <Trash2 className="mr-2 h-4 w-4" />
//                   Delete Sale
//                 </>
//               )}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Delete Selected Sales</DialogTitle>
//             <DialogDescription>
//               Are you sure you want to delete {selectedItemIds.size} selected item{selectedItemIds.size === 1 ? "" : "s"} from{" "}
//               {
//                 new Set(
//                   Array.from(selectedItemIds)
//                     .map(itemId => localFilteredSales.find(item => item.id === itemId)?.saleId)
//                     .filter(Boolean)
//                 ).size
//               }{" "}
//               sale
//               {new Set(
//                 Array.from(selectedItemIds)
//                   .map(itemId => localFilteredSales.find(item => item.id === itemId)?.saleId)
//                   .filter(Boolean)
//               ).size === 1
//                 ? ""
//                 : "s"}
//               ?
//               <br />
//               <br />
//               <strong>This action will:</strong>
//               <ul className="list-disc list-inside mt-2 space-y-1">
//                 <li>Hide the selected items from the sales history view</li>
//                 <li>Preserve all sale records in the database</li>
//                 <li>Keep all stock levels unchanged</li>
//                 <li>Allow the sales to be restored later if needed</li>
//               </ul>
//               <br />
//               <span className="text-blue-600 font-medium">This is a "soft delete" operation - the sale data is preserved but hidden from view.</span>
//               {(selectedItem !== "all" || selectedSection !== "all" || dateFilter) && (
//                 <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
//                   <p className="text-sm text-yellow-800">
//                     <strong>Note:</strong> You are deleting sales based on current filters:
//                     {selectedItem !== "all" && <span className="block">• Item: {selectedItem}</span>}
//                     {selectedSection !== "all" && <span className="block">• Section: {selectedSection}</span>}
//                     {dateFilter && <span className="block">• Date: {formatDate(new Date(dateFilter))}</span>}
//                   </p>
//                 </div>
//               )}
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button variant="outline" onClick={cancelBulkDelete} disabled={isBulkDeleting}>
//               Cancel
//             </Button>
//             <Button variant="destructive" onClick={confirmBulkDelete} disabled={isBulkDeleting}>
//               {isBulkDeleting ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Deleting {selectedItemIds.size} Items...
//                 </>
//               ) : (
//                 <>
//                   <Trash2 className="mr-2 h-4 w-4" />
//                   Delete {selectedItemIds.size} Items
//                 </>
//               )}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={bulkRevertDialogOpen} onOpenChange={setBulkRevertDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Revert Selected Sales</DialogTitle>
//             <DialogDescription>
//               Are you sure you want to revert {selectedItemIds.size} selected item{selectedItemIds.size === 1 ? "" : "s"} from{" "}
//               {
//                 new Set(
//                   Array.from(selectedItemIds)
//                     .map(itemId => localFilteredSales.find(item => item.id === itemId)?.saleId)
//                     .filter(Boolean)
//                 ).size
//               }{" "}
//               sale
//               {new Set(
//                 Array.from(selectedItemIds)
//                   .map(itemId => localFilteredSales.find(item => item.id === itemId)?.saleId)
//                   .filter(Boolean)
//               ).size === 1
//                 ? ""
//                 : "s"}
//               ?
//               <br />
//               <br />
//               <strong>This action will:</strong>
//               <ul className="list-disc list-inside mt-2 space-y-1">
//                 <li>
//                   Permanently delete the affected sale record
//                   {new Set(
//                     Array.from(selectedItemIds)
//                       .map(itemId => localFilteredSales.find(item => item.id === itemId)?.saleId)
//                       .filter(Boolean)
//                   ).size === 1
//                     ? ""
//                     : "s"}
//                 </li>
//                 <li>Restore all sold items back to inventory</li>
//                 <li>Restore ingredient quantities for menu items</li>
//                 <li>Update stock levels accordingly</li>
//               </ul>
//               <br />
//               <span className="text-destructive font-medium">This action cannot be undone.</span>
//               {(selectedItem !== "all" || selectedSection !== "all" || dateFilter) && (
//                 <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
//                   <p className="text-sm text-yellow-800">
//                     <strong>Note:</strong> You are reverting sales based on current filters:
//                     {selectedItem !== "all" && <span className="block">• Item: {selectedItem}</span>}
//                     {selectedSection !== "all" && <span className="block">• Section: {selectedSection}</span>}
//                     {dateFilter && <span className="block">• Date: {formatDate(new Date(dateFilter))}</span>}
//                   </p>
//                 </div>
//               )}
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button variant="outline" onClick={cancelBulkRevert} disabled={isBulkReverting}>
//               Cancel
//             </Button>
//             <Button className="text-orange-600" variant="outline" onClick={confirmBulkRevert} disabled={isBulkReverting}>
//               {isBulkReverting ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Reverting {selectedItemIds.size} Items...
//                 </>
//               ) : (
//                 <>
//                   <Undo2 className="mr-2 h-4 w-4" />
//                   Revert {selectedItemIds.size} Items
//                 </>
//               )}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
