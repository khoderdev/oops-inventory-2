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
  table: <ShoppingBag className="w-4 h-4" />
};

export const POSClientOrders: React.FC<POSClientOrdersProps> = ({ isOpen, onClose, onOrderSelect }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
      setSelectedOrder(orderData as Order);
      setShowOrderDetails(true);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      setError("Failed to load order details. Please try again.");
    } finally {
      setIsLoading(false);
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
          tax: typedOrderData.tax,
          total: typedOrderData.total,
          paymentAmount: typedOrderData.total,
          change: 0,
          paymentMethod: "cash"
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
      [key]: value
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
              <Select value={filters.status || "all"} onValueChange={value => handleFilterChange("status", value === "all" ? undefined : value)}>
                <SelectTrigger className="w-48 h-11 bg-white border-gray-200 focus:border-blue-400">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="served">Served</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.orderType || "all"} onValueChange={value => handleFilterChange("orderType", value === "all" ? undefined : value)}>
                <SelectTrigger className="w-48 h-11 bg-white border-gray-200 focus:border-blue-400">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                </SelectContent>
              </Select>

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
        {/* </div> */}

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
          <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 bg-gray-50 overflow-hidden">
            <MainContent />
          </DialogContent>
        </Dialog>
      ) : (
        <MainContent />
      )}

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 bg-white overflow-hidden">
          <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Fixed Header */}
            <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">Order Details - {selectedOrder?.orderNumber}</DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">Complete order information and items</DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Content */}
            {selectedOrder && (
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 sm:p-6">
                    <div className="max-w-6xl mx-auto space-y-6">
                      {/* Order Information */}
                      <Card className="border-gray-200">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Order Information</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-500">Order Number</label>
                              <p className="font-semibold text-gray-900">{selectedOrder.orderNumber}</p>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-500">Type</label>
                              <div className="flex items-center space-x-2">
                                {ORDER_TYPE_ICONS[selectedOrder.orderType]}
                                <span className="capitalize font-medium">{selectedOrder.orderType}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-500">Status</label>
                              <div>
                                <Badge className={ORDER_STATUS_COLORS[selectedOrder.status]}>{selectedOrder.status}</Badge>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-500">Created</label>
                              <p className="font-medium text-gray-900">
                                {formatDate(selectedOrder.createdAt)} at {formatTime(selectedOrder.createdAt)}
                              </p>
                            </div>
                            {selectedOrder.completedAt && (
                              <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-500">Completed</label>
                                <p className="font-medium text-gray-900">
                                  {formatDate(selectedOrder.completedAt)} at {formatTime(selectedOrder.completedAt)}
                                </p>
                              </div>
                            )}
                            {selectedOrder.estimatedReadyTime && (
                              <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-500">Ready Time</label>
                                <p className="font-medium text-gray-900">
                                  {formatDate(selectedOrder.estimatedReadyTime)} at {formatTime(selectedOrder.estimatedReadyTime)}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Customer Information */}
                      {(selectedOrder.customerName || selectedOrder.customerPhone || selectedOrder.customerAddress) && (
                        <Card className="border-gray-200">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span>Customer Information</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {selectedOrder.customerName && (
                                <div className="space-y-1">
                                  <label className="text-sm font-medium text-gray-500">Name</label>
                                  <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                                </div>
                              )}
                              {selectedOrder.customerPhone && (
                                <div className="space-y-1">
                                  <label className="text-sm font-medium text-gray-500">Phone</label>
                                  <p className="font-medium text-gray-900">{selectedOrder.customerPhone}</p>
                                </div>
                              )}
                              {selectedOrder.customerAddress && (
                                <div className="md:col-span-2 space-y-1">
                                  <label className="text-sm font-medium text-gray-500">Address</label>
                                  <p className="font-medium text-gray-900">{selectedOrder.customerAddress}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Order Items */}
                      <Card className="border-gray-200">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span>Order Items</span>
                            <Badge variant="outline" className="ml-2">
                              {selectedOrder.items.length} items
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {selectedOrder.items.map((item, index) => (
                              <div key={item.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">{item.type === "material" ? <Package className="w-5 h-5 text-blue-600" /> : <ShoppingBag className="w-5 h-5 text-green-600" />}</div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{item.name}</p>
                                    <p className="text-sm text-gray-500">
                                      {item.quantity} × {formatCurrency(item.unitPrice)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg text-gray-900">{formatCurrency(item.totalPrice)}</p>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {item.type}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Order Summary */}
                      <Card className="border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Order Summary</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="font-semibold text-gray-900">{formatCurrency(selectedOrder.subtotal)}</span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-t border-gray-200">
                              <span className="text-xl font-bold text-gray-900">Total</span>
                              <span className="text-2xl font-bold text-green-600">{formatCurrency(selectedOrder.total)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Notes */}
                      {selectedOrder.notes && (
                        <Card className="border-gray-200">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span>Notes</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg border border-yellow-200">{selectedOrder.notes}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Printer Dialog */}
      <ReceiptPrinter isOpen={showReceiptDialog} onClose={() => setShowReceiptDialog(false)} receiptData={receiptData} autoPrint={false} />
    </>
  );
};
