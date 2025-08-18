import React from "react";
import { StockEntryWithMaterial } from "@/types/inventory";
import { VariantData } from "../ui/Variants";
import { convertVolume, convertMass, isVolumeUnit, isMassUnit, formatCurrency } from "@/utils/conversionLogic";

interface CostBreakdownProps {
  selectedBeverageStock: StockEntryWithMaterial;
  price: string;
  variantData: VariantData;
}

// Helper function to calculate cost per serving unit using cl-based formula
const calculateCostPerServing = (stock: StockEntryWithMaterial, servingUnit: string): number => {
  const baseCost = Number(stock.costPerBaseUnit || 0);
  const stockUnit = stock.purchasedUnit || "piece";

  // If same unit, return base cost
  if (stockUnit.toLowerCase() === servingUnit.toLowerCase()) {
    return baseCost;
  }

  // Standard serving volumes in cl (centiliters)
  const servingVolumes: Record<string, number> = {
    glass: 3, // 3cl glass (standard whisky/spirits serving)
    shot: 3, // 3cl shot (30ml)
    small: 2, // 2cl small serving
    medium: 3, // 3cl medium serving
    large: 5, // 5cl large serving
    cup: 25 // 25cl cup (250ml)
  };

  // Stock unit volumes in cl
  const stockVolumes: Record<string, number> = {
    bottle: 75, // 75cl standard bottle (750ml)
    liter: 100, // 100cl = 1 liter
    ml: 0.1, // 0.1cl = 1ml
    gallon: 378.5 // 378.5cl = 1 gallon
  };

  const stockUnitLower = stockUnit.toLowerCase();
  const servingUnitLower = servingUnit.toLowerCase();

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

  // Get serving volume in cl
  const servingVolumeInCl = servingVolumes[servingUnitLower];

  if (!servingVolumeInCl) {
    // Fallback: return base cost
    return baseCost;
  }

  // Apply the formula: Price per cl = Bottle Price / Bottle Volume (cl)
  const pricePerCl = baseCost / stockVolumeInCl;

  // Glass Price = Price per cl × Glass Volume (cl)
  const servingPrice = pricePerCl * servingVolumeInCl;

  return servingPrice;
};

export const CostBreakdown: React.FC<CostBreakdownProps> = ({ selectedBeverageStock, price, variantData }) => {
  // Calculate cost per glass (standard serving unit for beverages)
  const costPerGlass = calculateCostPerServing(selectedBeverageStock, "glass");
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
            <span className="text-gray-600">Glass Cost (3cl):</span>
            <span className="ml-2 font-medium text-orange-600">
              {formatCurrency(costPerGlass)} ({formatCurrency(pricePerCl)} × 3cl)
            </span>
          </div>
          <div>
            <span className="text-gray-600">Selling Price:</span>
            <span className="ml-2 font-medium text-green-600">${price || "0.00"}</span>
          </div>
          <div>
            <span className="text-gray-600">Profit Margin:</span>
            <span className="ml-2 font-medium text-green-600">{price && costPerGlass ? `${formatCurrency(parseFloat(price) - costPerGlass)} (${(((parseFloat(price) - costPerGlass) / parseFloat(price)) * 100).toFixed(1)}%)` : "$0.00 (0.0%)"}</span>
          </div>
          <div>
            <span className="text-gray-600">Servings per Stock:</span>
            <span className="ml-2 font-medium text-blue-600">{stockVolumeInCl ? Math.floor(stockVolumeInCl / 3) : "N/A"} glasses</span>
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
              const adjustment = variantData.priceAdjustments[variant] || 1.0;
              const variantPrice = price ? parseFloat(price) * adjustment : 0;

              // Calculate cost per variant serving unit
              const variantCost = calculateCostPerServing(selectedBeverageStock, variant);
              const variantProfit = variantPrice - variantCost;
              const profitMargin = variantPrice > 0 ? (variantProfit / variantPrice) * 100 : 0;

              return (
                <div key={variant} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-4">
                    <span className="font-medium capitalize">{variant}</span>
                    <span className="text-sm text-gray-600">({adjustment}× base)</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 font-medium">{formatCurrency(variantPrice)}</span>
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
