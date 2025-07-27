import { ordersAPI } from "@/api/orders.api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReceiptData } from "@/types/inventory";
import { Order, OrderStatus, OrderSummary, OrderType } from "@/types/orders";
import { formatCurrency } from "@/utils/conversionLogic";
import { AlertCircle, Calendar, Check, Clock, Eye, Package, Printer, Search, ShoppingBag, Truck, User, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ReceiptPrinter } from "./ReceiptPrinter";

interface POSClientOrdersProps {
  isOpen: boolean;
  onClose: () => void;
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

export const POSClientOrders: React.FC<POSClientOrdersProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({});

  // Fetch orders based on filters
  const fetchOrders = useCallback(async () => {
    if (!isOpen) return;

    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, any> = {};

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
      const responseData = response.data as any;
      let fetchedOrders = responseData?.data || responseData || [];

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
      const responseData = response.data as any;
      const orderData = responseData.data || responseData;

      setSelectedOrder(orderData);
      setShowOrderDetails(true);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      setError("Failed to load order details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle print order receipt
  const handlePrintOrderReceipt = useCallback(async (orderSummary: OrderSummary) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ordersAPI.getOrder(orderSummary.id);
      // Handle nested response structure
      const responseData = response.data as any;
      const orderData = responseData.data || responseData;

      // Convert order to receipt data
      const receiptData: ReceiptData = {
        id: orderData.orderNumber || orderData.id,
        date: new Date(orderData.createdAt).toLocaleDateString(),
        time: new Date(orderData.createdAt).toLocaleTimeString(),
        cashier: user?.fullName || "POS System",
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          type: item.type
        })),
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        total: orderData.total,
        paymentAmount: orderData.total,
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
  }, [user]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof OrderFilters, value: any) => {
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

  // Handle order status update
  const handleUpdateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      setIsLoading(true);
      try {
        await ordersAPI.updateOrderStatus(orderId, status);

        // Refresh orders list by triggering effect
        setFilters(prev => ({ ...prev }));

        // Update selected order if it's the same one
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => (prev ? { ...prev, status } : null));
        }

