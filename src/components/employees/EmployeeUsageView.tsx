import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { employeesAtom, fetchUsageAtom, fetchUsageStatsAtom, settlementsAtom, usagesAtom, usagesFiltersAtom, usagesLoadingAtom, usageStatsAtom } from "@/store/employeeAtoms";
import { type EmployeeUsage, type EmployeeUsageType, type EmployeeSettlement, type GroupedOrder, usageTypes, usageTypeColors, EmployeeUsageViewProps } from "@/types/employee";
import { ArrowRight, ChevronDown, ChevronRight, Download, Filter, ShoppingCart, TrendingUp, UserPlus } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import { addDays } from "date-fns";
import { useNavigate } from "react-router-dom";

export const EmployeeUsageView: React.FC<EmployeeUsageViewProps> = ({ selectedEmployeeId, onEmployeeSelect }) => {
  const navigate = useNavigate();
  const [usages] = useAtom(usagesAtom);
  const [loading] = useAtom(usagesLoadingAtom);
  const [filters, setFilters] = useAtom(usagesFiltersAtom);
  const [usageStats] = useAtom(usageStatsAtom);
  const [employees] = useAtom(employeesAtom);
  const [settlements] = useAtom(settlementsAtom);
  const [, fetchUsages] = useAtom(fetchUsageAtom);
  const [, fetchStats] = useAtom(fetchUsageStatsAtom);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [addingToSettlement, setAddingToSettlement] = useState<Set<number>>(new Set());
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: addDays(new Date(), -30),
    to: new Date()
  });

  // Support both controlled (via props) and uncontrolled (internal) employee selection
  const [internalSelectedEmployeeId, setInternalSelectedEmployeeId] = useState<number | null>(selectedEmployeeId ?? null);
  useEffect(() => {
    setInternalSelectedEmployeeId(selectedEmployeeId ?? null);
  }, [selectedEmployeeId]);

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
            firstName: usage.employee?.firstName || "",
            lastName: usage.employee?.lastName || ""
          },
          creator: usage.recorder
            ? {
                id: usage.recorder.id,
                firstName: usage.recorder.firstName,
                lastName: usage.recorder.lastName,
                username: usage.recorder.username
              }
            : undefined,
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
      order.totalCost += totalCost;
      order.totalDiscountAmount += discountAmount;
      order.finalCost += finalCost;
      order.itemCount += 1;
      order.isSettled = order.isSettled && usage.isSettled;
    });

    return Array.from(orderMap.values()).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [usages]);

  // Build employees list from usages response to ensure the dropdown always has data
  const employeesFromUsages = useMemo(() => {
    const map = new Map<
      number,
      {
        id: number;
        employeeNumber: string;
        firstName: string;
        lastName: string;
        user?: { firstName: string; lastName: string } | null;
      }
    >();
    usages.forEach(u => {
      const e = u.employee;
      if (e) {
        if (!map.has(e.id)) {
          map.set(e.id, {
            id: e.id,
            employeeNumber: e.employeeNumber || "",
            firstName: e.firstName || "",
            lastName: e.lastName || "",
            user: e.user ?? null
          });
        }
      } else if (u.employeeId && !map.has(u.employeeId)) {
        // Fallback if API didn't embed employee object
        map.set(u.employeeId, {
          id: u.employeeId,
          employeeNumber: "",
          firstName: "",
          lastName: "",
          user: null
        });
      }
    });
    const list = Array.from(map.values());
    // Sort by full name if available
    list.sort((a, b) => {
      const an = `${a.firstName} ${a.lastName}`.trim().toLowerCase();
      const bn = `${b.firstName} ${b.lastName}`.trim().toLowerCase();
      return an.localeCompare(bn);
    });
    return list;
  }, [usages]);

  // Use usages-derived employees if available; otherwise fallback to employees store
  const employeesOptions = employeesFromUsages.length > 0 ? employeesFromUsages : employees;

  // Effective selected employee id (prop takes precedence, falls back to internal state)
  const effectiveSelectedEmployeeId = selectedEmployeeId ?? internalSelectedEmployeeId;

  useEffect(() => {
    const loadData = async () => {
      try {
        const updatedFilters = {
          ...filters,
          employeeId: effectiveSelectedEmployeeId || undefined,
          startDate: dateRange.from.toISOString().split("T")[0],
          endDate: dateRange.to.toISOString().split("T")[0]
        };
        setFilters(updatedFilters);
        await Promise.all([fetchUsages(updatedFilters), fetchStats(updatedFilters)]);
      } catch (error) {
        console.error("Failed to load usage data:", error);
      }
    };

    loadData();
  }, [effectiveSelectedEmployeeId, dateRange]);

  const handleEmployeeChange = (employeeId: string) => {
    const id = employeeId === "all" ? null : parseInt(employeeId);
    if (onEmployeeSelect) {
      onEmployeeSelect(id);
    } else {
      setInternalSelectedEmployeeId(id);
    }
  };

  // Export currently displayed grouped orders to CSV
  const exportUsages = () => {
    if (loading || (groupedOrders?.length || 0) === 0) return;

    const headers = [
      "Order",
      "Transaction ID",
      "Employee",
      "Employee Number",
      "Created By",
      "Username",
      "Date & Time",
      "Items Count",
      "Total Cost",
      "Discount Amount",
      "Final Cost",
      "Status",
      "Order Total",
      "Notes"
    ];

    const rows = groupedOrders.map(order => {
      const employeeName = (() => {
        const userName = `${order.employee.user?.firstName ?? ""} ${order.employee.user?.lastName ?? ""}`.trim();
        const fallback = `${order.employee.firstName ?? ""} ${order.employee.lastName ?? ""}`.trim();
        return userName || fallback || `Employee #${order.employee.id}`;
      })();
      const employeeNumber = order.employee.employeeNumber ?? "-";
      const creatorName = order.creator ? `${order.creator.firstName} ${order.creator.lastName}` : "Unknown";
      const creatorUsername = order.creator?.username ?? "";
      const dt = new Date(order.orderDate);
      const dateTime = isNaN(dt.getTime()) ? "-" : formatDateForCSV(dt);
      const orderTotal = order.items[0]?.order?.total != null ? Number(parseFloat(order.items[0].order.total.toString())).toFixed(2) : "-";
      const notes = order.items[0]?.notes ? String(order.items[0].notes) : "";

      // Determine payment/settlement status similar to UI
      const employeeId = order.employee.id;
      const settledUsages = order.items.filter(i => i.isSettled);
      const isPaid = settledUsages.some(usage =>
        settlements.find(
          s => s.employeeId === employeeId && s.settlementData?.usageBreakdown?.some(ub => ub.id === usage.id) && s.status === "paid"
        )
      );
      const status = isPaid ? "Paid" : order.isSettled ? "Settled (Unpaid)" : "Pending Settlement";

      const values: (string | number)[] = [
        order.posTransactionId.startsWith("individual-") ? "Individual Usage" : "POS Order",
        order.posTransactionId,
        employeeName,
        String(employeeNumber),
        creatorName,
        creatorUsername,
        dateTime,
        String(order.itemCount),
        Number(order.totalCost ?? 0).toFixed(2),
        Number(order.totalDiscountAmount ?? 0).toFixed(2),
        Number(order.finalCost ?? 0).toFixed(2),
        status,
        orderTotal,
        notes
      ];

      const escapeCSV = (v: string | number) => {
        const s = String(v ?? "");
        if (/[",\n]/.test(s)) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };

      return values.map(escapeCSV).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    // Build filename with current filters
    const emp = (selectedEmployeeId ?? internalSelectedEmployeeId) ?? "all";
    const type = filters.usageType ?? "all";
    const settled = filters.isSettled === undefined ? "all" : filters.isSettled ? "settled" : "unsettled";
    const from = dateRange.from.toISOString().split("T")[0];
    const to = dateRange.to.toISOString().split("T")[0];
    const filename = `employee-usage_emp-${emp}_type-${type}_status-${settled}_from-${from}_to-${to}.csv`;

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    if (amount == null || isNaN(amount) || !isFinite(amount)) {
      return "$0.00";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const formatQuantity = (quantity: number) => {
    return Number(quantity) % 1 === 0 ? Math.floor(quantity) : Number(quantity).toFixed(2);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format: DD-MM-YYYY HH:MM:SS AM/PM
  const formatDateForCSV = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hh = pad(hours);
    return `${day}-${month}-${year} ${hh}:${minutes}:${seconds} ${ampm}`;
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
    return `${transactionId}`;
  };

  const getAvailableSettlements = (employeeId: number): EmployeeSettlement[] => {
    return settlements.filter(settlement => settlement.employeeId === employeeId && (settlement.status === "pending" || settlement.status === "approved"));
  };

  const addUsageToSettlement = async (usageId: number, settlementId: number) => {
    setAddingToSettlement(prev => new Set(prev).add(usageId));
    try {
      const { employeeAPI } = await import("@/api/employee.api");
      const updateResult = await employeeAPI.updateUsage(usageId, {
        isSettled: true,
        settlementId: settlementId
      });

      if (updateResult.success) {
        const recalculateResult = await employeeAPI.updateSettlement(settlementId, {
          totalUsageCost: 0
        });

        if (recalculateResult.success) {
          toast({
            title: "Success",
            description: "Usage added to settlement successfully"
          });

          await fetchUsages(filters);
        } else {
          console.warn("Usage marked as settled but settlement totals may not be updated:", recalculateResult.message);
          toast({
            title: "Warning",
            description: "Usage added but settlement totals may need manual refresh",
            variant: "destructive"
          });
        }
      } else {
        throw new Error(updateResult.message || "Failed to add usage to settlement");
      }
    } catch (error) {
      console.error("Error adding usage to settlement:", error);
      toast({
        title: "Error",
        description: "Failed to add usage to settlement",
        variant: "destructive"
      });
    } finally {
      setAddingToSettlement(prev => {
        const newSet = new Set(prev);
        newSet.delete(usageId);
        return newSet;
      });
    }
  };

  // Helper function to add all order items to settlement
  const addAllOrderItemsToSettlement = async (order: GroupedOrder, settlementId: number) => {
    const unsettledItems = order.items.filter(item => !item.isSettled);

    if (unsettledItems.length === 0) {
      toast({
        title: "Info",
        description: "All items in this order are already settled"
      });
      return;
    }

    // Mark all items as being added
    setAddingToSettlement(prev => {
      const newSet = new Set(prev);
      unsettledItems.forEach(item => newSet.add(item.id));
      return newSet;
    });

    try {
      const { employeeAPI } = await import("@/api/employee.api");
      let successCount = 0;
      let failureCount = 0;

      // Add each unsettled item to the settlement
      for (const item of unsettledItems) {
        try {
          const updateResult = await employeeAPI.updateUsage(item.id, {
            isSettled: true,
            settlementId: settlementId
          });

          if (updateResult.success) {
            successCount++;
          } else {
            failureCount++;
            console.warn(`Failed to add item ${item.id} to settlement:`, updateResult.message);
          }
        } catch (error) {
          failureCount++;
          console.error(`Error adding item ${item.id} to settlement:`, error);
        }
      }

      if (successCount > 0) {
        // Trigger settlement recalculation
        const recalculateResult = await employeeAPI.updateSettlement(settlementId, {
          totalUsageCost: 0 // This triggers the recalculation logic in the backend
        });

        if (recalculateResult.success) {
          toast({
            title: "Success",
            description: `${successCount} item${successCount !== 1 ? "s" : ""} added to settlement successfully${failureCount > 0 ? `. ${failureCount} item${failureCount !== 1 ? "s" : ""} failed to add.` : ""}`
          });
        } else {
          toast({
            title: "Warning",
            description: `Items added but settlement totals may need manual refresh`,
            variant: "destructive"
          });
        }

        // Refresh the usages to reflect the changes
        await fetchUsages(filters);
      } else {
        toast({
          title: "Error",
          description: "Failed to add any items to settlement",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error adding order items to settlement:", error);
      toast({
        title: "Error",
        description: "Failed to add order items to settlement",
        variant: "destructive"
      });
    } finally {
      // Remove all items from the adding state
      setAddingToSettlement(prev => {
        const newSet = new Set(prev);
        unsettledItems.forEach(item => newSet.delete(item.id));
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employee Usages</h2>
        </div>
      </div>

      {/* Stats Cards */}
      {usageStats && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">Total Usage Records</CardTitle>
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-lg font-bold">{usageStats.totals.totalCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">Total Cost</CardTitle>
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-lg font-bold">{formatCurrency(usageStats.totals.totalCost)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">Final Cost</CardTitle>
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-lg font-bold">{formatCurrency(usageStats.totals.totalFinalCost)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
              <CardTitle className="text-xs font-medium">Total Savings</CardTitle>
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-lg font-bold text-green-600">{formatCurrency(usageStats.totals.totalDiscountAmount)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-3 w-3" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <Select value={effectiveSelectedEmployeeId?.toString() || "all"} onValueChange={handleEmployeeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employeesOptions.map(employee => {
                    const firstName = employee.user?.firstName ?? employee.firstName ?? "";
                    const lastName = employee.user?.lastName ?? employee.lastName ?? "";
                    const fullName = `${firstName} ${lastName}`.trim() || employee.employeeNumber || `Employee #${employee.id}`;
                    return (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {fullName}
                      </SelectItem>
                    );
                  })}
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

            <Button variant="outline" className="gap-2" onClick={exportUsages} disabled={loading || groupedOrders.length === 0}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Employee Orders
          </CardTitle>
          <Button onClick={() => navigate("/employees/settlements")}>
            Settlements
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Final Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
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
                          <div className="text-sm text-muted-foreground">{order.posTransactionId.startsWith("individual-") ? "Individual usage record" : "POS Order"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {order.employee.user?.firstName} {order.employee.user?.lastName}
                          </div>
                          <div className="font-medium flex flex-col items-center gap-2">
                            {order.employee.firstName + " " + order.employee.lastName}
                            <Badge variant="outline" className="!text-[0.7rem] text-muted-foreground">
                              {order.employee.employeeNumber}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.creator ? `${order.creator.firstName} ${order.creator.lastName}` : "Unknown"}</div>
                          {order.creator && <div className="text-sm text-muted-foreground">{order.creator.username}</div>}
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
                          {(() => {
                            // For employee orders, payment status is based on settlement payment, not order status
                            const employeeId = order.employee.id;
                            const orderUsages = order.items.filter(item => item.isSettled);

                            // Check if any usage in this order belongs to a paid settlement
                            const isPaid = orderUsages.some(usage => {
                              const settlement = settlements.find(s => s.employeeId === employeeId && s.settlementData?.usageBreakdown?.some(ub => ub.id === usage.id) && s.status === "paid");
                              return settlement !== undefined;
                            });

                            // Determine status based on settlement payment
                            if (isPaid) {
                              return (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  Paid
                                </Badge>
                              );
                            } else if (order.isSettled) {
                              return (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  Settled (Unpaid)
                                </Badge>
                              );
                            } else {
                              return (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                  Pending Settlement
                                </Badge>
                              );
                            }
                          })()}
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          {(() => {
                            const employeeId = order.employee.id;
                            const availableSettlements = getAvailableSettlements(employeeId);
                            const unsettledItems = order.items.filter(item => !item.isSettled);
                            const isAddingAny = unsettledItems.some(item => addingToSettlement.has(item.id));

                            if (unsettledItems.length === 0) {
                              return (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  All Settled
                                </Badge>
                              );
                            }

                            if (availableSettlements.length === 0) {
                              return <div className="text-xs text-muted-foreground text-center px-2 py-1 bg-orange-50 rounded border border-orange-200">No settlements</div>;
                            }

                            return (
                              <Button size="sm" variant="outline" className="h-8 px-3 text-xs" disabled={isAddingAny} onClick={() => addAllOrderItemsToSettlement(order, availableSettlements[0].id)}>
                                {isAddingAny ? (
                                  <>
                                    <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Add All ({unsettledItems.length})
                                  </>
                                )}
                              </Button>
                            );
                          })()}
                        </TableCell>
                      </TableRow>

                      {/* Expanded Items */}
                      {expandedOrders.has(order.posTransactionId) && (
                        <TableRow>
                          <TableCell colSpan={10} className="p-0">
                            <div className="bg-muted/30 p-4">
                              <div className="text-sm font-medium mb-3 text-muted-foreground">Order Items:</div>
                              <div className="grid gap-2">
                                {order.items.map(item => {
                                  const employeeId = item.employee?.id || 0;
                                  const availableSettlements = getAvailableSettlements(employeeId);
                                  const isSettled = item.isSettled;
                                  const isAddingToSettlement = addingToSettlement.has(item.id);

                                  return (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-background rounded border">
                                      <div className="flex items-center gap-3">
                                        <Badge variant="secondary" className={usageTypeColors[item.usageType]}>
                                          {item.usageType.replace("_", " ")}
                                        </Badge>
                                        <div>
                                          <div className="font-medium">{getItemName(item)}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {formatQuantity(item.quantity)} {item.unit} × {formatCurrency(item.unitCost)}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="text-right">
                                          {item.discountAmount > 0 ? (
                                            <>
                                              <div className="font-mono text-sm text-muted-foreground line-through">{formatCurrency(item.totalCost)}</div>
                                              <div className="text-sm text-green-600">
                                                -{formatCurrency(item.discountAmount)} ({item.discountApplied}%)
                                              </div>
                                              <div className="font-mono font-medium">{formatCurrency(item.finalCost)}</div>
                                            </>
                                          ) : (
                                            <div className="font-mono font-medium">{formatCurrency(item.finalCost)}</div>
                                          )}
                                        </div>

                                        {/* Settlement Action */}
                                        <div className="flex flex-col gap-1">
                                          {isSettled ? (
                                            <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                              Settled
                                            </Badge>
                                          ) : availableSettlements.length > 0 ? (
                                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={isAddingToSettlement} onClick={() => addUsageToSettlement(item.id, availableSettlements[0].id)}>
                                              {isAddingToSettlement ? (
                                                "Adding..."
                                              ) : (
                                                <>
                                                  <UserPlus className="h-3 w-3 mr-1" />
                                                  Add to Settlement
                                                </>
                                              )}
                                            </Button>
                                          ) : (
                                            <div className="text-xs text-muted-foreground text-center px-2 py-1 bg-orange-50 rounded border border-orange-200">No available settlements</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
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
