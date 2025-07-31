import { ordersAPI } from "@/api/orders.api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ORDER_STATUS_COLORS, ORDER_TYPE_ICONS } from "@/constants/constants";
import { useAuth } from "@/contexts/AuthContext";
import { POSClientSalesProps, ReceiptData, SalesFilters } from "@/types/inventory";
import { Order, OrderStatus, OrderSummary, OrderType } from "@/types/orders";
import { formatCurrency } from "@/utils/conversionLogic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Calendar, Clock, Grid3X3, List, Printer, Search, TrendingUp, User, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { ReceiptPrinter } from "./ReceiptPrinter";

// Raw API response types to handle string numbers from backend
interface RawOrderItem {
  id: string | number;
  name: string;
  quantity: string | number;
  unitPrice: string | number;
  totalPrice: string | number;
  type: "material" | "menu";
  notes?: string;
  [key: string]: unknown;
}

interface RawOrderData {
  id: string | number;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  subtotal: string | number;
  total: string | number;
  tax?: string | number;
  discountType?: "percentage" | "fixed";
  discountValue?: string | number;
  discountAmount?: string | number;
  paymentAmount?: string | number;
  createdAt: string;
  updatedAt: string;
  estimatedReadyTime?: string;
  completedAt?: string;
  items?: RawOrderItem[];
  createdBy?: string | number;
  userId?: string;
  userRole?: string;
  [key: string]: unknown;
}

// API response interface to handle nested data structure
interface ApiOrderResponse {
  data?: {
    data?: RawOrderData;
  } | RawOrderData;
}