        setError(null);
        setShowOrderDetails(false);
      } catch (error) {
        console.error(`Failed to update order status to ${status}:`, error);
        setError(`Failed to ${status} order. Please try again.`);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedOrder]
  );

  // Handle complete order with payment
  const handleCompleteOrder = useCallback(
    async (orderId: string) => {
      setIsLoading(true);
      try {
        // For simplicity, we'll complete with cash payment for the full amount
        const paymentData = {
          paymentMethod: "cash",
          paymentAmount: selectedOrder?.total || 0,
          change: 0
        };

        await ordersAPI.completeOrder(orderId, paymentData);

        // Refresh orders list by triggering effect
        setFilters(prev => ({ ...prev }));

        // Update selected order status
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => (prev ? { ...prev, status: "paid" as OrderStatus } : null));
        }

        setError(null);
        setShowOrderDetails(false);
      } catch (error) {
        console.error("Failed to complete order:", error);
        setError("Failed to complete order. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedOrder]
  );

  // Handle cancel order
  const handleCancelOrder = useCallback(
    async (orderId: string, reason?: string) => {
      setIsLoading(true);
      try {
        await ordersAPI.cancelOrder(orderId, reason);

        // Refresh orders list by triggering effect
        setFilters(prev => ({ ...prev }));

        // Update selected order status
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => (prev ? { ...prev, status: "cancelled" as OrderStatus } : null));
        }

        setError(null);
        setShowOrderDetails(false);
      } catch (error) {
        console.error("Failed to cancel order:", error);
        setError("Failed to cancel order. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedOrder]
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

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5" />
              <span>Orders Management</span>
              <Badge variant="outline" className="ml-2">
                {orders.length} orders
              </Badge>
            </DialogTitle>
            <DialogDescription>View and manage delivery and takeaway orders</DialogDescription>
          </DialogHeader>

          {/* Filters Section */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search by order number, customer name..." value={filters.searchTerm || ""} onChange={e => handleSearchChange(e.target.value)} className="pl-10" />
              </div>
            </div>

            <Select value={filters.status || "all"} onValueChange={value => handleFilterChange("status", value === "all" ? undefined : value)}>
              <SelectTrigger className="w-48">
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
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="takeaway">Takeaway</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          {/* Orders List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">Loading orders...</div>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="m-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mb-2 opacity-50" />
                  <p>No orders found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {orders.map(order => (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold">{order.orderNumber}</CardTitle>
                          <div className="flex items-center space-x-2">
                            {ORDER_TYPE_ICONS[order.orderType]}
                            <Badge className={ORDER_STATUS_COLORS[order.status]}>{order.status}</Badge>
                          </div>
                        </div>
                        <CardDescription className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(order.createdAt)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(order.createdAt)}</span>
                          </span>
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {order.customerName && (
                            <div className="flex items-center space-x-2 text-sm">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{order.customerName}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-lg font-semibold text-green-600">{formatCurrency(order.total)}</span>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewOrderDetails(order)} className="flex items-center space-x-1">
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handlePrintOrderReceipt(order)} className="flex items-center space-x-1">
                                <Printer className="w-4 h-4" />
                                <span>Print</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5" />
              <span>Order Details - {selectedOrder?.orderNumber}</span>
              {selectedOrder && <Badge className={ORDER_STATUS_COLORS[selectedOrder.status]}>{selectedOrder.status}</Badge>}
            </DialogTitle>
            <DialogDescription>Complete order information and items</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-6 p-4">
                  {/* Order Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Order Number</label>
                          <p className="font-semibold">{selectedOrder.orderNumber}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Type</label>
                          <div className="flex items-center space-x-2">
                            {ORDER_TYPE_ICONS[selectedOrder.orderType]}
                            <span className="capitalize">{selectedOrder.orderType}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <Badge className={ORDER_STATUS_COLORS[selectedOrder.status]}>{selectedOrder.status}</Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Created</label>
                          <p>
                            {formatDate(selectedOrder.createdAt)} at {formatTime(selectedOrder.createdAt)}
                          </p>
                        </div>
                        {selectedOrder.completedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Completed</label>
                            <p>
                              {formatDate(selectedOrder.completedAt)} at {formatTime(selectedOrder.completedAt)}
                            </p>
                          </div>
                        )}
                        {selectedOrder.estimatedReadyTime && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Ready Time</label>
                            <p>
                              {formatDate(selectedOrder.estimatedReadyTime)} at {formatTime(selectedOrder.estimatedReadyTime)}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Information */}
                  {(selectedOrder.customerName || selectedOrder.customerPhone || selectedOrder.customerAddress) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Customer Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedOrder.customerName && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Name</label>
                              <p>{selectedOrder.customerName}</p>
                            </div>
                          )}
                          {selectedOrder.customerPhone && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Phone</label>
                              <p>{selectedOrder.customerPhone}</p>
                            </div>
                          )}
                          {selectedOrder.customerAddress && (
                            <div className="md:col-span-2">
                              <label className="text-sm font-medium text-gray-500">Address</label>
                              <p>{selectedOrder.customerAddress}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Order Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedOrder.items.map((item, index) => (
                          <div key={item.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">{item.type === "material" ? <Package className="w-4 h-4 text-blue-600" /> : <ShoppingBag className="w-4 h-4 text-green-600" />}</div>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-500">
                                  {item.quantity} × {formatCurrency(item.unitPrice)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                              <Badge variant="outline" className="text-xs">
                                {item.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>{formatCurrency(selectedOrder.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax</span>
                          <span>{formatCurrency(selectedOrder.tax)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold border-t pt-2">
                          <span>Total</span>
                          <span className="text-green-600">{formatCurrency(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{selectedOrder.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div className="flex space-x-2">
              {selectedOrder && selectedOrder.status === "draft" && (
                <Button onClick={() => handleUpdateOrderStatus(selectedOrder.id, "confirmed")} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700" disabled={isLoading}>
                  <Check className="w-4 h-4" />
                  <span>Confirm Order</span>
                </Button>
              )}

              {selectedOrder && selectedOrder.status !== "paid" && selectedOrder.status !== "cancelled" && (
                <Button onClick={() => handleCompleteOrder(selectedOrder.id)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  <Check className="w-4 h-4" />
                  <span>Complete & Pay</span>
                </Button>
              )}

              {selectedOrder && selectedOrder.status !== "paid" && selectedOrder.status !== "cancelled" && (
                <Button onClick={() => handleCancelOrder(selectedOrder.id, "Cancelled from orders management")} variant="destructive" className="flex items-center space-x-2" disabled={isLoading}>
                  <X className="w-4 h-4" />
                  <span>Cancel Order</span>
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              {selectedOrder && (
                <Button
                  onClick={() =>
                    handlePrintOrderReceipt({
                      id: selectedOrder.id,
                      orderNumber: selectedOrder.orderNumber,
                      status: selectedOrder.status,
                      orderType: selectedOrder.orderType,
                      customerName: selectedOrder.customerName,
                      total: selectedOrder.total,
                      itemCount: selectedOrder.items.length,
                      createdAt: selectedOrder.createdAt
                    })
                  }
                  className="flex items-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Printer Dialog */}
      <ReceiptPrinter isOpen={showReceiptDialog} onClose={() => setShowReceiptDialog(false)} receiptData={receiptData} autoPrint={false} />
    </>
  );
};
