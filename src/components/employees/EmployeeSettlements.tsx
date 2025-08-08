import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { approveSettlementAtom, createSettlementAtom, employeesAtom, fetchEmployeesAtom, fetchSettlementsAtom, fetchSettlementStatsAtom, markSettlementAsPaidAtom, selectedSettlementAtom, settlementFormLoadingAtom, settlementsAtom, settlementsFiltersAtom, settlementsLoadingAtom, settlementStatsAtom, settlementStatsLoadingAtom } from "@/store/employeeAtoms";
import type { CreateSettlementData, EmployeeSettlement, SettlementStatus } from "@/types/employee";
import { useAtom } from "jotai";
import { Calendar, CheckCircle, DollarSign, Download, Eye, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { EmployeeSettlementForm } from "./EmployeeSettlementForm";
import { statusColors } from "@/constants/constants";

interface EmployeeSettlementsProps {
  selectedEmployeeId?: number | null;
  onEmployeeSelect?: (employeeId: number | null) => void;
}

const statuses: SettlementStatus[] = ["pending", "approved", "paid", "disputed", "cancelled"];

const usageTypeColors = {
  material: "bg-blue-100 text-blue-800",
  menu_item: "bg-green-100 text-green-800",
  stock_entry: "bg-orange-100 text-orange-800"
};

export const EmployeeSettlements: React.FC<EmployeeSettlementsProps> = ({ selectedEmployeeId, onEmployeeSelect }) => {
  // Data atoms
  const [settlements] = useAtom(settlementsAtom);
  const [employees] = useAtom(employeesAtom);
  const [settlementStats] = useAtom(settlementStatsAtom);
  const [selectedSettlement, setSelectedSettlement] = useAtom(selectedSettlementAtom);

  // Loading states
  const [loading] = useAtom(settlementsLoadingAtom);
  const [statsLoading] = useAtom(settlementStatsLoadingAtom);
  const [formLoading] = useAtom(settlementFormLoadingAtom);

  // Filters
  const [filters, setFilters] = useAtom(settlementsFiltersAtom);

  // Action atoms
  const [, fetchSettlements] = useAtom(fetchSettlementsAtom);
  const [, fetchEmployees] = useAtom(fetchEmployeesAtom);
  const [, fetchStats] = useAtom(fetchSettlementStatsAtom);
  const [, approveSettlement] = useAtom(approveSettlementAtom);
  const [, markAsPaid] = useAtom(markSettlementAsPaidAtom);
  const [, createSettlement] = useAtom(createSettlementAtom);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [settlementFormOpen, setSettlementFormOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);

  // Initial data loading
  useEffect(() => {
    fetchEmployees();
    fetchStats();
  }, [fetchEmployees, fetchStats]);

  // Load data when employee, year, or month changes
  useEffect(() => {
    const loadData = async () => {
      // Create updated filters (only include the specific filters we're updating)
      const updatedFilters = {
        employeeId: selectedEmployeeId || undefined,
        year: selectedYear,
        month: selectedMonth
      };

      // Update filters state
      setFilters(updatedFilters);

      // Fetch data with updated filters
      await fetchSettlements(updatedFilters);
      await fetchStats(updatedFilters);
    };

    loadData();
  }, [selectedEmployeeId, selectedYear, selectedMonth, fetchSettlements, fetchStats, setFilters]);

  const handleEmployeeChange = (employeeId: string) => {
    const id = employeeId === "all" ? null : parseInt(employeeId);
    onEmployeeSelect?.(id);
  };

  const handleStatusFilter = async (status: string) => {
    const updatedFilters = {
      ...filters,
      status: status === "all" ? undefined : (status as SettlementStatus)
    };
    setFilters(updatedFilters);
    await fetchSettlements(updatedFilters);
  };

  const handleViewDetails = (settlement: EmployeeSettlement) => {
    setSelectedSettlement(settlement);
    setDetailsOpen(true);
  };

  const handleApprove = async (settlementId: number) => {
    try {
      await approveSettlement({
        id: settlementId,
        notes: "Approved via settlement management interface"
      });
      // Refresh the settlements list
      await fetchSettlements(filters);
    } catch (error) {
      console.error("Error approving settlement:", error);
    }
  };

  const handleMarkAsPaid = async (settlementId: number) => {
    try {
      await markAsPaid({
        id: settlementId,
        paymentMethod: "bank_transfer",
        paymentReference: `PAY-${settlementId}-${Date.now()}`
      });
      // Refresh the settlements list
      await fetchSettlements(filters);
    } catch (error) {
      console.error("Error marking as paid:", error);
    }
  };

  const handleCreateSettlement = async (data: CreateSettlementData) => {
    try {
      await createSettlement(data);
      setSettlementFormOpen(false);
      // Refresh data
      await fetchSettlements(filters);
      await fetchStats({ year: selectedYear, month: selectedMonth });
    } catch (error) {
      console.error("Error creating settlement:", error);
    }
  };

  const handleCancelForm = () => {
    setSettlementFormOpen(false);
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

  const getMonthName = (month: number) => {
    return new Date(2024, month - 1, 1).toLocaleDateString("en-US", { month: "long" });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employee Settlements</h2>
          <p className="text-muted-foreground">Process monthly salary settlements and track payments</p>
        </div>
        <Button className="gap-2" onClick={() => setSettlementFormOpen(true)} disabled={formLoading}>
          <Plus className="h-4 w-4" />
          Create Settlement
        </Button>
      </div>

      {/* Stats Cards */}
      {settlementStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Settlements</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settlementStats.totals.totalCount}</div>
              <p className="text-xs text-muted-foreground">In selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Base Salary</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(settlementStats.totals.totalBaseSalary)}</div>
              <p className="text-xs text-muted-foreground">Before deductions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(settlementStats.totals.totalDeductions)}</div>
              <p className="text-xs text-muted-foreground">Employee usage costs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Final Salary</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(settlementStats.totals.totalFinalSalary)}</div>
              <p className="text-xs text-muted-foreground">After deductions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
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
                      {employee.firstName} {employee.lastName} (#{employee.employeeNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[120px]">
              <Select value={selectedYear.toString()} onValueChange={value => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[140px]">
              <Select value={selectedMonth?.toString() || "all"} onValueChange={value => setSelectedMonth(value === "all" ? undefined : parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[140px]">
              <Select value={filters.status || "all"} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Settlement Records</CardTitle>
          <CardDescription>Monthly salary settlements and payment tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Final Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Settlement Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : settlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No settlements found
                    </TableCell>
                  </TableRow>
                ) : (
                  settlements.map(settlement => (
                    <TableRow key={settlement.id}>
                      <TableCell>
                        <div className="font-medium">
                          {settlement.employee?.firstName} {settlement.employee?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">#{settlement.employee?.employeeNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {getMonthName(settlement.settlementMonth)} {settlement.settlementYear}
                        </div>
                        <div className="text-sm text-muted-foreground">{settlement.usageItemsCount} usage items</div>
                      </TableCell>
                      <TableCell className="font-mono">{formatCurrency(settlement.baseSalary)}</TableCell>
                      <TableCell className="font-mono text-red-600">-{formatCurrency(settlement.totalDeduction)}</TableCell>
                      <TableCell className="font-mono font-medium">{formatCurrency(settlement.finalSalary)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[settlement.status]}>
                          {settlement.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(settlement.settlementDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(settlement)} className="gap-1">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>

                          {settlement.status === "pending" && (
                            <Button variant="ghost" size="sm" onClick={() => handleApprove(settlement.id)} className="gap-1 text-blue-600">
                              <CheckCircle className="h-3 w-3" />
                              Approve
                            </Button>
                          )}

                          {settlement.status === "approved" && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkAsPaid(settlement.id)} className="gap-1 text-green-600">
                              <DollarSign className="h-3 w-3" />
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Settlement Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settlement Details</DialogTitle>
            <DialogDescription>Detailed breakdown of the settlement calculation</DialogDescription>
          </DialogHeader>

          {selectedSettlement && (
            <div className="space-y-6">
              {/* Settlement Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Settlement Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Employee</div>
                      <div className="font-medium">
                        {selectedSettlement.employee?.firstName} {selectedSettlement.employee?.lastName}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Period</div>
                      <div className="font-medium">
                        {getMonthName(selectedSettlement.settlementMonth)} {selectedSettlement.settlementYear}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <Badge className={statusColors[selectedSettlement.status]}>{selectedSettlement.status}</Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Settlement Date</div>
                      <div className="font-medium">{formatDate(selectedSettlement.settlementDate)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Financial Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Base Salary</span>
                      <span className="font-mono">{formatCurrency(selectedSettlement.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                      <span>Total Usage Cost</span>
                      <span className="font-mono">-{formatCurrency(selectedSettlement.totalUsageCost)}</span>
                    </div>
                    <div className="flex justify-between items-center text-green-600">
                      <span>Discount Amount</span>
                      <span className="font-mono">+{formatCurrency(selectedSettlement.totalDiscountAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-red-600">
                      <span>Net Deduction</span>
                      <span className="font-mono">-{formatCurrency(selectedSettlement.totalDeduction)}</span>
                    </div>
                    {selectedSettlement.bonusAmount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Bonus</span>
                        <span className="font-mono">+{formatCurrency(selectedSettlement.bonusAmount)}</span>
                      </div>
                    )}
                    {selectedSettlement.penaltyAmount > 0 && (
                      <div className="flex justify-between items-center text-red-600">
                        <span>Penalty</span>
                        <span className="font-mono">-{formatCurrency(selectedSettlement.penaltyAmount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Final Salary</span>
                      <span className="font-mono">{formatCurrency(selectedSettlement.finalSalary)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Breakdown */}
              {selectedSettlement.settlementData?.usageBreakdown && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usage Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Final</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSettlement.settlementData.usageBreakdown.map(usage => (
                            <TableRow key={usage.id}>
                              <TableCell className="text-sm">{formatDate(usage.usageDate)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={usageTypeColors[usage.usageType]}>
                                  {usage.usageType.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell>{usage.itemName}</TableCell>
                              <TableCell>
                                {usage.quantity} {usage.unit}
                              </TableCell>
                              <TableCell className="font-mono">{formatCurrency(usage.unitCost)}</TableCell>
                              <TableCell className="font-mono">{formatCurrency(usage.totalCost)}</TableCell>
                              <TableCell className="font-mono text-green-600">-{usage.discountApplied}%</TableCell>
                              <TableCell className="font-mono font-medium">{formatCurrency(usage.finalCost)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settlement Form Dialog */}
      <Dialog open={settlementFormOpen} onOpenChange={setSettlementFormOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Settlement</DialogTitle>
            <DialogDescription>Generate a monthly settlement for an employee based on their usage and salary</DialogDescription>
          </DialogHeader>
          <EmployeeSettlementForm onSubmit={handleCreateSettlement} onCancel={handleCancelForm} isLoading={formLoading} employees={employees} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
