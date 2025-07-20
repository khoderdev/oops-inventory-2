import { ConversionData, Material, MaterialWithStock, StockEntry } from "@/types/inventory";
import { convertMass, convertVolume, formatCurrency, formatNumber, isMassUnit, isVolumeUnit } from "./conversionLogic";

// Calculate conversion data for stock entries
export function calculateStockConversion(stockEntry: StockEntry, material: Material): ConversionData {
  // Use remaining individual quantity if available, otherwise fall back to purchased quantity
  let convertedQuantity = stockEntry.purchasedIndividualQuantity !== undefined ? stockEntry.purchasedIndividualQuantity : stockEntry.purchasedQuantity;

  let conversionFactor = 1;

  // For individual quantities, they should already be in base units
  if (stockEntry.purchasedIndividualQuantity !== undefined && stockEntry.purchasedIndividualUnit) {
    // Individual quantities are already converted to base units
    convertedQuantity = stockEntry.purchasedIndividualQuantity;
    conversionFactor = 1;
  } else {
    // Legacy fallback: Convert purchased quantity to base unit
    if (stockEntry.purchasedUnit !== material.baseUnit) {
      if (isMassUnit(stockEntry.purchasedUnit) && isMassUnit(material.baseUnit)) {
        convertedQuantity = convertMass(stockEntry.purchasedQuantity, stockEntry.purchasedUnit, material.baseUnit);
        conversionFactor = convertedQuantity / stockEntry.purchasedQuantity;
      } else if (isVolumeUnit(stockEntry.purchasedUnit) && isVolumeUnit(material.baseUnit)) {
        convertedQuantity = convertVolume(stockEntry.purchasedQuantity, stockEntry.purchasedUnit, material.baseUnit);
        conversionFactor = convertedQuantity / stockEntry.purchasedQuantity;
      } else if (material.unitType === "package") {
        if (material.packageQuantity && material.packageQuantity > 0) {
          convertedQuantity = stockEntry.purchasedQuantity * material.packageQuantity;
          conversionFactor = material.packageQuantity;
        } else {
          console.warn(`Material "${material.name}" (ID: ${material.id}) is a package unit but has no packageQuantity set. Using 1:1 conversion.`);
          convertedQuantity = stockEntry.purchasedQuantity;
          conversionFactor = 1;
        }
      }
    }
  }

  // Calculate cost per base unit based on total cost
  const costPerBaseUnit = convertedQuantity > 0 ? stockEntry.totalCost / convertedQuantity : 0;
  const totalCostInBaseUnit = stockEntry.totalCost;

  return {
    convertedQuantity,
    convertedUnit: stockEntry.purchasedIndividualUnit || material.baseUnit,
    costPerBaseUnit,
    totalCostInBaseUnit,
    conversionFactor
  };
}

// Calculate total inventory data for a material
export function calculateMaterialInventory(material: Material, stockEntries: StockEntry[]): MaterialWithStock {
  let totalQuantityInBaseUnit = 0;
  let totalValue = 0;

  const conversions = stockEntries.map(entry => {
    const conversion = calculateStockConversion(entry, material);
    totalQuantityInBaseUnit += conversion.convertedQuantity;
    totalValue += conversion.totalCostInBaseUnit;
    return conversion;
  });

  const averageCostPerBaseUnit = totalQuantityInBaseUnit > 0 ? totalValue / totalQuantityInBaseUnit : 0;

  return {
    ...material,
    stockEntries,
    totalQuantityInBaseUnit,
    totalValue,
    averageCostPerBaseUnit,
    availableQuantity: totalQuantityInBaseUnit
  };
}

// Calculate cost for a specific quantity in any unit
export function calculateCostForQuantity(material: Material, quantity: number, unit: string, averageCostPerBaseUnit: number): { cost: number; steps: string[]; warning?: string } {
  const steps: string[] = [];
  let warning: string | undefined;

  // Validate inputs
  if (averageCostPerBaseUnit <= 0) {
    warning = "Warning: Average cost is zero or negative - check material data";
  }

  // Category-specific cost validation
  const category = material.category?.toLowerCase();
  if (category === "meat" && averageCostPerBaseUnit < 10) {
    // Example threshold
    warning = "Warning: Meat cost seems unusually low - please verify";
  }

  let convertedQuantity = quantity;

  // Convert to base unit if needed
  if (unit !== material.baseUnit) {
    if (isMassUnit(unit) && isMassUnit(material.baseUnit)) {
      convertedQuantity = convertMass(quantity, unit, material.baseUnit);
      steps.push(`Convert ${formatNumber(quantity)} ${unit} to ${material.baseUnit}: ${formatNumber(convertedQuantity)} ${material.baseUnit}`);
    } else if (isVolumeUnit(unit) && isVolumeUnit(material.baseUnit)) {
      convertedQuantity = convertVolume(quantity, unit, material.baseUnit);
      steps.push(`Convert ${formatNumber(quantity)} ${unit} to ${material.baseUnit}: ${formatNumber(convertedQuantity)} ${material.baseUnit}`);
    } else {
      steps.push(`Using ${quantity} ${unit} directly (no conversion available)`);
      warning = warning || "Warning: Unit conversion not available - using direct quantity";
    }
  }

  const cost = convertedQuantity * averageCostPerBaseUnit;
  steps.push(`Cost calculation: ${formatNumber(convertedQuantity)} × ${formatCurrency(averageCostPerBaseUnit)} = ${formatCurrency(cost)}`);

  return { cost, steps, warning };
}

