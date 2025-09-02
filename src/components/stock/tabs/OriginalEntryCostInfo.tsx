import { OriginalEntryCostInfoProps } from "@/types/inventory";
import { formatCurrencyUI } from "@/utils/conversionLogic";
import { getCurrentStockDisplay } from "@/utils/getCurrentStockDisplay";

export const OriginalEntryCostInfo = ({ form, stockEntry }: OriginalEntryCostInfoProps) => {
  // Get current form values for real-time updates
  const currentValues = form.getValues();
  const wasteQuantity = parseFloat(String(currentValues.wasteQuantity || "0"));
  const currentUnit = currentValues.purchasedUnit || stockEntry.purchasedUnit;

  // Calculate remaining quantities after waste
  const calculateRemainingStock = () => {
    if (!stockEntry) return "0";

    // For mass materials (kg, g)
    if (stockEntry.totalMass && (stockEntry.purchasedUnit === "kg" || stockEntry.purchasedUnit === "g" || 
        currentUnit === "kg" || currentUnit === "g")) {
      const totalMass = typeof stockEntry.totalMass === "string" ? parseFloat(stockEntry.totalMass) : stockEntry.totalMass;
      
      // Convert waste to grams for calculation
      let wasteMassInGrams = 0;
      if (currentUnit === "kg") {
        wasteMassInGrams = wasteQuantity * 1000; // kg to g
      } else if (currentUnit === "g") {
        wasteMassInGrams = wasteQuantity;
      } else {
        // Default case if unit doesn't match
        wasteMassInGrams = wasteQuantity * (stockEntry.massPerUnit || 1);
      }
      
      // Calculate remaining mass
      const remainingMassInGrams = Math.max(0, totalMass - wasteMassInGrams);
      
      // Always display both kg and g units for consistency
      const remainingMassInKg = remainingMassInGrams / 1000;
      const formattedMassKg = remainingMassInKg.toFixed(2);
      const formattedMassG = Math.round(remainingMassInGrams);
      return `${formattedMassKg} kg (${formattedMassG} g)`;
    }

    // For volume materials (bottles)
    if (stockEntry.totalVolume && stockEntry.volumePerUnit && stockEntry.purchasedUnit === "bottle") {
      const totalVolume = typeof stockEntry.totalVolume === "string" ? parseFloat(stockEntry.totalVolume) : stockEntry.totalVolume;
      const volumePerUnit = typeof stockEntry.volumePerUnit === "string" ? parseFloat(stockEntry.volumePerUnit) : stockEntry.volumePerUnit;

      // Convert waste to volume if units match
      let wasteVolume = 0;
      if (currentUnit === "bottle") {
        wasteVolume = wasteQuantity * volumePerUnit;
      } else if (currentUnit === "ml" || currentUnit === "cl" || currentUnit === "l") {
        // Convert to ml if needed
        if (currentUnit === "cl") wasteVolume = wasteQuantity * 10;
        else if (currentUnit === "l") wasteVolume = wasteQuantity * 1000;
        else wasteVolume = wasteQuantity;
      }

      // Calculate remaining volume and bottles
      const remainingVolume = Math.max(0, totalVolume - wasteVolume);
      const remainingBottles = Math.round((remainingVolume / volumePerUnit) * 100) / 100;
      return `${remainingVolume.toFixed(0)} ml (${remainingBottles} ${remainingBottles === 1 ? "bottle" : "bottles"})`;
    }

    // For package materials with pieces
    if (stockEntry.totalPieces && stockEntry.piecesPerPackage) {
      const totalPieces = typeof stockEntry.totalPieces === "string" ? parseInt(stockEntry.totalPieces) : stockEntry.totalPieces;

      // Convert waste to pieces if needed
      let wastePieces = 0;
      if (currentUnit === "piece" || currentUnit === "pieces") {
        wastePieces = wasteQuantity;
      } else if (currentUnit === stockEntry.purchasedUnit) {
        wastePieces = wasteQuantity * stockEntry.piecesPerPackage;
      }

      const remainingPieces = Math.max(0, totalPieces - wastePieces);
      return `${remainingPieces} pieces`;
    }

    // For standard quantity items
    const quantity = stockEntry.purchasedIndividualQuantity !== undefined ? stockEntry.purchasedIndividualQuantity : stockEntry.purchasedQuantity;
    const remainingQuantity = Math.max(0, Number(quantity) - wasteQuantity);
    return `${remainingQuantity} ${currentUnit || stockEntry.purchasedUnit || "units"}`;
  };

  // Calculate cost impact
  const calculateCostImpact = () => {
    // Add null check for stockEntry
    if (!stockEntry) return 0;
    
    const totalCost = Number(stockEntry.totalCost || 0);
    if (!wasteQuantity || isNaN(wasteQuantity) || wasteQuantity <= 0) return 0;

    // For mass materials (kg, g)
    if (stockEntry.totalMass && (stockEntry.purchasedUnit === "kg" || stockEntry.purchasedUnit === "g" || 
        currentUnit === "kg" || currentUnit === "g")) {
      const totalMass = typeof stockEntry.totalMass === "string" ? parseFloat(stockEntry.totalMass) : stockEntry.totalMass;
      
      // Convert waste to grams for calculation
      let wasteMassInGrams = 0;
      if (currentUnit === "kg") {
        wasteMassInGrams = wasteQuantity * 1000; // kg to g
      } else if (currentUnit === "g") {
        wasteMassInGrams = wasteQuantity;
      } else {
        // Default case if unit doesn't match
        wasteMassInGrams = wasteQuantity * (stockEntry.massPerUnit || 1);
      }
      
      // Calculate cost impact based on mass proportion with higher precision for small quantities
      const costPerGram = totalCost / totalMass;
      const costImpact = wasteMassInGrams * costPerGram;
      
      // Return the exact cost impact without minimum threshold
      return costImpact;
    }

    // For volume materials (bottles)
    if (stockEntry.totalVolume && stockEntry.volumePerUnit && stockEntry.purchasedUnit === "bottle") {
      const totalVolume = typeof stockEntry.totalVolume === "string" ? parseFloat(stockEntry.totalVolume) : stockEntry.totalVolume;
      const volumePerUnit = typeof stockEntry.volumePerUnit === "string" ? parseFloat(stockEntry.volumePerUnit) : stockEntry.volumePerUnit;

      // Convert waste to volume if units match
      let wasteVolume = 0;
      if (currentUnit === "bottle") {
        wasteVolume = wasteQuantity * volumePerUnit;
      } else if (currentUnit === "ml" || currentUnit === "cl" || currentUnit === "l") {
        // Convert to ml if needed
        if (currentUnit === "cl") wasteVolume = wasteQuantity * 10;
        else if (currentUnit === "l") wasteVolume = wasteQuantity * 1000;
        else wasteVolume = wasteQuantity;
      }

      return (wasteVolume / totalVolume) * totalCost;
    }

    // For standard quantity items
    const quantity = stockEntry.purchasedQuantity || 1;
    return (wasteQuantity / Number(quantity)) * totalCost;
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Stock Entry Information</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Original Total Cost:</span>
          <span className="ml-2 font-medium">{formatCurrencyUI(stockEntry?.totalCost || 0)}</span>
        </div>
        <div>
          <span className="text-gray-500">Original Quantity:</span>
          <span className="ml-2 font-medium">
            {(() => {
              if (!stockEntry) return "0 units";
              
              if (stockEntry.totalVolume && stockEntry.volumePerUnit && stockEntry.purchasedUnit === "bottle") {
                const totalVolume = typeof stockEntry.totalVolume === "string" ? parseFloat(stockEntry.totalVolume) : stockEntry.totalVolume;
                const volumePerUnit = typeof stockEntry.volumePerUnit === "string" ? parseFloat(stockEntry.volumePerUnit) : stockEntry.volumePerUnit;
                const actualBottleCount = Math.round((totalVolume / volumePerUnit) * 100) / 100;
                return `${totalVolume} ml (${actualBottleCount} ${actualBottleCount === 1 ? "bottle" : "bottles"})`;
              }
              return `${stockEntry.purchasedQuantity || "0"} ${stockEntry.purchasedUnit || "units"}`;
            })()}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Current Stock:</span>
          <span className="ml-2 font-medium">{stockEntry ? getCurrentStockDisplay(stockEntry) : "0 units"}</span>
        </div>
        <div>
          <span className="text-gray-500">After Waste:</span>
          <span className="ml-2 font-medium">{stockEntry ? calculateRemainingStock() : "0 units"}</span>
        </div>
        <div>
          <span className="text-gray-500">Waste Cost Impact:</span>
          <span className="ml-2 font-medium">
            {(() => {
              const costImpact = calculateCostImpact();
              // For very small values, show more decimal places
              if (costImpact < 0.01 && costImpact > 0) {
                return `$${costImpact.toFixed(4)}`;
              }
              return formatCurrencyUI(costImpact);
            })()}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Unit:</span>
          <span className="ml-2 font-medium">{currentUnit || stockEntry.purchasedUnit || "units"}</span>
        </div>
      </div>
    </div>
  );
};
