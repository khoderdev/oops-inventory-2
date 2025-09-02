import { StockEntry } from "@/types/inventory";
import { formatCurrencyUI, isMassUnit, isVolumeUnit } from "./conversionLogic";

export const getCurrentStockDisplay = (stockEntry: StockEntry): string => {
  // For mass materials (kg, g)
  if (stockEntry?.totalMass && (stockEntry?.purchasedUnit === "kg" || stockEntry?.purchasedUnit === "g")) {
    const totalMass = typeof stockEntry.totalMass === "string" ? parseFloat(stockEntry.totalMass) : stockEntry.totalMass;

    // Always show both kg and g units
    const massInKg = totalMass / 1000;
    const formattedMassKg = Number.isInteger(massInKg) ? massInKg.toString() : massInKg.toFixed(2);
    const formattedMassG = Number.isInteger(totalMass) ? totalMass.toString() : totalMass.toFixed(0);

    return `${formattedMassKg} kg (${formattedMassG} g)`;
  }

  // For volume materials (bottles)
  if (stockEntry?.totalVolume && stockEntry?.volumePerUnit && stockEntry?.purchasedUnit === "bottle") {
    const totalVolume = typeof stockEntry.totalVolume === "string" ? parseFloat(stockEntry.totalVolume) : stockEntry.totalVolume;
    const volumePerUnit = typeof stockEntry.volumePerUnit === "string" ? parseFloat(stockEntry.volumePerUnit) : stockEntry.volumePerUnit;
    const actualBottleCount = Math.round((totalVolume / volumePerUnit) * 100) / 100;
    const formattedVolume = Number.isInteger(totalVolume) ? totalVolume.toString() : totalVolume.toFixed(0);
    const volumeUnit = stockEntry.volumeUnit || "ml";
    return `${formattedVolume} ${volumeUnit} from ${actualBottleCount} ${actualBottleCount === 1 ? "bottle" : "bottles"} main stock`;
  }

  // For package materials with pieces information (like bags of buns)
  if (stockEntry?.totalPieces && stockEntry?.piecesPerPackage && (stockEntry?.purchasedUnit === "bag" || stockEntry?.purchasedUnit === "pack" || stockEntry?.purchasedUnit === "package")) {
    const totalPieces = typeof stockEntry.totalPieces === "string" ? parseInt(stockEntry.totalPieces) : stockEntry.totalPieces;
    const purchasedQuantity = typeof stockEntry.purchasedQuantity === "string" ? parseFloat(stockEntry.purchasedQuantity) : stockEntry.purchasedQuantity;
    const packageUnit = stockEntry.purchasedUnit === "bag" ? "bags" : stockEntry.purchasedUnit === "pack" ? "packs" : "packages";

    return `${purchasedQuantity} ${packageUnit} (${totalPieces} pieces)`;
  }

  // For non-bottle items or when totalVolume is not available
  let quantity = stockEntry?.purchasedQuantity;
  if (!quantity || Number(quantity) === 0) {
    // Fallback to purchasedIndividualQuantity if purchasedQuantity is 0
    quantity = stockEntry?.purchasedIndividualQuantity;
  }
  const displayQuantity = typeof quantity === "string" ? quantity : String(quantity || "0");
  return `${displayQuantity} ${stockEntry?.purchasedUnit || "units"}`;
};

export const fmtCPU = (n: number, unitFieldName: string): string => {
  if (!isFinite(n) || isNaN(n) || n < 0) return "";

  // Get current unit to determine precision
  const unit = unitFieldName as string;

  // For mass units, use appropriate precision
  if (isMassUnit(unit)) {
    // For small units like g, use more decimal places
    if (unit === "g" || unit === "oz") {
      // For very small values, use 6 decimal places
      if (n < 0.01) {
        return n.toFixed(6);
      }
      // For small values, use 4 decimal places
      else if (n < 0.1) {
        return n.toFixed(4);
      }
      // Otherwise use 3 decimal places
      return n.toFixed(3);
    }
  }

  // Default formatting for other units
  const s = formatCurrencyUI(n);
  return s.startsWith("$") ? s.slice(1) : s;
};

