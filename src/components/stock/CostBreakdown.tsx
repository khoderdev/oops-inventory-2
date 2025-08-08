import { PackageUnit, PackagedGood } from "@/types/conversion";
import { Material } from "@/types/inventory";
import { calculatePackagedGoodCost } from "@/utils/conversionLogic";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { Calculator, DollarSign, Package } from "lucide-react";
import { Badge } from "../ui/badge";

export const CostBreakdown = ({ selectedMaterial, quantity, purchasedUnit, costPerPurchasedUnit, totalCost }: { selectedMaterial: Material | null; quantity: string; purchasedUnit: string; costPerPurchasedUnit: string; totalCost: string }) => {
  const numQuantity = parseFloat(quantity) || 0;
  const numCostPerUnit = parseFloat(costPerPurchasedUnit) || 0;
  const numTotalCost = parseFloat(totalCost) || 0;

  // Debugging: Log input props
  console.log("CostBreakdown Inputs:", {
    selectedMaterial,
    quantity,
    purchasedUnit,
    costPerPurchasedUnit,
    totalCost
  });

  // Early return if critical data is missing
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

  // If quantity is 0, show a loading/waiting state instead of an error
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

  // Handle packaged goods
  if (selectedMaterial.unitType === "package" && selectedMaterial.packageQuantity && selectedMaterial.baseUnit) {
    // For package items, if user enters cost in base unit (e.g., cost per piece),
    // we need to calculate the cost per package
    let costPerPackage: number;
    
    if (purchasedUnit === selectedMaterial.baseUnit) {
      // User entered cost per individual unit (e.g., $0.5 per piece)
      // Convert to cost per package: cost per piece × pieces per package
      costPerPackage = numCostPerUnit * selectedMaterial.packageQuantity;
      console.log(`🔄 Converting cost per ${purchasedUnit} to cost per package: $${numCostPerUnit} × ${selectedMaterial.packageQuantity} = $${costPerPackage}`);
    } else {
      // User entered cost per package directly
      costPerPackage = numCostPerUnit;
    }

    const validPackageUnits: PackageUnit[] = ["box", "pack", "case", "piece", "bottle"];
    const packageType: PackageUnit = validPackageUnits.includes(selectedMaterial.inputUnit as PackageUnit) ? (selectedMaterial.inputUnit as PackageUnit) : "pack";

    const packagedGood: PackagedGood = {
      name: selectedMaterial.name || "Unknown Material",
      costPerPackage,
      unitsPerPackage: selectedMaterial.packageQuantity, // e.g., 6 pieces per pack
      baseUnit: selectedMaterial.baseUnit, // e.g., "piece"
      packageType
    };

    // Validate packagedGood data - only check for critical missing data
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

    console.log("📦 Package Calculation Input:", { packagedGood, numQuantity, purchasedUnit });
    const costBreakdown = calculatePackagedGoodCost(packagedGood, numQuantity, purchasedUnit);
    costPerBaseUnit = packagedGood.costPerPackage / packagedGood.unitsPerPackage; // e.g., $6.00 ÷ 30 = $0.20
    calculatedTotalCost = costBreakdown.totalCost; // Use calculated total cost.

    // Debugging: Log cost breakdown steps
    console.log("📦 Package Cost Breakdown:", costBreakdown);
    console.log("📦 Calculated Total Cost:", calculatedTotalCost);
    console.log("Cost Breakdown Steps:", costBreakdown.steps);
  } else {
    // Non-packaged goods logic
    if (purchasedUnit && selectedMaterial?.baseUnit) {
      const conversionFactor = getConversionFactor(purchasedUnit, selectedMaterial.baseUnit, selectedMaterial.unitType, selectedMaterial);
      console.log("🔍 Cost Calculation Debug:", {
        purchasedUnit,
        baseUnit: selectedMaterial.baseUnit, 
        unitType: selectedMaterial.unitType,
        conversionFactor,
        numCostPerUnit,
        calculation: `${numCostPerUnit} / ${conversionFactor} = ${numCostPerUnit / conversionFactor}`
      });
      if (conversionFactor > 0) {
        costPerBaseUnit = numCostPerUnit / conversionFactor;
      }
    }
  }

  // Calculate total cost: quantity × cost per purchased unit (for non-package items)
  // For package items, this was already calculated above in the packagedGood logic
  if (selectedMaterial.unitType !== "package") {
    calculatedTotalCost = numQuantity * numCostPerUnit;
    console.log("💰 Total Cost Calculation:", `${numQuantity} ${purchasedUnit} × $${numCostPerUnit}/${purchasedUnit} = $${calculatedTotalCost}`);
  } else {
    console.log("💰 Package Total Cost (already calculated):", `$${calculatedTotalCost}`);
  }

  // Debugging: Log calculated values
  console.log("Calculated Values:", { costPerBaseUnit, calculatedTotalCost });

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
          <p className="text-xl font-bold text-gray-800">${numCostPerUnit.toFixed(4)}</p>
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
          <p className="text-xl font-bold text-gray-800">${(numQuantity * numCostPerUnit).toFixed(2)}</p>
        </div>

        {costPerBaseUnit > 0 && purchasedUnit !== selectedMaterial?.baseUnit && selectedMaterial?.baseUnit && (
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Cost per {selectedMaterial.baseUnit}</span>
            </div>
            <p className="text-xl font-bold text-gray-800">${costPerBaseUnit.toFixed(4)}</p>
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
              Current material cost: ${(existingCostPerBaseUnit || 0).toFixed(4)} per {selectedMaterial?.baseUnit || "unit"}
            </p>
            <p>
              New entry cost: ${(costPerBaseUnit || 0).toFixed(4)} per {selectedMaterial?.baseUnit || "unit"}
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
