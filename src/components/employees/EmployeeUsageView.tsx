import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { employeesAtom, fetchUsageAtom, fetchUsageStatsAtom, usagesAtom, usagesFiltersAtom, usagesLoadingAtom, usageStatsAtom } from "@/store/employeeAtoms";
import type { EmployeeUsage, EmployeeUsageType } from "@/types/employee";
import { addDays } from "date-fns";
import { useAtom } from "jotai";
import { ChevronDown, ChevronRight, Download, Filter, Plus, ShoppingCart, TrendingUp } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface EmployeeUsageViewProps {
  selectedEmployeeId?: number | null;
  onEmployeeSelect?: (employeeId: number | null) => void;
}

const usageTypeColors = {
  material: "bg-blue-100 text-blue-800",
  menu_item: "bg-green-100 text-green-800",
  stock_entry: "bg-orange-100 text-orange-800"
};

const usageTypes: EmployeeUsageType[] = ["material", "menu_item", "stock_entry"];

interface GroupedOrder {
  posTransactionId: string;
  employee: {
    id: number;
    employeeNumber: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  orderDate: string;
  items: EmployeeUsage[];
  totalCost: number;
  totalDiscountAmount: number;
  finalCost: number;
  itemCount: number;
  isSettled: boolean;
}

export const EmployeeUsageView: React.FC<EmployeeUsageViewProps> = ({ selectedEmployeeId, onEmployeeSelect }) => {
  const [usages] = useAtom(usagesAtom);
  const [loading] = useAtom(usagesLoadingAtom);
  const [filters, setFilters] = useAtom(usagesFiltersAtom);
  const [usageStats] = useAtom(usageStatsAtom);
  const [employees] = useAtom(employeesAtom);
  const [, fetchUsages] = useAtom(fetchUsageAtom);
  const [, fetchStats] = useAtom(fetchUsageStatsAtom);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: addDays(new Date(), -30),
    to: new Date()
  });

  // Group usage records by POS transaction ID
  const groupedOrders = useMemo(() => {
    const orderMap = new Map<string, GroupedOrder>();

    usages.forEach(usage => {
      const transactionId = usage.posTransactionId || `individual-${usage.id}`;

      if (!orderMap.has(transactionId)) {
        orderMap.set(transactionId, {
          posTransactionId: transactionId,
          employee: {
            id: usage.employee?.id || 0,
            employeeNumber: usage.employee?.employeeNumber || "",
            user: usage.employee?.user
          },
          orderDate: usage.usageDate,
          items: [],
          totalCost: 0,
          totalDiscountAmount: 0,
          finalCost: 0,
          itemCount: 0,
          isSettled: usage.isSettled
        });
      }

      const order = orderMap.get(transactionId)!;
      order.items.push(usage);

      // Convert string/number values to numbers with proper null/undefined handling
      const totalCost = (() => {
        const value = usage.totalCost;
        if (value === null || value === undefined) return 0;
        const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
        return isNaN(parsed) ? 0 : parsed;
      })();

      const discountAmount = (() => {
        const value = usage.discountAmount;
        if (value === null || value === undefined) return 0;
        const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
        return isNaN(parsed) ? 0 : parsed;
      })();

      const finalCost = (() => {
        const value = usage.finalCost;
        if (value === null || value === undefined) return 0;
        const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
        return isNaN(parsed) ? 0 : parsed;
      })();

      // Debug logging to check values (remove this after testing)
      console.log("Usage cost values:", {
        id: usage.id,
        originalTotalCost: usage.totalCost,
        originalDiscountAmount: usage.discountAmount,
        originalFinalCost: usage.finalCost,
        parsedTotalCost: totalCost,
        parsedDiscountAmount: discountAmount,
        parsedFinalCost: finalCost
      });

      order.totalCost += totalCost;
      order.totalDiscountAmount += discountAmount;
      order.finalCost += finalCost;
      order.itemCount += 1;

      // Order is settled only if ALL items are settled
      order.isSettled = order.isSettled && usage.isSettled;
    });

    return Array.from(orderMap.values()).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [usages]);

  // Load data when employee or date range changes
  useEffect(() => {
    const loadData = async () => {
      // Create updated filters
      const updatedFilters = {
        ...filters,
        employeeId: selectedEmployeeId || undefined,
        startDate: dateRange.from.toISOString().split("T")[0],
        endDate: dateRange.to.toISOString().split("T")[0]
      };

      // Update filters state
      setFilters(updatedFilters);

      // Fetch data with updated filters
      await fetchUsages(updatedFilters);
      await fetchStats(updatedFilters);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId, dateRange]); // Intentionally excluding setFilters, fetchUsages, fetchStats to prevent infinite loops

  const handleEmployeeChange = (employeeId: string) => {
    const id = employeeId === "all" ? null : parseInt(employeeId);
    onEmployeeSelect?.(id);
  };

  const handleUsageTypeFilter = async (usageType: string) => {
    const updatedFilters = {
      ...filters,
      usageType: usageType === "all" ? undefined : (usageType as EmployeeUsageType)
    };
    setFilters(updatedFilters);
    await fetchUsages(updatedFilters);
  };

  const handleSettledFilter = async (settled: string) => {
    const updatedFilters = {
      ...filters,
      isSettled: settled === "all" ? undefined : settled === "settled"
    };
    setFilters(updatedFilters);
    await fetchUsages(updatedFilters);
  };

  const toggleOrderExpansion = (transactionId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedOrders(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getItemName = (usage: EmployeeUsage) => {
    switch (usage.usageType) {
      case "material":
        return usage.material?.name || "Unknown Material";
      case "menu_item":
        return usage.menuItem?.name || "Unknown Menu Item";
      case "stock_entry":
        return `Stock Entry #${usage.stockEntryId}`;
      default:
        return "Unknown Item";
    }
  };

  const getOrderDisplayId = (transactionId: string) => {
    if (transactionId.startsWith("individual-")) {
      return "Individual Usage";
    }
    return `Order #${transactionId}`;
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employee Usage Tracking</h2>
          <p className="text-muted-foreground">Monitor employee usage of materials, menu items, and stock entries</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Record Usage
        </Button>
      </div>

      {/* Stats Cards */}
      {usageStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usage Records</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.totals.totalCount}</div>
              <p className="text-xs text-muted-foreground">In selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(usageStats.totals.totalCost)}</div>
              <p className="text-xs text-muted-foreground">Before discounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Final Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(usageStats.totals.totalFinalCost)}</div>
              <p className="text-xs text-muted-foreground">After discounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(usageStats.totals.totalDiscountAmount)}</div>
              <p className="text-xs text-muted-foreground">Employee discounts</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedEmployeeId?.toString() || "all"} onValueChange={handleEmployeeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.user?.firstName} {employee.user?.lastName} (#{employee.employeeNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <Select value={filters.usageType || "all"} onValueChange={handleUsageTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Usage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {usageTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <Select value={filters.isSettled === undefined ? "all" : filters.isSettled ? "settled" : "unsettled"} onValueChange={handleSettledFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Settlement status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                  <SelectItem value="unsettled">Unsettled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[250px]">
              <DatePickerWithRange
                date={dateRange}
                onDateChange={range => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
              />
            </div>

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Employee Orders
          </CardTitle>
          <CardDescription>Employee orders grouped by transaction with expandable item details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Final Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : groupedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedOrders.map(order => (
                    <React.Fragment key={order.posTransactionId}>
                      {/* Main Order Row */}
                      <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleOrderExpansion(order.posTransactionId)}>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            {expandedOrders.has(order.posTransactionId) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{getOrderDisplayId(order.posTransactionId)}</div>
                          <div className="text-sm text-muted-foreground">{order.posTransactionId.startsWith("individual-") ? "Individual usage record" : "POS Transaction"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {order.employee.user?.firstName} {order.employee.user?.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">#{order.employee.employeeNumber}</div>
                        </TableCell>
                        <TableCell className="text-sm">{formatDateTime(order.orderDate)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{formatCurrency(order.totalCost)}</TableCell>
                        <TableCell className="font-mono text-green-600">{order.totalDiscountAmount > 0 ? formatCurrency(order.totalDiscountAmount) : "-"}</TableCell>
                        <TableCell className="font-mono font-medium">
                          {formatCurrency(order.finalCost)}
                          {/* Show order total if available and different from final cost */}
                          {order.items[0]?.order?.total && <div className="text-xs text-muted-foreground mt-1">Order: {formatCurrency(parseFloat(order.items[0].order.total.toString()))}</div>}
                        </TableCell>
                        <TableCell>
                          {/* Show order status if available, otherwise show settlement status */}
                          {order.items[0]?.order?.status ? (
                            <Badge
                              variant={order.items[0].order.status === "paid" ? "default" : "secondary"}
                              className={`${
                                order.items[0].order.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : order.items[0].order.status === "draft"
                                    ? "bg-gray-100 text-gray-800"
                                    : order.items[0].order.status === "confirmed"
                                      ? "bg-blue-100 text-blue-800"
                                      : order.items[0].order.status === "preparing"
                                        ? "bg-orange-100 text-orange-800"
                                        : order.items[0].order.status === "ready"
                                          ? "bg-purple-100 text-purple-800"
                                          : order.items[0].order.status === "served"
                                            ? "bg-indigo-100 text-indigo-800"
                                            : order.items[0].order.status === "cancelled"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {order.items[0].order.status.charAt(0).toUpperCase() + order.items[0].order.status.slice(1)}
                            </Badge>
                          ) : (
                            <Badge variant={order.isSettled ? "default" : "secondary"} className={order.isSettled ? "bg-green-100 text-green-800" : ""}>
                              {order.isSettled ? "Settled" : "Pending"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded Items */}
                      {expandedOrders.has(order.posTransactionId) && (
                        <TableRow>
                          <TableCell colSpan={9} className="p-0">
                            <div className="bg-muted/30 p-4">
                              <div className="text-sm font-medium mb-3 text-muted-foreground">Order Items:</div>
                              <div className="grid gap-2">
                                {order.items.map(item => (
                                  <div key={item.id} className="flex items-center justify-between p-3 bg-background rounded border">
                                    <div className="flex items-center gap-3">
                                      <Badge variant="secondary" className={usageTypeColors[item.usageType]}>
                                        {item.usageType.replace("_", " ")}
                                      </Badge>
                                      <div>
                                        <div className="font-medium">{getItemName(item)}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {item.quantity} {item.unit} × {formatCurrency(item.unitCost)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-mono">{formatCurrency(item.totalCost)}</div>
                                      {item.discountAmount > 0 && (
                                        <div className="text-sm text-green-600">
                                          -{formatCurrency(item.discountAmount)} ({item.discountApplied}%)
                                        </div>
                                      )}
                                      <div className="font-mono font-medium">{formatCurrency(item.finalCost)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {/* Order Information Section */}
                              {order.items[0]?.order && (
                                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                                  <div className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4" />
                                    Order Information
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Order Number:</span>
                                      <div className="font-medium">{order.items[0].order.orderNumber}</div>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Type:</span>
                                      <div className="font-medium capitalize">{order.items[0].order.orderType}</div>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Status:</span>
                                      <div>
                                        <Badge variant={order.items[0].order.status === "paid" ? "default" : "secondary"} className={`text-xs ${order.items[0].order.status === "paid" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                          {order.items[0].order.status}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Order Total:</span>
                                      <div className="font-medium font-mono">{formatCurrency(parseFloat(order.items[0].order.total?.toString() || "0"))}</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Notes Section */}
                              {order.items[0]?.notes && (
                                <div className="mt-3 p-2 bg-background rounded border">
                                  <div className="text-sm font-medium text-muted-foreground mb-1">Notes:</div>
                                  <div className="text-sm">{order.items[0].notes}</div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
