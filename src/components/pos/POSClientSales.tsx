import { ordersAPI } from "@/api/orders.api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/contexts/AuthContext";
import { ReceiptData } from "@/types/inventory";
import { Order, OrderStatus, OrderSummary, OrderType } from "@/types/orders";
import { formatCurrency } from "@/utils/conversionLogic";
import { AlertCircle, Calendar, Clock, FileText, Grid3X3, List, Package, Search, ShoppingBag, TrendingUp, Truck, User } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { ReceiptPrinter } from "./ReceiptPrinter";

interface POSClientSalesProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOrderSelect?: (order: Order) => void;
}

interface SalesFilters {
  status?: OrderStatus;
  orderType?: OrderType;
  searchTerm?: string;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
}

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-yellow-100 text-yellow-800",
  ready: "bg-green-100 text-green-800",
  served: "bg-purple-100 text-purple-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800"
};

const ORDER_TYPE_ICONS: Record<OrderType, React.ReactNode> = {
  delivery: <Truck className="w-4 h-4" />,
  takeaway: <Package className="w-4 h-4" />,
  table: <ShoppingBag className="w-4 h-4" />
};

export const POSClientSales: React.FC<POSClientSalesProps> = ({ isOpen, onClose, onOrderSelect }) => {
  const { user } = useAuth();
  const [sales, setSales] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SalesFilters>({});
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [totalSales, setTotalSales] = useState(0);

  // Fetch sales based on filters
  const fetchSales = useCallback(async () => {
    if (isOpen !== undefined && !isOpen) return;

    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {};

      if (filters.orderType) {
        params.orderType = filters.orderType;
      }

      if (filters.status) {
        params.status = filters.status;
      }

      if (filters.dateRange?.startDate) {
        params.startDate = filters.dateRange.startDate;
      }

      if (filters.dateRange?.endDate) {
        params.endDate = filters.dateRange.endDate;
      }

      params.limit = 100;
      params.offset = 0;

      const response = await ordersAPI.getOrders(params);
      console.log("Sales API response:", response);

      const responseData = response.data as { data?: OrderSummary[] } | OrderSummary[];
      let fetchedSales = Array.isArray(responseData) ? responseData : responseData?.data || [];

      // Apply search term filter (include all order types)
      fetchedSales = fetchedSales.filter(order => {
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          return order.orderNumber.toLowerCase().includes(searchLower) || order.customerName?.toLowerCase().includes(searchLower) || order.id.toLowerCase().includes(searchLower);
        }
        return true;
      });

      fetchedSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setSales(fetchedSales);

      const total = fetchedSales.reduce((sum, order) => sum + (order.total || 0), 0);
      setTotalSales(total);
    } catch (error) {
      console.error("Failed to fetch sales:", error);
      setError(`Failed to load sales: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof SalesFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? undefined : value
    }));
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      searchTerm: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const handlePrintAllSalesReport = () => {
    // Create a comprehensive sales report
    const reportData = {
      reportTitle: "All Sales Report",
      reportDate: new Date().toLocaleDateString(),
      reportTime: new Date().toLocaleTimeString(),
      totalSales: sales.length,
      totalAmount: totalSales,
      sales: sales,
      summary: {
        byStatus: sales.reduce(
          (acc, sale) => {
            acc[sale.status] = (acc[sale.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        byType: sales.reduce(
          (acc, sale) => {
            acc[sale.orderType] = (acc[sale.orderType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      }
    };

    // For now, we'll use the browser's print functionality
    // In a real implementation, you might want to generate a PDF or send to a printer
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Sales Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total { font-weight: bold; background-color: #e8f5e8; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Sales Report</h1>
              <p>Generated on ${reportData.reportDate} at ${reportData.reportTime}</p>
            </div>
            <div class="summary">
              <h3>Summary</h3>
              <p><strong>Total Sales:</strong> ${reportData.totalSales}</p>
              <p><strong>Total Amount:</strong> ${formatCurrency(reportData.totalAmount)}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                ${sales
                  .map(
                    sale => `
                  <tr>
                    <td>${sale.id}</td>
                    <td>${sale.customerName || "N/A"}</td>
                    <td>${sale.orderType}</td>
                    <td>${sale.status}</td>
                    <td>${formatDate(sale.createdAt)}</td>
                    <td>${formatCurrency(sale.total)}</td>
                    <td>${sale.itemCount || 0}</td>
                  </tr>
                `
                  )
                  .join("")}
                <tr class="total">
                  <td colspan="5"><strong>TOTAL</strong></td>
                  <td><strong>${formatCurrency(reportData.totalAmount)}</strong></td>
                  <td><strong>${reportData.totalSales}</strong></td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const isDialog = isOpen !== undefined;

  const MainContent = () => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50 relative">
      <div className="flex-shrink-0 p-4 border-b bg-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>{isDialog ? <DialogTitle className="text-3xl font-bold text-white">Sales</DialogTitle> : <h1 className="text-3xl font-bold text-white">Sales</h1>}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-shrink-0 p-4 bg-white border-b">
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input placeholder="Search by order number, customer name, or ID..." value={filters.searchTerm || ""} onChange={e => handleSearchChange(e.target.value)} className="pl-11 h-11 bg-white border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-base" />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <select value={filters.status || "all"} onChange={e => handleFilterChange("status", e.target.value as OrderStatus | "all")} className="w-48 h-11 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none">
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="served">Served</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select value={filters.orderType || "all"} onChange={e => handleFilterChange("orderType", e.target.value as OrderType | "all")} className="w-48 h-11 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none">
                <option value="all">All Types</option>
                <option value="delivery">Delivery</option>
                <option value="takeaway">Takeaway</option>
                <option value="table">Table</option>
              </select>

              <Button variant="outline" onClick={clearFilters} className="h-11 px-4 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                Clear Filters
              </Button>

              <div className="border-l border-gray-200 pl-3 ml-3">
                <ToggleGroup type="single" value={viewMode} onValueChange={value => value && setViewMode(value as "list" | "grid")} className="bg-gray-100 rounded-lg p-1">
                  <ToggleGroupItem value="list" aria-label="List view" className="data-[state=on]:bg-white data-[state=on]:shadow-sm">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="grid" aria-label="Grid view" className="data-[state=on]:bg-white data-[state=on]:shadow-sm">
                    <Grid3X3 className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-gray-500 font-medium">Loading sales...</div>
                  </div>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : sales.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <TrendingUp className="w-12 h-12 opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No sales found</h3>
                  <p className="text-sm text-center max-w-md">{filters.searchTerm || filters.status || filters.orderType ? "Try adjusting your filters to see more results" : "No sales transactions available at the moment"}</p>
                </div>
              ) : viewMode === "list" ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-900">Order</TableHead>
                        <TableHead className="font-semibold text-gray-900">Customer</TableHead>
                        <TableHead className="font-semibold text-gray-900">Type</TableHead>
                        <TableHead className="font-semibold text-gray-900">Status</TableHead>
                        <TableHead className="font-semibold text-gray-900">Date & Time</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-right">Total</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-center">Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map(order => (
                        <TableRow key={order.id} className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{order.orderNumber}</span>
                              <span className="text-sm text-gray-500">#{String(order.id).slice(-8)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{order.customerName || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {ORDER_TYPE_ICONS[order.orderType]}
                              <span className="capitalize font-medium text-gray-700">{order.orderType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${ORDER_STATUS_COLORS[order.status]} font-semibold`}>{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              <div className="flex items-center space-x-1 text-gray-900">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(order.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(order.createdAt)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-lg font-bold text-green-600">{formatCurrency(order.total)}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-medium">
                              {order.itemCount || 0}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {sales.map(order => (
                    <Card key={order.id} className="hover:shadow-xl transition-all duration-300 cursor-pointer border-gray-200 hover:border-blue-400 group hover:scale-[1.02]">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{order.orderNumber}</CardTitle>
                            <div className="flex items-center space-x-3 mt-2">
                              <div className="flex items-center space-x-1.5">
                                {ORDER_TYPE_ICONS[order.orderType]}
                                <span className="text-sm text-gray-600 capitalize font-medium">{order.orderType}</span>
                              </div>
                            </div>
                          </div>
                          <Badge className={`${ORDER_STATUS_COLORS[order.status]} text-sm font-semibold px-3 py-1`}>{order.status}</Badge>
                        </div>

                        <CardDescription className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center space-x-1.5 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(order.createdAt)}</span>
                            </span>
                            <span className="flex items-center space-x-1.5 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(order.createdAt)}</span>
                            </span>
                          </div>
                          {order.customerName && (
                            <div className="flex items-center space-x-1.5 text-gray-700">
                              <User className="w-4 h-4" />
                              <span className="truncate font-medium">{order.customerName}</span>
                            </div>
                          )}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                            <span className="text-2xl font-bold text-green-600">{formatCurrency(order.total)}</span>
                            <Badge variant="outline" className="text-sm font-medium border-green-200 text-green-700">
                              {order.itemCount || 0} items
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-500 font-semibold">
                  {sales.length}
                </Badge>
                <span className="text-gray-700 font-medium">sale{sales.length !== 1 ? "s" : ""} found</span>
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-green-600">Total: {formatCurrency(totalSales)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button onClick={handlePrintAllSalesReport} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2" disabled={sales.length === 0}>
                <FileText className="w-4 h-4" />
                <span>Print All Sales Report</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isDialog && !isOpen) return null;

  return (
    <>
      {isDialog ? (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 bg-gray-50 overflow-hidden z-50">
            <MainContent />
          </DialogContent>
        </Dialog>
      ) : (
        <MainContent />
      )}

      <ReceiptPrinter isOpen={showReceiptDialog} onClose={() => setShowReceiptDialog(false)} receiptData={receiptData} autoPrint={false} />
    </>
  );
};
