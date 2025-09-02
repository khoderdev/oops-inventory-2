import { StockEntry } from "@/types/inventory";

export const getCurrentStockDisplay = (stockEntry: StockEntry): string => {
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
