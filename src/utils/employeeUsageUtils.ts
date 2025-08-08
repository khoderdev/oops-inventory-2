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
    // Convert cart items to employee usage format
    const usageItems: EmployeeUsageItem[] = cartItems.map(item => {
      // Determine the usage type and item ID based on the cart item
      let usageType: "material" | "menu_item" | "stock_entry";
      let itemId: number;

      if (item.type === "menu_item" && item.menuItemId) {
        usageType = "menu_item";
        itemId = item.menuItemId;
      } else if (item.type === "material") {
        // For material items, use the material ID from the original item
        usageType = "material";
        if (item.originalItem && 'materialId' in item.originalItem) {
          itemId = item.originalItem.materialId;
        } else if (item.originalItem && 'id' in item.originalItem) {
          // Try using the original item's ID (convert to number if it's a string)
          const originalId = item.originalItem.id;
          itemId = typeof originalId === 'string' ? parseInt(originalId) : originalId;
        } else {
          // Extract material ID from item.id format (e.g., "material-1234" -> 1234)
          const materialMatch = item.id.match(/^material-(\d+)$/);
          if (materialMatch) {
            itemId = parseInt(materialMatch[1]);
          } else {
            console.warn("Could not extract material ID from cart item:", item);
            itemId = 0;
          }
        }
      } else {
        // This should not happen with proper cart item types
        console.warn("Unknown cart item type:", item);
        usageType = "material";
        itemId = 0;
      }

      return {
        type: usageType,
        itemId,
        itemName: item.name,
        quantity: item.quantity,
        unit: "piece", // Default unit, could be enhanced based on item data
        unitCost: item.price
      };
    });

    // Record usage using the employee API
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
  const employeeName = `${employee.user?.firstName || ""} ${employee.user?.lastName || ""}`.trim() || employee.employeeNumber;

  return {
    employeeName,
    employeeNumber: employee.employeeNumber,
    department: employee.department,
    itemCount: costs.itemCount,
    subtotal: costs.subtotal,
    discountPercentage: costs.discountPercentage,
    discountAmount: costs.discountAmount,
    finalCost: costs.finalCost,
    summary: `${employeeName} (${employee.employeeNumber}) - ${costs.itemCount} items, $${costs.finalCost.toFixed(2)} after ${costs.discountPercentage}% discount`
  };
};
