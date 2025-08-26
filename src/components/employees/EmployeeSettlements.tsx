import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TanStackTable } from "@/components/ui/TanStackTable";
import { approveSettlementAtom, createSettlementAtom, deleteSettlementAtom, employeesAtom, fetchEmployeesAtom, fetchSettlementsAtom, fetchSettlementStatsAtom, markSettlementAsPaidAtom, selectedSettlementAtom, settlementFormLoadingAtom, settlementsAtom, settlementsFiltersAtom, settlementsLoadingAtom, settlementStatsAtom, settlementStatsLoadingAtom } from "@/store/employeeAtoms";
import { employeeAPI } from "@/api/employee.api";
import type { CreateSettlementData, EmployeeSettlement, SettlementStatus } from "@/types/employee";
import { useAtom } from "jotai";
import { Calendar, CheckCircle, DollarSign, Download, Eye, Plus, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createColumnHelper, getCoreRowModel, useReactTable, ColumnDef, SortingState } from "@tanstack/react-table";
import { EmployeeSettlementForm } from "./EmployeeSettlementForm";
import { statusColors } from "@/constants/constants";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface EmployeeSettlementsProps {
  selectedEmployeeId?: number | null;
  onEmployeeSelect?: (employeeId: number | null) => void;
}

const statuses: SettlementStatus[] = ["pending", "approved", "paid", "disputed", "cancelled"];

