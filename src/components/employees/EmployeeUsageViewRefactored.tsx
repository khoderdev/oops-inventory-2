import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { addDays } from "date-fns";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getExpandedRowModel, ExpandedState } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { ChevronDown, ChevronRight, MoreHorizontal, X } from "lucide-react";
import { employeesAtom, fetchUsageAtom, fetchUsageStatsAtom, settlementsAtom, usagesAtom, usagesFiltersAtom, usageStatsAtom } from "@/store/employeeAtoms";
import type { EmployeeUsage, EmployeeUsageType, GroupedOrder, SettlementStatus } from "@/types/employee";

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


export const EmployeeUsageView = ({ prefetchedUsages = null, prefetchedStats = null, isLoading = false }: { prefetchedUsages?: EmployeeUsage[] | null; prefetchedStats?: any | null; isLoading?: boolean }) => {
  const [usages, setUsages] = useAtom(usagesAtom);
  const [filters, setFilters] = useAtom(usagesFiltersAtom);
  const [, fetchUsages] = useAtom(fetchUsageAtom);
  const [, fetchStats] = useAtom(fetchUsageStatsAtom);
  const employees = useAtomValue(employeesAtom);
  const stats = useAtomValue(usageStatsAtom);
  const settlements = useAtomValue(settlementsAtom);
  const [allUsages, setAllUsages] = useState<EmployeeUsage[]>(Array.isArray(prefetchedUsages) ? prefetchedUsages : []);
  const [allStats, setAllStats] = useState<any>(prefetchedStats || {});
  const [, setStats] = useAtom(usageStatsAtom);
  const initialLoadComplete = useRef(false);
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
  const [expandedRows, setExpandedRows] = useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  // This state is not used anymore, we're using expandedRows instead
  // const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const filteredUsages = useMemo(() => {
    const usagesArray = Array.isArray(allUsages) ? allUsages : [];
    return usagesArray.filter(usage => {
      if (!usage || typeof usage !== "object") return false;
      if (selectedEmployeeId && usage.employee?.id?.toString() !== selectedEmployeeId) {
        return false;
      }
      if (selectedUsageType !== "all" && usage.usageType !== selectedUsageType) {
        return false;
      }
      if (selectedSettlementStatus === "settled" && !usage.isSettled) {
        return false;
      }
      if (selectedSettlementStatus === "unsettled" && usage.isSettled) {
        return false;
      }
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

  useEffect(() => {
    console.log('EmployeeUsageView - prefetchedUsages received:', prefetchedUsages);
    console.log('EmployeeUsageView - prefetchedStats received:', prefetchedStats);
    
    if (prefetchedUsages) {
      setAllUsages(prefetchedUsages);
      console.log('EmployeeUsageView - allUsages set to:', prefetchedUsages);
    }
    if (prefetchedStats) {
      setAllStats(prefetchedStats);
      console.log('EmployeeUsageView - allStats set to:', prefetchedStats);
    }
  }, [prefetchedUsages, prefetchedStats]);

  useEffect(() => {
    const loadAllData = async () => {
      if (prefetchedUsages && prefetchedStats) {
        setAllUsages(Array.isArray(prefetchedUsages) ? prefetchedUsages : []);
        setAllStats(prefetchedStats || {});
        initialLoadComplete.current = true;
        return;
      }

      try {
        const baseFilters = {
          startDate: addDays(new Date(), -90).toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0]
        };

        const [usagesData, statsData] = await Promise.all([fetchUsages(baseFilters), fetchStats(baseFilters)]);
        // Correctly access the data structure returned by the fetch atoms
        // fetchUsageAtom returns { usages: EmployeeUsage[], pagination: {...} }
        setAllUsages(Array.isArray(usagesData?.usages) ? usagesData.usages : []);
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

  useEffect(() => {
    if (initialLoadComplete.current) {
      // Ensure we're passing the correct type to setUsages
      setUsages(Array.isArray(filteredUsages) ? filteredUsages : []);
      setStats(allStats);
    }
  }, [filteredUsages, allStats, setUsages, setStats]);

  const addToSettlement = useCallback(
    async (usageIds: number[], settlementId: number) => {
      try {
        const { addUsagesToSettlement } = await import("@/api/employee.api");
        await addUsagesToSettlement(settlementId, usageIds);
        const baseFilters = {
          startDate: addDays(new Date(), -90).toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0]
        };
        const [usagesData, statsData] = await Promise.all([fetchUsages(baseFilters), fetchStats(baseFilters)]);
        setAllUsages(usagesData || []);
        setAllStats(statsData || {});
        toast({
          title: "Success",
          description: "Items added to settlement successfully",
          duration: 1500,
        });
      } catch (error) {
        console.error("Failed to add items to settlement:", error);
        toast({
          title: "Error",
          description: "Failed to add items to settlement",
          variant: "destructive",
          duration: 1500,
        });
      }
    },
    [fetchUsages, fetchStats, toast]
  );

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

  const toggleOrderExpansion = useCallback((orderId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  }, []);

  const columnHelper = createColumnHelper<GroupedOrder>();
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
        size: 120,
        cell: ({ row }) => <div className="font-medium">{row.original.posTransactionId}</div>
      }),
      columnHelper.accessor("employee", {
        header: "Employee",
        size: 160,
        cell: ({ row }) => {
          const employee = row.original.employee;
          // Direct access to firstName/lastName properties
          let name = "Unknown";
          if (employee) {
            name = `${employee.firstName} ${employee.lastName}`;
          }
          return <div className="truncate max-w-[140px]">{name}</div>;
        }
      }),
      columnHelper.accessor("creator", {
        header: "Created By",
        size: 160,
        cell: ({ row }) => {
          const creator = row.original.creator;
          const name = creator ? `${creator.firstName} ${creator.lastName}` : "Unknown";
          return <div className="truncate max-w-[140px]">{name}</div>;
        }
      }),
      columnHelper.accessor("orderDate", {
        header: "Date & Time",
        size: 180,
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            {new Date(row.original.orderDate).toLocaleDateString()} {new Date(row.original.orderDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        )
      }),
      columnHelper.accessor("itemCount", {
        header: "Items",
        size: 80,
        cell: ({ row }) => <div className="text-center">{row.original.items.length}</div>
      }),
      columnHelper.accessor("totalCost", {
        header: "Total Cost",
        size: 120,
        cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.original.totalCost)}</div>
      }),
      columnHelper.accessor("totalDiscountAmount", {
        header: "Discount",
        size: 120,
        cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.original.totalDiscountAmount)}</div>
      }),
      columnHelper.accessor("finalCost", {
        header: "Final Cost",
        size: 120,
        cell: ({ row }) => <div className="text-right font-mono font-medium">{formatCurrency(row.original.finalCost)}</div>
      }),
      columnHelper.accessor("status", {
        header: "Status",
        size: 100,
        cell: ({ row }) => {
          const status = row.original.items[0]?.order?.status || "unknown";
          return (
            <div className="flex justify-center">
              <Badge
                variant={status === "paid" ? "default" : "outline"}
                className={status === "paid" ? "bg-green-100 text-green-800" : ""}
              >
                {status}
              </Badge>
            </div>
          );
        }
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        size: 100,
        cell: ({ row }) => {
          const order = row.original;
          const employeeSettlements = settlements.filter(s => s.employeeId === order.employee?.id && s.status === "pending");
          
          return (
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {employeeSettlements.length > 0 && !order.isSettled && (
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
        }
      })
    ],
    [settlements, addOrderToSettlement]
  );

  // Set up TanStack Table
  const table = useReactTable({
    data: groupedOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    state: {
      expanded: expandedRows,
      rowSelection
    },
    onExpandedChange: updater => {
      if (typeof updater === "function") {
        setExpandedRows(prev => {
          // Handle the case where updater returns a boolean (toggle all)
          const result = updater(prev);
          return typeof result === 'boolean' ? (result ? prev : {}) : result;
        });
      } else if (typeof updater === 'boolean') {
        // Handle boolean toggle all case
        setExpandedRows(updater ? expandedRows : {});
      } else {
        // Handle direct object assignment
        setExpandedRows(updater);
      }
    },
    onRowSelectionChange: setRowSelection
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

  // Handle expand/collapse all rows
  const handleExpandAll = () => {
    table.toggleAllRowsExpanded(true);
  };

  const handleCollapseAll = () => {
    table.toggleAllRowsExpanded(false);
  };

  // Calculate dynamic height based on viewport
  const [tableHeight, setTableHeight] = useState("600px");
  
  // Update table height on window resize
  useEffect(() => {
    const updateTableHeight = () => {
      // Calculate available height (viewport height - estimated other content height)
      // Subtracting space for filters, stats cards, margins, and padding
      const estimatedOtherContentHeight = 300; // Reduced from 400 to allow more space for table
      const availableHeight = window.innerHeight - estimatedOtherContentHeight;
      // Set a minimum height
      const height = Math.max(500, availableHeight); // Increased minimum height from 400 to 500
      setTableHeight(`${height}px`);
    };
    
    // Set initial height
    updateTableHeight();
    
    // Add resize listener
    window.addEventListener('resize', updateTableHeight);
    return () => window.removeEventListener('resize', updateTableHeight);
  }, []);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-4">
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

        <DatePickerWithRange
          className="w-full md:w-auto"
          date={dateRange}
          setDate={setDateRange}
        />
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

      {/* Table Actions */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-muted-foreground">
          {groupedOrders.length} {groupedOrders.length === 1 ? 'order' : 'orders'} found
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExpandAll}>
            <ChevronDown className="h-4 w-4 mr-1" /> Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll}>
            <ChevronRight className="h-4 w-4 mr-1" /> Collapse All
          </Button>
        </div>
      </div>
      
      {/* Orders Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Employee Usage</CardTitle>
              <CardDescription>View and manage employee usage records</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div
              className="w-full overflow-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
              ref={tableContainerRef}
              style={{
                height: tableHeight,
                overscrollBehavior: "contain", // Prevent scroll chaining
                WebkitOverflowScrolling: "touch" // Smooth scrolling on iOS
              }}
            >
              <Table className="relative w-full table-fixed border-collapse">
                <TableHeader className="sticky top-0 z-20 bg-background border-b">
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id} className="hover:bg-background">
                      {headerGroup.headers.map(header => (
                        <TableHead 
                          key={header.id} 
                          style={{ 
                            width: header.getSize(),
                            minWidth: header.getSize(),
                            maxWidth: header.getSize() === 9999 ? 'none' : header.getSize()
                          }}
                          className="bg-muted/50 font-medium text-muted-foreground h-10 px-4 text-left"
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                
                {isLoading || !initialLoadComplete.current ? (
                  // Loading state
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`loading-${i}`}>
                        {Array.from({ length: columns.length }).map((_, j) => (
                          <TableCell key={`loading-cell-${i}-${j}`} className="py-2">
                            <div className="h-4 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                ) : groupedOrders.length === 0 ? (
                  // Empty state
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  // Virtualized rows
                  <TableBody>
                    <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                      <td colSpan={columns.length} style={{ padding: 0 }}>
                        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                          {rowVirtualizer.getVirtualItems().map(virtualRow => {
                            const row = rows[virtualRow.index];
                            const isExpanded = row.getIsExpanded();
                            
                            return (
                              <React.Fragment key={row.id}>
                                {/* Main row */}
                                <TableRow 
                                  data-index={virtualRow.index}
                                  ref={node => {
                                    if (node) rowVirtualizer.measureElement(node);
                                  }}
                                  className={`hover:bg-muted/50 cursor-pointer absolute w-full transition-colors duration-200 ${row.getIsExpanded() ? 'bg-muted/30' : ''}`}
                                  onClick={() => row.toggleExpanded()}
                                  style={{
                                    transform: `translateY(${virtualRow.start}px)`,
                                    height: virtualRow.size
                                  }}
                                >
                                  {row.getVisibleCells().map(cell => (
                                    <TableCell 
                                      key={cell.id} 
                                      className="py-3 px-4"
                                      style={{
                                        width: cell.column.getSize(),
                                        minWidth: cell.column.getSize(),
                                        maxWidth: cell.column.getSize() === 9999 ? 'none' : cell.column.getSize()
                                      }}
                                    >
                                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                  ))}
                                </TableRow>
                                
                                {/* Expanded content - rendered outside the table for proper DOM nesting */}
                                {isExpanded && (
                                  <div 
                                    className="absolute w-full bg-muted/50 p-4 rounded-md border border-muted shadow-sm backdrop-blur-sm"
                                    style={{
                                      transform: `translateY(${virtualRow.start + virtualRow.size}px)`,
                                      zIndex: 10
                                    }}
                                  >
                                    <div className="flex justify-between items-center mb-3">
                                      <div className="text-lg font-semibold">Order Details</div>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 px-2" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          row.toggleExpanded(false);
                                        }}
                                      >
                                        <ChevronRight className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                      {row.original.items.map((usage) => (
                                        <div key={usage.id} className="bg-card rounded-lg p-3 border hover:border-primary/20 transition-colors shadow-sm">
                                          <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-primary/90">{usage.item?.name || 'Unknown Item'}</div>
                                            <Badge variant={usage.isSettled ? "default" : "outline"} className={usage.isSettled ? "bg-green-100 text-green-800" : "border-amber-300 text-amber-600"}>
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
                                                    .filter(s => s.employeeId === row.original.employee?.id && s.status === "pending")
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
                                      <div className="bg-card rounded-lg p-4 border shadow-sm mb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                          <div className="text-md font-semibold">Order Information</div>
                                          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                                            #{row.original.items[0].order.id}
                                          </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                          <div className="bg-muted/30 p-2 rounded-md">
                                            <span className="text-muted-foreground block text-xs">Status</span>
                                            <div className="mt-1">
                                              <Badge variant={row.original.items[0].order.status === "paid" ? "default" : "secondary"} 
                                                className={`text-xs ${row.original.items[0].order.status === "paid" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                                {row.original.items[0].order.status}
                                              </Badge>
                                            </div>
                                          </div>
                                          <div className="bg-muted/30 p-2 rounded-md">
                                            <span className="text-muted-foreground block text-xs">Order Total</span>
                                            <div className="font-medium font-mono mt-1">{formatCurrency(parseFloat(row.original.items[0].order.total?.toString() || "0"))}</div>
                                          </div>
                                          <div className="bg-muted/30 p-2 rounded-md">
                                            <span className="text-muted-foreground block text-xs">Date</span>
                                            <div className="mt-1">{new Date(row.original.orderDate).toLocaleDateString()}</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Notes Section */}
                                    {row.original.items[0]?.notes && (
                                      <div className="p-3 bg-background rounded-md border shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="text-sm font-medium">Notes</div>
                                          <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
                                        </div>
                                        <div className="text-sm italic bg-muted/20 p-2 rounded">{row.original.items[0].notes}</div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  </TableBody>
                )}
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
