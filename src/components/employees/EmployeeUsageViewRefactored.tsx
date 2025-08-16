import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { format, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getExpandedRowModel } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

// Icons
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

// Atoms and Types
import { employeesAtom, fetchUsageAtom, fetchUsageStatsAtom, settlementsAtom, usagesAtom, usagesFiltersAtom, usagesLoadingAtom, usageStatsAtom } from "@/store/employeeAtoms";
import type { EmployeeUsage, EmployeeUsageType, EmployeeSettlement } from "@/types/employee";

// Utility functions defined inline
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

// Define GroupedOrder type based on the existing implementation
type GroupedOrder = {
  posTransactionId: string;
  employee: {
    id: number;
    employeeNumber: string;
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
  };
  orderDate: string;
  items: EmployeeUsage[];
  totalCost: number;
  totalDiscountAmount: number;
  finalCost: number;
  itemCount: number;
  isSettled: boolean;
};

export const EmployeeUsageView = ({ prefetchedUsages = null, prefetchedStats = null, isLoading = false }: { prefetchedUsages?: EmployeeUsage[] | null; prefetchedStats?: any | null; isLoading?: boolean }) => {
  // Atoms
  const [usages, setUsages] = useAtom(usagesAtom);
  const [filters, setFilters] = useAtom(usagesFiltersAtom);
  const [, fetchUsages] = useAtom(fetchUsageAtom);
  const [, fetchStats] = useAtom(fetchUsageStatsAtom);
  const employees = useAtomValue(employeesAtom);
  const stats = useAtomValue(usageStatsAtom);
  const settlements = useAtomValue(settlementsAtom);

  // Store all usages for client-side filtering
  const [allUsages, setAllUsages] = useState<EmployeeUsage[]>(Array.isArray(prefetchedUsages) ? prefetchedUsages : []);
  const [allStats, setAllStats] = useState<any>(prefetchedStats || {});
  const [, setStats] = useAtom(usageStatsAtom);
  const initialLoadComplete = useRef(false);

  // Local state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedUsageType, setSelectedUsageType] = useState<EmployeeUsageType | "all">("all");
  const [selectedSettlementStatus, setSelectedSettlementStatus] = useState<"all" | "settled" | "unsettled">("all");
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Apply client-side filtering to usages
  const filteredUsages = useMemo(() => {
    // Ensure allUsages is an array before filtering
    const usagesArray = Array.isArray(allUsages) ? allUsages : [];
    
    return usagesArray.filter(usage => {
      // Skip null/undefined items
      if (!usage || typeof usage !== 'object') return false;
      
      // Filter by employee
      if (selectedEmployeeId && usage.employee?.id?.toString() !== selectedEmployeeId) {
        return false;
      }

      // Filter by usage type
      if (selectedUsageType !== "all" && usage.usageType !== selectedUsageType) {
        return false;
      }

      // Filter by settlement status
      if (selectedSettlementStatus === "settled" && !usage.isSettled) {
        return false;
      }
      if (selectedSettlementStatus === "unsettled" && usage.isSettled) {
        return false;
      }

      // Filter by date range
      if (dateRange.from && dateRange.to) {
        const usageDate = new Date(usage.usageDate);
        const startDate = new Date(dateRange.from);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);

        if (usageDate < startDate || usageDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [allUsages, selectedEmployeeId, selectedUsageType, selectedSettlementStatus, dateRange]);

  // Group orders by transaction ID
  const groupedOrders = useMemo(() => {
    const orderMap = new Map<string, GroupedOrder>();
    filteredUsages.forEach(usage => {
      const transactionId = usage.posTransactionId || `individual-${usage.id}`;
      if (!orderMap.has(transactionId)) {
        orderMap.set(transactionId, {
          posTransactionId: transactionId,
          employee: {
            id: usage.employee?.id || 0,
            employeeNumber: usage.employee?.employeeNumber || "",
            user: usage.employee?.user
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
  }, [filteredUsages]);

  // Load all data on component mount once
  useEffect(() => {
    const loadAllData = async () => {
      if (prefetchedUsages && prefetchedStats) {
        // Use prefetched data if available, ensuring it's an array
        setAllUsages(Array.isArray(prefetchedUsages) ? prefetchedUsages : []);
        setAllStats(prefetchedStats || {});
        initialLoadComplete.current = true;
        return;
      }

      try {
        // Fetch all data without filters for client-side filtering
        const baseFilters = {
          startDate: addDays(new Date(), -90).toISOString().split("T")[0], // Get 90 days of data
          endDate: new Date().toISOString().split("T")[0]
        };

        const [usagesData, statsData] = await Promise.all([fetchUsages(baseFilters), fetchStats(baseFilters)]);

        // Store all data for client-side filtering
        setAllUsages(Array.isArray(usagesData) ? usagesData : []);
        setAllStats(statsData || {});
        initialLoadComplete.current = true;
      } catch (error) {
        console.error("Failed to load usage data:", error);
      }
    };

    if (!initialLoadComplete.current) {
      loadAllData();
    }
  }, [prefetchedUsages, prefetchedStats, fetchUsages, fetchStats]);

  // Update filters in the atom for other components that might need it
  useEffect(() => {
    if (initialLoadComplete.current) {
      const updatedFilters = {
        ...filters,
        employeeId: selectedEmployeeId || undefined,
        startDate: dateRange.from.toISOString().split("T")[0],
        endDate: dateRange.to.toISOString().split("T")[0]
      };
      setFilters(updatedFilters);
    }
  }, [selectedEmployeeId, dateRange, filters, setFilters]);

  // Update usages atom with filtered results for other components that might need it
  useEffect(() => {
    if (initialLoadComplete.current) {
      setUsages(filteredUsages);
      setStats(allStats); // Update the stats atom with the current stats
    }
  }, [filteredUsages, allStats, setUsages, setStats]);

  // Handle adding items to settlement with memoized callback
  const addToSettlement = useCallback(
    async (usageIds: number[], settlementId: number) => {
      try {
        const { addUsagesToSettlement } = await import("@/api/employee.api");
        await addUsagesToSettlement(settlementId, usageIds);

        // Refresh all data to maintain consistency
        const baseFilters = {
          startDate: addDays(new Date(), -90).toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0]
        };

        const [usagesData, statsData] = await Promise.all([fetchUsages(baseFilters), fetchStats(baseFilters)]);

        // Update all data for client-side filtering
        setAllUsages(usagesData || []);
        setAllStats(statsData || {});

        toast({
          title: "Success",
          description: "Items added to settlement successfully"
        });
      } catch (error) {
        console.error("Failed to add items to settlement:", error);
        toast({
          title: "Error",
          description: "Failed to add items to settlement",
          variant: "destructive"
        });
      }
    },
    [fetchUsages, fetchStats, toast]
  );

  // Handle adding all order items to settlement with memoized callback
  const addOrderToSettlement = useCallback(
    async (order: GroupedOrder, settlementId: number) => {
      const usageIds = order.items.filter(item => !item.isSettled).map(item => item.id);
      if (usageIds.length === 0) {
        toast({
          title: "Info",
          description: "All items in this order are already settled"
        });
        return;
      }
      await addToSettlement(usageIds, settlementId);
    },
    [addToSettlement, toast]
  );

  // Handle adding a single usage item to settlement with memoized callback
  const addItemToSettlement = useCallback(
    async (usage: EmployeeUsage, settlementId: number) => {
      if (usage.isSettled) {
        toast({
          title: "Info",
          description: "This item is already settled"
        });
        return;
      }
      await addToSettlement([usage.id], settlementId);
    },
    [addToSettlement, toast]
  );

  // Toggle row expansion with memoized callback
  const toggleOrderExpansion = useCallback((orderId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  }, []);

  // Define TanStack Table columns with memoization
  const columnHelper = createColumnHelper<GroupedOrder>();

  // Memoize the columns definition to prevent unnecessary re-renders
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "expander",
        header: () => null,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            onClick={e => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
            className="p-0 h-8 w-8"
          >
            {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ),
        size: 40
      }),
      columnHelper.accessor("posTransactionId", {
        header: "Order",
        cell: info => (info.getValue().startsWith("individual") ? "Individual Usage" : info.getValue()),
        size: 120
      }),
      columnHelper.accessor(row => row.employee, {
        id: "employee",
        header: "Employee",
        cell: info => {
          const employee = info.getValue();
          return `${employee.user?.firstName || ""} ${employee.user?.lastName || ""} (${employee.employeeNumber})`;
        },
        size: 150
      }),
      columnHelper.accessor(row => row.creator, {
        id: "createdBy",
        header: "Created By",
        cell: info => {
          const creator = info.getValue();
          return creator ? `${creator.firstName} ${creator.lastName}` : "N/A";
        },
        size: 150
      }),
      columnHelper.accessor("orderDate", {
        header: "Date & Time",
        cell: info => formatDateTime(info.getValue()),
        size: 150
      }),
      columnHelper.accessor("itemCount", {
        header: "Items",
        cell: info => formatQuantity(info.getValue()),
        size: 80
      }),
      columnHelper.accessor("totalCost", {
        header: "Total Cost",
        cell: info => formatCurrency(info.getValue()),
        size: 120
      }),
      columnHelper.accessor("totalDiscountAmount", {
        header: "Discount",
        cell: info => formatCurrency(info.getValue()),
        size: 120
      }),
      columnHelper.accessor("finalCost", {
        header: "Final Cost",
        cell: info => formatCurrency(info.getValue()),
        size: 120
      }),
      columnHelper.accessor(row => row.items[0]?.order?.status || "N/A", {
        id: "status",
        header: "Status",
        cell: info => {
          const status = info.getValue();
          return (
            <Badge variant={status === "paid" ? "default" : "secondary"} className={`text-xs ${status === "paid" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
              {status}
            </Badge>
          );
        },
        size: 100
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const order = row.original;
          const hasUnsettledItems = order.items.some(item => !item.isSettled);
          const employeeSettlements = settlements.filter(s => s.employeeId === order.employee.id && s.status !== "closed");

          return (
            <div className="flex space-x-2">
              {hasUnsettledItems && employeeSettlements.length > 0 && (
                <Select
                  onValueChange={value => {
                    const settlementId = parseInt(value);
                    addOrderToSettlement(order, settlementId);
                  }}
                >
                  <SelectTrigger className="h-8 w-[130px]">
                    <SelectValue placeholder="Add to settlement" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeSettlements.map(settlement => (
                      <SelectItem key={settlement.id} value={settlement.id.toString()}>
                        {settlement.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        },
        size: 150
      })
    ],
    [settlements]
  );

  // Set up TanStack Table
  const table = useReactTable({
    data: groupedOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    state: {
      expanded: Object.fromEntries(Object.entries(expandedRows).map(([key, value]) => [key, value]))
    },
    onExpandedChange: updater => {
      if (typeof updater === "function") {
        setExpandedRows(updater(expandedRows));
      } else {
        setExpandedRows(updater);
      }
    }
  });

  // Set up virtualization with optimized settings
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: useCallback(() => 50, []), // Memoized row height estimation
    overscan: 20, // Increased overscan for smoother scrolling
    measureElement:
      typeof window !== "undefined" && // Only measure in browser environment
      navigator.userAgent.indexOf("Firefox") === -1 // Skip for Firefox due to performance issues
        ? element => element?.getBoundingClientRect().height
        : undefined
  });

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedEmployeeId || ""} onValueChange={value => setSelectedEmployeeId(value === "" ? null : value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select Employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(employee => (
              <SelectItem key={employee.id} value={employee.id.toString()}>
                {employee.user?.firstName} {employee.user?.lastName} ({employee.employeeNumber})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedUsageType} onValueChange={value => setSelectedUsageType(value as EmployeeUsageType)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Usage Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pos">POS Transaction</SelectItem>
            <SelectItem value="individual">Individual Usage</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSettlementStatus} onValueChange={value => setSelectedSettlementStatus(value as "all" | "settled" | "unsettled")}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Settlement Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
            <SelectItem value="unsettled">Unsettled</SelectItem>
          </SelectContent>
        </Select>

        <DatePickerWithRange className="w-full sm:w-auto" value={dateRange} onValueChange={setDateRange} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Total Records</CardTitle>
            <CardDescription>Usage records in period</CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">{stats?.totalRecords || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Total Cost</CardTitle>
            <CardDescription>Before discounts</CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalCost || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Final Cost</CardTitle>
            <CardDescription>After discounts</CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">{formatCurrency(stats?.finalCost || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg">Savings</CardTitle>
            <CardDescription>Total discounts</CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">{formatCurrency((stats?.totalCost || 0) - (stats?.finalCost || 0))}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Usage</CardTitle>
          <CardDescription>View and manage employee usage records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div
              className="w-full overflow-auto"
              ref={tableContainerRef}
              style={{
                height: "600px",
                overscrollBehavior: "contain", // Prevent scroll chaining
                WebkitOverflowScrolling: "touch" // Smooth scrolling on iOS
              }}
            >
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id} style={{ width: header.getSize() }}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isLoading || !initialLoadComplete.current ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`loading-${i}`}>
                        {Array.from({ length: columns.length }).map((_, j) => (
                          <TableCell key={`loading-cell-${i}-${j}`} className="py-2">
                            <div className="h-4 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : groupedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    <div
                      style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: "100%",
                        position: "relative"
                      }}
                    >
                      {rowVirtualizer.getVirtualItems().map(virtualRow => {
                        const row = rows[virtualRow.index];
                        return (
                          <div
                            key={row.id}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement} // Add measurement ref for dynamic row heights
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              transform: `translateY(${virtualRow.start}px)`,
                              willChange: "transform" // Optimize for animations
                            }}
                          >
                            <TableRow
                              className="hover:bg-muted/50 cursor-pointer"
                              onClick={() => {
                                row.toggleExpanded();
                              }}
                            >
                              {row.getVisibleCells().map(cell => (
                                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                              ))}
                            </TableRow>
                            {row.getIsExpanded() && (
                              <TableRow>
                                <TableCell colSpan={columns.length} className="p-0">
                                  <div className="bg-muted/50 p-4">
                                    <div className="text-lg font-semibold mb-2">Order Details</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                      {row.original.items.map((usage, index) => (
                                        <div key={usage.id} className="bg-card rounded-lg p-3 border">
                                          <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium">{usage.item.name}</div>
                                            <Badge variant={usage.isSettled ? "default" : "outline"} className={usage.isSettled ? "bg-green-100 text-green-800" : ""}>
                                              {usage.isSettled ? "Settled" : "Unsettled"}
                                            </Badge>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                              <span className="text-muted-foreground">Quantity:</span>
                                              <div>{formatQuantity(usage.quantity)}</div>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Unit Price:</span>
                                              <div className="font-mono">{formatCurrency(parseFloat(usage.unitPrice?.toString() || "0"))}</div>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Total Cost:</span>
                                              <div className="font-mono">{formatCurrency(parseFloat(usage.totalCost?.toString() || "0"))}</div>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Final Cost:</span>
                                              <div className="font-mono">{formatCurrency(parseFloat(usage.finalCost?.toString() || "0"))}</div>
                                            </div>
                                          </div>

                                          {!usage.isSettled && (
                                            <div className="mt-3">
                                              <Select
                                                onValueChange={value => {
                                                  const settlementId = parseInt(value);
                                                  addItemToSettlement(usage, settlementId);
                                                }}
                                              >
                                                <SelectTrigger className="h-8 w-full">
                                                  <SelectValue placeholder="Add to settlement" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {settlements
                                                    .filter(s => s.employeeId === row.original.employee.id && s.status !== "closed")
                                                    .map(settlement => (
                                                      <SelectItem key={settlement.id} value={settlement.id.toString()}>
                                                        {settlement.name}
                                                      </SelectItem>
                                                    ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Order Info Section */}
                                    {row.original.items[0]?.order && (
                                      <div className="bg-card rounded-lg p-4 border">
                                        <div className="text-md font-semibold mb-2">Order Information</div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                          <div>
                                            <span className="text-muted-foreground">Order ID:</span>
                                            <div>{row.original.items[0].order.id}</div>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Status:</span>
                                            <div>
                                              <Badge variant={row.original.items[0].order.status === "paid" ? "default" : "secondary"} className={`text-xs ${row.original.items[0].order.status === "paid" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                                {row.original.items[0].order.status}
                                              </Badge>
                                            </div>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Order Total:</span>
                                            <div className="font-medium font-mono">{formatCurrency(parseFloat(row.original.items[0].order.total?.toString() || "0"))}</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Notes Section */}
                                    {row.original.items[0]?.notes && (
                                      <div className="mt-3 p-2 bg-background rounded border">
                                        <div className="text-sm font-medium text-muted-foreground mb-1">Notes:</div>
                                        <div className="text-sm">{row.original.items[0].notes}</div>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
