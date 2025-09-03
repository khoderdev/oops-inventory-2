import { StockEntry } from "@/types/inventory";
import { formatCurrencyUI, isMassUnit, isVolumeUnit } from "./conversionLogic";

export const getCurrentStockDisplay = (stockEntry: StockEntry): string => {
  if (stockEntry?.totalMass && (stockEntry?.purchasedUnit === "kg" || stockEntry?.purchasedUnit === "g")) {
    const totalMass = typeof stockEntry.totalMass === "string" ? parseFloat(stockEntry.totalMass) : stockEntry.totalMass;
    const massInKg = totalMass / 1000;
    const formattedMassKg = Number.isInteger(massInKg) ? massInKg.toString() : massInKg.toFixed(2);
    const formattedMassG = Number.isInteger(totalMass) ? totalMass.toString() : totalMass.toFixed(0);
    return `${formattedMassKg} kg (${formattedMassG} g)`;
  }
  if (stockEntry?.totalVolume && stockEntry?.volumePerUnit && stockEntry?.purchasedUnit === "bottle") {
    const totalVolume = typeof stockEntry.totalVolume === "string" ? parseFloat(stockEntry.totalVolume) : stockEntry.totalVolume;
    const volumePerUnit = typeof stockEntry.volumePerUnit === "string" ? parseFloat(stockEntry.volumePerUnit) : stockEntry.volumePerUnit;
    const actualBottleCount = Math.round((totalVolume / volumePerUnit) * 100) / 100;
    const formattedVolume = Number.isInteger(totalVolume) ? totalVolume.toString() : totalVolume.toFixed(0);
    const volumeUnit = stockEntry.volumeUnit || "ml";
    return `${formattedVolume} ${volumeUnit} from ${actualBottleCount} ${actualBottleCount === 1 ? "bottle" : "bottles"} main stock`;
  }
  if (stockEntry?.totalPieces && stockEntry?.piecesPerPackage && (stockEntry?.purchasedUnit === "bag" || stockEntry?.purchasedUnit === "pack" || stockEntry?.purchasedUnit === "package")) {
    const totalPieces = typeof stockEntry.totalPieces === "string" ? parseInt(stockEntry.totalPieces) : stockEntry.totalPieces;
    const purchasedQuantity = typeof stockEntry.purchasedQuantity === "string" ? parseFloat(stockEntry.purchasedQuantity) : stockEntry.purchasedQuantity;
    const packageUnit = stockEntry.purchasedUnit === "bag" ? "bags" : stockEntry.purchasedUnit === "pack" ? "packs" : "packages";
    return `${purchasedQuantity} ${packageUnit} (${totalPieces} pieces)`;
  }
  let quantity = stockEntry?.purchasedQuantity;
  if (!quantity || Number(quantity) === 0) {
    quantity = stockEntry?.purchasedIndividualQuantity;
  }
  const displayQuantity = typeof quantity === "string" ? quantity : String(quantity || "0");
  return `${displayQuantity} ${stockEntry?.purchasedUnit || "units"}`;
};

export const fmtCPU = (n: number, unitFieldName: string): string => {
  if (!isFinite(n) || isNaN(n) || n < 0) return "";
  const unit = unitFieldName as string;
  if (isMassUnit(unit)) {
    if (unit === "g" || unit === "oz") {
      if (n < 0.01) {
        return n.toFixed(6);
      } else if (n < 0.1) {
        return n.toFixed(4);
      }
      return n.toFixed(3);
    }
  }
  const s = formatCurrencyUI(n);
  return s.startsWith("$") ? s.slice(1) : s;
};

export const fmtTotalCost = (value: number | string | undefined, unit?: string): string => {
  if (value === undefined || value === null || value === "") {
    return "$0.00";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) {
    return "$0.00";
  }

  if (unit && isMassUnit(unit)) {
    if (unit === "g" || unit === "oz") {
      if (numValue < 0.01) {
        const formatted = formatCurrencyUI(numValue, 4);
        return formatted;
      } else if (numValue < 0.1) {
        const formatted = formatCurrencyUI(numValue, 3);
        return formatted;
      }
    }
  } else if (unit && isVolumeUnit(unit)) {
  }
  const formatted = formatCurrencyUI(numValue, 2);
  return formatted;
};

export const getFormattedCostPerUnitLabel = (unitFieldName: string): string => {
  const unit = unitFieldName || "Unit";
  if (isMassUnit(unit)) {
    if (unit === "kg") {
      return `Cost Per kg (per 1000g)`;
    } else if (unit === "g") {
      return `Cost Per g`;
    } else if (unit === "lb") {
      return `Cost Per lb (per 16oz)`;
    } else if (unit === "oz") {
      return `Cost Per oz`;
    }
  }

  return `Cost Per ${unit}`;
};

export const getFormattedTotalCostLabel = (unitFieldName: string): string => {
  const unit = unitFieldName || "Unit";
  if (isMassUnit(unit)) {
    if (unit === "kg") {
      return `Total Cost (all kg)`;
    } else if (unit === "g") {
      return `Total Cost (all g)`;
    } else if (unit === "lb") {
      return `Total Cost (all lb)`;
    } else if (unit === "oz") {
      return `Total Cost (all oz)`;
    }
  }

  return `Total Cost`;
};
