import { Material } from "@/types/inventory";
import { StockEntry } from "@/types/inventory";

export interface CostCalculationResult {
  costPerUnit: number;
  costPerMl?: number;
  costPerCl?: number;
  costPerBaseUnit?: number;
  totalCost: number;
  volumePerUnit?: number;
}

/**
 * Calculate cost per unit based on material properties and purchased unit
 */
export function calculateCostPerUnit(material: Material, stockEntry: StockEntry | null, purchasedUnit: string): number {
  const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 : stockEntry?.costPerPurchasedUnit || 0;

  const materialCost = typeof material?.costPerUnit === "string" ? parseFloat(material.costPerUnit) || 0 : material?.costPerUnit || 0;

  const baseCost = stockEntryCost > 0 ? stockEntryCost : materialCost;

  if (material.unitType === "package") {
    const packageQuantity = material.packageQuantity || 1;

    if (purchasedUnit === "ml") {
      const volumePerUnit = getVolumePerUnit(material, stockEntry);
      return volumePerUnit > 0 ? baseCost / volumePerUnit : 0;
    } else if (purchasedUnit === "piece" || purchasedUnit === "bottle") {
      return packageQuantity > 0 ? baseCost / packageQuantity : 0;
    }
  }

  return baseCost;
}

/**
 * Get volume per unit from material or stock entry configuration
 */
export function getVolumePerUnit(material: Material, stockEntry: StockEntry | null): number {
  // Try to get volume from stock entry first (most specific)
  if (stockEntry?.volumePerUnit && stockEntry.volumePerUnit > 0) {
    return stockEntry.volumePerUnit;
  }

  // Then try material configuration
  if (material.volumePerBottle && material.volumePerBottle > 0) {
    return material.volumePerBottle;
  }

  if (material.volumePerUnit && material.volumePerUnit > 0) {
    return material.volumePerUnit;
  }

  if (material.packageQuantity && material.packageQuantity > 0 && (material.baseUnit === "ml" || material.baseUnit === "cl")) {
    return material.packageQuantity;
  }

  // Default fallback for spirits (700ml is standard)
  if (material.unitType === "package" && (material.baseUnit === "ml" || material.baseUnit === "cl")) {
    return 700;
  }

  return 0;
}

/**
 * Calculate comprehensive cost breakdown for a material
 */
