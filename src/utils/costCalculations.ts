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
  if (stockEntry?.volumePerUnit && stockEntry.volumePerUnit > 0 && !isNaN(stockEntry.volumePerUnit)) {
    return stockEntry.volumePerUnit;
  }

  // Then try material configuration
  if (material.volumePerBottle && material.volumePerBottle > 0 && !isNaN(material.volumePerBottle)) {
    return material.volumePerBottle;
  }

  if (material.volumePerUnit && material.volumePerUnit > 0 && !isNaN(material.volumePerUnit)) {
    return material.volumePerUnit;
  }

  if (material.packageQuantity && material.packageQuantity > 0 && !isNaN(material.packageQuantity) && (material.baseUnit === "ml" || material.baseUnit === "cl")) {
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
  // Validate inputs first
  if (!material || isNaN(quantity) || quantity <= 0) {
    console.warn("🚨 Invalid inputs to calculateCostBreakdown:", { material: !!material, quantity, purchasedUnit });
    return {
      costPerUnit: 0,
      totalCost: 0
    };
  }

  const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 : stockEntry?.costPerPurchasedUnit || 0;
  const materialCost = typeof material?.costPerUnit === "string" ? parseFloat(material.costPerUnit) || 0 : material?.costPerUnit || 0;
  
  // Validate that we have valid costs
  if (isNaN(stockEntryCost) || isNaN(materialCost)) {
    console.warn("🚨 Invalid costs in calculateCostBreakdown:", { stockEntryCost, materialCost });
    return {
      costPerUnit: 0,
      totalCost: 0
    };
  }
  
  // Always use the original material/stock entry cost, not the current form cost
  let baseCost = materialCost;
  let originalUnit = material.inputUnit || material.baseUnit || "g";
  
  if (stockEntry && stockEntryCost > 0) {
    baseCost = stockEntryCost;
    originalUnit = stockEntry.purchasedUnit || originalUnit;
  }

  console.log("🔍 calculateCostBreakdown:", {
    material: material.name,
    unitType: material.unitType,
    baseUnit: material.baseUnit,
    inputUnit: material.inputUnit,
    stockEntryUnit: stockEntry?.purchasedUnit,
    purchasedUnit,
    stockEntryCost,
    materialCost,
    baseCost,
    quantity
  });

  let costPerUnit = baseCost;
  let costPerMl: number | undefined;
  let costPerCl: number | undefined;
  let costPerBaseUnit: number | undefined;
  let volumePerUnit: number | undefined;

  // Handle mass materials (kg, g, lb, oz)
  if (material.unitType === "mass") {
    console.log("🔍 Mass material conversion:", {
      originalUnit,
      purchasedUnit,
      baseCost
    });
    
    // Convert cost based on the relationship between original cost unit and desired unit
    if (purchasedUnit === "g" && originalUnit === "kg") {
      costPerUnit = baseCost / 1000; // 1 kg = 1000 g, so cost per g = cost per kg / 1000
      console.log("🔄 Converting kg to g:", { baseCost, costPerUnit });
    } else if (purchasedUnit === "kg" && originalUnit === "g") {
      costPerUnit = baseCost * 1000; // 1000 g = 1 kg, so cost per kg = cost per g * 1000
      console.log("🔄 Converting g to kg:", { baseCost, costPerUnit });
    } else if (purchasedUnit === "oz" && originalUnit === "lb") {
      costPerUnit = baseCost / 16; // 1 lb = 16 oz
    } else if (purchasedUnit === "lb" && originalUnit === "oz") {
      costPerUnit = baseCost * 16; // 16 oz = 1 lb
    } else if (purchasedUnit === originalUnit) {
      costPerUnit = baseCost; // Same unit, no conversion needed
      console.log("🔄 Same unit, no conversion:", { purchasedUnit, originalUnit, costPerUnit });
    } else {
      // Handle cross-conversions (g <-> oz, kg <-> lb, etc.)
      // Convert to grams first, then to target unit
      let costPerGram = baseCost;
      
      // Convert original cost to cost per gram
      if (originalUnit === "kg") {
        costPerGram = baseCost / 1000;
      } else if (originalUnit === "lb") {
        costPerGram = baseCost / 453.592; // 1 lb = 453.592 g
      } else if (originalUnit === "oz") {
        costPerGram = baseCost / 28.3495; // 1 oz = 28.3495 g
      }
      
      // Convert from cost per gram to target unit
      if (purchasedUnit === "g") {
        costPerUnit = costPerGram;
      } else if (purchasedUnit === "kg") {
        costPerUnit = costPerGram * 1000;
      } else if (purchasedUnit === "lb") {
        costPerUnit = costPerGram * 453.592;
      } else if (purchasedUnit === "oz") {
        costPerUnit = costPerGram * 28.3495;
      }
      
      console.log("🔄 Cross-conversion:", { originalUnit, purchasedUnit, costPerGram, costPerUnit });
    }
  }
  // Handle volume materials (L, ml, cl)
  else if (material.unitType === "volume") {
    if (purchasedUnit === "ml" && originalUnit === "L") {
      costPerUnit = baseCost / 1000; // 1 L = 1000 ml
    } else if (purchasedUnit === "L" && originalUnit === "ml") {
      costPerUnit = baseCost * 1000; // 1000 ml = 1 L
    } else if (purchasedUnit === "cl" && originalUnit === "L") {
      costPerUnit = baseCost / 100; // 1 L = 100 cl
    } else if (purchasedUnit === "L" && originalUnit === "cl") {
      costPerUnit = baseCost * 100; // 100 cl = 1 L
    } else if (purchasedUnit === "ml" && originalUnit === "cl") {
      costPerUnit = baseCost / 10; // 1 cl = 10 ml
    } else if (purchasedUnit === "cl" && originalUnit === "ml") {
      costPerUnit = baseCost * 10; // 10 ml = 1 cl
    } else if (purchasedUnit === originalUnit) {
      costPerUnit = baseCost; // Same unit, no conversion needed
    } else {
      let costPerMl = baseCost;
      if (originalUnit === "L") {
        costPerMl = baseCost / 1000;
      } else if (originalUnit === "cl") {
        costPerMl = baseCost / 10;
      }
      
      if (purchasedUnit === "ml") {
        costPerUnit = costPerMl;
      } else if (purchasedUnit === "L") {
        costPerUnit = costPerMl * 1000;
      } else if (purchasedUnit === "cl") {
        costPerUnit = costPerMl * 10;
      }
    }
  }
  // Handle package materials
  else if (material.unitType === "package") {
    const packageQuantity = material.packageQuantity || 1;

    if (purchasedUnit === "ml" && (material.baseUnit === "ml" || material.baseUnit === "cl" || material.baseUnit === "l")) {
      volumePerUnit = getVolumePerUnit(material, stockEntry);
      if (volumePerUnit > 0 && !isNaN(volumePerUnit)) {
        costPerUnit = baseCost / volumePerUnit;
        costPerMl = costPerUnit;
        costPerCl = costPerMl * 10;
      } else {
        console.warn("🚨 Invalid volumePerUnit in package calculation:", { volumePerUnit, material: material.name });
        costPerUnit = baseCost;
      }
    } else if (purchasedUnit === "piece" || purchasedUnit === "bottle") {
      costPerUnit = (packageQuantity > 0 && !isNaN(packageQuantity)) ? baseCost / packageQuantity : baseCost;
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

  // Final validation to ensure no NaN values are returned
  const result = {
    costPerUnit: isNaN(costPerUnit) ? 0 : costPerUnit,
    costPerMl: costPerMl !== undefined && isNaN(costPerMl) ? undefined : costPerMl,
    costPerCl: costPerCl !== undefined && isNaN(costPerCl) ? undefined : costPerCl,
    costPerBaseUnit: costPerBaseUnit !== undefined && isNaN(costPerBaseUnit) ? undefined : costPerBaseUnit,
    totalCost: isNaN(totalCost) ? 0 : totalCost,
    volumePerUnit: volumePerUnit !== undefined && isNaN(volumePerUnit) ? undefined : volumePerUnit
  };

  console.log("🔍 calculateCostBreakdown result:", result);
  
  // Double-check for any remaining NaN values
  if (isNaN(result.costPerUnit) || isNaN(result.totalCost)) {
    console.error("🚨 NaN detected in final result, returning safe defaults:", result);
    return {
      costPerUnit: 0,
      totalCost: 0
    };
  }
  
  return result;
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