import React from "react";
import { StockEntryWithMaterial } from "@/types/inventory";
import { VariantData } from "../ui/Variants";
import { convertVolume, convertMass, isVolumeUnit, isMassUnit, formatCurrency } from "@/utils/conversionLogic";

interface CostBreakdownProps {
  selectedBeverageStock: StockEntryWithMaterial;
  price: string; // This will be deprecated in favor of individual variant prices
  variantData: VariantData;
}

// Helper function to calculate cost per serving unit with dynamic volume and unit support
const calculateCostPerServing = (
  stock: StockEntryWithMaterial, 
  servingVolume: number,
  servingUnit: string
): number => {
  const baseCost = Number(stock.costPerBaseUnit || 0);
  const stockUnit = stock.purchasedUnit || "piece";

  // Stock unit volumes in cl
  const stockVolumes: Record<string, number> = {
    bottle: 75, // 75cl standard bottle (750ml)
    liter: 100, // 100cl = 1 liter
    ml: 0.1, // 0.1cl = 1ml
    gallon: 378.5 // 378.5cl = 1 gallon
  };

  const stockUnitLower = stockUnit.toLowerCase();

  // Get stock volume in cl
  let stockVolumeInCl = stockVolumes[stockUnitLower];

  // If stock unit not in predefined volumes, try conversion
  if (!stockVolumeInCl) {
    if (isVolumeUnit(stockUnit)) {
      // Convert stock unit to ml, then to cl
      const stockInMl = convertVolume(1, stockUnit, "ml");
      stockVolumeInCl = stockInMl * 0.1; // ml to cl
    } else {
      // Fallback for non-volume units
      return baseCost;
    }
  }

  // Apply the formula: cost_x_mL = price_per_unit × (x_mL / unit_volume_mL)
  // First convert stock volume to mL for consistent calculation
  const stockVolumeInMl = stockVolumeInCl * 10; // cl to ml (1cl = 10ml)
  
  // Convert serving volume to mL if needed
  let servingVolumeInMl = servingVolume;
  if (servingUnit === "cl") {
    servingVolumeInMl = servingVolume * 10; // cl to ml
  }
  
  // Calculate cost using the formula: cost_x_mL = price_per_unit × (x_mL / unit_volume_mL)
  const servingCost = baseCost * (servingVolumeInMl / stockVolumeInMl);

  return servingCost;
};

