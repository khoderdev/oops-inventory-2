import type { CreateEmployeeData, CreateSettlementData, Employee, EmployeeFilters, EmployeeSettlement, EmployeeStats, EmployeeUsage, MonthlyUsageSummary, PaymentMethod, SettlementFilters, SettlementPreview, SettlementStats, UpdateEmployeeData, UsageFilters, UsageStats } from "@/types/employee";
import { atom } from "jotai";
import { atomWithReset } from "jotai/utils";

// ============================================================================
// EMPLOYEE ATOMS
// ============================================================================

// Employee list and pagination
export const employeesAtom = atom<Employee[]>([]);
export const employeesTotalAtom = atom<number>(0);
export const employeesPageAtom = atom<number>(1);
export const employeesLimitAtom = atom<number>(20);
export const employeesFiltersAtom = atomWithReset<EmployeeFilters>({});

// Employee loading and error states
export const employeesLoadingAtom = atom<boolean>(false);
export const employeesErrorAtom = atomWithReset<string | null>(null);

// Selected employee
export const selectedEmployeeAtom = atomWithReset<Employee | null>(null);
export const selectedEmployeeLoadingAtom = atom<boolean>(false);

// Employee form state
export const employeeFormOpenAtom = atom<boolean>(false);
export const employeeFormModeAtom = atom<"create" | "edit">("create");
export const employeeFormLoadingAtom = atom<boolean>(false);

// Employee stats
export const employeeStatsAtom = atomWithReset<EmployeeStats | null>(null);
export const employeeStatsLoadingAtom = atom<boolean>(false);

// Derived atoms for employee management
export const employeesPaginationAtom = atom(get => ({
  total: get(employeesTotalAtom),
  page: get(employeesPageAtom),
  limit: get(employeesLimitAtom),
  pages: Math.ceil(get(employeesTotalAtom) / get(employeesLimitAtom))
}));

export const activeEmployeesAtom = atom(get => get(employeesAtom).filter(emp => emp.isActive));

export const employeesByDepartmentAtom = atom(get => {
  const employees = get(employeesAtom);
  return employees.reduce(
    (acc, emp) => {
      if (!acc[emp.department]) {
        acc[emp.department] = [];
      }
      acc[emp.department].push(emp);
      return acc;
    },
    {} as Record<string, Employee[]>
  );
});

// ============================================================================
// EMPLOYEE USAGE ATOMS
// ============================================================================

// Usage list and pagination
export const usagesAtom = atom<EmployeeUsage[]>([]);
export const usagesTotalAtom = atom<number>(0);
export const usagesPageAtom = atom<number>(1);
export const usagesLimitAtom = atom<number>(20);
export const usagesFiltersAtom = atomWithReset<UsageFilters>({});

// Usage loading and error states
export const usagesLoadingAtom = atom<boolean>(false);
export const usagesErrorAtom = atomWithReset<string | null>(null);

// Selected usage
export const selectedUsageAtom = atomWithReset<EmployeeUsage | null>(null);

// Usage form state
export const usageFormOpenAtom = atom<boolean>(false);
export const usageFormModeAtom = atom<"create" | "edit">("create");
export const usageFormLoadingAtom = atom<boolean>(false);

// Usage stats
export const usageStatsAtom = atomWithReset<UsageStats | null>(null);
export const usageStatsLoadingAtom = atom<boolean>(false);

// Monthly usage summary
export const monthlyUsageSummaryAtom = atomWithReset<MonthlyUsageSummary | null>(null);
export const monthlyUsageSummaryLoadingAtom = atom<boolean>(false);

// Derived atoms for usage management
export const usagesPaginationAtom = atom(get => ({
  total: get(usagesTotalAtom),
  page: get(usagesPageAtom),
  limit: get(usagesLimitAtom),
  pages: Math.ceil(get(usagesTotalAtom) / get(usagesLimitAtom))
}));

export const unsettledUsagesAtom = atom(get => get(usagesAtom).filter(usage => !usage.isSettled));

