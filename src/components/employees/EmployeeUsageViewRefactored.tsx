import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { addDays } from "date-fns";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getExpandedRowModel, ExpandedState } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, BadgePercent, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock, CreditCard, DollarSign, FileText, MoreHorizontal, NotebookText, RefreshCw, Search, ShoppingBag, User, Users, Wallet, X } from "lucide-react";
import { employeesAtom, fetchUsageAtom, fetchUsageStatsAtom, settlementsAtom, usagesAtom, usagesFiltersAtom, usageStatsAtom } from "@/store/employeeAtoms";
import type { EmployeeUsage, EmployeeUsageType, GroupedOrder, SettlementStatus } from "@/types/employee";
import { formatCurrency } from "@/utils/conversionLogic";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";

const formatQuantity = (quantity: number) => {
  return Number(quantity) % 1 === 0 ? Math.floor(quantity) : Number(quantity).toFixed(2);
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
                user: {
                  id: usage.recorder.id,
                  firstName: usage.recorder.firstName,
                  lastName: usage.recorder.lastName,
                  username: usage.recorder.username
                } as any,
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
    console.log("EmployeeUsageView - prefetchedUsages received:", prefetchedUsages);
    console.log("EmployeeUsageView - prefetchedStats received:", prefetchedStats);

    if (prefetchedUsages) {
      setAllUsages(prefetchedUsages);
      console.log("EmployeeUsageView - allUsages set to:", prefetchedUsages);
    }
    if (prefetchedStats) {
      setAllStats(prefetchedStats);
      console.log("EmployeeUsageView - allStats set to:", prefetchedStats);
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
      const employeeIdNum = selectedEmployeeId && !isNaN(Number(selectedEmployeeId)) ? Number(selectedEmployeeId) : undefined;
      const updatedFilters = {
        ...filters,
        employeeId: employeeIdNum,
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
          duration: 1500
        });
      } catch (error) {
        console.error("Failed to add items to settlement:", error);
        toast({
          title: "Error",
          description: "Failed to add items to settlement",
          variant: "destructive",
          duration: 1500
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
          let name = "Unknown";
          if (employee) {
            name = `${employee.user?.firstName} ${employee.user?.lastName}`;
          }
          return <div className="truncate max-w-[140px]">{name}</div>;
        }
      }),
      columnHelper.accessor("creator", {
        header: "Created By",
        size: 160,
        cell: ({ row }) => {
          const creator = row.original.creator;
          const name = creator ? `${creator.user?.firstName} ${creator.user?.lastName}` : "Unknown";
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
              <Badge variant={status === "paid" ? "default" : "outline"} className={status === "paid" ? "bg-green-100 text-green-800" : ""}>
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
          const result = updater(prev);
          return typeof result === "boolean" ? (result ? prev : {}) : result;
        });
      } else if (typeof updater === "boolean") {
        setExpandedRows(updater ? expandedRows : {});
      } else {
        setExpandedRows(updater);
      }
    },
    onRowSelectionChange: setRowSelection
  });

  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: useCallback(() => 50, []),
    overscan: 20,
    measureElement: typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1 ? element => element?.getBoundingClientRect().height : undefined
  });

  // Handle expand/collapse all rows
  const handleExpandAll = () => {
    table.toggleAllRowsExpanded(true);
  };
  const handleCollapseAll = () => {
    table.toggleAllRowsExpanded(false);
  };
  const [tableHeight, setTableHeight] = useState("600px");
  useEffect(() => {
    const updateTableHeight = () => {
      const estimatedOtherContentHeight = 300;
      const availableHeight = window.innerHeight - estimatedOtherContentHeight;
      const height = Math.max(500, availableHeight);
      setTableHeight(`${height}px`);
    };
    updateTableHeight();
    window.addEventListener("resize", updateTableHeight);
    return () => window.removeEventListener("resize", updateTableHeight);
  }, []);

  return (
    <div className="space-y-6">
      {/* Filter Controls - Improved Responsive Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select value={selectedEmployeeId || ""} onValueChange={value => setSelectedEmployeeId(value === "" || value === "all" ? null : value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(employee => (
              <SelectItem key={employee.id} value={employee.id.toString()}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={employee.user?.imageUrl} />
                    <AvatarFallback>
                      {employee.user?.firstName?.[0]}
                      {employee.user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {employee.user?.firstName} {employee.user?.lastName} ({employee.employeeNumber})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedUsageType} onValueChange={value => setSelectedUsageType(value as EmployeeUsageType)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Usage Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pos">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                POS Transaction
              </div>
            </SelectItem>
            <SelectItem value="individual">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Individual Usage
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSettlementStatus} onValueChange={value => setSelectedSettlementStatus(value as "all" | "settled" | "unsettled")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Settlement Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="settled">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Settled
              </div>
            </SelectItem>
            <SelectItem value="unsettled">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Unsettled
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <DatePickerWithRange className="w-full" date={dateRange} setDate={setDateRange} />
      </div>

      {/* Stats Cards - Improved Visual Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRecords || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Usage records in period</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalCost || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Before discounts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Final Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.finalCost || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">After discounts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BadgePercent className="h-4 w-4 text-green-600" />
              Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{formatCurrency((stats?.totalCost || 0) - (stats?.finalCost || 0))}</div>
            <p className="text-xs text-green-600 mt-1">Total discounts applied</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Employee Usage
              </CardTitle>
              <CardDescription className="mt-1">View and manage employee usage records</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleExpandAll} className="flex-1 sm:flex-none">
                <ChevronDown className="h-4 w-4 mr-1" />
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={handleCollapseAll} className="flex-1 sm:flex-none">
                <ChevronRight className="h-4 w-4 mr-1" />
                Collapse All
              </Button>
              <div className="text-sm text-muted-foreground flex items-center sm:ml-2 w-full sm:w-auto justify-end sm:justify-start">
                {groupedOrders.length} {groupedOrders.length === 1 ? "record" : "records"} found
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div
            className="relative rounded-md border overflow-hidden"
            ref={tableContainerRef}
            style={{
              height: tableHeight,
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch"
            }}
          >
            <Table className="relative w-full h-full border-collapse">
              <TableHeader className="sticky top-0 z-20 bg-background border-b">
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id} className="hover:bg-background">
                    {headerGroup.headers.map(header => (
                      <TableHead
                        key={header.id}
                        style={{
                          width: header.getSize(),
                          minWidth: header.getSize(),
                          maxWidth: header.getSize() === 9999 ? "none" : header.getSize()
                        }}
                        className="bg-muted/50 font-medium text-muted-foreground h-12 px-4 text-left"
                      >
                        <div className="flex items-center gap-1">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <button onClick={header.column.getToggleSortingHandler()} className="ml-1 p-1 rounded hover:bg-muted">
                              {{
                                asc: <ArrowUp className="h-3 w-3" />,
                                desc: <ArrowDown className="h-3 w-3" />
                              }[header.column.getIsSorted() as string] ?? <ArrowUpDown className="h-3 w-3 opacity-30 hover:opacity-100" />}
                            </button>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              {isLoading || !initialLoadComplete.current ? (
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`loading-${i}`} className="hover:bg-transparent">
                      {Array.from({ length: columns.length }).map((_, j) => (
                        <TableCell key={`loading-cell-${i}-${j}`} className="py-3 px-4">
                          <div className="h-5 bg-muted/50 animate-pulse rounded"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              ) : groupedOrders.length === 0 ? (
                <TableBody>
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={columns.length} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Search className="h-8 w-8 text-muted-foreground" />
                        <div className="text-lg font-medium">No records found</div>
                        <p className="text-sm text-muted-foreground max-w-md text-center">Try adjusting your filters or date range to find what you're looking for.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setSelectedEmployeeId(null);
                            setSelectedUsageType("all");
                            setSelectedSettlementStatus("all");
                            setDateRange({
                              from: new Date(new Date().setDate(new Date().getDate() - 30)),
                              to: new Date()
                            });
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset Filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              ) : (
                <TableBody>
                  <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                    <td colSpan={columns.length} style={{ padding: 0 }}>
                      <div style={{ position: "relative", height: "100%", width: "100%" }}>
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
                                className={`hover:bg-muted/30 cursor-pointer absolute w-full transition-colors duration-200 ${row.getIsExpanded() ? "bg-muted/20" : ""}`}
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
                                      maxWidth: cell.column.getSize() === 9999 ? "none" : cell.column.getSize()
                                    }}
                                  >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                ))}
                              </TableRow>

                              {/* Expanded content */}
                              {isExpanded && (
                                <div
                                  className="absolute w-full bg-background p-4 border-t border-muted shadow-sm"
                                  style={{
                                    transform: `translateY(${virtualRow.start + virtualRow.size}px)`,
                                    zIndex: 10
                                  }}
                                >
                                  <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                      <h3 className="text-lg font-semibold">Order Details</h3>
                                      <Badge variant="outline" className="px-2 py-1 text-xs">
                                        {row.original.items.length} items
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 rounded-full"
                                      onClick={e => {
                                        e.stopPropagation();
                                        row.toggleExpanded(false);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                    {row.original.items.map(usage => (
                                      <Card key={usage.id} className="hover:border-primary/30 transition-colors">
                                        <CardHeader className="pb-3">
                                          <div className="flex justify-between items-start">
                                            <CardTitle className="text-base font-medium">{usage.item?.name || "Unknown Item"}</CardTitle>
                                            <Badge variant={usage.isSettled ? "default" : "outline"} className={usage.isSettled ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-50"}>
                                              {usage.isSettled ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                                              {usage.isSettled ? "Settled" : "Unsettled"}
                                            </Badge>
                                          </div>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-1">
                                              <p className="text-muted-foreground text-xs">Quantity</p>
                                              <p>{formatQuantity(usage.quantity)}</p>
                                            </div>
                                            <div className="space-y-1">
                                              <p className="text-muted-foreground text-xs">Unit Price</p>
                                              <p className="font-mono">{formatCurrency(parseFloat(usage.unitPrice?.toString() || "0"))}</p>
                                            </div>
                                            <div className="space-y-1">
                                              <p className="text-muted-foreground text-xs">Total Cost</p>
                                              <p className="font-mono">{formatCurrency(parseFloat(usage.totalCost?.toString() || "0"))}</p>
                                            </div>
                                            <div className="space-y-1">
                                              <p className="text-muted-foreground text-xs">Final Cost</p>
                                              <p className="font-mono">{formatCurrency(parseFloat(usage.finalCost?.toString() || "0"))}</p>
                                            </div>
                                          </div>

                                          {!usage.isSettled && (
                                            <div className="mt-4">
                                              <Select
                                                onValueChange={value => {
                                                  const settlementId = parseInt(value);
                                                  addItemToSettlement(usage, settlementId);
                                                }}
                                              >
                                                <SelectTrigger className="h-8 w-full">
                                                  <SelectValue placeholder="Add to settlement..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {settlements.length > 0 ? (
                                                    settlements
                                                      .filter(s => s.employeeId === row.original.employee?.id && s.status === "pending")
                                                      .map(settlement => (
                                                        <SelectItem key={settlement.id} value={settlement.id.toString()}>
                                                          <div className="flex items-center gap-2">
                                                            <Wallet className="h-4 w-4" />
                                                            {settlement.name}
                                                          </div>
                                                        </SelectItem>
                                                      ))
                                                  ) : (
                                                    <div className="text-sm p-2 text-muted-foreground">No pending settlements found</div>
                                                  )}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>

                                  {/* Order Info Section */}
                                  {row.original.items[0]?.order && (
                                    <Card className="mb-6">
                                      <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                          <ShoppingBag className="h-4 w-4" />
                                          Order Information
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                          <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Order ID</p>
                                            <p className="font-mono">#{row.original.items[0].order.id}</p>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Status</p>
                                            <div>
                                              <Badge variant={row.original.items[0].order.status === "paid" ? "default" : "secondary"} className={`text-xs ${row.original.items[0].order.status === "paid" ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}`}>
                                                {row.original.items[0].order.status === "paid" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                                {row.original.items[0].order.status}
                                              </Badge>
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Order Total</p>
                                            <p className="font-mono">{formatCurrency(parseFloat(row.original.items[0].order.total?.toString() || "0"))}</p>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-muted-foreground text-xs">Date</p>
                                            <p>{new Date(row.original.orderDate).toLocaleDateString()}</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}

                                  {/* Notes Section */}
                                  {row.original.items[0]?.notes && (
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                          <NotebookText className="h-4 w-4" />
                                          Additional Notes
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="bg-muted/20 p-3 rounded-md">
                                          <p className="text-sm">{row.original.items[0].notes}</p>
                                        </div>
                                      </CardContent>
                                    </Card>
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
        </CardContent>

        {/* Pagination/Summary Footer */}
        <CardFooter className="bg-muted/50 border-t p-3">
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <div>
              Showing {groupedOrders.length} of {stats?.totalRecords || 0} records
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: table.getPageCount() }).map((_, i) => (
                  <Button key={i} variant={table.getState().pagination.pageIndex === i ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => table.setPageIndex(i)}>
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
