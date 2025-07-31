import { ordersAPI } from "@/api/orders.api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/contexts/AuthContext";
import { ReceiptData } from "@/types/inventory";
import { Order, OrderStatus, OrderSummary, OrderType } from "@/types/orders";
import { formatCurrency } from "@/utils/conversionLogic";
import { AlertCircle, Calendar, Clock, Edit, Eye, Grid3X3, List, Package, Printer, Search, ShoppingBag, Truck, User } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { ReceiptPrinter } from "./ReceiptPrinter";

interface POSClientOrdersProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOrderSelect?: (order: Order) => void;
}

interface OrderFilters {
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
  table: <ShoppingBag className="w-4 h-4" />,
  employees: <User className="w-4 h-4" />
};

export const POSClientOrders: React.FC<POSClientOrdersProps> = ({ isOpen, onClose, onOrderSelect }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // Default to list view

  // Fetch orders based on filters
  const fetchOrders = useCallback(async () => {
    // If used as dialog, only fetch when open
    if (isOpen !== undefined && !isOpen) return;

    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {};

      // Only include delivery and takeaway orders
      if (filters.orderType) {
        params.orderType = filters.orderType;
      } else {
        // If no specific type filter, we'll filter client-side to exclude table orders
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

      // Add pagination
      params.limit = 100;
      params.offset = 0;

      const response = await ordersAPI.getOrders(params);
      console.log("Orders API response:", response);

      // Handle nested response structure
      const responseData = response.data as { data?: OrderSummary[] } | OrderSummary[];
      let fetchedOrders = Array.isArray(responseData) ? responseData : responseData?.data || [];

      // Filter out table orders and apply search term
      fetchedOrders = fetchedOrders.filter(order => {
        // Only show delivery and takeaway orders
        if (order.orderType === "table") return false;

        // Apply search term filter
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          return order.orderNumber.toLowerCase().includes(searchLower) || order.customerName?.toLowerCase().includes(searchLower) || order.id.toLowerCase().includes(searchLower);
        }

        return true;
      });

      // Sort by creation date (newest first)
      fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      console.error("Error details:", error);
      setError(`Failed to load orders: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, filters]);

  // Fetch orders when component opens or filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle view order details
  const handleViewOrderDetails = useCallback(async (orderSummary: OrderSummary) => {
    setIsLoadingOrderDetails(true);
    setError(null);
    setShowOrderDetails(true);

    try {
      const response = await ordersAPI.getOrder(orderSummary.id);
      // Handle nested response structure
      const responseData = response.data as { data?: Order } | Order;
      const orderData = "data" in responseData ? responseData.data : responseData;

      if (!orderData) {
        throw new Error('Order data not found');
      }

      // TypeScript now knows orderData is Order, not undefined
      setSelectedOrder(orderData as Order);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      setError("Failed to load order details. Please try again.");
    } finally {
      setIsLoadingOrderDetails(false);
    }
  }, []);

  // Handle print order receipt
  const handlePrintOrderReceipt = useCallback(
    async (orderSummary: OrderSummary) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await ordersAPI.getOrder(orderSummary.id);
        // Handle nested response structure
        const responseData = response.data as { data?: Order } | Order;
        const orderData = "data" in responseData ? responseData.data : responseData;

        if (!orderData) {
          throw new Error('Order data not found');
        }

        // TypeScript now knows orderData is Order, not undefined
        const typedOrderData = orderData as Order;

        // Convert order to receipt data
        const receiptData: ReceiptData = {
          id: typedOrderData.orderNumber || typedOrderData.id,
          date: new Date(typedOrderData.createdAt).toLocaleDateString(),
          time: new Date(typedOrderData.createdAt).toLocaleTimeString(),
          cashier: user?.fullName || "POS System",
          items: typedOrderData.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            type: item.type
          })),
          subtotal: typedOrderData.subtotal,
          tax: typedOrderData.tax || 0,
          total: typedOrderData.total,
          paymentAmount: typedOrderData.total,
          change: 0,
          paymentMethod: "cash",
          // Include discount information
          discountType: typedOrderData.discountType || null,
          discountValue: typedOrderData.discountValue || null,
          discountAmount: typedOrderData.discountAmount || null,
          discountReason: typedOrderData.discountReason || null
        };

        setReceiptData(receiptData);
        setShowReceiptDialog(true);
        // Close the details modal
        setShowOrderDetails(false);
      } catch (error) {
        console.error("Failed to prepare receipt:", error);
        setError("Failed to prepare receipt. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof OrderFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? undefined : value
    }));
  }, []);

  // Handle search term change
  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      searchTerm: value
    }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Handle order selection for editing
  const handleOrderSelect = useCallback(
    async (orderSummary: OrderSummary) => {
      if (!onOrderSelect) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await ordersAPI.getOrder(orderSummary.id);
        // Handle nested response structure
        const responseData = response.data as { data?: Order } | Order;
        const orderData = "data" in responseData ? responseData.data : responseData;

        if (!orderData) {
          throw new Error('Order data not found');
        }

        // Call the parent callback to load order into POS cart
        onOrderSelect(orderData as Order);

        // Close the orders dialog if onClose is provided
        if (onClose) {
          onClose();
        }
      } catch (error) {
        console.error("Failed to load order for editing:", error);
        setError("Failed to load order for editing. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [onOrderSelect, onClose]
  );

  // Format date for display
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Format time for display
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // Determine if this is being used as a dialog
  const isDialog = isOpen !== undefined;

  // Main content component
  const MainContent = () => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 border-b bg-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              {isDialog ? <DialogTitle className="text-3xl font-bold text-gray-900">Orders</DialogTitle> : <h1 className="text-3xl font-bold text-gray-900">Orders</h1>}
              <p className="text-sm text-gray-600 mt-1">
                {orders.length > 0 ? (
                  <span className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-500">
                      {orders.length}
                    </Badge>
                    <span>order{orders.length !== 1 ? "s" : ""} found</span>
                  </span>
                ) : (
                  "Manage delivery and takeaway orders"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Enhanced Filters Section */}
        <div className="flex-shrink-0 p-4 bg-white border-b">
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input placeholder="Search by order number, customer name, or ID..." value={filters.searchTerm || ""} onChange={e => handleSearchChange(e.target.value)} className="pl-11 h-11 bg-white border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-base" />
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Status Filter - Native Select */}
              <select 
                value={filters.status || "all"} 
                onChange={(e) => handleFilterChange("status", e.target.value as OrderStatus | "all")}
                className="w-48 h-11 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="served">Served</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Order Type Filter - Native Select */}
              <select 
                value={filters.orderType || "all"} 
                onChange={(e) => handleFilterChange("orderType", e.target.value as OrderType | "all")}
                className="w-48 h-11 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="delivery">Delivery</option>
                <option value="takeaway">Takeaway</option>
              </select>

              <Button variant="outline" onClick={clearFilters} className="h-11 px-4 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                Clear Filters
              </Button>

              {/* View Mode Toggle */}
              <div className="border-l border-gray-200 pl-3 ml-3">
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'list' | 'grid')} className="bg-gray-100 rounded-lg p-1">
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

        {/* Orders Content - Scrollable */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-gray-500 font-medium">Loading orders...</div>
                  </div>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <ShoppingBag className="w-12 h-12 opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No orders found</h3>
                  <p className="text-sm text-center max-w-md">{filters.searchTerm || filters.status || filters.orderType ? "Try adjusting your filters to see more results" : "No delivery or takeaway orders available at the moment"}</p>
                </div>
              ) : viewMode === 'list' ? (
                /* List View */
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
                        <TableHead className="font-semibold text-gray-900 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map(order => (
                        <TableRow 
                          key={order.id} 
                          className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
                          onClick={() => handleOrderSelect(order)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{order.orderNumber}</span>
                              <span className="text-sm text-gray-500">#{String(order.id).slice(-8)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {order.customerName || 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {ORDER_TYPE_ICONS[order.orderType]}
                              <span className="capitalize font-medium text-gray-700">{order.orderType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${ORDER_STATUS_COLORS[order.status]} font-semibold`}>
                              {order.status}
                            </Badge>
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
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(order.total)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-medium">
                              {order.itemCount || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleOrderSelect(order);
                                }}
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleViewOrderDetails(order);
                                }}
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                                onClick={e => {
                                  e.stopPropagation();
                                  handlePrintOrderReceipt(order);
                                }}
                              >
                                <Printer className="w-4 h-4 text-blue-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {orders.map(order => (
                    <Card key={order.id} className="hover:shadow-xl transition-all duration-300 cursor-pointer border-gray-200 hover:border-blue-400 group hover:scale-[1.02]" onClick={() => handleOrderSelect(order)}>
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

                          {/* Action Buttons */}
                          <div className="flex w-full items-center justify-around">
                            <Edit
                              className="w-6 h-6 hover:text-blue-600 cursor-pointer"
                              onClick={e => {
                                e.stopPropagation();
                                handleOrderSelect(order);
                              }}
                            />
                            <Eye
                              className="w-6 h-6 hover:text-blue-600 cursor-pointer"
                              onClick={e => {
                                e.stopPropagation();
                                handleViewOrderDetails(order);
                              }}
                            />
                            <Printer
                              className="w-6 h-6 hover:text-blue-600 cursor-pointer"
                              onClick={e => {
                                e.stopPropagation();
                                handlePrintOrderReceipt(order);
                              }}
                            />
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
    </div>
  );

  // If not used as dialog, return early if isOpen is false
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
        onClose={() => {
          setShowOrderDetails(false);
          setSelectedOrder(null);
          setIsLoadingOrderDetails(false);
        }}
        order={selectedOrder}
        isLoading={isLoadingOrderDetails}
      />

      {/* Receipt Printer Dialog */}
      <ReceiptPrinter isOpen={showReceiptDialog} onClose={() => setShowReceiptDialog(false)} receiptData={receiptData} autoPrint={false} />
    </>
  );
};
