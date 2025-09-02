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
export function calculateCostPerUnit(
  material: Material,
  stockEntry: StockEntry | null,
  purchasedUnit: string
): number {
  const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" 
    ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 
    : stockEntry?.costPerPurchasedUnit || 0;
  
  const materialCost = typeof material?.costPerUnit === "string" 
    ? parseFloat(material.costPerUnit) || 0 
    : material?.costPerUnit || 0;
  
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
  
  if (material.packageQuantity && material.packageQuantity > 0 && 
      (material.baseUnit === "ml" || material.baseUnit === "cl")) {
    return material.packageQuantity;
  }
  
  // Default fallback for spirits (700ml is standard)
  if (material.unitType === "package" && 
      (material.baseUnit === "ml" || material.baseUnit === "cl")) {
    return 700;
  }
  
  return 0;
}

/**
 * Calculate comprehensive cost breakdown for a material
 */
export function calculateCostBreakdown(
  material: Material,
  stockEntry: StockEntry | null,
  quantity: number,
  purchasedUnit: string
): CostCalculationResult {
  const costPerUnit = calculateCostPerUnit(material, stockEntry, purchasedUnit);
  
  let costPerMl: number | undefined;
  let costPerCl: number | undefined;
  let costPerBaseUnit: number | undefined;
  let volumePerUnit: number | undefined;
  
  // Calculate volume-based costs for package materials
  if (material.unitType === "package" && 
      (material.baseUnit === "ml" || material.baseUnit === "cl" || material.baseUnit === "l")) {
    
    volumePerUnit = getVolumePerUnit(material, stockEntry);
    
    if (volumePerUnit > 0) {
      const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" 
        ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 
        : stockEntry?.costPerPurchasedUnit || 0;
      
      const materialCost = typeof material?.costPerUnit === "string" 
        ? parseFloat(material.costPerUnit) || 0 
        : material?.costPerUnit || 0;
      
      const bottleCost = stockEntryCost > 0 ? stockEntryCost : materialCost;
      
      // Calculate cost per ml and cl based on bottle cost
      costPerMl = bottleCost / volumePerUnit;
      costPerCl = costPerMl * 10;
      
      // Calculate cost per base unit
      if (material.baseUnit === "cl") {
        costPerBaseUnit = costPerCl;
      } else if (material.baseUnit === "ml") {
        costPerBaseUnit = costPerMl;
      } else if (material.baseUnit === "l") {
        costPerBaseUnit = (bottleCost / volumePerUnit) * 1000; // ml to l conversion
      }
    }
  }
  
  // Calculate total cost with smart rounding for whole bottles
  let totalCost = quantity * costPerUnit;
  
  // For ml quantities in bottle-based materials, use proportional calculation
  if (material.unitType === "package" && purchasedUnit === "ml" && volumePerUnit && volumePerUnit > 0) {
    const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" 
      ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 
      : stockEntry?.costPerPurchasedUnit || 0;
    
    const materialCost = typeof material?.costPerUnit === "string" 
      ? parseFloat(material.costPerUnit) || 0 
      : material?.costPerUnit || 0;
    
    const bottleCost = stockEntryCost > 0 ? stockEntryCost : materialCost;
    const bottleFraction = quantity / volumePerUnit;
    
    // Calculate proportional cost
    totalCost = bottleFraction * bottleCost;
    
    // Smart rounding: if very close to whole bottles (within 1%), use exact bottle cost
    const nearestWholeBottle = Math.round(bottleFraction);
    if (Math.abs(bottleFraction - nearestWholeBottle) < 0.01 && nearestWholeBottle > 0) {
      totalCost = nearestWholeBottle * bottleCost;
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
export function formatCostPerUnitDisplay(
  material: Material,
  stockEntry: StockEntry | null,
  purchasedUnit: string
): string {
  const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" 
    ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 
    : stockEntry?.costPerPurchasedUnit || 0;
  
  const materialCost = typeof material?.costPerUnit === "string" 
    ? parseFloat(material.costPerUnit) || 0 
    : material?.costPerUnit || 0;
  
  const baseCost = stockEntryCost > 0 ? stockEntryCost : materialCost;
  
  if (purchasedUnit === "ml") {
    const volumePerUnit = getVolumePerUnit(material, stockEntry);
    return `$${baseCost.toFixed(2)} per ${stockEntry?.purchasedUnit || "bottle"} ÷ ${volumePerUnit} ml`;
  } else {
    const packageQuantity = material.packageQuantity || 1;
    return `$${baseCost.toFixed(2)} per ${stockEntry?.purchasedUnit || "package"} ÷ ${packageQuantity} ${material.baseUnit || "units"}`;
  }
}
