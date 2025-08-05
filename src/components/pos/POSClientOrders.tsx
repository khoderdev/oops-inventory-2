import { ordersAPI } from "@/api/orders.api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ORDER_STATUS_COLORS, ORDER_TYPE_ICONS } from "@/constants/constants";
import { useAuth } from "@/contexts/AuthContext";
import { OrderFilters, POSClientOrdersProps, ReceiptData } from "@/types/inventory";
import { Order, OrderStatus, OrderSummary, OrderType } from "@/types/orders";
import { formatCurrency } from "@/utils/conversionLogic";
import { AlertCircle, ArrowUpDown, Calendar, Clock, Edit, Eye, Grid3X3, List, Printer, RefreshCw, Search, ShoppingBag } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { ReceiptPrinter } from "./ReceiptPrinter";

const POSClientOrdersComponent: React.FC<POSClientOrdersProps> = ({ isOpen, onClose, onOrderSelect }) => {
  const renderCount = useRef(0);
  renderCount.current += 1;

  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize filters to show only incomplete orders
  const [filters, setFilters] = useState<OrderFilters>(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      dateRange: {
        startDate: today,
        endDate: today
      }
      // No status filter - we'll filter client-side for incomplete orders
    };
  });
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"date" | "total" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const componentMountedRef = useRef(true);
  const stableOnClose = useRef(onClose);
  const stableOnOrderSelect = useRef(onOrderSelect);

  // Update refs when props change but don't cause re-renders
  stableOnClose.current = onClose;
  stableOnOrderSelect.current = onOrderSelect;

  // Fetch orders with stable implementation
  const fetchOrders = useCallback(async () => {
    if (isOpen !== undefined && !isOpen) {
      return;
    }
    if (!componentMountedRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        limit: 100,
        offset: 0
      };

      if (filters.orderType) {
        params.orderType = filters.orderType;
      }
      const response = await ordersAPI.getOrders(params);

      if (!componentMountedRef.current) {
        return;
      }

      const responseData = response.data as { data?: OrderSummary[] } | OrderSummary[];
      let fetchedOrders = Array.isArray(responseData) ? responseData : responseData?.data || [];

      // Show all incomplete orders (including table orders)
      // Incomplete = orders that are still in progress, not yet completed
      const incompleteStatuses: OrderStatus[] = ["draft", "confirmed", "preparing", "ready"];
      fetchedOrders = fetchedOrders.filter(order => {
        // Only show incomplete orders (include all order types: table, delivery, takeaway, bar)
        if (!incompleteStatuses.includes(order.status)) return false;

        // Apply search filter
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          return order.orderNumber.toLowerCase().includes(searchLower) || order.customerName?.toLowerCase().includes(searchLower) || String(order.id).toLowerCase().includes(searchLower);
        }
        return true;
      });

      setOrders(fetchedOrders);
    } catch (error) {
      if (!componentMountedRef.current) {
        return;
      }
      const errorMessage = `Failed to load orders: ${error instanceof Error ? error.message : "Unknown error"}`;
      setError(errorMessage);
    } finally {
      if (componentMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isOpen, filters]);

  // Stable callbacks to prevent re-renders from inline functions
  const handleCloseOrderDetails = useCallback(() => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
    setIsLoadingOrderDetails(false);
  }, []);

  const handleCloseReceiptDialog = useCallback(() => {
    setShowReceiptDialog(false);
  }, []);

  // Handle order updates from OrderDetailsDialog
  const handleOrderUpdate = useCallback((updatedOrder: Order) => {
    console.log("📝 POSClientOrders: Order updated:", updatedOrder);

    // Check if the updated order is still incomplete
    const incompleteStatuses: OrderStatus[] = ["draft", "confirmed", "preparing", "ready"];
    const isStillIncomplete = incompleteStatuses.includes(updatedOrder.status);

    if (isStillIncomplete) {
      // Update the orders list with the new order data
      setOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order.id === updatedOrder.id) {
            // Update only the properties that exist in OrderSummary
            const updatedOrderSummary: OrderSummary = {
              ...order,
              status: updatedOrder.status,
              total: updatedOrder.total,
              itemCount: updatedOrder.items?.length || order.itemCount || 0,
              customerName: updatedOrder.customerName || order.customerName,
              discountAmount: updatedOrder.discountAmount || 0
            };
            console.log("✅ POSClientOrders: Updated order in list:", updatedOrderSummary);
            return updatedOrderSummary;
          }
          return order;
        });
      });
    } else {
      // Order is now completed, remove it from the incomplete orders list
      console.log("🎉 POSClientOrders: Order completed, removing from list:", updatedOrder.status);
      setOrders(prevOrders => {
        return prevOrders.filter(order => order.id !== updatedOrder.id);
      });
    }

    // Update the selected order if it's the same one
    setSelectedOrder(updatedOrder);
  }, []);

  // Fetch orders when component opens or filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Clear error after 10 seconds
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError(null);
      }, 1500);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [error]);

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
        throw new Error("Order data not found");
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
          throw new Error("Order data not found");
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

  // Memoized sorted orders to prevent unnecessary re-renders
  const sortedOrders = useMemo(() => {
    const ordersCopy = [...orders];

    ordersCopy.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "total":
          comparison = a.total - b.total;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return ordersCopy;
  }, [orders, sortBy, sortOrder]);

  // Calculate total amount of all incomplete orders
  const totalIncompleteAmount = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.total, 0);
  }, [orders]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof OrderFilters, value: string | undefined) => {
    const newValue = value === "all" ? undefined : value;
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: newValue
      };
      return newFilters;
    });
  }, []);

  // Handle search term change
  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        searchTerm: value
      };
      return newFilters;
    });
  }, []);

  // Handle dialog close with search clearing
  const handleDialogClose = useCallback(() => {
    // Clear search term when dialog closes
    setFilters(prev => ({
      ...prev,
      searchTerm: undefined
    }));

    // Call the original onClose if it exists
    if (stableOnClose.current) {
      stableOnClose.current();
    }
  }, []);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    if (refreshing || isLoading) {
      return;
    }
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders, refreshing, isLoading]);

  // Handle sorting
  const handleSort = useCallback((field: "date" | "total" | "status") => {
    setSortBy(prevSortBy => {
      setSortOrder(prevSortOrder => {
        if (prevSortBy === field) {
          const newOrder = prevSortOrder === "asc" ? "desc" : "asc";
          console.log("📊 handleSort: Toggling sort order to:", newOrder);
          return newOrder;
        } else {
          console.log("📊 handleSort: Changing sort field to:", field, "with order: desc");
          return "desc";
        }
      });
      return field;
    });
  }, []); // Remove dependencies to prevent excessive re-renders

  // Handle order selection for editing
  const handleOrderSelect = useCallback(
    (orderSummary: OrderSummary) => {
      if (!stableOnOrderSelect.current) {
        return;
      }

      // Pass the OrderSummary directly since that's what the interface expects
      stableOnOrderSelect.current(orderSummary);

      if (stableOnClose.current) {
        stableOnClose.current();
      }
    },
    [] // No dependencies to prevent re-renders
  );

  // Format date for display
  const formatDate = useCallback((date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }, []);

  // Format time for display
  const formatTime = useCallback((date: Date | string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }, []);

  // Determine if this is being used as a dialog
  const isDialog = isOpen !== undefined;

  // Component lifecycle management
  useEffect(() => {
    componentMountedRef.current = true;
    return () => {
      componentMountedRef.current = false;
      const intervalRef = refreshIntervalRef.current;
      if (intervalRef) {
        clearInterval(intervalRef);
      }
    };
  }, []);

  // Main content component - memoized to prevent re-creation and input focus loss
  const MainContent = useMemo(
    () => (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50">
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-3 border-b bg-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>{isDialog ? <DialogTitle className="text-3xl font-bold text-white">Orders</DialogTitle> : <h1 className="text-3xl font-bold text-white">Orders</h1>}</div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Enhanced Filters Section */}
          <div className="flex-shrink-0 p-3 bg-white border-b">
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
                {/* Order Type Filter - Using stable native select */}
                <div className="relative">
                  <select
                    value={filters.orderType || "all"}
                    onChange={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFilterChange("orderType", e.target.value === "all" ? undefined : (e.target.value as OrderType));
                    }}
                    className="w-48 h-11 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="delivery">Delivery</option>
                    <option value="takeaway">Takeaway</option>
                    <option value="table">Tables</option>
                    <option value="bar">Bar</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <Button variant="outline" onClick={handleRefresh} disabled={refreshing || isLoading} className="h-11 px-4 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>

                {/* View Mode Toggle */}
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

          {/* Orders Content - Scrollable */}
          <div
            className="flex-1 min-h-0 overflow-auto"
            onScroll={e => {
              const target = e.target as HTMLElement;
            }}
          >
            <div className="p-4">
              {isLoading && !refreshing ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-gray-500 font-medium">Loading orders...</div>
                  </div>
                </div>
              ) : refreshing ? (
                <div className="flex items-center justify-center h-16 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Refreshing orders...</span>
                  </div>
                </div>
              ) : error ? (
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-6 w-6 p-0 hover:bg-red-100">
                      ×
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <ShoppingBag className="w-12 h-12 opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No incomplete orders found</h3>
                  <p className="text-sm text-center max-w-md">{filters.searchTerm || filters.status || filters.orderType ? "Try adjusting your filters to see more results" : "No incomplete orders at the moment"}</p>
                </div>
              ) : viewMode === "list" ? (
                /* List View */
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-900">Order</TableHead>
                        <TableHead className="font-semibold text-gray-900">Notes</TableHead>
                        <TableHead className="font-semibold text-gray-900">Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort("status")}>
                          <div className="flex items-center space-x-1">
                            <span>Status</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort("date")}>
                          <div className="flex items-center space-x-1">
                            <span>Date & Time</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 text-right cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort("total")}>
                          <div className="flex items-center justify-end space-x-1">
                            <span>Total</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900 text-center">Items</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedOrders.map(order => (
                        <TableRow
                          key={order.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
                          onClick={e => {
                            const target = e.target as HTMLElement;
                            if (target.closest("button") || target.closest(".action-button")) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            handleOrderSelect(order);
                          }}
                        >
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{order.orderNumber}</span>
                              <span className="text-sm text-gray-500">#{String(order.id).slice(-8)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600 max-w-32 truncate">
                                {/* {(order as OrderSummary & { notes?: string }).notes || "No notes"} */}
                                {order.notes || "No notes"}
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
                  {sortedOrders.map(order => (
                    <Card
                      key={order.id}
                      className="hover:shadow-xl transition-all duration-300 cursor-pointer border-gray-200 hover:border-blue-400 group hover:scale-[1.02]"
                      onClick={e => {
                        const target = e.target as HTMLElement;
                        if (target.closest(".action-button") || target.closest("svg")) {
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }
                        handleOrderSelect(order);
                      }}
                    >
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
                          {order.notes && (
                            <div className="flex items-center space-x-1.5 text-gray-700">
                              <span className="truncate text-sm text-gray-600">{order.notes}</span>
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
                          <div className="flex w-full items-center justify-around action-button">
                            <Edit
                              className="w-6 h-6 hover:text-blue-600 cursor-pointer transition-colors"
                              onClick={e => {
                                e.stopPropagation();
                                handleOrderSelect(order);
                              }}
                            />
                            <Eye
                              className="w-6 h-6 hover:text-blue-600 cursor-pointer transition-colors"
                              onClick={e => {
                                e.stopPropagation();
                                handleViewOrderDetails(order);
                              }}
                            />
                            <Printer
                              className="w-6 h-6 hover:text-blue-600 cursor-pointer transition-colors"
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
          </div>
        </div>

        {/* Fixed Footer - Only show when used as dialog */}
        {isDialog && orders.length > 0 && (
          <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg">
            <div className="px-6 py-4">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-500 font-semibold">
                      {orders.length}
                    </Badge>
                    <span className="text-gray-700 font-medium">incomplete order{orders.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300" />
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-green-600">Total: {formatCurrency(totalIncompleteAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    ),
    [isDialog, orders, totalIncompleteAmount, isLoading, refreshing, error, filters, viewMode, sortedOrders, handleRefresh, handleSearchChange, handleFilterChange, handleSort, handleOrderSelect, handleViewOrderDetails, handlePrintOrderReceipt, formatDate, formatTime]
  );

  // If not used as dialog, return early if isOpen is false
  if (isDialog && !isOpen) return null;

  return (
    <>
      {isDialog ? (
        <Dialog open={isOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 bg-gray-50 overflow-hidden z-50">{MainContent}</DialogContent>
        </Dialog>
      ) : (
        MainContent
      )}

      {/* Order Details Dialog */}
      <OrderDetailsDialog isOpen={showOrderDetails} onClose={handleCloseOrderDetails} order={selectedOrder} isLoading={isLoadingOrderDetails} onOrderUpdate={handleOrderUpdate} />

      {/* Receipt Printer Dialog */}
      <ReceiptPrinter isOpen={showReceiptDialog} onClose={handleCloseReceiptDialog} receiptData={receiptData} autoPrint={false} />
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const POSClientOrders: React.FC<POSClientOrdersProps> = React.memo(POSClientOrdersComponent, (prevProps, nextProps) => {
  // Custom comparison function
  const isEqual = prevProps.isOpen === nextProps.isOpen && prevProps.onClose === nextProps.onClose && prevProps.onOrderSelect === nextProps.onOrderSelect;

  return isEqual;
});
