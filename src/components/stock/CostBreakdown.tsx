import { Material } from "@/types/inventory";
import { formatCurrencyUI, formatNumberUI } from "@/utils/conversionLogic";
import { Calculator, DollarSign, Package } from "lucide-react";
import { Badge } from "../ui/badge";

const formatCurrency = formatCurrencyUI;
const formatNumber = formatNumberUI;

export const CostBreakdown = ({ selectedMaterial, quantity, purchasedUnit, costPerPurchasedUnit }: { selectedMaterial: Material | null; quantity: string; purchasedUnit: string; costPerPurchasedUnit: string; totalCost?: string }) => {
  const numQuantity = parseFloat(quantity) || 0;
  const numCostPerUnit = parseFloat(costPerPurchasedUnit) || 0;

  if (!selectedMaterial) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calculator className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-800">Cost Breakdown</h3>
        </div>
        <p className="text-sm text-gray-500">Select a material to see cost breakdown.</p>
      </div>
    );
  }

  if (numQuantity === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calculator className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-800">Cost Breakdown</h3>
        </div>
        <p className="text-sm text-gray-500">Enter quantity to see cost breakdown.</p>
      </div>
    );
  }

  // Calculate costs directly using the provided cost per unit
  let costPerMl = 0;
  let costPerCl = 0;
  let costPerBaseUnit = 0;
  let calculatedTotalCost = numQuantity * numCostPerUnit;
  
  // For volume-based materials, calculate cost per ml/cl
  if (selectedMaterial.unitType === "package" && 
      (selectedMaterial.baseUnit === "ml" || selectedMaterial.baseUnit === "cl" || selectedMaterial.baseUnit === "l")) {
    
    const volumePerUnit = selectedMaterial.volumePerUnit || selectedMaterial.volumePerBottle || 700;
    
    if (purchasedUnit === "ml" && volumePerUnit > 0) {
      // For ml purchases, the numCostPerUnit is already cost per ml
      costPerMl = numCostPerUnit;
      costPerCl = costPerMl * 10;
    } else if (purchasedUnit === "bottle" && volumePerUnit > 0) {
      // For bottle purchases, calculate cost per ml from bottle cost
      costPerMl = numCostPerUnit / volumePerUnit;
      costPerCl = costPerMl * 10;
    }
    
    // Calculate cost per base unit
    if (selectedMaterial.baseUnit === "ml") {
      costPerBaseUnit = costPerMl;
    } else if (selectedMaterial.baseUnit === "cl") {
      costPerBaseUnit = costPerCl;
    }
  }
  
  const showVolumeBreakdown = selectedMaterial.unitType === "package" && 
    (selectedMaterial.baseUnit === "ml" || selectedMaterial.baseUnit === "cl" || selectedMaterial.baseUnit === "l") ||
    selectedMaterial.unitType === "volume";

  const existingCostPerBaseUnit = parseFloat(String(selectedMaterial?.costPerUnit || 0)) || 0;
  const costDifferencePercent = existingCostPerBaseUnit > 0 ? ((costPerBaseUnit - existingCostPerBaseUnit) / existingCostPerBaseUnit) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Calculator className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-blue-800">Cost Breakdown</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="justify-between flex flex-col bg-white rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Cost per {purchasedUnit}</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(numCostPerUnit)}</p>
        </div>

        <div className="justify-between flex flex-col bg-white rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Quantity</span>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {formatNumber(numQuantity)} {purchasedUnit || "units"}
          </p>
        </div>

        <div className="justify-between flex flex-col bg-white rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Total Cost</span>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {formatCurrency(calculatedTotalCost)}
          </p>
        </div>

        {showVolumeBreakdown && costPerCl > 0 && (
          <div className="justify-between flex flex-col bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Cost per cl</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(costPerCl)}</p>
          </div>
        )}

        {showVolumeBreakdown && costPerMl > 0 && purchasedUnit !== "ml" && (
          <div className="justify-between flex flex-col bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-medium text-gray-600">Cost per ml</span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {formatCurrency(costPerMl)}
            </p>
          </div>
        )}

        {!showVolumeBreakdown && costPerBaseUnit > 0 && purchasedUnit !== selectedMaterial?.baseUnit && selectedMaterial?.baseUnit && (
          <div className="justify-between flex flex-col bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Cost per {selectedMaterial.baseUnit}</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(costPerBaseUnit)}</p>
          </div>
        )}
      </div>

      {costPerBaseUnit > 0 && existingCostPerBaseUnit > 0 && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Cost Comparison</span>
            <Badge variant={costDifferencePercent > 0 ? "destructive" : costDifferencePercent < 0 ? "default" : "secondary"} className={costDifferencePercent < 0 ? "bg-green-500 hover:bg-green-600" : ""}>
              {costDifferencePercent > 0 ? "+" : ""}
              {(costDifferencePercent || 0).toFixed(1)}%
            </Badge>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <p>
              Current material cost: {formatCurrency(existingCostPerBaseUnit || 0)} per {selectedMaterial?.baseUnit || "unit"}
            </p>
            <p>
              New entry cost: {formatCurrency(costPerBaseUnit || 0)} per {selectedMaterial?.baseUnit || "unit"}
            </p>
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-blue-700">
        {costDifferencePercent > 5 && (
          <p className="flex items-center gap-1 text-red-600">
            <span>⚠️</span>
            This purchase is {(Math.abs(costDifferencePercent) || 0).toFixed(1)}% more expensive than your usual cost
          </p>
        )}
        {costDifferencePercent < -5 && (
          <p className="flex items-center gap-1 text-green-600">
            <span>✅</span>
            Great deal! This is {(Math.abs(costDifferencePercent) || 0).toFixed(1)}% cheaper than your usual cost
          </p>
        )}
        {Math.abs(costDifferencePercent) <= 5 && existingCostPerBaseUnit > 0 && (
          <p className="flex items-center gap-1 text-blue-600">
            <span>📊</span>
            This cost is consistent with your usual pricing
          </p>
        )}
      </div>
    </div>
  );
};
