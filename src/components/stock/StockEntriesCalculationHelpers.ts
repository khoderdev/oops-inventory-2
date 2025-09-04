import { StockEntryWithMaterial } from "@/types/inventory";

export const calculateCurrentTotalCost = (entry: StockEntryWithMaterial): number => {
  if (!entry || !entry.material) {
    return 0;
  }
  const { material, costPerPurchasedUnit } = entry;
  if (!costPerPurchasedUnit || costPerPurchasedUnit <= 0) {
    return 0;
  }

  switch (material.unitType) {
    case "mass":
      return ((entry.totalMass || 0) * costPerPurchasedUnit) / entry.purchasedIndividualQuantity;
    case "volume":
      return ((entry.totalVolume || 0) * costPerPurchasedUnit) / entry.purchasedIndividualQuantity;
    case "package":
      if (entry.purchasedUnit === "piece" || entry.purchasedUnit === "bottle") {
        return ((entry.totalPieces || 0) * costPerPurchasedUnit) / entry.purchasedIndividualQuantity;
      } else {
        return (entry.purchasedQuantity || 0) * costPerPurchasedUnit;
      }
    case "piece":
      return ((entry.totalPieces || entry.purchasedQuantity || 0) * costPerPurchasedUnit);
    default:
      return ((entry.purchasedIndividualQuantity || entry.purchasedQuantity || 0) * costPerPurchasedUnit);
  }
};
