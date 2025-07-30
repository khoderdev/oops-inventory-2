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
import { Download, Filter, Plus, TrendingUp } from "lucide-react";
import React, { useEffect, useState } from "react";

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

export const EmployeeUsageView: React.FC<EmployeeUsageViewProps> = ({ selectedEmployeeId, onEmployeeSelect }) => {
  const [usages] = useAtom(usagesAtom);
  const [loading] = useAtom(usagesLoadingAtom);
  const [filters, setFilters] = useAtom(usagesFiltersAtom);
  const [usageStats] = useAtom(usageStatsAtom);
  const [employees] = useAtom(employeesAtom);
  const [, fetchUsages] = useAtom(fetchUsageAtom);
  const [, fetchStats] = useAtom(fetchUsageStatsAtom);

  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: addDays(new Date(), -30),
    to: new Date()
  });

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
  }, [selectedEmployeeId, dateRange]); // Removed setFilters, fetchUsages, fetchStats from deps

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  return (
    <div className="space-y-6">
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

      {/* Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Records</CardTitle>
          <CardDescription>Detailed list of employee usage records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
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
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : usages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No usage records found
                    </TableCell>
                  </TableRow>
                ) : (
                  usages.map(usage => (
                    <TableRow key={usage.id}>
                      <TableCell className="text-sm">{formatDate(usage.usageDate)}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {usage.employee?.user?.firstName} {usage.employee?.user?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">#{usage.employee?.employeeNumber}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={usageTypeColors[usage.usageType]}>
                          {usage.usageType.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{getItemName(usage)}</TableCell>
                      <TableCell>
                        {usage.quantity} {usage.unit}
                      </TableCell>
                      <TableCell className="font-mono">{formatCurrency(usage.unitCost)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(usage.totalCost)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {usage.discountApplied}% ({formatCurrency(usage.discountAmount)})
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-medium">{formatCurrency(usage.finalCost)}</TableCell>
                      <TableCell>
                        <Badge variant={usage.isSettled ? "default" : "secondary"} className={usage.isSettled ? "bg-green-100 text-green-800" : ""}>
                          {usage.isSettled ? "Settled" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
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