export const EmployeeSettlements: React.FC<EmployeeSettlementsProps> = ({ selectedEmployeeId, onEmployeeSelect }) => {
  const [settlements] = useAtom(settlementsAtom);
  const [employees] = useAtom(employeesAtom);
  const [settlementStats] = useAtom(settlementStatsAtom);
  const [selectedSettlement, setSelectedSettlement] = useAtom(selectedSettlementAtom);
  const [loading] = useAtom(settlementsLoadingAtom);
  const [formLoading] = useAtom(settlementFormLoadingAtom);
  const [filters, setFilters] = useAtom(settlementsFiltersAtom);
  const [, fetchSettlements] = useAtom(fetchSettlementsAtom);
  const [, fetchEmployees] = useAtom(fetchEmployeesAtom);
  const [, fetchStats] = useAtom(fetchSettlementStatsAtom);
  const [, approveSettlement] = useAtom(approveSettlementAtom);
  const [, markAsPaid] = useAtom(markSettlementAsPaidAtom);
  const [, createSettlement] = useAtom(createSettlementAtom);
  const [, deleteSettlement] = useAtom(deleteSettlementAtom);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [settlementFormOpen, setSettlementFormOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settlementToDelete, setSettlementToDelete] = useState<EmployeeSettlement | null>(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [internalSelectedEmployeeId, setInternalSelectedEmployeeId] = useState<number | null>(selectedEmployeeId || null);
  const [addedUsageIds, setAddedUsageIds] = useState<Set<number>>(new Set());
  const [editingDiscountId, setEditingDiscountId] = useState<number | null>(null);
  const [editingDiscountValue, setEditingDiscountValue] = useState<string>("");
  const { user } = useAuth();
  const canDeleteSettlements = user?.role === "admin" || user?.role === "manager";
  const [discountInputMode, setDiscountInputMode] = useState<"percentage" | "amount">("percentage");
  const canDeleteSettlement = (settlement: EmployeeSettlement | null) => {
    if (!canDeleteSettlements || !settlement) return false;
    return ["pending", "disputed", "cancelled"].includes(settlement.status);
  };
  const canForceDelete = user?.role === "admin";

  // Table sorting & pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>("settlementDate");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    fetchEmployees();
    fetchStats();
  }, [fetchEmployees, fetchStats]);

  useEffect(() => {
    const loadData = async () => {
      setFilters(prevFilters => {
        const updatedFilters = {
          ...prevFilters,
          employeeId: internalSelectedEmployeeId || undefined,
          year: selectedYear,
          month: selectedMonth
        };
        fetchSettlements(updatedFilters);
        fetchStats(updatedFilters);
        return updatedFilters;
      });
    };
    loadData();
  }, [internalSelectedEmployeeId, selectedYear, selectedMonth, fetchSettlements, fetchStats, setFilters]);

  const handleEmployeeChange = (employeeId: string) => {
    const id = employeeId === "all" ? null : parseInt(employeeId);
    setInternalSelectedEmployeeId(id);
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

  const handleViewDetails = async (settlement: EmployeeSettlement) => {
    try {
      const settledUsagesResponse = await employeeAPI.getUsageHistory({
        employeeId: settlement.employeeId,
        isSettled: true,
        settlementId: settlement.id
      });
      if (settledUsagesResponse.success && settledUsagesResponse.data?.usages) {
        const settledUsages = settledUsagesResponse.data.usages;

        const usageBreakdown = settledUsages.map(usage => ({
          id: usage.id,
          usageType: usage.usageType,
          itemName: usage.material?.name || usage.menuItem?.name || "Unknown Item",
          quantity: Number(usage.quantity),
          unit: usage.unit,
          unitCost: Number(usage.unitCost),
          totalCost: Number(usage.totalCost),
          discountApplied: Number(usage.discountApplied),
          finalCost: Number(usage.finalCost),
          usageDate: usage.usageDate
        }));

        const totalUsageCost = usageBreakdown.reduce((sum, item) => sum + item.totalCost, 0);
        const totalDiscountAmount = usageBreakdown.reduce((sum, item) => sum + (item.totalCost - item.finalCost), 0);
        const totalDeduction = totalUsageCost - totalDiscountAmount;

        const updatedSettlement = {
          ...settlement,
          settlementData: {
            ...settlement.settlementData,
            usageBreakdown,
            calculationDetails: {
              baseSalary: Number(settlement.baseSalary),
              totalUsageCost,
              discountPercentage: Number(settlement.employee?.discountPercentage || 0),
              totalDiscountAmount,
              netDeduction: totalDeduction,
              bonusAmount: Number(settlement.bonusAmount),
              penaltyAmount: Number(settlement.penaltyAmount)
            }
          },
          totalUsageCost,
          totalDiscountAmount,
          totalDeduction,
          usageItemsCount: usageBreakdown.length
        };

        setSelectedSettlement(updatedSettlement);
      } else {
        setSelectedSettlement(settlement);
      }
      setDetailsOpen(true);
      setAddedUsageIds(new Set());
    } catch (error) {
      console.error("Error fetching settled usages:", error);
      setSelectedSettlement(settlement);
      setDetailsOpen(true);
      setAddedUsageIds(new Set());
    }
  };

  const markUsageItemsAsSettled = async (settlement: EmployeeSettlement) => {
    try {
      // Get the date range for the settlement period
      const startDate = new Date(settlement.settlementYear, settlement.settlementMonth - 1, 1).toISOString().split("T")[0];
      const endDate = new Date(settlement.settlementYear, settlement.settlementMonth, 0).toISOString().split("T")[0];

      // Get all unsettled usage records for this employee and period
      const unsettledUsages = await employeeAPI.getUsageHistory({
        employeeId: settlement.employeeId,
        startDate,
        endDate,
        isSettled: false
      });

      if (unsettledUsages.success && unsettledUsages.data?.usages) {
        // Update each unsettled usage to mark it as settled
        for (const usage of unsettledUsages.data.usages) {
          await employeeAPI.updateUsage(usage.id, {
            isSettled: true,
            settlementId: settlement.id
          });
        }
      }
    } catch (error) {
      console.error("Error marking usage items as settled:", error);
      throw error;
    }
  };

  // const handleDiscountEdit = (usageId: number, currentDiscount: number) => {
  //   setEditingDiscountId(usageId);
  //   setEditingDiscountValue(currentDiscount.toString());
  // };

  const handleDiscountEdit = (usageId: number, currentDiscount: number, totalCost: number) => {
    setEditingDiscountId(usageId);

    if (discountInputMode === "percentage") {
      setEditingDiscountValue(currentDiscount.toString());
    } else {
      // Convert percentage to amount
      const discountAmount = (totalCost * currentDiscount) / 100;
      setEditingDiscountValue(discountAmount.toString());
    }
  };

  const handleDiscountSave = async (usageId: number, totalCost: number) => {
    if (!selectedSettlement) return;

    try {
      let newDiscountValue: number;
      let discountAmount: number;

      if (discountInputMode === "percentage") {
        newDiscountValue = parseFloat(editingDiscountValue);
        if (isNaN(newDiscountValue) || newDiscountValue < 0 || newDiscountValue > 100) {
          toast.error("Please enter a valid discount percentage (0-100)");
          return;
        }
        discountAmount = (totalCost * newDiscountValue) / 100;
      } else {
        // Amount mode
        discountAmount = parseFloat(editingDiscountValue);
        if (isNaN(discountAmount) || discountAmount < 0 || discountAmount > totalCost) {
          toast.error(`Please enter a valid discount amount (0-${totalCost.toFixed(2)})`);
          return;
        }
        newDiscountValue = (discountAmount / totalCost) * 100;
      }

      const newFinalCost = totalCost - discountAmount;
      await employeeAPI.updateUsage(usageId, {
        discountApplied: newDiscountValue,
        finalCost: newFinalCost
      });
      const updatedUsageBreakdown = selectedSettlement.settlementData.usageBreakdown.map(usage => (usage.id === usageId ? { ...usage, discountApplied: newDiscountValue, finalCost: newFinalCost } : usage));
      const totalUsageCost = updatedUsageBreakdown.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
      const totalDiscountAmount = updatedUsageBreakdown.reduce((sum, item) => sum + (Number(item.totalCost || 0) - Number(item.finalCost || 0)), 0);
      const totalDeduction = totalUsageCost - totalDiscountAmount;
      const baseSalary = Number(selectedSettlement.baseSalary || 0);
      const bonusAmount = Number(selectedSettlement.bonusAmount || 0);
      const penaltyAmount = Number(selectedSettlement.penaltyAmount || 0);
      const finalSalary = baseSalary - totalDeduction + bonusAmount - penaltyAmount;
      const updatedSettlementDataForState = {
        ...selectedSettlement.settlementData,
        usageBreakdown: updatedUsageBreakdown,
        calculationDetails: {
          ...selectedSettlement.settlementData.calculationDetails,
          totalUsageCost,
          totalDiscountAmount,
          netDeduction: totalDeduction
        }
      };

      // Build settlement data for API (SettlementPreview format)
      const settlementDataForAPI = {
        employee: {
          id: selectedSettlement.employee.id,
          name: `${selectedSettlement.employee.firstName} ${selectedSettlement.employee.lastName}`,
          employeeNumber: selectedSettlement.employee.employeeNumber,
          department: selectedSettlement.employee.department,
          discountPercentage: Number(selectedSettlement.employee?.discountPercentage || 0)
        },
        period: {
          month: selectedSettlement.settlementMonth,
          year: selectedSettlement.settlementYear,
          monthName: new Date(selectedSettlement.settlementYear, selectedSettlement.settlementMonth - 1).toLocaleString("default", { month: "long" })
        },
        calculation: {
          baseSalary: Number(selectedSettlement.baseSalary),
          totalUsageCost,
          totalDiscountAmount,
          totalDeduction,
          bonusAmount: Number(selectedSettlement.bonusAmount),
          penaltyAmount: Number(selectedSettlement.penaltyAmount),
          finalSalary,
          usageItemsCount: updatedUsageBreakdown.length
        },
        usages: updatedUsageBreakdown,
        usageBreakdown: updatedUsageBreakdown
      };

      // Update the settlement in the backend
      await employeeAPI.updateSettlement(selectedSettlement.id, {
        totalUsageCost,
        totalDiscountAmount,
        totalDeduction,
        finalSalary,
        settlementData: settlementDataForAPI
      });
      setSelectedSettlement({
        ...selectedSettlement,
        totalUsageCost,
        totalDiscountAmount,
        totalDeduction,
        finalSalary,
        settlementData: updatedSettlementDataForState
      });
      setEditingDiscountId(null);
      setEditingDiscountValue("");
      await fetchSettlements(filters);
      toast.success("Discount updated successfully");
    } catch (error) {
      console.error("Error updating discount:", error);
      toast.error("Failed to update discount");
    }
  };

  const handleDiscountCancel = () => {
    setEditingDiscountId(null);
    setEditingDiscountValue("");
  };

  const handleApprove = async (settlementId: number) => {
    try {
      const settlement = settlements.find(s => s.id === settlementId);
      if (!settlement) {
        throw new Error("Settlement not found");
      }
      await approveSettlement({
        id: settlementId,
        notes: "Approved via settlement management interface"
      });
      await markUsageItemsAsSettled(settlement);
      await fetchSettlements(filters);
      toast.success("Settlement approved and usage items marked as settled");
    } catch (error) {
      console.error("Error approving settlement:", error);
      toast.error("Failed to approve settlement");
    }
  };

  const handleMarkAsPaid = async (settlementId: number) => {
    try {
      const settlement = settlements.find(s => s.id === settlementId);
      if (!settlement) {
        throw new Error("Settlement not found");
      }
      await markAsPaid({
        id: settlementId,
        paymentMethod: "cash",
        paymentReference: `PAY-${settlementId}-${Date.now()}`
      });
      await markUsageItemsAsSettled(settlement);
      await fetchSettlements(filters);
      toast.success("Settlement marked as paid and usage items marked as settled");
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error("Failed to mark settlement as paid");
    }
  };

  const handleCreateSettlement = async (data: CreateSettlementData) => {
    try {
      await createSettlement(data);
      setSettlementFormOpen(false);
      toast.success("Settlement created successfully");
      await fetchSettlements(filters);
      await fetchStats({ year: selectedYear, month: selectedMonth });
    } catch (error) {
      console.error("Error creating settlement:", error);
      toast.error("Failed to create settlement");
    }
  };

  const handleDeleteClick = (settlement: EmployeeSettlement) => {
    setSettlementToDelete(settlement);
    setForceDelete(false);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!settlementToDelete) return;
    try {
      await deleteSettlement({ id: settlementToDelete.id, force: forceDelete });
      setDeleteDialogOpen(false);
      setSettlementToDelete(null);
      setForceDelete(false);
      toast.success(forceDelete ? "Settlement force deleted successfully" : "Settlement deleted successfully");
      await fetchSettlements(filters);
      await fetchStats({ year: selectedYear, month: selectedMonth });
    } catch (error) {
      console.error("Error deleting settlement:", error);
      if (error.message === "Cannot delete paid settlements") {
        toast.error("Cannot delete paid settlements. Only pending, disputed, or cancelled settlements can be deleted.");
      } else if (error.message === "Settlement not found") {
        toast.error("Settlement not found. It may have already been deleted.");
      } else {
        toast.error(`Failed to delete settlement: ${error.message || "Unknown error"}`);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSettlementToDelete(null);
    setForceDelete(false);
  };

  const handleCancelForm = () => {
    setSettlementFormOpen(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getMonthName = (month: number) => {
    return new Date(2024, month - 1, 1).toLocaleDateString("en-US", { month: "long" });
  };

  // Format as DD-MM-YYYY HH:MM:SS AM/PM (match ReportGenerator CSV style)
  const formatDateForCSV = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 -> 12
    const hoursStr = hours.toString().padStart(2, "0");

    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${day}-${month}-${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
  };

  const exportSettlements = () => {
    if (loading || (settlements?.length || 0) === 0) return;
    const headers = ["Employee", "Employee Number", "Department", "Period", "Base Salary", "Total Usage Cost", "Discount Amount", "Net Deduction", "Bonus", "Penalty", "Final Salary", "Status", "Settlement Date", "Usage Items Count"];
    const csvRows = settlements.map(s => {
      const employeeName = s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : `Employee #${s.employeeId}`;
      const employeeNumber = s.employee?.employeeNumber ?? "-";
      const department = s.employee?.department?.name ?? "-";
      const period = `${getMonthName(s.settlementMonth)} ${s.settlementYear}`;
      const settlementDate = (() => {
        const d = new Date(s.settlementDate);
        return isNaN(d.getTime()) ? "-" : formatDateForCSV(d);
      })();

      const values: (string | number)[] = [employeeName, String(employeeNumber), department, period, Number(s.baseSalary ?? 0).toFixed(2), Number(s.totalUsageCost ?? 0).toFixed(2), Number(s.totalDiscountAmount ?? 0).toFixed(2), Number(s.totalDeduction ?? 0).toFixed(2), Number(s.bonusAmount ?? 0).toFixed(2), Number(s.penaltyAmount ?? 0).toFixed(2), Number(s.finalSalary ?? 0).toFixed(2), s.status, settlementDate, String(s.usageItemsCount ?? 0)];

      // CSV escape: wrap fields containing commas, quotes, or newlines in quotes and escape quotes
      const escapeCSV = (v: string | number) => {
        const str = String(v);
        if (/[",\n]/.test(str)) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      return values.map(escapeCSV).join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Build a helpful filename from filters
    const parts: string[] = ["employee-settlements"];
    if (internalSelectedEmployeeId) parts.push(`emp-${internalSelectedEmployeeId}`);
    if (selectedYear) parts.push(String(selectedYear));
    if (selectedMonth) parts.push(String(selectedMonth).padStart(2, "0"));
    link.download = parts.join("-") + ".csv";
    link.href = url;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Visible, sorted, and paginated data
  const visibleSettlements = useMemo(() => {
    return settlements;
  }, [settlements]);

  const sortedSettlements = useMemo(() => {
    const arr = [...visibleSettlements];
    arr.sort((a, b) => {
      const dir = sortOrder === "ASC" ? 1 : -1;
      const by = sortBy;
      const safeStr = (v: any) => String(v ?? "").toLowerCase();
      const safeNum = (v: any) => Number(v ?? 0);

      switch (by) {
        case "employee": {
          const aName = safeStr(`${a.employee?.firstName ?? ""} ${a.employee?.lastName ?? ""}`);
          const bName = safeStr(`${b.employee?.firstName ?? ""} ${b.employee?.lastName ?? ""}`);
          return aName.localeCompare(bName) * dir;
        }
        case "period": {
          const aKey = a.settlementYear * 12 + a.settlementMonth;
          const bKey = b.settlementYear * 12 + b.settlementMonth;
          return (aKey - bKey) * dir;
        }
        case "baseSalary":
          return (safeNum(a.baseSalary) - safeNum(b.baseSalary)) * dir;
        case "deductions":
          return (safeNum(a.totalDeduction) - safeNum(b.totalDeduction)) * dir;
        case "finalSalary":
          return (safeNum(a.finalSalary) - safeNum(b.finalSalary)) * dir;
        case "status":
          return safeStr(a.status).localeCompare(safeStr(b.status)) * dir;
        case "settlementDate":
        default: {
          const aTime = new Date(a.settlementDate).getTime();
          const bTime = new Date(b.settlementDate).getTime();
          return (aTime - bTime) * dir;
        }
      }
    });
    return arr;
  }, [visibleSettlements, sortBy, sortOrder]);

  const paginatedSettlements = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedSettlements.slice(startIndex, endIndex);
  }, [sortedSettlements, currentPage, pageSize]);

  const paginationInfo = useMemo(() => {
    const totalItems = visibleSettlements.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: pageSize,
      startIndex,
      endIndex,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages
    };
  }, [visibleSettlements.length, currentPage, pageSize]);

  const handleSortChange = useCallback((newSortBy: string, newSortOrder: "ASC" | "DESC") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setSorting([{ id: newSortBy, desc: newSortOrder === "DESC" }]);
    setCurrentPage(1);
  }, []);

  const goToFirstPage = useCallback(() => setCurrentPage(1), []);
  const goToPreviousPage = useCallback(() => setCurrentPage(prev => Math.max(1, prev - 1)), []);
  const goToNextPage = useCallback(() => setCurrentPage(prev => Math.min(paginationInfo.totalPages, prev + 1)), [paginationInfo.totalPages]);
  const goToLastPage = useCallback(() => setCurrentPage(paginationInfo.totalPages), [paginationInfo.totalPages]);
  const handlePageSizeChange = useCallback((newSize: string) => {
    const size = Number(newSize);
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Columns
  const columnHelper = createColumnHelper<EmployeeSettlement>();
  const columns = useMemo<ColumnDef<EmployeeSettlement>[]>(
    () => [
      columnHelper.accessor(row => `${row.employee?.firstName ?? ""} ${row.employee?.lastName ?? ""}`.trim(), {
        id: "employee",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "employee" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("employee", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Employee
            <span className="ml-2 text-xs">{sortBy === "employee" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.employee?.firstName} {row.original.employee?.lastName}</div>
            <div className="text-xs text-muted-foreground">#{row.original.employee?.employeeNumber}</div>
          </div>
        ),
        enableSorting: false,
        size: 220
      }),
      columnHelper.display({
        id: "period",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "period" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("period", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Period
            <span className="ml-2 text-xs">{sortBy === "period" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{getMonthName(row.original.settlementMonth)} {row.original.settlementYear}</div>
            <div className="text-xs text-muted-foreground">{row.original.usageItemsCount} usage items</div>
          </div>
        ),
        enableSorting: false,
        size: 160
      }),
      columnHelper.accessor("baseSalary", {
        id: "baseSalary",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "baseSalary" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("baseSalary", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Base Salary
            <span className="ml-2 text-xs">{sortBy === "baseSalary" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue }) => <div className="font-mono">{formatCurrency(Number(getValue()))}</div>,
        enableSorting: false,
        size: 130
      }),
      columnHelper.display({
        id: "deductions",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "deductions" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("deductions", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Deductions
            <span className="ml-2 text-xs">{sortBy === "deductions" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ row }) => <div className="font-mono text-red-600">-{formatCurrency(Number(row.original.totalDeduction))}</div>,
        enableSorting: false,
        size: 130
      }),
      columnHelper.accessor("finalSalary", {
        id: "finalSalary",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "finalSalary" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("finalSalary", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Final Salary
            <span className="ml-2 text-xs">{sortBy === "finalSalary" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue }) => <div className="font-mono font-medium">{formatCurrency(Number(getValue()))}</div>,
        enableSorting: false,
        size: 130
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "status" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("status", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Status
            <span className="ml-2 text-xs">{sortBy === "status" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue }) => (
          <Badge variant="secondary" className={statusColors[getValue() as SettlementStatus]}>
            {String(getValue())}
          </Badge>
        ),
        enableSorting: false,
        size: 120
      }),
      columnHelper.accessor("settlementDate", {
        id: "settlementDate",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "settlementDate" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("settlementDate", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent"
          >
            Settlement Date
            <span className="ml-2 text-xs">{sortBy === "settlementDate" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue }) => <div className="text-sm">{formatDate(String(getValue()))}</div>,
        enableSorting: false,
        size: 150
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="w-full text-right">Actions</div>,
        cell: ({ row }) => {
          const settlement = row.original;
          return (
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
              {(canDeleteSettlement(settlement) || canForceDelete) && (
                <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(settlement)} className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              )}
            </div>
          );
        },
        enableSorting: false,
        size: 220
      })
    ],
    [sortBy, sortOrder, handleSortChange]
  );

  const table = useReactTable({
    data: paginatedSettlements,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true
  });

  return (
    <div className="space-y-4 p-3 sm:p-4">
      {settlementStats && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
              <CardTitle className="text-xs font-medium">Total Settlements</CardTitle>
              <Calendar className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg font-bold">{settlementStats.totals.totalCount}</div>
              <p className="text-[10px] text-muted-foreground">In selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
              <CardTitle className="text-xs font-medium">Total Base Salary</CardTitle>
              <DollarSign className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg font-bold">{formatCurrency(settlementStats.totals.totalBaseSalary)}</div>
              <p className="text-[10px] text-muted-foreground">Before deductions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
              <CardTitle className="text-xs font-medium">Total Deductions</CardTitle>
              <DollarSign className="h-3 w-3 text-red-600" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg font-bold text-red-600">{formatCurrency(settlementStats.totals.totalDeductions)}</div>
              <p className="text-[10px] text-muted-foreground">Employee usage costs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
              <CardTitle className="text-xs font-medium">Final Salary</CardTitle>
              <DollarSign className="h-3 w-3 text-green-600" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg font-bold text-green-600">{formatCurrency(settlementStats.totals.totalFinalSalary)}</div>
              <p className="text-[10px] text-muted-foreground">After deductions</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="p-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Filters</CardTitle>
            <Button size="sm" className="gap-1" onClick={() => setSettlementFormOpen(true)} disabled={formLoading}>
              <Plus className="h-4 w-4" />
              Create Settlement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[160px]">
              <Select value={internalSelectedEmployeeId?.toString() || "all"} onValueChange={handleEmployeeChange}>
                <SelectTrigger className="h-8 px-2 text-xs">
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

            <div className="min-w-[100px]">
              <Select value={selectedYear.toString()} onValueChange={value => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="h-8 px-2 text-xs">
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

            <div className="min-w-[120px]">
              <Select value={selectedMonth?.toString() || "all"} onValueChange={value => setSelectedMonth(value === "all" ? undefined : parseInt(value))}>
                <SelectTrigger className="h-8 px-2 text-xs">
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

            <div className="min-w-[120px]">
              <Select value={filters.status || "all"} onValueChange={handleStatusFilter}>
                <SelectTrigger className="h-8 px-2 text-xs">
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

            <Button size="sm" variant="outline" className="gap-1" onClick={exportSettlements} disabled={loading || settlements.length === 0}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settlement Records</CardTitle>
          <CardDescription>Monthly salary settlements and payment tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <TanStackTable
              table={table}
              virtualized={false}
              loading={loading}
              emptyMessage="No settlements found"
              stickyHeader={true}
              maxHeight="calc(100vh - 340px)"
              customHeaderAlignment={{ actions: "right" }}
              customCellAlignment={{ actions: "right" }}
            />
          </div>
          {/* Pagination Controls */}
          {paginationInfo.totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-muted-foreground">
                Showing {paginationInfo.startIndex}–{paginationInfo.endIndex} of {paginationInfo.totalItems}
              </div>
              <div className="flex items-center gap-2">
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-8 px-2 text-xs w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={!paginationInfo.hasPreviousPage} className="h-8 px-3">
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={!paginationInfo.hasPreviousPage} className="h-8 px-3">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-xs font-medium bg-gray-50 rounded border">{paginationInfo.currentPage}</span>
                  <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!paginationInfo.hasNextPage} className="h-8 px-3">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToLastPage} disabled={!paginationInfo.hasNextPage} className="h-8 px-3">
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Settlement Details</DialogTitle>
              </div>
            </div>
          </DialogHeader>

          {selectedSettlement && (
            <div className="space-y-6">
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

              {selectedSettlement.settlementData?.usageBreakdown && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Usage Breakdown</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Discount input:</span>
                      <Select value={discountInputMode} onValueChange={(value: "percentage" | "amount") => setDiscountInputMode(value)}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue placeholder="Input mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="amount">Amount ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
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
                              <TableCell>{usage.itemName}</TableCell>
                              <TableCell>{Number(usage.quantity) % 1 === 0 ? Math.floor(usage.quantity) : usage.quantity.toFixed(2)}</TableCell>
                              <TableCell className="font-mono">{formatCurrency(usage.unitCost)}</TableCell>
                              <TableCell className="font-mono">{formatCurrency(usage.totalCost)}</TableCell>
                              <TableCell className="font-mono text-green-600 cursor-pointer hover:bg-muted/50" onDoubleClick={() => handleDiscountEdit(usage.id, usage.discountApplied, usage.totalCost)} title="Double-click to edit discount">
                                {editingDiscountId === usage.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={editingDiscountValue}
                                      onChange={e => setEditingDiscountValue(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === "Enter") {
                                          handleDiscountSave(usage.id, usage.totalCost);
                                        } else if (e.key === "Escape") {
                                          handleDiscountCancel();
                                        }
                                      }}
                                      onBlur={() => handleDiscountSave(usage.id, usage.totalCost)}
                                      className="w-16 px-1 py-0 text-xs border rounded"
                                      min="0"
                                      max={discountInputMode === "percentage" ? "100" : usage.totalCost.toFixed(2)}
                                      step={discountInputMode === "percentage" ? "0.1" : "0.01"}
                                      autoFocus
                                    />
                                    <span className="text-xs">{discountInputMode === "percentage" ? "%" : "$"}</span>
                                  </div>
                                ) : (
                                  <span>{discountInputMode === "percentage" ? `-${usage.discountApplied}%` : `-${formatCurrency((usage.totalCost * usage.discountApplied) / 100)}`}</span>
                                )}
                              </TableCell>
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

      <Dialog open={settlementFormOpen} onOpenChange={setSettlementFormOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Settlement</DialogTitle>
            <DialogDescription>Generate a monthly settlement for an employee based on their usage and salary</DialogDescription>
          </DialogHeader>
          <EmployeeSettlementForm onSubmit={handleCreateSettlement} onCancel={handleCancelForm} isLoading={formLoading} employees={employees} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Settlement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this settlement record? This action cannot be undone.
              {settlementToDelete && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <div className="text-sm font-medium">
                    Employee: {settlementToDelete.employee?.firstName} {settlementToDelete.employee?.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Period: {getMonthName(settlementToDelete.settlementMonth)} {settlementToDelete.settlementYear}
                  </div>
                  <div className="text-sm text-muted-foreground">Final Salary: {formatCurrency(settlementToDelete.finalSalary)}</div>
                  <div className="text-sm text-muted-foreground">
                    Status: <Badge className={statusColors[settlementToDelete.status]}>{settlementToDelete.status}</Badge>
                  </div>
                </div>
              )}
              {!canDeleteSettlement(settlementToDelete) && canForceDelete && (
                <div className="mt-3 p-3 border border-orange-200 bg-orange-50 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" id="forceDelete" checked={forceDelete} onChange={e => setForceDelete(e.target.checked)} className="rounded border-orange-300 text-orange-600 focus:ring-orange-500" />
                    <label htmlFor="forceDelete" className="text-sm font-medium text-orange-800">
                      Force Delete (Admin Override)
                    </label>
                  </div>
                  <p className="text-xs text-orange-700">This will permanently delete the settlement regardless of its status. This action bypasses all business rules and should only be used in exceptional circumstances.</p>
                </div>
              )}
              <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                <strong>Note:</strong> Only pending, disputed, or cancelled settlements can be deleted normally. {canForceDelete ? "Admins can force delete any settlement using the override option above." : "Paid and approved settlements are protected."}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className={`${forceDelete ? "bg-orange-600 hover:bg-orange-700 focus:ring-orange-600" : "bg-red-600 hover:bg-red-700 focus:ring-red-600"}`} disabled={settlementToDelete && !canDeleteSettlement(settlementToDelete) && !forceDelete}>
              {forceDelete ? "Force Delete Settlement" : "Delete Settlement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