export const usagesByTypeAtom = atom(get => {
  const usages = get(usagesAtom);
  return usages.reduce(
    (acc, usage) => {
      if (!acc[usage.usageType]) {
        acc[usage.usageType] = [];
      }
      acc[usage.usageType].push(usage);
      return acc;
    },
    {} as Record<string, EmployeeUsage[]>
  );
});

export const totalUsageCostAtom = atom(get => get(usagesAtom).reduce((total, usage) => total + usage.finalCost, 0));

// ============================================================================
// EMPLOYEE SETTLEMENT ATOMS
// ============================================================================

// Settlement list and pagination
export const settlementsAtom = atom<EmployeeSettlement[]>([]);
export const settlementsTotalAtom = atom<number>(0);
export const settlementsPageAtom = atom<number>(1);
export const settlementsLimitAtom = atom<number>(20);
export const settlementsFiltersAtom = atomWithReset<SettlementFilters>({});

// Settlement loading and error states
export const settlementsLoadingAtom = atom<boolean>(false);
export const settlementsErrorAtom = atomWithReset<string | null>(null);

// Selected settlement
export const selectedSettlementAtom = atomWithReset<EmployeeSettlement | null>(null);
export const selectedSettlementLoadingAtom = atom<boolean>(false);

// Settlement form state
export const settlementFormOpenAtom = atom<boolean>(false);
export const settlementFormModeAtom = atom<"create" | "edit">("create");
export const settlementFormLoadingAtom = atom<boolean>(false);

// Settlement preview
export const settlementPreviewAtom = atomWithReset<SettlementPreview | null>(null);
export const settlementPreviewLoadingAtom = atom<boolean>(false);

// Settlement stats
export const settlementStatsAtom = atomWithReset<SettlementStats | null>(null);
export const settlementStatsLoadingAtom = atom<boolean>(false);

// Pending settlements
export const pendingSettlementsAtom = atomWithReset<EmployeeSettlement[]>([]);
export const pendingSettlementsLoadingAtom = atom<boolean>(false);

// Derived atoms for settlement management
export const settlementsPaginationAtom = atom(get => ({
  total: get(settlementsTotalAtom),
  page: get(settlementsPageAtom),
  limit: get(settlementsLimitAtom),
  pages: Math.ceil(get(settlementsTotalAtom) / get(settlementsLimitAtom))
}));

export const settlementsByStatusAtom = atom(get => {
  const settlements = get(settlementsAtom);
  return settlements.reduce(
    (acc, settlement) => {
      if (!acc[settlement.status]) {
        acc[settlement.status] = [];
      }
      acc[settlement.status].push(settlement);
      return acc;
    },
    {} as Record<string, EmployeeSettlement[]>
  );
});

export const approvedSettlementsAtom = atom(get => get(settlementsAtom).filter(settlement => settlement.status === "approved"));

export const paidSettlementsAtom = atom(get => get(settlementsAtom).filter(settlement => settlement.status === "paid"));

export const totalPendingPaymentsAtom = atom(get => get(pendingSettlementsAtom).reduce((total, settlement) => total + settlement.finalSalary, 0));

// ============================================================================
// UI STATE ATOMS
// ============================================================================

// Dialog and modal states
export const employeeDialogOpenAtom = atom<boolean>(false);
export const usageDialogOpenAtom = atom<boolean>(false);
export const settlementDialogOpenAtom = atom<boolean>(false);
export const settlementPreviewDialogOpenAtom = atom<boolean>(false);

// Tab states
export const employeeTabAtom = atom<"employees" | "usage" | "settlements">("employees");
export const selectedEmployeeTabAtom = atom<"profile" | "usage" | "settlements">("profile");

// Search and filter states
export const employeeSearchAtom = atom<string>("");
export const usageSearchAtom = atom<string>("");
export const settlementSearchAtom = atom<string>("");

// Date range filters
export const usageDateRangeAtom = atomWithReset<{ start: string; end: string } | null>(null);
export const settlementDateRangeAtom = atomWithReset<{ start: string; end: string } | null>(null);

// ============================================================================
// ACTION ATOMS (Write-only atoms for triggering actions)
// ============================================================================

// Fetch atoms for loading data