// Format total cost with better precision for mass units
export const fmtTotalCost = (value: number | string | undefined, unit?: string): string => {
  console.log("[fmtTotalCost] Input value:", value, "Unit:", unit, "Type:", typeof value);
  
  if (value === undefined || value === null || value === "") {
    console.log("[fmtTotalCost] Value is undefined/null/empty, returning $0.00");
    return "$0.00";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;
  console.log("[fmtTotalCost] Parsed numValue:", numValue, "Original type:", typeof value);
  
  if (isNaN(numValue)) {
    console.log("[fmtTotalCost] Value is NaN, returning $0.00");
    return "$0.00";
  }

  // For small mass units (g, oz) we need more precision for small values
  if (unit && isMassUnit(unit)) {
    console.log("[fmtTotalCost] Mass unit detected:", unit, "Value:", numValue);
    
    if (unit === "g" || unit === "oz") {
      console.log("[fmtTotalCost] Small mass unit (g/oz) detected, value:", numValue);
      
      // For very small values, show 4 decimal places
      if (numValue < 0.01) {
        console.log("[fmtTotalCost] Very small value < 0.01, using 4 decimal places for:", numValue);
        const formatted = formatCurrencyUI(numValue, 4);
        console.log("[fmtTotalCost] Formatted result with 4 decimals:", formatted);
        return formatted;
      }
      // For small values, show 3 decimal places
      else if (numValue < 0.1) {
        console.log("[fmtTotalCost] Small value < 0.1, using 3 decimal places for:", numValue);
        const formatted = formatCurrencyUI(numValue, 3);
        console.log("[fmtTotalCost] Formatted result with 3 decimals:", formatted);
        return formatted;
      }
      // For other values with small mass units, still use 2 decimal places
      console.log("[fmtTotalCost] Normal value with small mass unit, using 2 decimal places for:", numValue);
    }
  } else if (unit && isVolumeUnit(unit)) {
    console.log("[fmtTotalCost] Volume unit detected:", unit, "Value:", numValue);
  } else {
    console.log("[fmtTotalCost] No specific unit type detected or unit is undefined:", unit);
  }

  console.log("[fmtTotalCost] Using default 2 decimal places for value:", numValue);
  const formatted = formatCurrencyUI(numValue, 2);
  console.log("[fmtTotalCost] Final formatted result:", formatted);
  return formatted;
};

// Format cost per unit with proper unit display
export const getFormattedCostPerUnitLabel = (unitFieldName: string): string => {
  const unit = unitFieldName || "Unit";

  // For mass units, show the appropriate unit in the label
  if (isMassUnit(unit)) {
    // For kg, show both kg and g equivalents
    if (unit === "kg") {
      return `Cost Per kg (per 1000g)`;
    }
    // For g, show per g
    else if (unit === "g") {
      return `Cost Per g`;
    }
    // For lb, show both lb and oz equivalents
    else if (unit === "lb") {
      return `Cost Per lb (per 16oz)`;
    }
    // For oz, show per oz
    else if (unit === "oz") {
      return `Cost Per oz`;
    }
  }

  return `Cost Per ${unit}`;
};

// Format total cost label with unit-specific information
export const getFormattedTotalCostLabel = (unitFieldName: string): string => {
  const unit = unitFieldName || "Unit";
  
  // For mass units, show more specific information
  if (isMassUnit(unit)) {
    // For kg, show total cost for all kg
    if (unit === "kg") {
      return `Total Cost (all kg)`;
    }
    // For g, show total cost for all g
    else if (unit === "g") {
      return `Total Cost (all g)`;
    }
    // For lb, show total cost for all lb
    else if (unit === "lb") {
      return `Total Cost (all lb)`;
    }
    // For oz, show total cost for all oz
    else if (unit === "oz") {
      return `Total Cost (all oz)`;
    }
  }
  
  return `Total Cost`;
};
