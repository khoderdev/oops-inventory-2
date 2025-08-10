import { employeeAPI } from "@/api/employee.api";
import { Employee } from "@/types/employee";
import { POSCartItem } from "@/types/inventory";

export interface EmployeeUsageItem {
  type: "material" | "menu_item" | "stock_entry";
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

export const recordEmployeeUsage = async (employee: Employee, cartItems: POSCartItem[], posTransactionId: string, notes?: string) => {
  try {
    const usageItems: EmployeeUsageItem[] = cartItems.map(item => {
      let usageType: "material" | "menu_item" | "stock_entry";
      let itemId: number;
      if (item.type === "menu_item" && item.menuItemId) {
        usageType = "menu_item";
        itemId = typeof item.menuItemId === "string" ? parseInt(item.menuItemId) : item.menuItemId;
      } else if (item.type === "material") {
        usageType = "material";
        if (item.originalItem && "materialId" in item.originalItem) {
          itemId = typeof item.originalItem.materialId === "string" ? parseInt(item.originalItem.materialId) : item.originalItem.materialId;
        } else if (item.originalItem && "id" in item.originalItem) {
          const originalId = item.originalItem.id;
          itemId = typeof originalId === "string" ? parseInt(originalId) : originalId;
        } else {
          const materialMatch = item.id.match(/^material-(\d+)$/);
          if (materialMatch) {
            itemId = parseInt(materialMatch[1]);
          } else {
            console.warn("Could not extract material ID from cart item:", item);
            itemId = 0;
          }
        }
      } else {
        console.warn("Unknown cart item type:", item);
        usageType = "material";
        itemId = 0;
      }

      return {
        type: usageType,
        itemId,
        itemName: item.name,
        quantity: item.quantity,
        unit: "piece",
        unitCost: item.price
      };
    });
    const usageResults = await employeeAPI.recordPOSUsage(employee.id, usageItems, posTransactionId, notes || `POS Order - ${new Date().toLocaleString()}`);

    console.log("Employee usage recorded successfully:", {
      employee: `${employee.user?.firstName} ${employee.user?.lastName}`,
      employeeNumber: employee.employeeNumber,
      itemCount: usageItems.length,
      totalCost: usageItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
      discountApplied: employee.discountPercentage
    });

    return usageResults;
  } catch (error) {
    console.error("Failed to record employee usage:", error);
    throw error;
  }
};

export const calculateEmployeeUsageCost = (cartItems: POSCartItem[], employee: Employee) => {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * employee.discountPercentage) / 100;
  const finalCost = subtotal - discountAmount;

  return {
    subtotal,
    discountPercentage: employee.discountPercentage,
    discountAmount,
    finalCost,
    itemCount: cartItems.length
  };
};

export const validateEmployeeForUsage = (employee: Employee | null) => {
  if (!employee) {
    return {
      isValid: false,
      message: "No employee selected"
    };
  }

  if (!employee.isActive) {
    return {
      isValid: false,
      message: "Cannot record usage for inactive employee"
    };
  }

  return {
    isValid: true,
    message: "Employee is valid for usage recording"
  };
};

export const formatEmployeeUsageSummary = (employee: Employee, cartItems: POSCartItem[]) => {
  const costs = calculateEmployeeUsageCost(cartItems, employee);
  const employeeName = `${employee.firstName || ""} ${employee.lastName || ""}`.trim();

  return {
    employeeName,
    employeeNumber: employee.employeeNumber,
    department: employee.department,
    itemCount: costs.itemCount,
    subtotal: costs.subtotal,
    discountPercentage: costs.discountPercentage,
    discountAmount: costs.discountAmount,
    finalCost: costs.finalCost,
    summary: `${employeeName} - ${costs.itemCount} items, $${costs.finalCost.toFixed(2)} after ${costs.discountPercentage}% discount`
  };
};


export const recordEmployeeUsageWithSettlementUpdate = async (employee: Employee, cartItems: POSCartItem[], posTransactionId: string, notes?: string) => {
  try {
    const usageResults = await recordEmployeeUsage(employee, cartItems, posTransactionId, notes);
    const currentDate = new Date();
    const settlementMonth = currentDate.getMonth() + 1;
    const settlementYear = currentDate.getFullYear();
    try {
      const settlementsResponse = await employeeAPI.getSettlements({
        employeeId: employee.id,
        month: settlementMonth,
        year: settlementYear
      });
      if (settlementsResponse.success && settlementsResponse.data && settlementsResponse.data.settlements && settlementsResponse.data.settlements.length > 0) {
        const existingSettlement = settlementsResponse.data.settlements[0];

        console.log(`📋 Found existing settlement for ${employee.user?.firstName} ${employee.user?.lastName} for ${settlementMonth}/${settlementYear}`, {
          settlementId: existingSettlement.id,
          status: existingSettlement.status,
          usageRecorded: usageResults.length
        });
      } else {
        console.log(`📋 No existing settlement found for ${employee.user?.firstName} ${employee.user?.lastName} for ${settlementMonth}/${settlementYear}. Usage recorded for future settlement.`);
      }
    } catch (settlementError) {
      console.warn("⚠️ Could not check for existing settlements, but usage was recorded:", settlementError);
    }

    return usageResults;
  } catch (error) {
    console.error("❌ Failed to record employee usage with settlement update:", error);
    throw error;
  }
};

export const ensureUsageInSettlement = async (employeeId: number, month: number, year: number) => {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];
    const usageResponse = await employeeAPI.getUsageHistory({
      employeeId,
      startDate,
      endDate,
      isSettled: false
    });
    if (usageResponse.success && usageResponse.data && usageResponse.data.usages && usageResponse.data.usages.length > 0) {
      console.log(`📊 Found ${usageResponse.data.usages.length} unsettled usage records for employee ${employeeId} in ${month}/${year}`);
      return {
        success: true,
        unsettledUsageCount: usageResponse.data.usages.length,
        message: `Found ${usageResponse.data.usages.length} unsettled usage records`
      };
    } else {
      return {
        success: true,
        unsettledUsageCount: 0,
        message: "No unsettled usage found for this period"
      };
    }
  } catch (error) {
    console.error("❌ Failed to ensure usage in settlement:", error);
    return {
      success: false,
      unsettledUsageCount: 0,
      message: `Error checking usage: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
};
