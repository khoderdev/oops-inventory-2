import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VirtualSelect } from "@/components/ui/VirtualSelect";
import { TanStackTable } from "@/components/ui/TanStackTable";
import { approveSettlementAtom, createSettlementAtom, deleteSettlementAtom, employeesAtom, fetchEmployeesAtom, fetchSettlementsAtom, fetchSettlementStatsAtom, markSettlementAsPaidAtom, selectedSettlementAtom, settlementFormLoadingAtom, settlementsAtom, settlementsFiltersAtom, settlementsLoadingAtom, settlementStatsAtom, employeeUsagesCacheAtom, getEmployeeUsagesAtom, prefetchAllEmployeeUsagesAtom } from "@/store/employeeAtoms";
import { employeeAPI } from "@/api/employee.api";
import type { CreateSettlementData, EmployeeSettlement, SettlementStatus } from "@/types/employee";
import { useAtom } from "jotai";
import { CheckCircle, DollarSign, Download, Plus, Trash2, X } from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { createColumnHelper, getCoreRowModel, useReactTable, ColumnDef, SortingState } from "@tanstack/react-table";
import { statusColors } from "@/constants/constants";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import MobileSettlementCardView from "@/components/employees/MobileSettlementCardView";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

// Lazy load the form component
const EmployeeSettlementForm = lazy(() => import("@/components/employees/EmployeeSettlementForm"));

interface EmployeeSettlementsProps {
  selectedEmployeeId?: number | null;
  onEmployeeSelect?: (employeeId: number | null) => void;
}

const statuses: SettlementStatus[] = ["pending", "approved", "paid", "disputed", "cancelled"];