// Validate unit compatibility
export function isUnitCompatible(unit: string, materialUnitType: string): boolean {
  switch (materialUnitType) {
    case "mass":
      return isMassUnit(unit);
    case "volume":
      return isVolumeUnit(unit);
    case "piece":
      return ["piece", "unit"].includes(unit.toLowerCase());
    case "package":
      return ["box", "pack", "case", "bottle"].includes(unit.toLowerCase());
    default:
      return false;
  }
}

// Get suggested units for a material type
export function getSuggestedUnits(unitType: string): string[] {
  switch (unitType) {
    case "mass":
      return ["kg", "g", "lb"];
    case "volume":
      return ["liter", "ml", "gallon"];
    case "piece":
      return ["piece", "unit"];
    case "package":
      return ["box", "pack", "case", "bottle"];
    default:
      return [];
  }
}

// Calculate total inventory value
export function calculateTotalInventoryValue(materials: MaterialWithStock[]): number {
  return materials.reduce((total, material) => total + material.totalValue, 0);
}

// Find low stock materials (less than specified threshold in base units)
export function findLowStockMaterials(materials: MaterialWithStock[], threshold: number = 10): MaterialWithStock[] {
  return materials.filter(material => material.totalQuantityInBaseUnit < threshold);
}

// Calculate inventory turnover rate (simplified)
export function calculateInventoryTurnover(material: MaterialWithStock, usagePerMonth: number): { turnoverRate: number; monthsOfStock: number } {
  const turnoverRate = usagePerMonth > 0 ? material.totalQuantityInBaseUnit / usagePerMonth : 0;
  const monthsOfStock = usagePerMonth > 0 ? material.totalQuantityInBaseUnit / usagePerMonth : Infinity;

  return { turnoverRate, monthsOfStock };
}

// Convert package quantities to base units for display (shows remaining quantities after sales)
export function getDisplayQuantity(stockEntry: StockEntry, material: Material | undefined): { quantity: number; unit: string; isConverted: boolean } {
  // Handle undefined material gracefully
  if (!material) {
    return {
      quantity: stockEntry.purchasedQuantity,
      unit: stockEntry.purchasedUnit,
      isConverted: false
    };
  }

  if (material.unitType === "package") {
    // Use stored individual quantity if available (new backend implementation)
    if (stockEntry.purchasedIndividualQuantity !== undefined && stockEntry.purchasedIndividualUnit) {
      return {
        quantity: stockEntry.purchasedIndividualQuantity,
        unit: stockEntry.purchasedIndividualUnit,
        isConverted: true
      };
    }

    // Fallback to calculation for backward compatibility
    if (material.packageQuantity && material.packageQuantity > 0) {
      const convertedQuantity = stockEntry.purchasedQuantity * material.packageQuantity;
      return {
        quantity: convertedQuantity,
        unit: material.baseUnit,
        isConverted: true
      };
    }
  }

  // For non-package units, return remaining quantity as-is
  return {
    quantity: stockEntry.purchasedQuantity,
    unit: stockEntry.purchasedUnit,
    isConverted: false
  };
}

// Get total available quantity for a material across all stock entries
export function getTotalAvailableQuantity(material: Material, stockEntries: StockEntry[]): { quantity: number; unit: string } {
  const materialStockEntries = stockEntries.filter(entry => entry.materialId === material.id);

  let totalQuantity = 0;

  // Sum up all remaining quantities in base units
  materialStockEntries.forEach(entry => {
    // Always prefer purchasedIndividualQuantity (remaining quantity) over purchasedQuantity (original purchase)
    if (entry.purchasedIndividualQuantity !== undefined) {
      // Use the remaining individual quantity (this is the accurate current stock)
      totalQuantity += entry.purchasedIndividualQuantity;
    } else {
      // Legacy fallback: calculate from purchased quantity
      if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        totalQuantity += entry.purchasedQuantity * material.packageQuantity;
      } else {
        // For mass and other units, use purchased quantity directly as fallback
        totalQuantity += entry.purchasedQuantity;
      }
    }
  });

  return {
    quantity: totalQuantity,
    unit: material.baseUnit
  };
}
