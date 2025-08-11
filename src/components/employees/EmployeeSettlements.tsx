import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { approveSettlementAtom, createSettlementAtom, deleteSettlementAtom, employeesAtom, fetchEmployeesAtom, fetchSettlementsAtom, fetchSettlementStatsAtom, markSettlementAsPaidAtom, selectedSettlementAtom, settlementFormLoadingAtom, settlementsAtom, settlementsFiltersAtom, settlementsLoadingAtom, settlementStatsAtom, settlementStatsLoadingAtom } from "@/store/employeeAtoms";
import { employeeAPI } from "@/api/employee.api";
import type { CreateSettlementData, EmployeeSettlement, SettlementStatus } from "@/types/employee";
import { useAtom } from "jotai";
import { Calendar, CheckCircle, DollarSign, Download, Eye, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
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
  const [statsLoading] = useAtom(settlementStatsLoadingAtom);
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
  const [newUsagesDialogOpen, setNewUsagesDialogOpen] = useState(false);
  const [newUsages, setNewUsages] = useState<any[]>([]);
  const [selectedUsageIds, setSelectedUsageIds] = useState<number[]>([]);
  const [loadingNewUsages, setLoadingNewUsages] = useState(false);
  const [addedUsageIds, setAddedUsageIds] = useState<Set<number>>(new Set());
  const [editingDiscountId, setEditingDiscountId] = useState<number | null>(null);
  const [editingDiscountValue, setEditingDiscountValue] = useState<string>("");
  const { user } = useAuth();
  const canDeleteSettlements = user?.role === "admin" || user?.role === "manager";
  const canDeleteSettlement = (settlement: EmployeeSettlement | null) => {
    if (!canDeleteSettlements || !settlement) return false;
    return ["pending", "disputed", "cancelled"].includes(settlement.status);
  };
  const canForceDelete = user?.role === "admin";

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
      // Fetch all settled usages for this specific settlement
      const settledUsagesResponse = await employeeAPI.getUsageHistory({
        employeeId: settlement.employeeId,
        isSettled: true,
        settlementId: settlement.id
      });

      if (settledUsagesResponse.success && settledUsagesResponse.data?.usages) {
        const settledUsages = settledUsagesResponse.data.usages;
        
        // Build usage breakdown from all settled usages for this settlement
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

        // Calculate totals from actual settled usages
        const totalUsageCost = usageBreakdown.reduce((sum, item) => sum + item.totalCost, 0);
        const totalDiscountAmount = usageBreakdown.reduce((sum, item) => sum + (item.totalCost - item.finalCost), 0);
        const totalDeduction = totalUsageCost - totalDiscountAmount;

        // Update settlement data with actual usage breakdown
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
        // If no settled usages found, use the settlement as-is
        setSelectedSettlement(settlement);
      }

      setDetailsOpen(true);
      // Reset added usage IDs when viewing a different settlement
      setAddedUsageIds(new Set());
    } catch (error) {
      console.error("Error fetching settled usages:", error);
      // Fallback to showing settlement without updated usage breakdown
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
        console.log(`Marked ${unsettledUsages.data.usages.length} usage items as settled for settlement ${settlement.id}`);
      }
    } catch (error) {
      console.error("Error marking usage items as settled:", error);
      throw error;
    }
  };

  const fetchNewUsagesAfterSettlement = async (settlement: EmployeeSettlement) => {
    setLoadingNewUsages(true);
    try {
      // Get usages created after the settlement date
      const settlementDate = new Date(settlement.createdAt);
      const startDate = settlementDate.toISOString().split("T")[0];
      const endDate = new Date(settlement.settlementYear, settlement.settlementMonth, 0).toISOString().split("T")[0];

      const usagesResponse = await employeeAPI.getUsageHistory({
        employeeId: settlement.employeeId,
        startDate,
        endDate,
        isSettled: false
      });

      if (usagesResponse.success && usagesResponse.data?.usages) {
        // Get all usage IDs that should be excluded (already in settlement + locally added)
        const excludedUsageIds = new Set(addedUsageIds);
        
        // Add existing usage IDs from the settlement's usage breakdown
        if (settlement.settlementData?.usageBreakdown) {
          settlement.settlementData.usageBreakdown.forEach(usage => {
            excludedUsageIds.add(usage.id);
          });
        }
        
        // Filter for truly new usages only
        const newUsagesAfterSettlement = usagesResponse.data.usages.filter(usage => {
          const createdAfterSettlement = new Date(usage.createdAt) > settlementDate;
          const notExcluded = !excludedUsageIds.has(usage.id);
          
          return createdAfterSettlement && notExcluded;
        });
        
        if (newUsagesAfterSettlement.length > 0) {
          setNewUsages(newUsagesAfterSettlement);
          setSelectedUsageIds(newUsagesAfterSettlement.map(usage => usage.id));
          setNewUsagesDialogOpen(true);
        } else {
          toast.info("No new usage records found after this settlement date");
        }
      }
    } catch (error) {
      console.error("Error fetching new usages:", error);
      toast.error("Failed to fetch new usage records");
    } finally {
      setLoadingNewUsages(false);
    }
  };

  const handleDiscountEdit = (usageId: number, currentDiscount: number) => {
    setEditingDiscountId(usageId);
    setEditingDiscountValue(currentDiscount.toString());
  };

  const handleDiscountSave = async (usageId: number) => {
    if (!selectedSettlement) return;

    try {
      const newDiscountValue = parseFloat(editingDiscountValue);
      if (isNaN(newDiscountValue) || newDiscountValue < 0 || newDiscountValue > 100) {
        toast.error("Please enter a valid discount percentage (0-100)");
        return;
      }

      // Find the usage item in the breakdown
      const usageItem = selectedSettlement.settlementData?.usageBreakdown?.find(u => u.id === usageId);
      if (!usageItem) return;

      // Calculate new final cost based on new discount
      const discountAmount = (usageItem.totalCost * newDiscountValue) / 100;
      const newFinalCost = usageItem.totalCost - discountAmount;

      // Update the usage record in the backend
      await employeeAPI.updateUsage(usageId, {
        discountApplied: newDiscountValue,
        finalCost: newFinalCost
      });

      // Update the local state
      const updatedUsageBreakdown = selectedSettlement.settlementData.usageBreakdown.map(usage => 
        usage.id === usageId 
          ? { ...usage, discountApplied: newDiscountValue, finalCost: newFinalCost }
          : usage
      );

      // Recalculate totals
      const totalUsageCost = updatedUsageBreakdown.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
      const totalDiscountAmount = updatedUsageBreakdown.reduce((sum, item) => sum + (Number(item.totalCost || 0) - Number(item.finalCost || 0)), 0);
      const totalDeduction = totalUsageCost - totalDiscountAmount;
      const baseSalary = Number(selectedSettlement.baseSalary || 0);
      const bonusAmount = Number(selectedSettlement.bonusAmount || 0);
      const penaltyAmount = Number(selectedSettlement.penaltyAmount || 0);
      const finalSalary = baseSalary - totalDeduction + bonusAmount - penaltyAmount;

      // Update settlement data for local state (EmployeeSettlement.settlementData format)
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
          monthName: new Date(selectedSettlement.settlementYear, selectedSettlement.settlementMonth - 1).toLocaleString('default', { month: 'long' })
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

      // Update local state
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
      
      // Refresh settlements list
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

  const addUsagesToCurrentSettlement = async (usageIds: number[]) => {
    if (!selectedSettlement) {
      return;
    }

    try {
      // Mark selected usages as settled with current settlement ID and collect the updated usages
      const updatedUsages = [];
      for (const usageId of usageIds) {
        const updateResult = await employeeAPI.updateUsage(usageId, {
          isSettled: true,
          settlementId: selectedSettlement.id
        });
        
        if (updateResult.success && updateResult.data) {
          updatedUsages.push(updateResult.data);
        }
      }

      // Get existing usages that already belong to this settlement
      const existingUsagesResponse = await employeeAPI.getUsageHistory({
        employeeId: selectedSettlement.employeeId,
        startDate: new Date(selectedSettlement.settlementYear, selectedSettlement.settlementMonth - 1, 1).toISOString().split("T")[0],
        endDate: new Date(selectedSettlement.settlementYear, selectedSettlement.settlementMonth, 0).toISOString().split("T")[0],
        isSettled: true
      });

      if (existingUsagesResponse.success && existingUsagesResponse.data?.usages) {
        // Get existing usages for this settlement (excluding the ones we just added)
        const existingSettlementUsages = existingUsagesResponse.data.usages.filter(usage => 
          usage.settlementId === selectedSettlement.id && !usageIds.includes(usage.id)
        );
        
        // Combine existing usages with newly added ones
        const allSettlementUsages = [...existingSettlementUsages, ...updatedUsages];

        // Build complete usage breakdown
        const completeUsageBreakdown = allSettlementUsages.map(usage => ({
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

        // Calculate totals
        const totalUsageCost = completeUsageBreakdown.reduce((sum, item) => sum + item.totalCost, 0);
        const totalDiscountAmount = completeUsageBreakdown.reduce((sum, item) => sum + (item.totalCost - item.finalCost), 0);
        const totalDeduction = totalUsageCost - totalDiscountAmount;
        const finalSalary = Number(selectedSettlement.baseSalary) - totalDeduction + Number(selectedSettlement.bonusAmount) - Number(selectedSettlement.penaltyAmount);

        const { employeeAPI: api } = await import("@/api/employee.api");
        
        // Build settlement data in the format the backend expects (SettlementPreview)
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
            monthName: new Date(selectedSettlement.settlementYear, selectedSettlement.settlementMonth - 1).toLocaleString('default', { month: 'long' })
          },
          calculation: {
            baseSalary: Number(selectedSettlement.baseSalary),
            totalUsageCost,
            totalDiscountAmount,
            totalDeduction,
            bonusAmount: Number(selectedSettlement.bonusAmount),
            penaltyAmount: Number(selectedSettlement.penaltyAmount),
            finalSalary,
            usageItemsCount: completeUsageBreakdown.length
          },
          usages: completeUsageBreakdown,
          usageBreakdown: completeUsageBreakdown
        };

        const updateSettlementResult = await api.updateSettlement(selectedSettlement.id, {
          totalUsageCost,
          totalDiscountAmount,
          totalDeduction,
          finalSalary,
          settlementData: settlementDataForAPI
        });

        if (updateSettlementResult.success) {
          // Build settlement data in the format expected by EmployeeSettlement type
          const settlementDataForState = {
            usageBreakdown: completeUsageBreakdown,
            calculationDetails: {
              baseSalary: Number(selectedSettlement.baseSalary),
              totalUsageCost,
              discountPercentage: Number(selectedSettlement.employee?.discountPercentage || 0),
              totalDiscountAmount,
              netDeduction: totalDeduction,
              bonusAmount: Number(selectedSettlement.bonusAmount),
              penaltyAmount: Number(selectedSettlement.penaltyAmount)
            }
          };

          // Immediately update the selected settlement with the new data
          const updatedSelectedSettlement = {
            ...selectedSettlement,
            totalUsageCost,
            totalDiscountAmount,
            totalDeduction,
            finalSalary,
            usageItemsCount: completeUsageBreakdown.length,
            settlementData: settlementDataForState
          };
          
          setSelectedSettlement(updatedSelectedSettlement);
          
          // Track the added usage IDs locally to prevent them from reappearing
          setAddedUsageIds(prev => {
            const newSet = new Set(prev);
            usageIds.forEach(id => newSet.add(id));
            return newSet;
          });
          
          // Remove the added usages from the newUsages list
          const remainingNewUsages = newUsages.filter(usage => !usageIds.includes(Number(usage.id)));
          setNewUsages(remainingNewUsages);
          
          // Update selected usage IDs to remove the added ones
          setSelectedUsageIds(prev => prev.filter(id => !usageIds.includes(id)));
          
          // If no more usages remain, close the dialog
          if (remainingNewUsages.length === 0) {
            setNewUsagesDialogOpen(false);
            setSelectedUsageIds([]);
          }
        }
      }

      await fetchSettlements(filters);
      
      toast.success(`Added ${usageIds.length} usage records to the current settlement`);
    } catch (error) {
      console.error("Error adding usages to settlement:", error);
      toast.error("Failed to add usages to settlement");
    }
  };

  const handleApprove = async (settlementId: number) => {
    try {
      // Find the settlement to get its details
      const settlement = settlements.find(s => s.id === settlementId);
      if (!settlement) {
        throw new Error("Settlement not found");
      }

      // Approve the settlement
      await approveSettlement({
        id: settlementId,
        notes: "Approved via settlement management interface"
      });

      // Mark all usage items as settled
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
      // Find the settlement to get its details
      const settlement = settlements.find(s => s.id === settlementId);
      if (!settlement) {
        throw new Error("Settlement not found");
      }

      // Mark the settlement as paid
      await markAsPaid({
        id: settlementId,
        paymentMethod: "bank_transfer",
        paymentReference: `PAY-${settlementId}-${Date.now()}`
      });

      // Mark all usage items as settled (if not already settled from approval)
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 p-4">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={internalSelectedEmployeeId?.toString() || "all"} onValueChange={handleEmployeeChange}>
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

                          {(canDeleteSettlement(settlement) || canForceDelete) && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(settlement)} className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-3 w-3" />
                              Delete
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Settlement Details</DialogTitle>
                <DialogDescription>Detailed breakdown of the settlement calculation</DialogDescription>
              </div>
              {selectedSettlement && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNewUsagesAfterSettlement(selectedSettlement)}
                  disabled={loadingNewUsages}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{loadingNewUsages ? "Loading..." : "Add New Usage"}</span>
                </Button>
              )}
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
                  <CardHeader>
                    <CardTitle className="text-lg">Usage Breakdown</CardTitle>
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
                              <TableCell 
                                className="font-mono text-green-600 cursor-pointer hover:bg-muted/50"
                                onDoubleClick={() => handleDiscountEdit(usage.id, usage.discountApplied)}
                                title="Double-click to edit discount"
                              >
                                {editingDiscountId === usage.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={editingDiscountValue}
                                      onChange={(e) => setEditingDiscountValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleDiscountSave(usage.id);
                                        } else if (e.key === 'Escape') {
                                          handleDiscountCancel();
                                        }
                                      }}
                                      onBlur={() => handleDiscountSave(usage.id)}
                                      className="w-16 px-1 py-0 text-xs border rounded"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                      autoFocus
                                    />
                                    <span className="text-xs">%</span>
                                  </div>
                                ) : (
                                  <span>-{usage.discountApplied}%</span>
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

      {/* New Usages Dialog */}
      <Dialog open={newUsagesDialogOpen} onOpenChange={setNewUsagesDialogOpen}>
        <DialogContent key={`new-usages-${newUsages.length}-${Date.now()}`} className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Usage to Settlement</DialogTitle>
            <DialogDescription>
              Usage items created after the settlement date that can be added to the current settlement
            </DialogDescription>
          </DialogHeader>

          {newUsages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No new usage records found after the settlement creation date.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Found {newUsages.length} usage record(s) created after this settlement. Select which ones to add:
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {newUsages.map((usage, index) => (
                  <div key={usage.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      id={`usage-${usage.id}`}
                      className="w-4 h-4"
                      checked={selectedUsageIds.includes(usage.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsageIds(prev => [...prev, usage.id]);
                        } else {
                          setSelectedUsageIds(prev => prev.filter(id => id !== usage.id));
                        }
                      }}
                    />
                    <label htmlFor={`usage-${usage.id}`} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">
                            {usage.usageType === "menu_item" ? "Menu Item" : "Material"}: {usage.material?.name || usage.menuItem?.name || "Unknown Item"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Quantity: {usage.quantity} {usage.unit} • Cost: ${Number(usage.finalCost || 0).toFixed(2)} • Date: {new Date(usage.usageDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${Number(usage.finalCost || 0).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(usage.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Total Cost: ${newUsages.reduce((sum, usage) => sum + Number(usage.finalCost || 0), 0).toFixed(2)}
                </div>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setNewUsagesDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedUsageIds.length > 0) {
                        addUsagesToCurrentSettlement(selectedUsageIds);
                      } else {
                        toast.error("Please select at least one usage record to add");
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Selected to Settlement
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
