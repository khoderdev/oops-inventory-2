import { salesAPI } from "@/api/sales.api.ts.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SaleRecord } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { formatDate } from "@/utils/formatDate";
import { AlertCircle, ArrowLeft, Calendar, DollarSign, Loader2, Package, Search, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function SalesHistoryPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [filteredSales, setFilteredSales] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const navigate = useNavigate();

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await salesAPI.getSales();
      const salesData = response.data || [];
      setSales(salesData);
      setFilteredSales(salesData);
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

  // Filter sales based on search term and date
  useEffect(() => {
    let filtered = [...sales];

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(sale => {
        const searchLower = searchTerm.toLowerCase();
        const matchesId = sale.id?.toString().includes(searchLower);
        const matchesSection = sale.sectionId?.toString().includes(searchLower);
        const matchesItems = sale.items?.some(item => item.materialName?.toLowerCase().includes(searchLower));
        const matchesMenuItems = sale.menuItems?.some(menuItem => menuItem.menuItemId?.toLowerCase().includes(searchLower));
        return matchesId || matchesSection || matchesItems || matchesMenuItems;
      });
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.saleDate).toISOString().split("T")[0];
        return saleDate === dateFilter;
      });
    }

    setFilteredSales(filtered);
  }, [sales, searchTerm, dateFilter]);

  const totalSales = filteredSales.reduce((sum, sale) => sum + parseFloat(String(sale.totalAmount || 0)), 0);
  const totalTransactions = filteredSales.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading sales history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sales History</h1>
            <p className="text-muted-foreground">View and search through all completed sales</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">From {totalTransactions} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">{searchTerm || dateFilter ? `Filtered from ${sales.length} total` : "Total completed sales"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions > 0 ? formatCurrency(totalSales / totalTransactions) : formatCurrency(0)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search sales (ID, section, items)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-auto" />
              {(searchTerm || dateFilter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setDateFilter("");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {filteredSales.length} of {sales.length} sales
          </p>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Menu Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length > 0 ? (
                  filteredSales
                    .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
                    .map(sale => (
                      <TableRow key={sale.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">#{sale.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(new Date(sale.saleDate))}</span>
                            <span className="text-xs text-muted-foreground">{new Date(sale.saleDate).toLocaleTimeString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>{sale.sectionId ? <Badge variant="outline">Section {sale.sectionId}</Badge> : <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {sale.items && sale.items.length > 0 ? (
                              sale.items.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">{item.materialName}</span>
                                  <span className="text-muted-foreground ml-2">
                                    {item.quantity} {item.unit} × {formatCurrency(parseFloat(String(item.unitPrice || 0)))}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {sale.menuItems && sale.menuItems.length > 0 ? (
                              sale.menuItems.map((menuItem, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">Menu Item {menuItem.menuItemId}</span>
                                  <span className="text-muted-foreground ml-2">
                                    {menuItem.quantity}× × {formatCurrency(parseFloat(String(menuItem.unitPrice || 0)))}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(parseFloat(String(sale.totalAmount || 0)))}</TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {sales.length === 0 ? (
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No sales recorded yet</p>
                          <p className="text-sm text-muted-foreground">Sales will appear here after transactions are completed</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-12 w-12 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No sales match your filters</p>
                          <p className="text-sm text-muted-foreground">Try adjusting your search terms or date filter</p>
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
