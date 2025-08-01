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
import { AlertCircle, ArrowUpDown, Calendar, Clock, Edit, Eye, Grid3X3, List, Printer, RefreshCw, Search, ShoppingBag, User } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { ReceiptPrinter } from "./ReceiptPrinter";

const POSClientOrdersComponent: React.FC<POSClientOrdersProps> = ({ isOpen, onClose, onOrderSelect }) => {
  const renderCount = useRef(0);
  renderCount.current += 1;

  console.log("🔄 POSClientOrders: Component rendering #", renderCount.current, "with props:", {
    isOpen,
    hasOnClose: !!onClose,
    hasOnOrderSelect: !!onOrderSelect,
    onCloseChanged: onClose !== useRef(onClose).current,
    onOrderSelectChanged: onOrderSelect !== useRef(onOrderSelect).current
  });

  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize filters to show only today's orders by default
  const [filters, setFilters] = useState<OrderFilters>(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      dateRange: {
        startDate: today,
        endDate: today
      }
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
    console.log("📡 fetchOrders: Starting fetch with conditions:", {
      isOpen,
      componentMounted: componentMountedRef.current,
      filters
    });

    if (isOpen !== undefined && !isOpen) {
      console.log("❌ fetchOrders: Skipping - dialog is closed");
      return;
    }
    if (!componentMountedRef.current) {
      console.log("❌ fetchOrders: Skipping - component unmounted");
      return;
    }

    console.log("⏳ fetchOrders: Setting loading state");
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
      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.dateRange?.startDate) {
        params.startDate = filters.dateRange.startDate;
      }
      if (filters.dateRange?.endDate) {
        params.endDate = filters.dateRange.endDate;
      }

      console.log("📡 fetchOrders: Making API call with params:", params);
      const response = await ordersAPI.getOrders(params);
      console.log("✅ fetchOrders: API response received:", {
        hasData: !!response.data,
        responseType: typeof response.data,
        isArray: Array.isArray(response.data)
      });

      if (!componentMountedRef.current) {
        console.log("❌ fetchOrders: Component unmounted during API call");
        return;
      }

      const responseData = response.data as { data?: OrderSummary[] } | OrderSummary[];
      let fetchedOrders = Array.isArray(responseData) ? responseData : responseData?.data || [];
      console.log("📊 fetchOrders: Extracted orders:", {
        totalOrders: fetchedOrders.length,
        firstOrder: fetchedOrders[0]?.orderNumber || "none"
      });

      // Filter out table orders and apply search
      const beforeFilter = fetchedOrders.length;
      fetchedOrders = fetchedOrders.filter(order => {
        if (order.orderType === "table") return false;

        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          return order.orderNumber.toLowerCase().includes(searchLower) || order.customerName?.toLowerCase().includes(searchLower) || order.id.toLowerCase().includes(searchLower);
        }
        return true;
      });

      console.log("🔍 fetchOrders: Filtering complete:", {
        beforeFilter,
        afterFilter: fetchedOrders.length,
        searchTerm: filters.searchTerm,
        statusFilter: filters.status,
        typeFilter: filters.orderType
      });

      console.log("✅ fetchOrders: Setting orders state with", fetchedOrders.length, "orders");
      setOrders(fetchedOrders);
    } catch (error) {
      if (!componentMountedRef.current) {
        console.log("❌ fetchOrders: Component unmounted during error handling");
        return;
      }
      console.error("❌ fetchOrders: API call failed:", error);
      const errorMessage = `Failed to load orders: ${error instanceof Error ? error.message : "Unknown error"}`;
      console.log("❌ fetchOrders: Setting error state:", errorMessage);
      setError(errorMessage);
    } finally {
      if (componentMountedRef.current) {
        console.log("✅ fetchOrders: Setting loading to false");
        setIsLoading(false);
      } else {
        console.log("❌ fetchOrders: Component unmounted, skipping loading state update");
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

  // Fetch orders when component opens or filters change
  useEffect(() => {
    console.log("🔄 useEffect[fetchOrders]: Triggering fetch due to dependency change");
    fetchOrders();
  }, [fetchOrders]);

  // Clear error after 10 seconds
  useEffect(() => {
    if (error) {
      console.log("⏰ useEffect[error]: Setting 10s timeout to clear error:", error);
      const timeout = setTimeout(() => {
        console.log("⏰ Error timeout: Clearing error after 10 seconds");
        setError(null);
      }, 10000);

      return () => {
        console.log("⏰ Error timeout: Cleanup - clearing timeout");
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
    console.log("📊 useMemo[sortedOrders]: Recalculating sorted orders:", {
      ordersCount: orders.length,
      sortBy,
      sortOrder
    });

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

    console.log("📊 useMemo[sortedOrders]: Sorting complete, returning", ordersCopy.length, "orders");
    return ordersCopy;
  }, [orders, sortBy, sortOrder]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof OrderFilters, value: string | undefined) => {
    console.log("🔧 handleFilterChange: Changing filter:", {
      key,
      value
    });

    const newValue = value === "all" ? undefined : value;
    console.log("🔧 handleFilterChange: Processed value:", newValue);

    setFilters(prev => {
      console.log("🔧 handleFilterChange: Previous filters:", prev);
      const newFilters = {
        ...prev,
        [key]: newValue
      };
      console.log("🔧 handleFilterChange: New filters state:", newFilters);
      return newFilters;
    });
  }, []); // Remove filters dependency to prevent excessive re-renders

  // Handle search term change
  const handleSearchChange = useCallback((value: string) => {
    console.log("🔍 handleSearchChange: Search term changed to:", value);

    setFilters(prev => {
      console.log("🔍 handleSearchChange: Previous filters:", prev);
      const newFilters = {
        ...prev,
        searchTerm: value
      };
      console.log("🔍 handleSearchChange: Updated filters:", newFilters);
      return newFilters;
    });
  }, []); // Remove dependency to prevent excessive re-renders

  // Clear filters
  const clearFilters = useCallback(() => {
    console.log("🧽 clearFilters: Clearing all filters");
    setFilters({});
  }, []);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    console.log("🔄 handleRefresh: Manual refresh triggered:", {
      currentlyRefreshing: refreshing,
      currentlyLoading: isLoading
    });

    if (refreshing || isLoading) {
      console.log("❌ handleRefresh: Skipping - already refreshing or loading");
      return;
    }

    console.log("⏳ handleRefresh: Starting manual refresh");
    setRefreshing(true);
    await fetchOrders();
    console.log("✅ handleRefresh: Manual refresh complete");
    setRefreshing(false);
  }, [fetchOrders, refreshing, isLoading]);

  // Handle sorting
  const handleSort = useCallback((field: "date" | "total" | "status") => {
    console.log("📊 handleSort: Sort requested for field:", field);

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
    async (orderSummary: OrderSummary) => {
      console.log("🎯 handleOrderSelect: Order selected:", orderSummary.orderNumber);

      if (!stableOnOrderSelect.current) {
        console.log("❌ handleOrderSelect: No onOrderSelect callback provided");
        return;
      }

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

        console.log("✅ handleOrderSelect: Calling parent onOrderSelect");
        // Call the parent callback to load order into POS cart
        stableOnOrderSelect.current(orderData as Order);

        // Close the orders dialog if onClose is provided
        if (stableOnClose.current) {
          console.log("✅ handleOrderSelect: Closing dialog");
          stableOnClose.current();
        }
      } catch (error) {
        console.error("Failed to load order for editing:", error);
        setError("Failed to load order for editing. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [] // No dependencies to prevent re-renders
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

  // Component lifecycle management
  useEffect(() => {
    console.log("🔄 useEffect[lifecycle]: Component mounted");
    componentMountedRef.current = true;
    return () => {
      console.log("🔄 useEffect[lifecycle]: Component unmounting");
      componentMountedRef.current = false;
      if (refreshIntervalRef.current) {
        console.log("⏰ useEffect[lifecycle]: Clearing refresh interval");
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    console.log("⏰ useEffect[auto-refresh]: Setting up auto-refresh:", {
      isOpen,
      showOrderDetails,
      showReceiptDialog,
      isLoading,
      refreshing
    });

    if (refreshIntervalRef.current) {
      console.log("⏰ useEffect[auto-refresh]: Clearing existing interval");
      clearInterval(refreshIntervalRef.current);
    }

    if ((!isOpen && isOpen !== undefined) || showOrderDetails || showReceiptDialog) {
      console.log("❌ useEffect[auto-refresh]: Skipping auto-refresh setup - dialog closed or other dialogs open");
      return;
    }

    console.log("✅ useEffect[auto-refresh]: Starting 30s auto-refresh interval");
    refreshIntervalRef.current = setInterval(() => {
      console.log("⏰ Auto-refresh interval: Checking conditions:", {
        isLoading,
        refreshing,
        componentMounted: componentMountedRef.current
      });

      if (!isLoading && !refreshing && componentMountedRef.current) {
        console.log("🔄 Auto-refresh interval: Triggering fetchOrders");
        fetchOrders();
      } else {
        console.log("❌ Auto-refresh interval: Skipping - conditions not met");
      }
    }, 30000);

    return () => {
      console.log("⏰ useEffect[auto-refresh]: Cleanup - clearing interval");
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isOpen, showOrderDetails, showReceiptDialog, isLoading, refreshing, fetchOrders]);

  // If not used as dialog, return early if isOpen is false
  if (isDialog && !isOpen) return null;

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
              {/* Status Filter - Using stable native select */}
              <div className="relative">
                <select
                  value={filters.status || "all"}
                  onChange={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("🔧 Status select onChange:", {
                      selectedValue: e.target.value,
                      willSetTo: e.target.value === "all" ? undefined : e.target.value
                    });
                    handleFilterChange("status", e.target.value === "all" ? undefined : (e.target.value as OrderStatus));
                  }}
                  onFocus={e => {
                    e.stopPropagation();
                    console.log("🎯 Status select: Focused");
                  }}
                  onBlur={e => {
                    e.stopPropagation();
                    console.log("🎯 Status select: Blurred");
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    console.log("🖱️ Status select: Clicked");
                  }}
                  className="w-48 h-11 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none appearance-none cursor-pointer"
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
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Order Type Filter - Using stable native select */}
              <div className="relative">
                <select
                  value={filters.orderType || "all"}
                  onChange={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("🔧 Order Type select onChange:", {
                      selectedValue: e.target.value,
                      willSetTo: e.target.value === "all" ? undefined : e.target.value
                    });
                    handleFilterChange("orderType", e.target.value === "all" ? undefined : (e.target.value as OrderType));
                  }}
                  onFocus={e => {
                    e.stopPropagation();
                    console.log("🎯 Order Type select: Focused");
                  }}
                  onBlur={e => {
                    e.stopPropagation();
                    console.log("🎯 Order Type select: Blurred");
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    console.log("🖱️ Order Type select: Clicked");
                  }}
                  className="w-48 h-11 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="delivery">Delivery</option>
                  <option value="takeaway">Takeaway</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <Button variant="outline" onClick={clearFilters} className="h-11 px-4 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                Clear Filters
              </Button>

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
            console.log("📜 Scroll event:", {
              scrollTop: target.scrollTop,
              scrollHeight: target.scrollHeight,
              clientHeight: target.clientHeight
            });
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
                <h3 className="text-lg font-medium mb-2">No orders found</h3>
                <p className="text-sm text-center max-w-md">{filters.searchTerm || filters.status || filters.orderType ? "Try adjusting your filters to see more results" : "No delivery or takeaway orders available at the moment"}</p>
              </div>
            ) : viewMode === "list" ? (
              /* List View */
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-900">Order</TableHead>
                      <TableHead className="font-semibold text-gray-900">Customer</TableHead>
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
                          console.log("🖱️ Table row clicked:", {
                            orderNumber: order.orderNumber,
                            targetTag: target.tagName,
                            targetClass: target.className,
                            hasButton: !!target.closest("button"),
                            hasActionButton: !!target.closest(".action-button")
                          });

                          if (target.closest("button") || target.closest(".action-button")) {
                            console.log("❌ Table row click: Prevented - clicked on action button");
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }

                          console.log("✅ Table row click: Calling handleOrderSelect");
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
                      console.log("🖱️ Card clicked:", {
                        orderNumber: order.orderNumber,
                        targetTag: target.tagName,
                        targetClass: target.className,
                        hasActionButton: !!target.closest(".action-button"),
                        hasSvg: !!target.closest("svg")
                      });

                      if (target.closest(".action-button") || target.closest("svg")) {
                        console.log("❌ Card click: Prevented - clicked on action button or SVG");
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }

                      console.log("✅ Card click: Calling handleOrderSelect");
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
    </div>
  );

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
        onClose={handleCloseOrderDetails}
        order={selectedOrder}
        isLoading={isLoadingOrderDetails}
      />

      {/* Receipt Printer Dialog */}
      <ReceiptPrinter isOpen={showReceiptDialog} onClose={handleCloseReceiptDialog} receiptData={receiptData} autoPrint={false} />
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const POSClientOrders = React.memo(POSClientOrdersComponent, (prevProps, nextProps) => {
  // Custom comparison function
  const isEqual = prevProps.isOpen === nextProps.isOpen && prevProps.onClose === nextProps.onClose && prevProps.onOrderSelect === nextProps.onOrderSelect;

  return isEqual;
});