export function calculateCostBreakdown(material: Material, stockEntry: StockEntry | null, quantity: number, purchasedUnit: string): CostCalculationResult {
  const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 : stockEntry?.costPerPurchasedUnit || 0;
  const materialCost = typeof material?.costPerUnit === "string" ? parseFloat(material.costPerUnit) || 0 : material?.costPerUnit || 0;
  const baseCost = stockEntryCost > 0 ? stockEntryCost : materialCost;

  let costPerUnit = baseCost;
  let costPerMl: number | undefined;
  let costPerCl: number | undefined;
  let costPerBaseUnit: number | undefined;
  let volumePerUnit: number | undefined;

  // Handle mass materials (kg, g, lb, oz)
  if (material.unitType === "mass") {
    const baseUnit = material.baseUnit || "g";
    const inputUnit = material.inputUnit || baseUnit;
    
    // If the purchased unit is different from the input unit, convert the cost
    if (purchasedUnit === "g" && inputUnit === "kg") {
      costPerUnit = baseCost / 1000; // 1 kg = 1000 g
    } else if (purchasedUnit === "kg" && inputUnit === "g") {
      costPerUnit = baseCost * 1000; // 1000 g = 1 kg
    } else if (purchasedUnit === "oz" && inputUnit === "lb") {
      costPerUnit = baseCost / 16; // 1 lb = 16 oz
    } else if (purchasedUnit === "lb" && inputUnit === "oz") {
      costPerUnit = baseCost * 16; // 16 oz = 1 lb
    } else if (purchasedUnit === inputUnit) {
      costPerUnit = baseCost; // Same unit, no conversion needed
    }
  }
  // Handle volume materials (L, ml, cl)
  else if (material.unitType === "volume") {
    const baseUnit = material.baseUnit || "ml";
    const inputUnit = material.inputUnit || baseUnit;
    
    // If the purchased unit is different from the input unit, convert the cost
    if (purchasedUnit === "ml" && inputUnit === "L") {
      costPerUnit = baseCost / 1000; // 1 L = 1000 ml
    } else if (purchasedUnit === "L" && inputUnit === "ml") {
      costPerUnit = baseCost * 1000; // 1000 ml = 1 L
    } else if (purchasedUnit === "cl" && inputUnit === "L") {
      costPerUnit = baseCost / 100; // 1 L = 100 cl
    } else if (purchasedUnit === "L" && inputUnit === "cl") {
      costPerUnit = baseCost * 100; // 100 cl = 1 L
    } else if (purchasedUnit === "ml" && inputUnit === "cl") {
      costPerUnit = baseCost / 10; // 1 cl = 10 ml
    } else if (purchasedUnit === "cl" && inputUnit === "ml") {
      costPerUnit = baseCost * 10; // 10 ml = 1 cl
    } else if (purchasedUnit === inputUnit) {
      costPerUnit = baseCost; // Same unit, no conversion needed
    }
  }
  // Handle package materials
  else if (material.unitType === "package") {
    const packageQuantity = material.packageQuantity || 1;

    if (purchasedUnit === "ml" && (material.baseUnit === "ml" || material.baseUnit === "cl" || material.baseUnit === "l")) {
      volumePerUnit = getVolumePerUnit(material, stockEntry);
      if (volumePerUnit > 0) {
        costPerUnit = baseCost / volumePerUnit;
        costPerMl = costPerUnit;
        costPerCl = costPerMl * 10;
      }
    } else if (purchasedUnit === "piece" || purchasedUnit === "bottle") {
      costPerUnit = packageQuantity > 0 ? baseCost / packageQuantity : baseCost;
    } else {
      costPerUnit = baseCost;
    }

    // Calculate volume-based costs for package materials
    if (material.baseUnit === "ml" || material.baseUnit === "cl" || material.baseUnit === "l") {
      volumePerUnit = getVolumePerUnit(material, stockEntry);

      if (volumePerUnit > 0) {
        costPerMl = baseCost / volumePerUnit;
        costPerCl = costPerMl * 10;

        // Calculate cost per base unit
        if (material.baseUnit === "cl") {
          costPerBaseUnit = costPerCl;
        } else if (material.baseUnit === "ml") {
          costPerBaseUnit = costPerMl;
        } else if (material.baseUnit === "l") {
          costPerBaseUnit = (baseCost / volumePerUnit) * 1000; // ml to l conversion
        }
      }
    }
  }

  // Calculate total cost
  let totalCost = quantity * costPerUnit;

  // For ml quantities in bottle-based materials, use proportional calculation with smart rounding
  if (material.unitType === "package" && purchasedUnit === "ml" && volumePerUnit && volumePerUnit > 0) {
    const bottleFraction = quantity / volumePerUnit;
    totalCost = bottleFraction * baseCost;

    // Smart rounding: if very close to whole bottles (within 1%), use exact bottle cost
    const nearestWholeBottle = Math.round(bottleFraction);
    if (Math.abs(bottleFraction - nearestWholeBottle) < 0.01 && nearestWholeBottle > 0) {
      totalCost = nearestWholeBottle * baseCost;
    }
  }

  return {
    costPerUnit,
    costPerMl,
    costPerCl,
    costPerBaseUnit,
    totalCost,
    volumePerUnit
  };
}

/**
 * Format cost per unit display text
 */
export function formatCostPerUnitDisplay(material: Material, stockEntry: StockEntry | null, purchasedUnit: string): string {
  const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 : stockEntry?.costPerPurchasedUnit || 0;

  const materialCost = typeof material?.costPerUnit === "string" ? parseFloat(material.costPerUnit) || 0 : material?.costPerUnit || 0;

  const baseCost = stockEntryCost > 0 ? stockEntryCost : materialCost;

  if (purchasedUnit === "ml") {
    const volumePerUnit = getVolumePerUnit(material, stockEntry);
    return `$${baseCost.toFixed(2)} per ${stockEntry?.purchasedUnit || "bottle"} ÷ ${volumePerUnit} ml`;
  } else {
    const packageQuantity = material.packageQuantity || 1;
    return `$${baseCost.toFixed(2)} per ${stockEntry?.purchasedUnit || "package"} ÷ ${packageQuantity} ${material.baseUnit || "units"}`;
  }
}

export const formatQuantity = (value: string | number): string => {
  if (!value && value !== 0) return "";

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) return "";

  // For whole numbers, return as is
  if (Number.isInteger(numValue)) return numValue.toString();

  // For values with many decimal places, format appropriately
  // Use 2 decimal places for most values, but handle special cases
  const decimalPlaces = Math.abs(numValue) < 0.01 ? 4 : 2;

  // Format the number with the appropriate decimal places
  const formatted = numValue.toFixed(decimalPlaces);

  // Remove trailing zeros after the decimal point
  return formatted.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
};