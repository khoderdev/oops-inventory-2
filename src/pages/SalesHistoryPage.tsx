import { salesAPI } from "@/api/sales.api.ts.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ItemSale, SaleRecord, StockRestorationItem } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { formatDate } from "@/utils/formatDate";
import { AlertCircle, ArrowRight, CheckCircle, CheckSquare, DollarSign, Loader2, Package, Search, ShoppingBag, ShoppingCart, Square, Trash2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export function SalesHistoryPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [selectedSaleForRevert, setSelectedSaleForRevert] = useState<SaleRecord | null>(null);
  const [isReverting, setIsReverting] = useState(false);
  const [revertSuccess, setRevertSuccess] = useState<string | null>(null);
  const [stockRestorationReport, setStockRestorationReport] = useState<StockRestorationItem[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSaleForDelete, setSelectedSaleForDelete] = useState<SaleRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [selectedSaleIds, setSelectedSaleIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkRevertDialogOpen, setBulkRevertDialogOpen] = useState(false);
  const [isBulkReverting, setIsBulkReverting] = useState(false);
  const [bulkRevertSuccess, setBulkRevertSuccess] = useState<string | null>(null);
  const [bulkStockRestorationReport, setBulkStockRestorationReport] = useState<StockRestorationItem[]>([]);
  const navigate = useNavigate();

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await salesAPI.getSales();
      const salesData = response.data || [];
      setSales(salesData);
    } catch (error: unknown) {
      console.error("Failed to fetch sales:", error);
      const errorMessage = error && typeof error === "object" && "response" in error ? (error as { response?: { data?: { error?: string } } }).response?.data?.error : undefined;
      setError(errorMessage || "Failed to load sales history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Handle revert sale
  const handleRevertSale = useCallback(async (sale: SaleRecord) => {
    setSelectedSaleForRevert(sale);
    setRevertDialogOpen(true);
  }, []);

  const confirmRevertSale = useCallback(async () => {
    if (!selectedSaleForRevert) return;

    setIsReverting(true);
    setError(null);

    try {
      const response = await salesAPI.revertSale(selectedSaleForRevert.id.toString());
      // Update the sales list by removing the reverted sale
      setSales(prevSales => prevSales.filter(sale => sale.id !== selectedSaleForRevert.id));
      // Show success message with restoration details
      setStockRestorationReport(response.data.stockRestorationReport);
      setRevertSuccess(`Sale #${selectedSaleForRevert.id} successfully reverted. ${response.data.totalItemsRestored} items restored to stock.`);
      // Auto-hide success message after 1.5 seconds
      setTimeout(() => setRevertSuccess(null), 1500);
    } catch (error: unknown) {
      console.error("Failed to revert sale:", error);
      const errorMessage = error && typeof error === "object" && "response" in error ? (error as { response?: { data?: { error?: string } } }).response?.data?.error : undefined;
      setError(errorMessage || "Failed to revert sale. Please try again.");
    } finally {
      setIsReverting(false);
      setRevertDialogOpen(false);
      setSelectedSaleForRevert(null);
    }
  }, [selectedSaleForRevert]);

  const cancelRevert = useCallback(() => {
    setRevertDialogOpen(false);
    setSelectedSaleForRevert(null);
  }, []);

  // Handle soft delete sale
  const handleSoftDeleteSale = useCallback(async (sale: SaleRecord) => {
    setSelectedSaleForDelete(sale);
    setDeleteDialogOpen(true);
  }, []);

  const confirmSoftDeleteSale = useCallback(async () => {
    if (!selectedSaleForDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await salesAPI.softDeleteSale(selectedSaleForDelete.id.toString());
      // Update the sales list by removing the soft deleted sale
      setSales(prevSales => prevSales.filter(sale => sale.id !== selectedSaleForDelete.id));
      // Show success message
      setDeleteSuccess(`Sale #${selectedSaleForDelete.id} successfully hidden from view. ${response.data.note}`);
      // Auto-hide success message after 1.5 seconds
      setTimeout(() => setDeleteSuccess(null), 1500);
    } catch (error: unknown) {
      console.error("Failed to soft delete sale:", error);
      const errorMessage = error && typeof error === "object" && "response" in error ? (error as { response?: { data?: { error?: string } } }).response?.data?.error : undefined;
      setError(errorMessage || "Failed to hide sale. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedSaleForDelete(null);
    }
  }, [selectedSaleForDelete]);

  const cancelSoftDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedSaleForDelete(null);
  }, []);

  // Convert sales data to item-level sales
  const itemSales = useMemo<ItemSale[]>(() => {
    const items: ItemSale[] = [];
    sales.forEach(sale => {
      // Add individual items
      sale.items?.forEach((item, index) => {
        items.push({
          id: `${sale.id}-item-${index}`,
          saleId: sale.id || "",
          saleDate: new Date(sale.saleDate),
          sectionId: sale.sectionId,
          sectionName: sale.section?.name,
          itemName: item.materialName || "Unknown Item",
          itemType: "individual",
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: parseFloat(String(item.unitPrice || 0)),
          totalPrice: parseFloat(String(item.totalPrice || 0)),
          materialId: item.materialId
        });
      });

      // Add menu items
      sale.menuItems?.forEach((menuItem, index) => {
        items.push({
          id: `${sale.id}-menu-${index}`,
          saleId: sale.id || "",
          saleDate: new Date(sale.saleDate),
          sectionId: sale.sectionId,
          sectionName: sale.section?.name,
          itemName: menuItem.menuItemName || `Menu Item ${menuItem.menuItemId}`,
          itemType: "menu",
          quantity: menuItem.quantity,
          unitPrice: parseFloat(String(menuItem.unitPrice || 0)),
          totalPrice: parseFloat(String(menuItem.totalPrice || 0)),
          menuItemId: menuItem.menuItemId
        });
      });
    });

    return items;
  }, [sales]);

  // Get unique item names for the filter dropdown
  const uniqueItemNames = useMemo(() => {
    const names = new Set(itemSales.map(item => item.itemName));
    return Array.from(names).sort();
  }, [itemSales]);

  // Get unique section names for the filter dropdown
  const uniqueSectionNames = useMemo(() => {
    const sections = new Set(itemSales.map(item => item.sectionName || `Section ${item.sectionId}`).filter(Boolean));
    return Array.from(sections).sort();
  }, [itemSales]);

  // Filter item sales based on selected item, section, and date
  const filteredItemSales = useMemo(() => {
    let filtered = [...itemSales];

    // Item filter
    if (selectedItem && selectedItem !== "all") {
      filtered = filtered.filter(item => item.itemName === selectedItem);
    }

    // Section filter
    if (selectedSection && selectedSection !== "all") {
      filtered = filtered.filter(item => {
        const itemSectionName = item.sectionName || `Section ${item.sectionId}`;
        return itemSectionName === selectedSection;
      });
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(item => {
        const itemDate = item.saleDate.toISOString().split("T")[0];
        return itemDate === dateFilter;
      });
    }

    return filtered.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());
  }, [itemSales, selectedItem, selectedSection, dateFilter]);

  // Get unique sale IDs from filtered results
  const visibleSaleIds = useMemo(() => {
    return new Set(filteredItemSales.map(item => item.saleId));
  }, [filteredItemSales]);

  // Check if all visible sales are selected
  const allVisibleSelected = useMemo(() => {
    return visibleSaleIds.size > 0 && Array.from(visibleSaleIds).every(id => selectedSaleIds.has(id));
  }, [visibleSaleIds, selectedSaleIds]);

  // Check if some visible sales are selected
  const someVisibleSelected = useMemo(() => {
    return Array.from(visibleSaleIds).some(id => selectedSaleIds.has(id));
  }, [visibleSaleIds, selectedSaleIds]);

  // Handle bulk selection
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

  const toggleSelectAll = useCallback(() => {
    const visibleSaleIds = new Set(filteredItemSales.map(item => item.saleId));
    const allSelected = Array.from(visibleSaleIds).every(id => selectedSaleIds.has(id));

    if (allSelected) {
      // Deselect all visible sales
      setSelectedSaleIds(prev => {
        const newSet = new Set(prev);
        visibleSaleIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all visible sales
      setSelectedSaleIds(prev => {
        const newSet = new Set(prev);
        visibleSaleIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [filteredItemSales, selectedSaleIds]);

  const clearSelection = useCallback(() => {
    setSelectedSaleIds(new Set());
  }, []);

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    if (selectedSaleIds.size === 0) return;
    setBulkDeleteDialogOpen(true);
  }, [selectedSaleIds]);

  // Handle bulk revert
  const handleBulkRevert = useCallback(() => {
    if (selectedSaleIds.size === 0) return;
    setBulkRevertDialogOpen(true);
  }, [selectedSaleIds]);

  const confirmBulkDelete = useCallback(async () => {
    if (selectedSaleIds.size === 0) return;

    setIsBulkDeleting(true);
    setError(null);

    try {
      const deletePromises = Array.from(selectedSaleIds).map(saleId => salesAPI.softDeleteSale(saleId));

      await Promise.all(deletePromises);

      // Update the sales list by removing the soft deleted sales
      setSales(prevSales => prevSales.filter(sale => !selectedSaleIds.has(sale.id.toString())));

      // Show success message
      setDeleteSuccess(`Successfully hidden ${selectedSaleIds.size} sales from view.`);

      // Clear selection
      setSelectedSaleIds(new Set());

      // Auto-hide success message after 2 seconds
      setTimeout(() => setDeleteSuccess(null), 2000);
    } catch (error: unknown) {
      console.error("Failed to bulk delete sales:", error);
      const errorMessage = error && typeof error === "object" && "response" in error ? (error as { response?: { data?: { error?: string } } }).response?.data?.error : undefined;
      setError(errorMessage || "Failed to delete selected sales. Please try again.");
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteDialogOpen(false);
    }
  }, [selectedSaleIds]);

  const cancelBulkDelete = useCallback(() => {
    setBulkDeleteDialogOpen(false);
  }, []);

  const confirmBulkRevert = useCallback(async () => {
    if (selectedSaleIds.size === 0) return;

    setIsBulkReverting(true);
    setError(null);

    try {
      const revertPromises = Array.from(selectedSaleIds).map(saleId => salesAPI.revertSale(saleId));

      const results = await Promise.all(revertPromises);

      // Combine all stock restoration reports
      const allRestorationReports = results.flatMap(result => result.data.stockRestorationReport || []);
      const totalItemsRestored = results.reduce((sum, result) => sum + (result.data.totalItemsRestored || 0), 0);

      // Update the sales list by removing the reverted sales
      setSales(prevSales => prevSales.filter(sale => !selectedSaleIds.has(sale.id.toString())));

      // Show success message with restoration details
      setBulkStockRestorationReport(allRestorationReports);
      setBulkRevertSuccess(`Successfully reverted ${selectedSaleIds.size} sales. ${totalItemsRestored} items restored to stock.`);

      // Clear selection
      setSelectedSaleIds(new Set());

      // Auto-hide success message after 2 seconds
      setTimeout(() => setBulkRevertSuccess(null), 2000);
    } catch (error: unknown) {
      console.error("Failed to bulk revert sales:", error);
      const errorMessage = error && typeof error === "object" && "response" in error ? (error as { response?: { data?: { error?: string } } }).response?.data?.error : undefined;
      setError(errorMessage || "Failed to revert selected sales. Please try again.");
    } finally {
      setIsBulkReverting(false);
      setBulkRevertDialogOpen(false);
    }
  }, [selectedSaleIds]);

  const cancelBulkRevert = useCallback(() => {
    setBulkRevertDialogOpen(false);
  }, []);

  const totalSales = filteredItemSales.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalQuantity = filteredItemSales.reduce((sum, item) => sum + item.quantity, 0);

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

      {/* Success Alert */}
      {revertSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{revertSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Delete Success Alert */}
      {deleteSuccess && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">{deleteSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Bulk Revert Success Alert */}
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

      {/* Filters */}
      <Card className="rounded-none">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 py-2">
          <Card className="py-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">Total Sales</CardTitle>
              <DollarSign className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-1 pb-3">
              <div className="text-lg font-bold">{formatCurrency(totalSales)}</div>
              <p className="text-[10px] text-muted-foreground">From {filteredItemSales.length} item sales</p>
            </CardContent>
          </Card>

          <Card className="py-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">Items Sold</CardTitle>
              <ShoppingBag className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-1 pb-3">
              <div className="text-lg font-bold">{totalQuantity}</div>
              <p className="text-[10px] text-muted-foreground">{selectedItem !== "all" || selectedSection !== "all" || dateFilter ? `Filtered from ${itemSales.length} total` : "Total quantity sold"}</p>
            </CardContent>
          </Card>

          <Card className="py-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">Average Price</CardTitle>
              <Package className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-1 pb-3">
              <div className="text-lg font-bold">{totalQuantity > 0 ? formatCurrency(totalSales / totalQuantity) : formatCurrency(0)}</div>
              <p className="text-[10px] text-muted-foreground">Per item</p>
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

      {/* Item Sales Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Item Sales Records</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {filteredItemSales.length} of {itemSales.length} item sales
                {selectedItem !== "all" && ` for "${selectedItem}"`}
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
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="h-8 w-8 p-0" disabled={visibleSaleIds.size === 0}>
                      {allVisibleSelected ? <CheckSquare className="h-4 w-4" /> : someVisibleSelected ? <CheckSquare className="h-4 w-4 opacity-50" /> : <Square className="h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead className="w-20">Sale ID</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItemSales.length > 0 ? (
                  filteredItemSales.map(item => (
                    <TableRow key={item.id} className={`hover:bg-muted/50 ${selectedSaleIds.has(item.saleId) ? "bg-blue-50 border-blue-200" : ""}`}>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => toggleSaleSelection(item.saleId)} className="h-8 w-8 p-0">
                          {selectedSaleIds.has(item.saleId) ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className=" text-muted-foreground">#{item.saleId}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.itemType === "individual" ? <Package className="h-4 w-4 text-blue-500" /> : <ShoppingBag className="h-4 w-4 text-green-500" />}
                          <div className="flex flex-col">
                            <span>{item.itemName}</span>
                            {item.itemType === "menu" && <span className="text-xs text-muted-foreground">ID: {item.menuItemId}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{formatDate(item.saleDate)}</span>
                          <span className="text-xs text-muted-foreground">{item.saleDate.toLocaleTimeString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.sectionName ? <Badge variant="outline">{item.sectionName}</Badge> : item.sectionId ? <Badge variant="outline">Section {item.sectionId}</Badge> : <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.quantity}</span>
                          {item.unit && <span className="text-xs text-muted-foreground">{item.unit}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(item.totalPrice)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const sale = sales.find(s => s.id === item.saleId);
                              if (sale) handleRevertSale(sale);
                            }}
                            className="h-8 w-8 p-0"
                            title="Revert Sale"
                          >
                            <Undo2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const sale = sales.find(s => s.id === item.saleId);
                              if (sale) handleSoftDeleteSale(sale);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Hide Sale"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      {itemSales.length === 0 ? (
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No item sales recorded yet</p>
                          <p className="text-sm text-muted-foreground">Item sales will appear here after transactions are completed</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-12 w-12 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No item sales match your filters</p>
                          <p className="text-sm text-muted-foreground">Try selecting a different item or adjusting the date filter</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Success Alert */}
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
            <DialogTitle>Hide Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to hide sale #{selectedSaleForDelete?.id}?
              <br />
              <br />
              <strong>This action will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Hide the sale from the sales history view</li>
                <li>Preserve the sale record in the database</li>
                <li>Keep all stock levels unchanged</li>
                <li>Allow the sale to be restored later if needed</li>
              </ul>
              <br />
              <span className="text-blue-600 font-medium">This is a "soft delete" - the sale data is preserved but hidden from view.</span>
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
                  Hiding...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hide Sale
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
                <li>
                  delete {selectedSaleIds.size} sale{selectedSaleIds.size === 1 ? "" : "s"} from the sales history view
                </li>
                <li>Preserve all sale records in the database</li>
                <li>Keep all stock levels unchanged</li>
                <li>Allow the sales to be restored later if needed</li>
              </ul>
              <br />
              <span className="text-blue-600 font-medium">This is a "soft delete" operation - the sale data is preserved but hidden from view.</span>
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
                  Permanently delete {selectedSaleIds.size} sale record{selectedSaleIds.size === 1 ? "" : "s"}
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
    </div>
  );
}