export const fetchSettlementsAtom = atom(null, async (get, set, filters?: SettlementFilters) => {
  set(settlementsLoadingAtom, true);
  set(settlementsErrorAtom, null);

  try {
    const { employeeAPI } = await import("@/api/employee.api");
    const response = await employeeAPI.getSettlements(filters);

    if (response.success) {
      set(settlementsAtom, response.data.settlements);
      set(settlementsTotalAtom, response.data.pagination.total);
      set(settlementsPageAtom, response.data.pagination.page);
      return response.data;
    } else {
      throw new Error(response.message || "Failed to fetch settlements");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch settlements";
    set(settlementsErrorAtom, errorMessage);
    throw error;
  } finally {
    set(settlementsLoadingAtom, false);
  }
});

export const fetchSettlementStatsAtom = atom(null, async (get, set, filters?: { year?: number; month?: number }) => {
  set(settlementStatsLoadingAtom, true);
  set(settlementsErrorAtom, null);

  try {
    const { employeeAPI } = await import("@/api/employee.api");
    const response = await employeeAPI.getSettlementStats(filters);

    if (response.success) {
      set(settlementStatsAtom, response.data);
      return response.data;
    } else {
      throw new Error(response.message || "Failed to fetch settlement stats");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch settlement stats";
    set(settlementsErrorAtom, errorMessage);
    throw error;
  } finally {
    set(settlementStatsLoadingAtom, false);
  }
});

export const fetchUsageAtom = atom(null, async (get, set, filters?: Omit<UsageFilters, "page" | "limit">) => {
  set(usagesLoadingAtom, true);
  set(usagesErrorAtom, null);

  try {
    const { employeeAPI } = await import("@/api/employee.api");
    const response = await employeeAPI.getUsages(filters);

    if (response.success) {
      set(usagesAtom, response.data.usages);
      set(usagesTotalAtom, response.data.pagination.total);
      set(usagesPageAtom, response.data.pagination.page);
      return response.data;
    } else {
      throw new Error(response.message || "Failed to fetch usages");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch usages";
    set(usagesErrorAtom, errorMessage);
    throw error;
  } finally {
    set(usagesLoadingAtom, false);
  }
});

export const fetchUsageStatsAtom = atom(null, async (get, set, filters?: Omit<UsageFilters, "page" | "limit">) => {
  set(usageStatsLoadingAtom, true);
  set(usagesErrorAtom, null);

  try {
    const { employeeAPI } = await import("@/api/employee.api");
    const response = await employeeAPI.getUsageStats(filters);

    if (response.success) {
      set(usageStatsAtom, response.data);
      return response.data;
    } else {
      throw new Error(response.message || "Failed to fetch usage stats");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch usage stats";
    set(usagesErrorAtom, errorMessage);
    throw error;
  } finally {
    set(usageStatsLoadingAtom, false);
  }
});

export const fetchUsageHistoryAtom = atom(null, async (get, set, filters?: UsageFilters) => {
  set(usagesLoadingAtom, true);
  set(usagesErrorAtom, null);

  try {
    const { employeeAPI } = await import("@/api/employee.api");
    const response = await employeeAPI.getUsageHistory(filters);

    if (response.success) {
      set(usagesAtom, response.data.usages);
      set(usagesTotalAtom, response.data.pagination.total);
      set(usagesPageAtom, response.data.pagination.page);
      return response.data;
    } else {
      throw new Error(response.message || "Failed to fetch usage history");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch usage history";
    set(usagesErrorAtom, errorMessage);
    throw error;
  } finally {
    set(usagesLoadingAtom, false);
  }
});

export const fetchPendingSettlementsAtom = atom(null, async (get, set) => {
  set(pendingSettlementsLoadingAtom, true);
  set(settlementsErrorAtom, null);

  try {
    const { employeeAPI } = await import("@/api/employee.api");
    const response = await employeeAPI.getPendingSettlements();

    if (response.success) {
      set(pendingSettlementsAtom, response.data);
      return response.data;
    } else {
      throw new Error(response.message || "Failed to fetch pending settlements");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch pending settlements";
    set(settlementsErrorAtom, errorMessage);
    throw error;
  } finally {
    set(pendingSettlementsLoadingAtom, false);
  }
});

// Employee actions
export const createEmployeeAtom = atom(null, async (get, set, employeeData: CreateEmployeeData) => {
  set(employeeFormLoadingAtom, true);
  set(employeesErrorAtom, null);

  try {
    const { employeeAPI } = await import("@/api/employee.api");
    const response = await employeeAPI.createEmployee(employeeData);

    if (response.success) {
      // Add the new employee to the list
      const employees = get(employeesAtom);
      set(employeesAtom, [...employees, response.data]);
      set(employeesTotalAtom, get(employeesTotalAtom) + 1);

      return response.data;
    } else {
      throw new Error(response.message || "Failed to create employee");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create employee";
    set(employeesErrorAtom, errorMessage);
    throw error;
  } finally {
    set(employeeFormLoadingAtom, false);
  }
});

export const updateEmployeeAtom = atom(null, async (get, set, { id, data }: { id: number; data: UpdateEmployeeData }) => {
  set(employeeFormLoadingAtom, true);
  set(employeesErrorAtom, null);

  try {
    const { employeeAPI } = await import("@/api/employee.api");
    const response = await employeeAPI.updateEmployee(id, data);

    if (response.success) {
      // Update the employee in the list
      const employees = get(employeesAtom);
      const updatedEmployees = employees.map(emp => (emp.id === id ? response.data : emp));
      set(employeesAtom, updatedEmployees);

      // Update selected employee if it's the one being updated
      const selectedEmployee = get(selectedEmployeeAtom);
      if (selectedEmployee?.id === id) {
        set(selectedEmployeeAtom, response.data);
      }

      return response.data;
    } else {
      throw new Error(response.message || "Failed to update employee");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update employee";
    set(employeesErrorAtom, errorMessage);
    throw error;
  } finally {
    set(employeeFormLoadingAtom, false);
  }
});

export const deleteEmployeeAtom = atom(null, async (get, set, id: number) => {
  set(employeesLoadingAtom, true);
  set(employeesErrorAtom, null);

  try {
    // Remove from the list optimistically
    const employees = get(employeesAtom);
    const filteredEmployees = employees.filter(emp => emp.id !== id);
    set(employeesAtom, filteredEmployees);
    set(employeesTotalAtom, get(employeesTotalAtom) - 1);

    // Clear selected employee if it was deleted
    const selectedEmployee = get(selectedEmployeeAtom);
    if (selectedEmployee?.id === id) {
      set(selectedEmployeeAtom, null);
    }

    return true;
  } catch (error) {
    set(employeesErrorAtom, error instanceof Error ? error.message : "Failed to delete employee");
    return false;
  } finally {
    set(employeesLoadingAtom, false);
  }
});

// Usage actions
export const recordUsageAtom = atom(null, async (get, set, usage: Omit<EmployeeUsage, "id" | "createdAt" | "updatedAt">) => {
  set(usageFormLoadingAtom, true);
  set(usagesErrorAtom, null);

  try {
    // This would be handled by the component using the API
    return true;
  } catch (error) {
    set(usagesErrorAtom, error instanceof Error ? error.message : "Failed to record usage");
    return false;
  } finally {
    set(usageFormLoadingAtom, false);
  }
});

// Settlement actions
export const createSettlementAtom = atom(null, async (get, set, data: CreateSettlementData) => {
  set(settlementFormLoadingAtom, true);
  set(settlementsErrorAtom, null);

  try {
    const { employeeAPI } = await import("@/api/employee.api");
    const response = await employeeAPI.createSettlement(data);

    if (response.success) {
      // Add new settlement to list
      const settlements = get(settlementsAtom);
      set(settlementsAtom, [response.data, ...settlements]);
      set(settlementsTotalAtom, get(settlementsTotalAtom) + 1);

      // Clear preview
      set(settlementPreviewAtom, null);

      return response.data;
    } else {
      throw new Error(response.message || "Failed to create settlement");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create settlement";
    set(settlementsErrorAtom, errorMessage);
    throw error;
  } finally {
    set(settlementFormLoadingAtom, false);
  }
});

export const previewSettlementAtom = atom(null, async (get, set, data: CreateSettlementData) => {
  set(settlementPreviewLoadingAtom, true);
  set(settlementsErrorAtom, null);

  try {
    const { employeeAPI } = await import("@/api/employee.api");
    const response = await employeeAPI.previewSettlement(data);

    if (response.success) {
      set(settlementPreviewAtom, response.data);
      return response.data;
    } else {
      throw new Error(response.message || "Failed to preview settlement");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to preview settlement";
    set(settlementsErrorAtom, errorMessage);
    throw error;
  } finally {
    set(settlementPreviewLoadingAtom, false);
  }
});

export const approveSettlementAtom = atom(
  null,
  async (
    get,
    set,
    {
      id,
      notes
    }: {
      id: number;
      notes?: string;
    }
  ) => {
    set(settlementsLoadingAtom, true);
    set(settlementsErrorAtom, null);

    try {
      const { employeeAPI } = await import("@/api/employee.api");
      const response = await employeeAPI.approveSettlement(id, notes);

      if (response.success) {
        // Update the settlement in the list
        const settlements = get(settlementsAtom);
        const updatedSettlements = settlements.map(settlement => (settlement.id === id ? response.data : settlement));
        set(settlementsAtom, updatedSettlements);
        return response.data;
      } else {
        throw new Error(response.message || "Failed to approve settlement");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to approve settlement";
      set(settlementsErrorAtom, errorMessage);
      throw error;
    } finally {
      set(settlementsLoadingAtom, false);
    }
  }
);

export const markSettlementAsPaidAtom = atom(
  null,
  async (
    get,
    set,
    {
      id,
      paymentMethod,
      paymentReference
    }: {
      id: number;
      paymentMethod: PaymentMethod;
      paymentReference?: string;
    }
  ) => {
    set(settlementsLoadingAtom, true);
    set(settlementsErrorAtom, null);

    try {
      const { employeeAPI } = await import("@/api/employee.api");
      const response = await employeeAPI.markSettlementAsPaid(id, {
        paymentMethod,
        paymentReference
      });

      if (response.success) {
        // Update the settlement in the list
        const settlements = get(settlementsAtom);
        const updatedSettlements = settlements.map(settlement => (settlement.id === id ? response.data : settlement));
        set(settlementsAtom, updatedSettlements);
        return response.data;
      } else {
        throw new Error(response.message || "Failed to mark settlement as paid");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to mark settlement as paid";
      set(settlementsErrorAtom, errorMessage);
      throw error;
    } finally {
      set(settlementsLoadingAtom, false);
    }
  }
);

export const deleteSettlementAtom = atom(
  null,
  async (get, set, { id, force }: { id: number; force?: boolean }) => {
    set(settlementsLoadingAtom, true);
    set(settlementsErrorAtom, null);

    try {
      const { employeeAPI } = await import("@/api/employee.api");
      const response = await employeeAPI.deleteSettlement(id, force);

      if (response.success) {
        // Remove settlement from the list
        const settlements = get(settlementsAtom);
        const updatedSettlements = settlements.filter(settlement => settlement.id !== id);
        set(settlementsAtom, updatedSettlements);
        set(settlementsTotalAtom, get(settlementsTotalAtom) - 1);

        // Clear selected settlement if it was deleted
        const selectedSettlement = get(selectedSettlementAtom);
        if (selectedSettlement?.id === id) {
          set(selectedSettlementAtom, null);
        }

        return true;
      } else {
        throw new Error(response.message || "Failed to delete settlement");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete settlement";
      set(settlementsErrorAtom, errorMessage);
      throw error;
    } finally {
      set(settlementsLoadingAtom, false);
    }
  }
);

// ============================================================================
// FETCH ATOMS
// ============================================================================

// Fetch employees with filters
export const fetchEmployeesAtom = atom(null, async (get, set, filters?: EmployeeFilters) => {
  set(employeesLoadingAtom, true);
  set(employeesErrorAtom, null);

  try {
    const { employeeAPI } = await import("@/api/employee.api");
    const response = await employeeAPI.getEmployees(filters);

    if (response.success) {
      set(employeesAtom, response.data.employees);
      set(employeesTotalAtom, response.data.pagination.total);
      set(employeesPageAtom, response.data.pagination.page);
      return response.data;
    } else {
      throw new Error(response.message || "Failed to fetch employees");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch employees";
    set(employeesErrorAtom, errorMessage);
    throw error;
  } finally {
    set(employeesLoadingAtom, false);
  }
});

// Fetch employee statistics
export const fetchEmployeeStatsAtom = atom(null, async (get, set) => {
  set(employeeStatsLoadingAtom, true);
  set(employeesErrorAtom, null);

  try {
    const { employeeAPI } = await import("@/api/employee.api");
    const response = await employeeAPI.getEmployeeStats();

    if (response.success) {
      set(employeeStatsAtom, response.data);
      return response.data;
    } else {
      throw new Error(response.message || "Failed to fetch employee stats");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch employee stats";
    set(employeesErrorAtom, errorMessage);
    throw error;
  } finally {
    set(employeeStatsLoadingAtom, false);
  }
});

// ============================================================================
// RESET ATOMS
// ============================================================================

export const resetEmployeeStateAtom = atom(null, (get, set) => {
  set(employeesAtom, []);
  set(employeesTotalAtom, 0);
  set(employeesPageAtom, 1);
  set(employeesFiltersAtom, {});
  set(employeesLoadingAtom, false);
  set(employeesErrorAtom, null);
  set(selectedEmployeeAtom, null);
  set(employeeFormOpenAtom, false);
  set(employeeFormModeAtom, "create");
  set(employeeFormLoadingAtom, false);
  set(employeeStatsAtom, null);
  set(employeeStatsLoadingAtom, false);
});

export const resetUsageStateAtom = atom(null, (get, set) => {
  set(usagesAtom, []);
  set(usagesTotalAtom, 0);
  set(usagesPageAtom, 1);
  set(usagesFiltersAtom, {});
  set(usagesLoadingAtom, false);
  set(usagesErrorAtom, null);
  set(selectedUsageAtom, null);
  set(usageFormOpenAtom, false);
  set(usageFormModeAtom, "create");
  set(usageFormLoadingAtom, false);
  set(usageStatsAtom, null);
  set(usageStatsLoadingAtom, false);
  set(monthlyUsageSummaryAtom, null);
  set(monthlyUsageSummaryLoadingAtom, false);
});

export const resetSettlementStateAtom = atom(null, (get, set) => {
  set(settlementsAtom, []);
  set(settlementsTotalAtom, 0);
  set(settlementsPageAtom, 1);
  set(settlementsFiltersAtom, {});
  set(settlementsLoadingAtom, false);
  set(settlementsErrorAtom, null);
  set(selectedSettlementAtom, null);
  set(settlementFormOpenAtom, false);
  set(settlementFormModeAtom, "create");
  set(settlementFormLoadingAtom, false);
  set(settlementPreviewAtom, null);
  set(settlementPreviewLoadingAtom, false);
  set(settlementStatsAtom, null);
  set(settlementStatsLoadingAtom, false);
  set(pendingSettlementsAtom, []);
  set(pendingSettlementsLoadingAtom, false);
});

export const resetAllEmployeeStateAtom = atom(null, (get, set) => {
  set(resetEmployeeStateAtom);
  set(resetUsageStateAtom);
  set(resetSettlementStateAtom);

  // Reset UI state
  set(employeeDialogOpenAtom, false);
  set(usageDialogOpenAtom, false);
  set(settlementDialogOpenAtom, false);
  set(settlementPreviewDialogOpenAtom, false);
  set(employeeTabAtom, "employees");
  set(selectedEmployeeTabAtom, "profile");
  set(employeeSearchAtom, "");
  set(usageSearchAtom, "");
  set(settlementSearchAtom, "");
  set(usageDateRangeAtom, null);
  set(settlementDateRangeAtom, null);
});