export const POSClientSales: React.FC<POSClientSalesProps> = ({ isOpen, onClose, onOrderSelect }) => {
  const { user } = useAuth();
  const [sales, setSales] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [isPrintingReport, setIsPrintingReport] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SalesFilters>({});
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [totalSales, setTotalSales] = useState(0);
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, OrderStatus>>({});

  // Auto-clear errors after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [error]);

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

      // Apply any local status overrides to maintain UI consistency
      const salesWithOverrides = fetchedSales.map(sale => {
        const overrideStatus = statusOverrides[sale.id];
        if (overrideStatus && overrideStatus !== sale.status) {
          console.log(`POSClientSales: Applying status override for order ${sale.id}: ${sale.status} → ${overrideStatus}`);
          return { ...sale, status: overrideStatus };
        }
        return sale;
      });
      
      // Clean up status overrides that are no longer needed (backend caught up)
      const overridesToRemove = Object.keys(statusOverrides).filter(orderId => {
        const sale = fetchedSales.find(s => s.id === orderId);
        return sale && sale.status === statusOverrides[orderId];
      });
      
      if (overridesToRemove.length > 0) {
        console.log('POSClientSales: Cleaning up status overrides that are no longer needed:', overridesToRemove);
        setStatusOverrides(prev => {
          const cleaned = { ...prev };
          overridesToRemove.forEach(orderId => delete cleaned[orderId]);
          return cleaned;
        });
      }

      setSales(salesWithOverrides);

      const total = fetchedSales.reduce((sum, order) => sum + (order.total || 0), 0);
      setTotalSales(total);
    } catch (error) {
      console.error("Failed to fetch sales:", error);
      setError(`Failed to load sales: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, filters, statusOverrides]);

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

  // Transform API data to ensure numeric fields are numbers
  const transformOrderData = (rawOrder: RawOrderData): Order => {
    const parseNumber = (value: string | number | undefined): number => {
      if (typeof value === 'number') return value;
      return parseFloat(String(value)) || 0;
    };
    
    const parseOptionalNumber = (value: string | number | undefined): number | undefined => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === 'number') return value;
      const parsed = parseFloat(String(value));
      return isNaN(parsed) ? undefined : parsed;
    };
    
    return {
      ...rawOrder,
      id: String(rawOrder.id),
      subtotal: parseNumber(rawOrder.subtotal),
      total: parseNumber(rawOrder.total),
      tax: parseNumber(rawOrder.tax),
      discountValue: parseOptionalNumber(rawOrder.discountValue),
      discountAmount: parseOptionalNumber(rawOrder.discountAmount),
      createdAt: new Date(rawOrder.createdAt),
      updatedAt: new Date(rawOrder.updatedAt),
      startTime: new Date(rawOrder.createdAt),
      estimatedReadyTime: rawOrder.estimatedReadyTime ? new Date(rawOrder.estimatedReadyTime) : undefined,
      completedAt: rawOrder.completedAt ? new Date(rawOrder.completedAt) : undefined,
      items: rawOrder.items?.map((item: RawOrderItem) => ({
        ...item,
        id: String(item.id),
        unitPrice: parseNumber(item.unitPrice),
        totalPrice: parseNumber(item.totalPrice),
        quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity)) || 0
      })) || [],
      userId: String(rawOrder.createdBy || rawOrder.userId || ""),
      userRole: rawOrder.userRole || "user"
    };
  };

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

  // Handle order update from OrderDetailsDialog
  const handleOrderUpdate = useCallback((updatedOrder: Order) => {
    console.log('POSClientSales: Handling order update:', {
      orderId: updatedOrder.id,
      oldStatus: selectedOrder?.status,
      newStatus: updatedOrder.status,
      updatedOrder
    });
    
    // Store the status override to maintain consistency across refreshes
    setStatusOverrides(prev => ({
      ...prev,
      [updatedOrder.id]: updatedOrder.status
    }));
    
    // Update the order in the sales list
    setSales(prevSales => {
      const updatedSales = prevSales.map(sale => {
        if (sale.id === updatedOrder.id) {
          const updatedSale = { 
            ...sale, 
            status: updatedOrder.status, 
            updatedAt: updatedOrder.updatedAt 
          };
          console.log('POSClientSales: Updated sale in list:', {
            saleId: sale.id,
            oldStatus: sale.status,
            newStatus: updatedSale.status
          });
          return updatedSale;
        }
        return sale;
      });
      
      console.log('POSClientSales: Sales list updated');
      return updatedSales;
    });
    
    // Update the selected order if it's the same one
    if (selectedOrder && selectedOrder.id === updatedOrder.id) {
      console.log('POSClientSales: Updating selected order:', {
        oldStatus: selectedOrder.status,
        newStatus: updatedOrder.status
      });
      setSelectedOrder(updatedOrder);
    }
    
    // Force a re-render by updating a dummy state
    setTimeout(() => {
      console.log('POSClientSales: Order update completed');
    }, 50);
  }, [selectedOrder]);

  // Handle clicking on a sale row to show details
  const handleSaleRowClick = async (sale: OrderSummary) => {
    setIsLoadingOrderDetails(true);
    setError(null); // Clear any previous errors

    try {
      const response = await ordersAPI.getOrder(sale.id) as ApiOrderResponse;
      console.log("Order details response:", response);
      
      // Handle nested data structure - API returns { data: { data: orderData } }
      const rawOrderData = (response.data && typeof response.data === 'object' && 'data' in response.data) 
        ? response.data.data as RawOrderData
        : response.data as RawOrderData;
      const transformedOrder = transformOrderData(rawOrderData);
      setSelectedOrder(transformedOrder);
      setShowOrderDetails(true);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to load order details: ${errorMessage}`);

      // Still show dialog with limited info from OrderSummary
      const limitedOrder: Partial<Order> = {
        id: sale.id,
        orderNumber: sale.orderNumber,
        status: sale.status,
        orderType: sale.orderType,
        tableNumber: sale.tableNumber,
        customerName: sale.customerName,
        total: sale.total,
        createdAt: sale.createdAt,
        updatedAt: sale.createdAt, // Fallback
        items: [
          {
            id: "summary-item",
            name: `Order Summary (${sale.itemCount} items)`,
            quantity: sale.itemCount || 1,
            unitPrice: sale.total / (sale.itemCount || 1),
            totalPrice: sale.total,
            type: "menu" as const,
            notes: "Detailed item information unavailable"
          }
        ],
        subtotal: sale.total - (sale.discountAmount || 0),
        tax: 0,
        discountAmount: sale.discountAmount,
        userId: "",
        userRole: "",
        startTime: sale.createdAt
      };

      setSelectedOrder(limitedOrder as Order);
      setShowOrderDetails(true);
    } finally {
      setIsLoadingOrderDetails(false);
    }
  };

  // Handle printing individual receipt
  const handlePrintReceipt = async (sale: OrderSummary, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    setPrintingOrderId(sale.id);

    try {
      // First try to get full order details
      let order: Order;
      let receiptData: ReceiptData;

      try {
        const response = await ordersAPI.getOrder(sale.id) as ApiOrderResponse;
        // Handle nested data structure - API returns { data: { data: orderData } }
        const rawOrderData = (response.data && typeof response.data === 'object' && 'data' in response.data) 
          ? response.data.data as RawOrderData
          : response.data as RawOrderData;
        order = transformOrderData(rawOrderData);

        // Convert full order to receipt data - use API data as-is
        receiptData = {
          id: order.orderNumber || order.id,
          date: new Date(order.createdAt).toLocaleDateString(),
          time: new Date(order.createdAt).toLocaleTimeString(),
          cashier: user?.fullName || "POS System",
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            type: item.type
          })),
          subtotal: order.subtotal,
          tax: order.tax || 0,
          total: order.total,
          paymentAmount: order.total,
          change: 0,
          paymentMethod: "cash",
          // Include discount information exactly as stored
          discountType: order.discountType || null,
          discountValue: order.discountValue || null,
          discountAmount: order.discountAmount || null,
          discountReason: order.discountReason || null
        };
      } catch (orderError) {
        console.warn("Failed to fetch full order details, using summary data:", orderError);

        // Fallback: Create simplified receipt from OrderSummary data
        // When we don't have full order details, create a simple receipt without discount complications
        receiptData = {
          id: sale.orderNumber,
          date: new Date(sale.createdAt).toLocaleDateString(),
          time: new Date(sale.createdAt).toLocaleTimeString(),
          cashier: user?.fullName || "System",
          items: [
            {
              name: `Order ${sale.orderNumber} (${sale.itemCount} items)`,
              quantity: 1,
              unitPrice: sale.total,
              totalPrice: sale.total,
              type: "menu" as const
            }
          ],
          subtotal: sale.total, // Use total as subtotal for simplicity
          tax: 0,
          total: sale.total,
          paymentAmount: sale.total,
          change: 0,
          paymentMethod: "cash",
          // Don't include discount info in fallback to avoid validation issues
          discountType: null,
          discountValue: null,
          discountAmount: null,
          discountReason: null
        };
      }

      setReceiptData(receiptData);
      setShowReceiptDialog(true);

      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error("Failed to prepare receipt:", error);
      setError(`Failed to prepare receipt: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setPrintingOrderId(null);
    }
  };

  // Handle printing sales report using ReceiptPrinter
  const handlePrintSalesReport = async () => {
    setIsPrintingReport(true);

    try {
      // Create a receipt-style sales report
      const reportReceiptData: ReceiptData = {
        id: "SALES-REPORT",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        cashier: user?.fullName || "System",
        items: sales.map((sale, index) => ({
          name: `${sale.orderNumber} - ${sale.customerName || "N/A"}`,
          quantity: 1,
          unitPrice: sale.total,
          totalPrice: sale.total,
          type: "menu" as const
        })),
        subtotal: totalSales,
        tax: 0,
        total: totalSales,
        paymentAmount: totalSales,
        change: 0,
        paymentMethod: "report",
        discountType: null,
        discountValue: null,
        discountAmount: null,
        discountReason: null
      };

      setReceiptData(reportReceiptData);
      setShowReceiptDialog(true);
    } catch (error) {
      console.error("Error preparing sales report:", error);
      setError("Failed to prepare sales report");
    } finally {
      setIsPrintingReport(false);
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
                  <AlertDescription className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-6 w-6 p-0 ml-2 hover:bg-red-100" title="Dismiss error">
                      <X className="w-4 h-4" />
                    </Button>
                  </AlertDescription>
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
                        <TableHead className="font-semibold text-gray-900 text-right">Discount</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-right">Total</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-center">Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map(order => (
                        <TableRow key={order.id} className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100" onClick={() => handleSaleRowClick(order)}>
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
                          <TableCell className="text-right">{order.discountAmount && parseFloat(order.discountAmount.toString()) > 0 ? <span className="text-sm font-semibold text-orange-600">-{formatCurrency(parseFloat(order.discountAmount.toString()))}</span> : <span className="text-sm text-gray-400">-</span>}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-lg font-bold text-green-600">{formatCurrency(order.total)}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Badge variant="outline" className="font-medium">
                                {order.itemCount || 0}
                              </Badge>
                              <Button variant="ghost" size="sm" onClick={e => handlePrintReceipt(order, e)} disabled={printingOrderId === order.id} className="h-8 w-8 p-0 hover:bg-blue-100" title="Print Receipt">
                                {printingOrderId === order.id ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Printer className="w-4 h-4 text-blue-600" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {sales.map(order => (
                    <Card key={order.id} className="hover:shadow-xl transition-all duration-300 cursor-pointer border-gray-200 hover:border-blue-400 group hover:scale-[1.02]" onClick={() => handleSaleRowClick(order)}>
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
                          <div className="flex items-center space-x-2">
                            <Badge className={`${ORDER_STATUS_COLORS[order.status]} text-sm font-semibold px-3 py-1`}>{order.status}</Badge>
                            <Button variant="ghost" size="sm" onClick={e => handlePrintReceipt(order, e)} disabled={printingOrderId === order.id} className="h-8 w-8 p-0 hover:bg-blue-100" title="Print Receipt">
                              {printingOrderId === order.id ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Printer className="w-4 h-4 text-blue-600" />}
                            </Button>
                          </div>
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
                          {/* Discount Information (if applicable) */}
                          {order.discountAmount && parseFloat(order.discountAmount.toString()) > 0 && (
                            <div className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                              <span className="text-sm font-medium text-orange-700">Discount Applied</span>
                              <span className="text-sm font-bold text-orange-600">-{formatCurrency(parseFloat(order.discountAmount.toString()))}</span>
                            </div>
                          )}

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
              <button onClick={handlePrintSalesReport} disabled={sales.length === 0 || isPrintingReport} className={`inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 ${sales.length === 0 || isPrintingReport ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}>
                {isPrintingReport ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Print Sales Report</span>
                  </>
                )}
              </button>
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

      {/* Order Details Dialog */}
      <OrderDetailsDialog 
        isOpen={showOrderDetails} 
        onClose={() => setShowOrderDetails(false)} 
        order={selectedOrder} 
        isLoading={isLoadingOrderDetails}
        onOrderUpdate={handleOrderUpdate}
      />

      <ReceiptPrinter
        isOpen={showReceiptDialog}
        onClose={() => {
          setShowReceiptDialog(false);
          setReceiptData(null);
        }}
        receiptData={receiptData}
        autoPrint={false}
      />
    </>
  );
};
