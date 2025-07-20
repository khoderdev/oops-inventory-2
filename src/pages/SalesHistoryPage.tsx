import { salesAPI } from "@/api/sales.api.ts.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SaleRecord } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { formatDate } from "@/utils/formatDate";
import { AlertCircle, ArrowRight, Calendar, DollarSign, Loader2, Package, Search, ShoppingBag, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ItemSale {
  id: string;
  saleId: string;
  saleDate: Date;
  sectionId?: string;
  sectionName?: string;
  itemName: string;
  itemType: "individual" | "menu";
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalPrice: number;
  materialId?: string;
  menuItemId?: string;
}

export function SalesHistoryPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
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

  // Convert sales data to item-level sales
  const itemSales = useMemo<ItemSale[]>(() => {
    const items: ItemSale[] = [];

    if (sales.length > 0) {
      console.log("Processing sales data with menu items:", sales[0]?.menuItems);
    }

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

      {/* Filters */}
      <Card className="rounded-none">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
              <p className="text-xs text-muted-foreground">From {filteredItemSales.length} item sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantity}</div>
              <p className="text-xs text-muted-foreground">{selectedItem !== "all" || selectedSection !== "all" || dateFilter ? `Filtered from ${itemSales.length} total` : "Total quantity sold"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Price</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantity > 0 ? formatCurrency(totalSales / totalQuantity) : formatCurrency(0)}</div>
              <p className="text-xs text-muted-foreground">Per item</p>
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
          <CardTitle>Item Sales Records</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {filteredItemSales.length} of {itemSales.length} item sales
            {selectedItem !== "all" && ` for "${selectedItem}"`}
            {dateFilter && ` on ${formatDate(new Date(dateFilter))}`}
          </p>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Sale ID</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItemSales.length > 0 ? (
                  filteredItemSales.map(item => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
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
    </div>
  );
}
