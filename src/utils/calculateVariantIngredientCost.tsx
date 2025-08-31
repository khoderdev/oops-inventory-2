import { MenuItemIngredient, Material, StockEntry } from "@/types/inventory";
import { getConversionFactor } from "./getConversionFactor";

const formatCost = (cost: number): number => {
  return parseFloat(parseFloat(String(cost)).toFixed(6));
};

export const calculateVariantIngredientCost = (
  ingredient: Omit<MenuItemIngredient, "cost">,
  materials: Material[],
  stockEntries: StockEntry[]
): number => {
  const material = materials?.find(m => String(m.id) === ingredient.materialId);
  if (!material) {
    console.warn(`Material not found for ID: ${ingredient.materialId}`);
    return 0;
  }

  const relevantStockEntries = stockEntries.filter(entry => String(entry.materialId) === ingredient.materialId);
  if (relevantStockEntries.length === 0) {
    console.warn(`No stock entries found for material: ${material.name}`);
    return 0;
  }
  if (material.unitType === "package" && ingredient.unit === "box" && material.baseUnit === "piece" && !["ml", "cl", "dl", "l", "fl_oz"].includes(material.baseUnit)) {
    const entry = relevantStockEntries[0];
    if (entry.costPerPurchasedUnit && entry.costPerPurchasedUnit > 0 && (entry.purchasedUnit === "box" || !entry.purchasedUnit)) {
      const costPerBox = parseFloat(String(entry.costPerPurchasedUnit));
      const finalCost = ingredient.quantity * costPerBox;
      return isNaN(finalCost) ? 0 : formatCost(finalCost);
    } else if (entry.totalCost && entry.totalCost > 0 && entry.purchasedQuantity && entry.purchasedQuantity > 0) {
      const totalCost = parseFloat(String(entry.totalCost));
      const purchasedQuantity = parseFloat(String(entry.purchasedQuantity));
      const costPerBox = totalCost / purchasedQuantity;
      const finalCost = ingredient.quantity * costPerBox;
      return isNaN(finalCost) ? 0 : formatCost(finalCost);
    }
  }

  let totalWeightedCost = 0;
  let totalQuantity = 0;

  for (const entry of relevantStockEntries) {
    const quantity = parseFloat(String(entry.purchasedQuantity)) || 0;
    if (quantity <= 0) continue;

    let unitCost = 0;

    if (entry.costPerBaseUnit && entry.costPerBaseUnit > 0) {
      unitCost = parseFloat(String(entry.costPerBaseUnit));
    } else if (entry.totalCost && entry.totalCost > 0) {
      const totalCost = parseFloat(String(entry.totalCost));
      if (material.unitType === "package") {
        let actualPackageSize = material.packageQuantity || 1;
        if (actualPackageSize <= 1) {
          if (material.baseUnit === "cl") {
            actualPackageSize = 75;
          } else if (material.baseUnit === "ml") {
            actualPackageSize = 750;
          }
        }
        const totalBaseUnits = quantity * actualPackageSize;
        unitCost = totalCost / totalBaseUnits;
      } else {
        unitCost = totalCost / quantity;
      }
    } else if (entry.costPerPurchasedUnit && entry.costPerPurchasedUnit > 0) {
      const purchasedUnitCost = parseFloat(String(entry.costPerPurchasedUnit));

      if (material.unitType === "package") {
        let actualPackageSize = material.packageQuantity || 1;
        if (actualPackageSize <= 1) {
          if (material.baseUnit === "cl") {
            actualPackageSize = 75;
          } else if (material.baseUnit === "ml") {
            actualPackageSize = 750;
          }
        }
        unitCost = purchasedUnitCost / actualPackageSize;
      } else {
        try {
          const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
          unitCost = purchasedUnitCost / conversionFactor;
        } catch (error) {
          console.error(`Error converting cost units for ${material.name}:`, error);
          continue;
        }
      }
    }
    if (unitCost > 0) {
      totalWeightedCost += unitCost * quantity;
      totalQuantity += quantity;
    } else {
      console.warn(`❌ Could not determine unit cost for entry:`, entry);
    }
  }

  if (totalQuantity <= 0) {
    console.warn(`No valid quantity data for material ${material.name}`);
    return 0;
  }

  const costPerBaseUnit = totalWeightedCost / totalQuantity;
  const materialBaseUnit = material.baseUnit as string;
  const ingredientUnit = ingredient.unit as string;
  const isPackageMaterial = material.unitType === "package";
  const isVolumeType = material.unitType === "volume";
  const isClBaseUnit = materialBaseUnit === "cl";
  const isBottleBaseUnit = materialBaseUnit === "bottle";
  const isVolumeIngredientUnit = ["cl", "ml", "l"].includes(ingredientUnit);
  const isBoxOrBottleUnit = ["box", "bottle"].includes(ingredientUnit);
  if ((isPackageMaterial || isVolumeType) && (isClBaseUnit || isBottleBaseUnit) && (isVolumeIngredientUnit || isBoxOrBottleUnit)) {
    const entry = relevantStockEntries[0];
    if (!entry) return 0;
    const bottleCost = parseFloat(String(entry.costPerBaseUnit || 0));
    let bottleVolume = 0;
    let bottleVolumeUnit = "";
    if (material.volumePerBottle) {
      bottleVolume = material.volumePerBottle;
      bottleVolumeUnit = material.volumeUnit || "cl";
    } else {
      bottleVolume = 75;
      bottleVolumeUnit = "cl";
    }
    let finalCost = 0;
    const isVolumeBasedPackage = ["ml", "cl", "dl", "l", "fl_oz"].includes(material.baseUnit);
    const shouldForceVolumeCalculation = isVolumeBasedPackage && ingredientUnit === "box";
    if (shouldForceVolumeCalculation) {
      const entry = relevantStockEntries[0];
      if (!entry) return 0;
      let bottleVolume = material.volumePerBottle || 75;
      const bottleCost = parseFloat(String(entry.costPerBaseUnit || 0));
      const costPerVolumeUnit = bottleCost / bottleVolume;
      finalCost = ingredient.quantity * costPerVolumeUnit;
      ingredient.unit = material.baseUnit;
      return isNaN(finalCost) ? 0 : finalCost;
    }
    if (isVolumeIngredientUnit) {
      let volumeInBottleUnits = ingredient.quantity;
      if (ingredientUnit !== bottleVolumeUnit) {
        try {
          const conversionFactor = getConversionFactor(ingredientUnit, bottleVolumeUnit, "volume", material);
          volumeInBottleUnits = ingredient.quantity * conversionFactor;
        } catch (error) {
          console.error(`Error converting volume units from ${ingredientUnit} to ${bottleVolumeUnit}:`, error);
          if (ingredientUnit === "ml" && bottleVolumeUnit === "cl") {
            volumeInBottleUnits = ingredient.quantity / 10;
          } else if (ingredientUnit === "cl" && bottleVolumeUnit === "ml") {
            volumeInBottleUnits = ingredient.quantity * 10;
          } else if (ingredientUnit === "l" && bottleVolumeUnit === "ml") {
            volumeInBottleUnits = ingredient.quantity * 1000;
          } else if (ingredientUnit === "l" && bottleVolumeUnit === "cl") {
            volumeInBottleUnits = ingredient.quantity * 100;
          } else if (ingredientUnit === "ml" && bottleVolumeUnit === "l") {
            volumeInBottleUnits = ingredient.quantity / 1000;
          } else if (ingredientUnit === "cl" && bottleVolumeUnit === "l") {
            volumeInBottleUnits = ingredient.quantity / 100;
          }
        }
      }
      finalCost = (volumeInBottleUnits / bottleVolume) * bottleCost;
    } else if (ingredientUnit === "bottle") {
      finalCost = ingredient.quantity * bottleCost;
    } else if (ingredientUnit === "box" || ingredientUnit === "pack" || ingredientUnit === "case") {
      const packageQuantity = material.packageQuantity || 1;
      const boxCost = bottleCost * packageQuantity;
      finalCost = ingredient.quantity * boxCost;
    } else {
      finalCost = ingredient.quantity * bottleCost;
    }

    return isNaN(finalCost) ? 0 : finalCost;
  }
  try {
    const conversionFactor = getConversionFactor(ingredient.unit, material.baseUnit, material.unitType || "piece", material);
    const ingredientQuantityInBaseUnits = ingredient.quantity * conversionFactor;
    const finalCost = ingredientQuantityInBaseUnits * costPerBaseUnit;
    return isNaN(finalCost) ? 0 : formatCost(finalCost);
  } catch (error) {
    console.error(`Error calculating final cost for ${material.name}:`, error);
    return 0;
  }
};