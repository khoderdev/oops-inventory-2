import { PackageUnit, PackagedGood } from "@/types/conversion";
import { Material } from "@/types/inventory";
import { calculatePackagedGoodCost } from "@/utils/conversionLogic";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { Calculator, DollarSign, Package } from "lucide-react";
import { Badge } from "../ui/badge";

// Helper function to format currency cleanly
const formatCurrency = (value: number): string => {
  if (value % 1 === 0) {
    // Whole number - no decimals
    return `$${value}`;
  } else {
    // Has decimals - show with appropriate decimal places
    return `$${value.toFixed(2)}`;
  }
};

export const CostBreakdown = ({ selectedMaterial, quantity, purchasedUnit, costPerPurchasedUnit }: { selectedMaterial: Material | null; quantity: string; purchasedUnit: string; costPerPurchasedUnit: string }) => {
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
  let calculatedTotalCost = 0;

  if (selectedMaterial.unitType === "package" && selectedMaterial.packageQuantity && selectedMaterial.baseUnit) {
    let costPerPackage: number;
    if (purchasedUnit === selectedMaterial.baseUnit) {
      costPerPackage = numCostPerUnit * selectedMaterial.packageQuantity;
    } else {
      costPerPackage = numCostPerUnit;
    }
    const validPackageUnits: PackageUnit[] = ["box", "pack", "case", "piece", "bottle"];
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
    const costBreakdown = calculatePackagedGoodCost(packagedGood, numQuantity, purchasedUnit);
    costPerBaseUnit = packagedGood.costPerPackage / packagedGood.unitsPerPackage;
    calculatedTotalCost = costBreakdown.totalCost;
  } else {
    if (purchasedUnit && selectedMaterial?.baseUnit) {
      const conversionFactor = getConversionFactor(purchasedUnit, selectedMaterial.baseUnit, selectedMaterial.unitType, selectedMaterial);
      if (conversionFactor > 0) {
        costPerBaseUnit = numCostPerUnit / conversionFactor;
      }
    }
  }
  if (selectedMaterial.unitType !== "package") {
    calculatedTotalCost = numQuantity * numCostPerUnit;
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
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Cost per {purchasedUnit}</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(numCostPerUnit)}</p>
        </div>

        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Quantity</span>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {numQuantity} {purchasedUnit || "units"}
          </p>
        </div>

        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Total Cost</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(numQuantity * numCostPerUnit)}</p>
        </div>

        {costPerBaseUnit > 0 && purchasedUnit !== selectedMaterial?.baseUnit && selectedMaterial?.baseUnit && (
          <div className="bg-white rounded-lg p-3 border border-blue-100">
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