const Test: React.FC<EmployeeSettlementsProps> = ({ selectedEmployeeId, onEmployeeSelect }) => {
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
  const [, setAddedUsageIds] = useState<Set<number>>(new Set());
  const [editingDiscountId, setEditingDiscountId] = useState<number | null>(null);
  const [editingDiscountValue, setEditingDiscountValue] = useState<string>("");
  const { user } = useAuth();
  const canDeleteSettlements = user?.role === "admin" || user?.role === "manager";
  const [discountInputMode, setDiscountInputMode] = useState<"percentage" | "amount">("percentage");
  const [, prefetchAllUsages] = useAtom(prefetchAllEmployeeUsagesAtom);
  const getEmployeeUsages = useAtom(getEmployeeUsagesAtom)[0];
  const [employeeUsagesCache, setEmployeeUsagesCache] = useAtom(employeeUsagesCacheAtom);

  // Helper function to get the cache
  const getEmployeeUsagesCache = useCallback(() => {
    return employeeUsagesCache;
  }, [employeeUsagesCache]);

  const canDeleteSettlement = useCallback(
    (settlement: EmployeeSettlement | null) => {
      if (!canDeleteSettlements || !settlement) return false;
      return ["pending", "disputed", "cancelled"].includes(settlement.status);
    },
    [canDeleteSettlements]
  );

  const canForceDelete = user?.role === "admin";
  const isMobile = useMediaQuery("(max-width: 1104px)");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>("settlementDate");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Debounced filters to reduce API calls
  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    if (employees.length > 0) {
      // Pre-fetch usages for all employees in the background
      prefetchAllUsages();
    }
  }, [employees, prefetchAllUsages]);

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
        return updatedFilters;
      });
    };
    loadData();
  }, [internalSelectedEmployeeId, selectedYear, selectedMonth, setFilters]);

  // Use debounced filters for API calls
  useEffect(() => {
    fetchSettlements(debouncedFilters);
    fetchStats(debouncedFilters);
  }, [debouncedFilters, fetchSettlements, fetchStats]);

  const handleEmployeeChange = useCallback(
    (employeeId: string) => {
      if (employeeId === "all") {
        setInternalSelectedEmployeeId(null);
        onEmployeeSelect?.(null);
      } else {
        const id = parseInt(employeeId, 10);
        setInternalSelectedEmployeeId(id);
        onEmployeeSelect?.(id);
      }
    },
    [onEmployeeSelect]
  );

  const handleStatusFilter = useCallback(
    async (status: string) => {
      const updatedFilters = {
        ...filters,
        status: status === "all" ? undefined : (status as SettlementStatus)
      };
      setFilters(updatedFilters);
    },
    [filters, setFilters]
  );

  // Helper function to update settlement with usage data
  const updateSettlementWithUsageData = useCallback((settlement: EmployeeSettlement, usages: any[]) => {
    const usageBreakdown = usages.map(usage => ({
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
  }, []);

  // Update the handleViewDetails function to include the missing dependency
  const handleViewDetails = useCallback(
    async (settlement: EmployeeSettlement) => {
      try {
        // Immediately show the dialog with basic data
        setSelectedSettlement(settlement);
        setDetailsOpen(true);
        setAddedUsageIds(new Set());
        // Check if we have cached usages for this employee
        const cachedUsages = getEmployeeUsages(settlement.employeeId);
        if (cachedUsages.length > 0) {
          // Filter usages for the settlement period and settled status
          const settledUsages = cachedUsages.filter(usage => usage.isSettled && usage.settlementId === settlement.id);
          if (settledUsages.length > 0) {
            updateSettlementWithUsageData(settlement, settledUsages);
            return;
          }
        }
        // If no cached data or no settled usages found, fetch from API
        const settledUsagesResponse = await employeeAPI.getUsageHistory({
          employeeId: settlement.employeeId,
          isSettled: true,
          settlementId: settlement.id
        });

        if (settledUsagesResponse.success && settledUsagesResponse.data?.usages) {
          updateSettlementWithUsageData(settlement, settledUsagesResponse.data.usages);
          // Also update the cache with the fetched data
          const newCache = { ...getEmployeeUsagesCache() };
          if (!newCache[settlement.employeeId]) {
            newCache[settlement.employeeId] = [];
          }
          // Merge with existing cache, avoiding duplicates
          const existingUsages = newCache[settlement.employeeId];
          const newUsages = settledUsagesResponse.data.usages.filter(newUsage => !existingUsages.some(existing => existing.id === newUsage.id));
          newCache[settlement.employeeId] = [...existingUsages, ...newUsages];
          setEmployeeUsagesCache(newCache);
        }
      } catch (error) {
        console.error("Error fetching settled usages:", error);
      }
    },
    [getEmployeeUsages, updateSettlementWithUsageData, getEmployeeUsagesCache, setEmployeeUsagesCache]
  );

  const markUsageItemsAsSettled = useCallback(async (settlement: EmployeeSettlement) => {
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
  }, []);

  const handleDiscountEdit = useCallback(
    (usageId: number, currentDiscount: number, totalCost: number) => {
      setEditingDiscountId(usageId);

      if (discountInputMode === "percentage") {
        setEditingDiscountValue(currentDiscount.toString());
      } else {
        const discountAmount = (totalCost * currentDiscount) / 100;
        setEditingDiscountValue(discountAmount.toString());
      }
    },
    [discountInputMode]
  );

  const handleDiscountSave = useCallback(
    async (usageId: number, totalCost: number) => {
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
    },
    [selectedSettlement, discountInputMode, editingDiscountValue, filters, fetchSettlements]
  );

  const handleDiscountCancel = useCallback(() => {
    setEditingDiscountId(null);
    setEditingDiscountValue("");
  }, []);

  const handleApprove = useCallback(
    async (settlementId: number) => {
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
    },
    [settlements, approveSettlement, markUsageItemsAsSettled, fetchSettlements, filters]
  );

  const handleMarkAsPaid = useCallback(
    async (settlementId: number) => {
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
    },
    [settlements, markAsPaid, markUsageItemsAsSettled, fetchSettlements, filters]
  );

  const handleCreateSettlement = useCallback(
    async (data: CreateSettlementData) => {
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
    },
    [createSettlement, fetchSettlements, filters, fetchStats, selectedYear, selectedMonth]
  );

  const handleDeleteClick = useCallback((settlement: EmployeeSettlement) => {
    setSettlementToDelete(settlement);
    setForceDelete(false);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
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
  }, [settlementToDelete, forceDelete, deleteSettlement, fetchSettlements, filters, fetchStats, selectedYear, selectedMonth]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSettlementToDelete(null);
    setForceDelete(false);
  }, []);

  const handleCancelForm = useCallback(() => {
    setSettlementFormOpen(false);
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    if (amount == null || isNaN(amount) || !isFinite(amount)) {
      return "$0.00";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  }, []);

  const getMonthName = useCallback((month: number) => {
    return new Date(2024, month - 1, 1).toLocaleDateString("en-US", { month: "long" });
  }, []);

  // Format as DD-MM-YYYY HH:MM:SS AM/PM (match ReportGenerator CSV style)
  const formatDateForCSV = useCallback((date: Date): string => {
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
  }, []);

  const exportSettlements = useCallback(() => {
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
  }, [loading, settlements, getMonthName, formatDateForCSV, internalSelectedEmployeeId, selectedYear, selectedMonth]);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => currentYear - i), [currentYear]);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

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

  const handleSortChange = useCallback((newSortBy: string, newSortOrder: "ASC" | "DESC") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setSorting([{ id: newSortBy, desc: newSortOrder === "DESC" }]);
    setCurrentPage(1);
  }, []);

  // Columns
  const columnHelper = createColumnHelper<EmployeeSettlement>();
  const columns = useMemo<ColumnDef<EmployeeSettlement>[]>(
    () => [
      columnHelper.accessor(row => `${row.employee?.firstName ?? ""} ${row.employee?.lastName ?? ""}`.trim(), {
        id: "employee",
        header: () => (
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => {
                const newOrder = sortBy === "employee" && sortOrder === "ASC" ? "DESC" : "ASC";
                handleSortChange("employee", newOrder);
              }}
              className="text-xs h-auto p-0 font-semibold hover:bg-transparent hover:text-black flex items-center gap-1"
            >
              Employee
              <span className="text-xs">{sortBy === "employee" ? (sortOrder === "ASC" ? "↑" : "↓") : ""}</span>
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <div className="font-medium truncate">
              {row.original.employee?.firstName} {row.original.employee?.lastName}
            </div>
            <div className="text-xs text-muted-foreground truncate">#{row.original.employee?.employeeNumber}</div>
          </div>
        ),
        enableSorting: false
        // size: 220,
        // minSize: 180
      }),
      columnHelper.display({
        id: "period",
        header: () => (
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => {
                const newOrder = sortBy === "period" && sortOrder === "ASC" ? "DESC" : "ASC";
                handleSortChange("period", newOrder);
              }}
              className="text-xs h-auto p-0 font-semibold hover:bg-transparent hover:text-black flex items-center gap-1"
            >
              Period
              <span className="text-xs">{sortBy === "period" ? (sortOrder === "ASC" ? "↑" : "↓") : ""}</span>
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col items-start min-w-0">
            <div className="font-medium">
              {getMonthName(row.original.settlementMonth)} {row.original.settlementYear}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.usageItemsCount} usage item{row.original.usageItemsCount !== 1 ? "s" : ""}
            </div>
          </div>
        ),
        enableSorting: false
        // size: 180,
        // minSize: 150
      }),
      columnHelper.accessor("baseSalary", {
        id: "baseSalary",
        header: () => (
          <div className="flex items-center justify-end w-full">
            <Button
              variant="ghost"
              onClick={() => {
                const newOrder = sortBy === "baseSalary" && sortOrder === "ASC" ? "DESC" : "ASC";
                handleSortChange("baseSalary", newOrder);
              }}
              className="text-xs h-auto p-0 font-semibold hover:bg-transparent hover:text-black flex items-center gap-1"
            >
              Base Salary
              <span className="text-xs">{sortBy === "baseSalary" ? (sortOrder === "ASC" ? "↑" : "↓") : ""}</span>
            </Button>
          </div>
        ),
        cell: ({ getValue }) => <div className="font-mono text-right w-full">{formatCurrency(Number(getValue()))}</div>,
        enableSorting: false,
        size: 140,
        minSize: 120
      }),
      columnHelper.display({
        id: "deductions",
        header: () => (
          <div className="flex items-center justify-end w-full">
            <Button
              variant="ghost"
              onClick={() => {
                const newOrder = sortBy === "deductions" && sortOrder === "ASC" ? "DESC" : "ASC";
                handleSortChange("deductions", newOrder);
              }}
              className="text-xs h-auto p-0 font-semibold hover:bg-transparent hover:text-black flex items-center gap-1"
            >
              Deductions
              <span className="text-xs">{sortBy === "deductions" ? (sortOrder === "ASC" ? "↑" : "↓") : ""}</span>
            </Button>
          </div>
        ),
        cell: ({ row }) => <div className="font-mono text-red-600 text-right w-full">-{formatCurrency(Number(row.original.totalDeduction))}</div>,
        enableSorting: false
        // size: 140,
        // minSize: 120
      }),
      columnHelper.accessor("finalSalary", {
        id: "finalSalary",
        header: () => (
          <div className="flex items-center justify-end w-full">
            <Button
              variant="ghost"
              onClick={() => {
                const newOrder = sortBy === "finalSalary" && sortOrder === "ASC" ? "DESC" : "ASC";
                handleSortChange("finalSalary", newOrder);
              }}
              className="text-xs h-auto p-0 font-semibold hover:bg-transparent hover:text-black flex items-center gap-1"
            >
              Final Salary
              <span className="text-xs">{sortBy === "finalSalary" ? (sortOrder === "ASC" ? "↑" : "↓") : ""}</span>
            </Button>
          </div>
        ),
        cell: ({ getValue }) => <div className="font-mono font-medium text-right w-full">{formatCurrency(Number(getValue()))}</div>,
        enableSorting: false
        // size: 140,
        // minSize: 120
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: () => (
          <div className="flex items-center justify-center w-full">
            <Button
              variant="ghost"
              onClick={() => {
                const newOrder = sortBy === "status" && sortOrder === "ASC" ? "DESC" : "ASC";
                handleSortChange("status", newOrder);
              }}
              className="text-xs h-auto p-0 font-semibold hover:bg-transparent hover:text-black flex items-center gap-1"
            >
              Status
              <span className="text-xs">{sortBy === "status" ? (sortOrder === "ASC" ? "↑" : "↓") : ""}</span>
            </Button>
          </div>
        ),
        cell: ({ getValue }) => (
          <div className="flex justify-center w-full">
            <Badge variant="secondary" className={cn("min-w-[80px] justify-center py-1 px-2 text-xs font-medium", statusColors[getValue() as SettlementStatus])}>
              {String(getValue()).charAt(0).toUpperCase() + String(getValue()).slice(1)}
            </Badge>
          </div>
        ),
        enableSorting: false
        // size: 120,
        // minSize: 100
      }),
      columnHelper.accessor("settlementDate", {
        id: "settlementDate",
        header: () => (
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => {
                const newOrder = sortBy === "settlementDate" && sortOrder === "ASC" ? "DESC" : "ASC";
                handleSortChange("settlementDate", newOrder);
              }}
              className="text-xs h-auto p-0 font-semibold hover:bg-transparent hover:text-black flex items-center gap-1"
            >
              Date
              <span className="text-xs">{sortBy === "settlementDate" ? (sortOrder === "ASC" ? "↑" : "↓") : ""}</span>
            </Button>
          </div>
        ),
        cell: ({ getValue }) => <div className="text-sm text-gray-700">{getValue() ? formatDate(String(getValue())) : "-"}</div>,
        enableSorting: false
        // size: 150,
        // minSize: 130
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="flex w-full items-center justify-end pr-6 text-xs font-semibold">Actions</div>,
        cell: ({ row }) => {
          const settlement = row.original;
          return (
            <div className="flex w-full items-center justify-end">
              {settlement.status === "pending" && (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => handleApprove(settlement.id)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Approve settlement</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {settlement.status === "approved" && (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => handleMarkAsPaid(settlement.id)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50">
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mark as paid</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {(canDeleteSettlement(settlement) || canForceDelete) && (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(settlement)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete settlement</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          );
        },
        enableSorting: false,
        size: 160,
        // minSize: 140,
        enableResizing: false
      })
    ],
    [sortBy, sortOrder, handleSortChange]
  );

  const table = useReactTable({
    data: paginatedSettlements,
    columns,
    state: { sorting },
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true
  });

  return (
    <div className="p-2 px-6">
      {isMobile ? (
        <MobileSettlementCardView settlements={paginatedSettlements} onViewDetails={handleViewDetails} onApprove={handleApprove} onMarkAsPaid={handleMarkAsPaid} onDelete={handleDeleteClick} canDeleteSettlement={canDeleteSettlement} canForceDelete={canForceDelete} statusColors={statusColors} />
      ) : (
        <>
          {/* Header row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            {/* Title & description */}
            <div className="flex flex-col shrink-0">
              <CardTitle className="text-lg font-semibold">Settlement Records</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Monthly salary settlements and payment tracking</CardDescription>
            </div>

            {/* Filters & buttons */}
            <div className="flex-1 flex items-stretch lg:items-center justify-end gap-2">
              <VirtualSelect
                items={[
                  { id: "all", label: "All Employees" },
                  ...employees.map(employee => ({
                    id: employee.id.toString(),
                    label: `${employee.firstName} ${employee.lastName}`
                  }))
                ]}
                value={
                  internalSelectedEmployeeId
                    ? {
                        id: internalSelectedEmployeeId.toString(),
                        label: employees.find(e => e.id === internalSelectedEmployeeId)?.firstName + " " + employees.find(e => e.id === internalSelectedEmployeeId)?.lastName || "Unknown"
                      }
                    : { id: "all", label: "All Employees" }
                }
                onChange={item => handleEmployeeChange(item ? String(item.id) : "all")}
                placeholder="Select employee"
                disabled={employees.length === 0}
                height={250}
                inputHeight={35}
                className="!bg-background !w-[160px]"
              />

              <Select value={selectedYear.toString()} onValueChange={value => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="h-9 px-2 text-xs !w-[70px]">
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

              <Select value={selectedMonth?.toString() || "all"} onValueChange={value => setSelectedMonth(value === "all" ? undefined : parseInt(value))}>
                <SelectTrigger className="h-9 px-2 text-xs !w-[100px]">
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

              <Select value={filters.status || "all"} onValueChange={handleStatusFilter}>
                <SelectTrigger className="h-9 px-2 text-xs !w-[100px]">
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

              {/* Action buttons */}
              <div className="flex gap-2 flex-1 sm:flex-none justify-end">
                <Button size="sm" variant="outline" className="gap-1 h-9 w-full sm:w-auto" onClick={exportSettlements} disabled={loading || settlements.length === 0}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button size="sm" className="gap-1 h-9 w-full sm:w-auto" onClick={() => setSettlementFormOpen(true)} disabled={formLoading}>
                  <Plus className="h-4 w-4" />
                  Create Settlement
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <TanStackTable table={table} emptyMessage="No settlements found" maxHeight="calc(100vh - 170px)" onRowClick={row => handleViewDetails(row.original)} />
          </div>
        </>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-background border-b p-1.5 px-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg sm:text-xl">Settlement Details</DialogTitle>
                <DialogClose asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {selectedSettlement && (
              <div className="space-y-4 sm:space-y-6">
                <Card>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <div className="text-xs sm:text-sm">Employee</div>
                        <div className="font-medium text-sm sm:text-base">
                          {selectedSettlement.employee?.firstName} {selectedSettlement.employee?.lastName}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm">Period</div>
                        <div className="font-medium text-sm sm:text-base">
                          {getMonthName(selectedSettlement.settlementMonth)} {selectedSettlement.settlementYear}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm">Status</div>
                        <Select
                          value={selectedSettlement.status}
                          onValueChange={async (newStatus: SettlementStatus) => {
                            if (!selectedSettlement) return;
                            try {
                              const updatedSettlement = {
                                ...selectedSettlement,
                                status: newStatus as SettlementStatus
                              };
                              setSelectedSettlement(updatedSettlement);
                              await employeeAPI.updateSettlementStatus(selectedSettlement.id, newStatus);
                              await fetchSettlements(filters);
                              toast.success(`Status updated to ${newStatus}`);
                            } catch (error) {
                              console.error("Error changing status:", error);
                              setSelectedSettlement(selectedSettlement);
                              toast.error("Failed to update status");
                            }
                          }}
                        >
                          <SelectTrigger className="w-28 h-7 p-1 text-xs">
                            <SelectValue>
                              <Badge className={`text-xs ${statusColors[selectedSettlement.status]}`}>{selectedSettlement.status.charAt(0).toUpperCase() + selectedSettlement.status.slice(1)}</Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map(status => (
                              <SelectItem key={status} value={status}>
                                <Badge className={`text-xs ${statusColors[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm">Settlement Date</div>
                        <div className="font-medium text-sm sm:text-base">{formatDate(selectedSettlement.settlementDate)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base sm:text-lg">Financial Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm sm:text-base">Base Salary</span>
                        <span className="font-mono text-sm sm:text-base">{formatCurrency(selectedSettlement.baseSalary)}</span>
                      </div>
                      <div className="flex justify-between items-center text-red-600">
                        <span className="text-sm sm:text-base">Total Usage Cost</span>
                        <span className="font-mono text-sm sm:text-base">-{formatCurrency(selectedSettlement.totalUsageCost)}</span>
                      </div>
                      <div className="flex justify-between items-center text-green-600">
                        <span className="text-sm sm:text-base">Discount Amount</span>
                        <span className="font-mono text-sm sm:text-base">+{formatCurrency(selectedSettlement.totalDiscountAmount)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-red-600">
                        <span className="text-sm sm:text-base">Net Deduction</span>
                        <span className="font-mono text-sm sm:text-base">-{formatCurrency(selectedSettlement.totalDeduction)}</span>
                      </div>
                      {selectedSettlement.bonusAmount > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span className="text-sm sm:text-base">Bonus</span>
                          <span className="font-mono text-sm sm:text-base">+{formatCurrency(selectedSettlement.bonusAmount)}</span>
                        </div>
                      )}
                      {selectedSettlement.penaltyAmount > 0 && (
                        <div className="flex justify-between items-center text-red-600">
                          <span className="text-sm sm:text-base">Penalty</span>
                          <span className="font-mono text-sm sm:text-base">-{formatCurrency(selectedSettlement.penaltyAmount)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between items-center font-bold text-base sm:text-lg">
                        <span>Final Salary</span>
                        <span className="font-mono">{formatCurrency(selectedSettlement.finalSalary)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedSettlement.settlementData?.usageBreakdown && (
                  <Card>
                    <div className="flex justify-between items-center p-4 gap-2">
                      <CardTitle className="text-base sm:text-lg">Items Usage</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-medium">Discount type:</span>
                        <Select value={discountInputMode} onValueChange={(value: "percentage" | "amount") => setDiscountInputMode(value)}>
                          <SelectTrigger className="w-28 sm:w-32 h-8 text-xs">
                            <SelectValue placeholder="Input mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="amount">Amount ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <CardContent className="p-4 pt-0">
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs sm:text-sm">Date</TableHead>
                              <TableHead className="text-xs sm:text-sm">Item</TableHead>
                              <TableHead className="text-xs sm:text-sm">Quantity</TableHead>
                              <TableHead className="text-xs sm:text-sm">Unit Cost</TableHead>
                              <TableHead className="text-xs sm:text-sm">Total</TableHead>
                              <TableHead className="text-xs sm:text-sm ">Discount</TableHead>
                              <TableHead className="text-xs sm:text-sm">Final</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedSettlement.settlementData.usageBreakdown.map(usage => (
                              <TableRow key={usage.id}>
                                <TableCell className="text-xs sm:text-sm">{formatDate(usage.usageDate)}</TableCell>
                                <TableCell className="text-xs sm:text-sm">{usage.itemName}</TableCell>
                                <TableCell className="text-xs sm:text-sm">{Number(usage.quantity) % 1 === 0 ? Math.floor(usage.quantity) : usage.quantity.toFixed(2)}</TableCell>
                                <TableCell className="font-mono text-xs sm:text-sm">{formatCurrency(usage.unitCost)}</TableCell>
                                <TableCell className="font-mono text-xs sm:text-sm">{formatCurrency(usage.totalCost)}</TableCell>
                                <TableCell className="font-mono text-green-600 text-xs sm:text-sm cursor-pointer hover:bg-green-400/25" onDoubleClick={() => handleDiscountEdit(usage.id, usage.discountApplied, usage.totalCost)} title="Double-click to edit discount">
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
                                        className="w-14 sm:w-16 px-1 py-1 text-xs rounded"
                                        min="0"
                                        max={discountInputMode === "percentage" ? "100" : usage.totalCost.toFixed(2)}
                                        step={discountInputMode === "percentage" ? "0.1" : "0.01"}
                                        autoFocus
                                      />
                                      <span className="text-xs font-bold ml-1">{discountInputMode === "percentage" ? "%" : "$"}</span>
                                    </div>
                                  ) : (
                                    <span className="font-semibold">{discountInputMode === "percentage" ? `-${usage.discountApplied}%` : `-${formatCurrency((usage.totalCost * usage.discountApplied) / 100)}`}</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-mono font-medium text-xs sm:text-sm">{formatCurrency(usage.finalCost)}</TableCell>
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
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
            <div className="flex justify-end">
              <Button onClick={() => setDetailsOpen(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settlementFormOpen} onOpenChange={setSettlementFormOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Settlement</DialogTitle>
            <DialogDescription>Generate a monthly settlement for an employee based on their usage and salary</DialogDescription>
          </DialogHeader>
          <Suspense fallback={<div className="p-4 text-center">Loading form...</div>}>
            <EmployeeSettlementForm onSubmit={handleCreateSettlement} onCancel={handleCancelForm} isLoading={formLoading} employees={employees} />
          </Suspense>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Settlement</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
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

export default Test;
