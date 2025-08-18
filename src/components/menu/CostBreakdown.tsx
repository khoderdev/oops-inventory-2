import React from "react";
import { StockEntryWithMaterial } from "@/types/inventory";
import { VariantData } from "../ui/Variants";
import { convertVolume, convertMass, isVolumeUnit, isMassUnit, formatCurrency } from "@/utils/conversionLogic";

interface CostBreakdownProps {
  selectedBeverageStock: StockEntryWithMaterial;
  price: string;
  variantData: VariantData;
}

export const CostBreakdown: React.FC<CostBreakdownProps> = ({
  selectedBeverageStock,
  price,
  variantData
}) => {
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
            <span className="text-gray-600">Unit Cost:</span>
            <span className="ml-2 font-medium">${Number(selectedBeverageStock.costPerBaseUnit || 0).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600">Selling Price:</span>
            <span className="ml-2 font-medium text-green-600">${price || '0.00'}</span>
          </div>
          <div>
            <span className="text-gray-600">Profit Margin:</span>
            <span className="ml-2 font-medium text-green-600">
              {price && selectedBeverageStock.costPerBaseUnit 
                ? `$${(parseFloat(price) - Number(selectedBeverageStock.costPerBaseUnit)).toFixed(2)} (${(((parseFloat(price) - Number(selectedBeverageStock.costPerBaseUnit)) / parseFloat(price)) * 100).toFixed(1)}%)`
                : '$0.00 (0.0%)'
              }
            </span>
          </div>
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
              const baseCost = Number(selectedBeverageStock.costPerBaseUnit || 0);
              const variantProfit = variantPrice - baseCost;
              const profitMargin = variantPrice > 0 ? (variantProfit / variantPrice) * 100 : 0;
              
              return (
                <div key={variant} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-4">
                    <span className="font-medium capitalize">{variant}</span>
                    <span className="text-sm text-gray-600">({adjustment}× base)</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 font-medium">${variantPrice.toFixed(2)}</span>
                    <span className="text-gray-600">
                      Profit: ${variantProfit.toFixed(2)} ({profitMargin.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-100 p-3 rounded-md mt-3">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">
            Total Items: {1 + variantData.selectedVariants.length}
          </span>
          <span className="text-sm text-gray-600">
            Stock Available: {selectedBeverageStock.purchasedQuantity || 0} {selectedBeverageStock.purchasedUnit || 'units'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CostBreakdown;
