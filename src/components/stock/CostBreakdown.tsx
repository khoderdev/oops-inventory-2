import { PackageUnit, PackagedGood } from "@/types/conversion";
import { Material } from "@/types/inventory";
import { formatCurrencyUI, formatNumberUI } from "@/utils/conversionLogic";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { Calculator, DollarSign, Package } from "lucide-react";
import { Badge } from "../ui/badge";

// Use the enhanced UI-friendly formatting utilities
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

  let costPerBaseUnit = 0;
  let costPerCl = 0;
  let costPerMl = 0;
  let calculatedTotalCost = 0;
  let showVolumeBreakdown = false;

  if (selectedMaterial.unitType === "package" && selectedMaterial.packageQuantity && selectedMaterial.baseUnit) {
    let costPerPackage: number;
    if (purchasedUnit === selectedMaterial.baseUnit) {
      costPerPackage = numCostPerUnit * selectedMaterial.packageQuantity;
    } else {
      costPerPackage = numCostPerUnit;
    }
    const validPackageUnits: PackageUnit[] = ["box", "pack", "case", "piece", "bottle", "bag"];
    const packageType: PackageUnit = validPackageUnits.includes(selectedMaterial.inputUnit as PackageUnit) ? (selectedMaterial.inputUnit as PackageUnit) : "pack";

    const packagedGood: PackagedGood = {
      name: selectedMaterial.name || "Unknown Material",
      costPerPackage,
      unitsPerPackage: selectedMaterial.packageQuantity,
      baseUnit: selectedMaterial.baseUnit,
      packageType
    };

    if (packagedGood.unitsPerPackage <= 0) {
      console.warn("Invalid packagedGood data (missing unitsPerPackage):", packagedGood);
      return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-blue-800">Cost Breakdown</h3>
          </div>
          <p className="text-sm text-red-600">Invalid package data: Missing quantity per package configuration.</p>
        </div>
      );
    }
    costPerBaseUnit = packagedGood.costPerPackage / packagedGood.unitsPerPackage;
    calculatedTotalCost = numQuantity * numCostPerUnit;

    // For volume-based package materials (like bottles), calculate cost per cl/ml
    if (selectedMaterial.baseUnit === "ml" || selectedMaterial.baseUnit === "cl" || selectedMaterial.baseUnit === "l") {
      showVolumeBreakdown = true;
      
      // If purchasing bottles and we know the volume per bottle
      if (purchasedUnit === "bottle") {
        let volumePerBottle = 0;
        
        // Try to get volume from material configuration in order of preference
        if (selectedMaterial.volumePerBottle && selectedMaterial.volumePerBottle > 0) {
          volumePerBottle = selectedMaterial.volumePerBottle;
        } else if (selectedMaterial.volumePerUnit && selectedMaterial.volumePerUnit > 0) {
          volumePerBottle = selectedMaterial.volumePerUnit;
        } else if (selectedMaterial.packageQuantity && selectedMaterial.packageQuantity > 0) {
          volumePerBottle = selectedMaterial.packageQuantity;
        }
        
        // Only proceed if we have valid volume data
        if (volumePerBottle <= 0) {
          console.warn(`No volume configuration found for bottle material: ${selectedMaterial.name}`);
          return;
        }
        
        const baseUnit = selectedMaterial.baseUnit || "cl";
        
        if (baseUnit === "cl") {
          costPerCl = numCostPerUnit / volumePerBottle;
          costPerMl = costPerCl / 10;
        } else if (baseUnit === "ml") {
          costPerMl = numCostPerUnit / volumePerBottle;
          costPerCl = costPerMl * 10;
        } else if (baseUnit === "l") {
          const costPerLiter = numCostPerUnit / volumePerBottle;
          costPerCl = costPerLiter / 100;
          costPerMl = costPerLiter / 1000;
        } else {
          // Default: assume volume is in cl for bottles
          costPerCl = numCostPerUnit / volumePerBottle;
          costPerMl = costPerCl / 10;
        }
      }
    }
  } else if (selectedMaterial.unitType === "volume") {
    showVolumeBreakdown = true;
    calculatedTotalCost = numQuantity * numCostPerUnit;

    // Calculate cost per cl and ml for volume materials
    if (purchasedUnit === "bottle") {
      let volumePerBottle = 0;
      
      // Try to get volume from material configuration in order of preference
      if (selectedMaterial.volumePerBottle && selectedMaterial.volumePerBottle > 0) {
        volumePerBottle = selectedMaterial.volumePerBottle;
      } else if (selectedMaterial.volumePerUnit && selectedMaterial.volumePerUnit > 0) {
        volumePerBottle = selectedMaterial.volumePerUnit;
      } else if (selectedMaterial.packageQuantity && selectedMaterial.packageQuantity > 0) {
        volumePerBottle = selectedMaterial.packageQuantity;
      }
      
      // Only proceed if we have valid volume data
      if (volumePerBottle <= 0) {
        console.warn(`No volume configuration found for bottle material: ${selectedMaterial.name}`);
        // Skip volume breakdown for this material
        showVolumeBreakdown = false;
      } else {
        costPerCl = numCostPerUnit / volumePerBottle;
        costPerMl = costPerCl / 10;
      }
    } else if (purchasedUnit === "cl") {
      costPerCl = numCostPerUnit;
      costPerMl = numCostPerUnit / 10;
    } else if (purchasedUnit === "ml") {
      costPerMl = numCostPerUnit;
      costPerCl = numCostPerUnit * 10;
    } else if (purchasedUnit === "l") {
      costPerCl = numCostPerUnit / 100;
      costPerMl = numCostPerUnit / 1000;
    }

    // Calculate cost per base unit
    if (purchasedUnit && selectedMaterial?.baseUnit) {
      if (purchasedUnit === "cl" && selectedMaterial.baseUnit === "ml") {
        costPerBaseUnit = numCostPerUnit / 10;
      } else if (purchasedUnit === "ml" && selectedMaterial.baseUnit === "cl") {
        costPerBaseUnit = numCostPerUnit * 10;
      } else if (purchasedUnit === "l" && selectedMaterial.baseUnit === "ml") {
        costPerBaseUnit = numCostPerUnit / 1000;
      } else if (purchasedUnit === "l" && selectedMaterial.baseUnit === "cl") {
        costPerBaseUnit = numCostPerUnit / 100;
      } else {
        const conversionFactor = getConversionFactor(purchasedUnit, selectedMaterial.baseUnit, selectedMaterial.unitType, selectedMaterial);
        if (conversionFactor > 0) {
          costPerBaseUnit = numCostPerUnit / conversionFactor;
        }
      }
    }
  } else {
    calculatedTotalCost = numQuantity * numCostPerUnit;
    
    if (purchasedUnit && selectedMaterial?.baseUnit) {
      if (purchasedUnit === "g" && selectedMaterial.baseUnit === "kg") {
        costPerBaseUnit = numCostPerUnit * 1000;
      } else if (purchasedUnit === "kg" && selectedMaterial.baseUnit === "g") {
        costPerBaseUnit = numCostPerUnit / 1000;
      } else {
        const conversionFactor = getConversionFactor(purchasedUnit, selectedMaterial.baseUnit, selectedMaterial.unitType, selectedMaterial);
        if (conversionFactor > 0) {
          costPerBaseUnit = numCostPerUnit / conversionFactor;
        }
      }
    }
  }

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
          <p className="text-xl font-bold text-gray-800">{formatCurrency(calculatedTotalCost)}</p>
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

        {showVolumeBreakdown && costPerMl > 0 && (
          <div className="justify-between flex flex-col bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-medium text-gray-600">Cost per ml</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(costPerMl)}</p>
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