export const CostBreakdown: React.FC<CostBreakdownProps> = ({ selectedBeverageStock, price, variantData }) => {
  const baseCost = Number(selectedBeverageStock.costPerBaseUnit || 0);

  // Calculate price per cl for display
  const stockUnit = selectedBeverageStock.purchasedUnit || "piece";
  const stockVolumes: Record<string, number> = {
    bottle: 75, // 75cl standard bottle (750ml)
    liter: 100, // 100cl = 1 liter
    ml: 0.1, // 0.1cl = 1ml
    gallon: 378.5 // 378.5cl = 1 gallon
  };

  let stockVolumeInCl = stockVolumes[stockUnit.toLowerCase()];
  if (!stockVolumeInCl && isVolumeUnit(stockUnit)) {
    const stockInMl = convertVolume(1, stockUnit, "ml");
    stockVolumeInCl = stockInMl * 0.1;
  }

  const pricePerCl = stockVolumeInCl ? baseCost / stockVolumeInCl : 0;

  // Get the primary variant for base display (glass if selected, otherwise first selected variant)
  const primaryVariant = variantData.selectedVariants.includes("glass") 
    ? "glass" 
    : variantData.selectedVariants[0] || "glass";
  const primaryVariantVolume = variantData.variantVolumes[primaryVariant] || 3;
  const primaryVariantUnit = variantData.variantVolumeUnits[primaryVariant] || "cl";
  const primaryVariantCost = calculateCostPerServing(selectedBeverageStock, primaryVariantVolume, primaryVariantUnit);
  const primaryVariantPrice = variantData.variantPrices[primaryVariant] || 0;
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
      <h3 className="text-lg font-semibold text-blue-800 mb-3">Cost Breakdown</h3>

      {/* Base Item Cost */}
      <div className="bg-white p-3 rounded-md shadow-sm mb-3">
        <h4 className="font-medium text-gray-700 mb-2">Base Item</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Material:</span>
            <span className="ml-2 font-medium">{selectedBeverageStock.material?.name}</span>
          </div>
          <div>
            <span className="text-gray-600">Available in Stock:</span>
            <span className="ml-2 font-medium">
              {Math.floor(selectedBeverageStock.purchasedQuantity || 0)} {Math.floor(selectedBeverageStock.purchasedQuantity || 0) === 1 ? selectedBeverageStock.purchasedUnit || "unit" : selectedBeverageStock.purchasedUnit === "bottle" ? "bottles" : selectedBeverageStock.purchasedUnit === "liter" ? "liters" : selectedBeverageStock.purchasedUnit === "gallon" ? "gallons" : (selectedBeverageStock.purchasedUnit || "units") + "s"}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Stock Unit Cost:</span>
            <span className="ml-2 font-medium">
              {formatCurrency(baseCost)} per {selectedBeverageStock.purchasedUnit}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Volume:</span>
            <span className="ml-2 font-medium">
              {stockVolumeInCl}cl per {selectedBeverageStock.purchasedUnit}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Price per cl:</span>
            <span className="ml-2 font-medium text-blue-600">
              {formatCurrency(pricePerCl)} ({formatCurrency(baseCost)} ÷ {stockVolumeInCl}cl)
            </span>
          </div>
          <div>
            <span className="text-gray-600">{primaryVariant} Cost ({primaryVariantVolume}{primaryVariantUnit}):</span>
            <span className="ml-2 font-medium text-orange-600">
              {formatCurrency(primaryVariantCost)} ({formatCurrency(baseCost)} × {primaryVariantUnit === "ml" ? primaryVariantVolume : (primaryVariantVolume * 10)}mL/{stockVolumeInCl * 10}mL)
            </span>
          </div>
          <div>
            <span className="text-gray-600">Selling Price:</span>
            <span className="ml-2 font-medium text-green-600">${primaryVariantPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">Profit Margin:</span>
            <span className="ml-2 font-medium text-green-600">{primaryVariantPrice && primaryVariantCost ? `${formatCurrency(primaryVariantPrice - primaryVariantCost)} (${(((primaryVariantPrice - primaryVariantCost) / primaryVariantPrice) * 100).toFixed(1)}%)` : "$0.00 (0.0%)"}</span>
          </div>
          <div>
            <span className="text-gray-600">Servings per Stock:</span>
            <span className="ml-2 font-medium text-blue-600">{stockVolumeInCl ? Math.floor((stockVolumeInCl * 10) / (primaryVariantUnit === "ml" ? primaryVariantVolume : (primaryVariantVolume * 10))) : "N/A"} {primaryVariant}s</span>
          </div>
          <div></div>
        </div>
      </div>

      {/* Variants Cost Breakdown */}
      {variantData.selectedVariants.length > 0 && (
        <div className="bg-white p-3 rounded-md shadow-sm">
          <h4 className="font-medium text-gray-700 mb-2">Variant Pricing</h4>
          <div className="space-y-2">
            {variantData.selectedVariants.map(variant => {
              const variantPrice = variantData.variantPrices[variant] || 0;
              const variantVolume = variantData.variantVolumes[variant] || 3;
              const variantUnit = variantData.variantVolumeUnits[variant] || "cl";

              // Calculate cost per variant serving unit using dynamic volume and unit
              const variantCost = calculateCostPerServing(selectedBeverageStock, variantVolume, variantUnit);
              const variantProfit = variantPrice - variantCost;
              const profitMargin = variantPrice > 0 ? (variantProfit / variantPrice) * 100 : 0;

              // Calculate servings per stock for this variant
              // Calculate servings per stock: stock_volume_mL / serving_mL
              const stockTotalMl = stockVolumeInCl * 10; // total stock in ml
              const servingMl = variantUnit === "ml" ? variantVolume : (variantVolume * 10);
              const servingsPerStock = stockTotalMl ? Math.floor(stockTotalMl / servingMl) : 0;

              return (
                <div key={variant} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-4">
                    <span className="font-medium capitalize">{variant}</span>
                    <span className="text-sm text-gray-600">({variantVolume}{variantUnit})</span>
                    <span className="text-xs text-blue-600">{servingsPerStock} servings/stock</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 font-medium">${variantPrice.toFixed(2)}</span>
                    <span className="text-gray-600">Cost: {formatCurrency(variantCost)}</span>
                    <span className="text-gray-600">
                      Profit: {formatCurrency(variantProfit)} ({profitMargin.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CostBreakdown;
