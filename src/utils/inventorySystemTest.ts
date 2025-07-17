import { Material, StockEntry, MenuItem } from "@/types/inventory";
import { unitConverter } from "./enhancedConversions";
import { calculateMaterialInventory } from "./inventoryCalculations";
import { reportGenerator } from "./inventoryReports";

// Test data
const testMaterials: Material[] = [
  {
    id: "1",
    name: "Pickles",
    category: "condiments",
    unitType: "mass",
    baseUnit: "g",
    costPerBaseUnit: 0.008,
    description: "Dill pickles for burgers",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: "2", 
    name: "Beef Patties",
    category: "proteins",
    unitType: "piece",
    baseUnit: "piece",
    costPerBaseUnit: 1.0,
    description: "Quarter pound beef patties",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  }
];

const testStockEntries: StockEntry[] = [
  {
    id: "1",
    materialId: "1",
    supplier: "Pickle Co",
    purchasedQuantity: 2,
    purchasedUnit: "case",
    costPerPurchasedUnit: 48.0,
    totalCost: 96.0,
    purchaseDate: new Date("2024-01-15"),
    expiryDate: new Date("2024-06-15"),
    batchNumber: "PC001",
    notes: "12 jars per case, 500g each",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15")
  },
  {
    id: "2",
    materialId: "2",
    supplier: "Meat Supply Inc",
    purchasedQuantity: 5,
    purchasedUnit: "box",
    costPerPurchasedUnit: 32.0,
    totalCost: 160.0,
    purchaseDate: new Date("2024-01-20"),
    expiryDate: new Date("2024-02-20"),
    batchNumber: "MS002",
    notes: "4 packs per box, 8 patties each",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20")
  }
];

export class InventorySystemTest {
  
  // Test unit conversions
  static testUnitConversions() {
    console.log("=== TESTING UNIT CONVERSIONS ===");
    
    // Initialize packaging for pickles
    unitConverter.addPackagingConfiguration("1", {
      materialId: "1",
      materialName: "Pickles",
      baseUnit: "g",
      packageHierarchy: [
        { unit: "case", containsQuantity: 12, containsUnit: "jar" },
        { unit: "jar", containsQuantity: 500, containsUnit: "g" }
      ]
    });

    // Initialize packaging for beef patties
    unitConverter.addPackagingConfiguration("2", {
      materialId: "2", 
      materialName: "Beef Patties",
      baseUnit: "piece",
      packageHierarchy: [
        { unit: "box", containsQuantity: 4, containsUnit: "pack" },
        { unit: "pack", containsQuantity: 8, containsUnit: "piece" }
      ]
    });

    // Test pickle conversions
    console.log("\n--- Pickle Conversions ---");
    const pickleResult1 = unitConverter.convertUnits("1", 1, "case", "g");
    console.log("1 case → grams:", pickleResult1);
    
    const pickleResult2 = unitConverter.convertUnits("1", 2, "jar", "g");
    console.log("2 jars → grams:", pickleResult2);

    // Test beef patty conversions
    console.log("\n--- Beef Patty Conversions ---");
    const beefResult1 = unitConverter.convertUnits("2", 1, "box", "piece");
    console.log("1 box → pieces:", beefResult1);
    
    const beefResult2 = unitConverter.convertUnits("2", 3, "pack", "piece");
    console.log("3 packs → pieces:", beefResult2);

    return { pickleResult1, pickleResult2, beefResult1, beefResult2 };
  }

  // Test cost calculations
  static testCostCalculations() {
    console.log("\n=== TESTING COST CALCULATIONS ===");
    
    // Setup packaging
    unitConverter.addPackagingConfiguration("1", {
      materialId: "1",
      materialName: "Pickles",
      baseUnit: "g",
      packageHierarchy: [
        { unit: "case", containsQuantity: 12, containsUnit: "jar" },
        { unit: "jar", containsQuantity: 500, containsUnit: "g" }
      ]
    });

    unitConverter.addPackagingConfiguration("2", {
      materialId: "2",
      materialName: "Beef Patties", 
      baseUnit: "piece",
      packageHierarchy: [
        { unit: "box", containsQuantity: 4, containsUnit: "pack" },
        { unit: "pack", containsQuantity: 8, containsUnit: "piece" }
      ]
    });

    // Test cost calculation for pickles
    console.log("\n--- Pickle Cost Calculation ---");
    const pickleCost = unitConverter.calculateCostForQuantity("1", testStockEntries, 100, "g");
    console.log("Cost for 100g pickles:", pickleCost);

    // Test cost calculation for beef patties
    console.log("\n--- Beef Patty Cost Calculation ---");
    const beefCost = unitConverter.calculateCostForQuantity("2", testStockEntries, 5, "piece");
    console.log("Cost for 5 beef patties:", beefCost);

    return { pickleCost, beefCost };
  }

  // Test inventory calculations
  static testInventoryCalculations() {
    console.log("\n=== TESTING INVENTORY CALCULATIONS ===");
    
    // Setup packaging
    unitConverter.addPackagingConfiguration("1", {
      materialId: "1",
      materialName: "Pickles",
      baseUnit: "g",
      packageHierarchy: [
        { unit: "case", containsQuantity: 12, containsUnit: "jar" },
        { unit: "jar", containsQuantity: 500, containsUnit: "g" }
      ]
    });

    unitConverter.addPackagingConfiguration("2", {
      materialId: "2",
      materialName: "Beef Patties",
      baseUnit: "piece", 
      packageHierarchy: [
        { unit: "box", containsQuantity: 4, containsUnit: "pack" },
        { unit: "pack", containsQuantity: 8, containsUnit: "piece" }
      ]
    });

    // Calculate inventory for each material
    const pickleInventory = calculateMaterialInventory(
      testMaterials[0], 
      testStockEntries.filter(e => e.materialId === "1")
    );
    
    const beefInventory = calculateMaterialInventory(
      testMaterials[1],
      testStockEntries.filter(e => e.materialId === "2")
    );

    console.log("\n--- Pickle Inventory ---");
    console.log("Total quantity:", pickleInventory.totalQuantityInBaseUnit, "g");
    console.log("Total value:", pickleInventory.totalValue);
    console.log("Average cost per base unit:", pickleInventory.averageCostPerBaseUnit);

    console.log("\n--- Beef Inventory ---");
    console.log("Total quantity:", beefInventory.totalQuantityInBaseUnit, "pieces");
    console.log("Total value:", beefInventory.totalValue);
    console.log("Average cost per base unit:", beefInventory.averageCostPerBaseUnit);

    return { pickleInventory, beefInventory };
  }

  // Test report generation
  static testReportGeneration() {
    console.log("\n=== TESTING REPORT GENERATION ===");
    
    // Setup packaging
    unitConverter.addPackagingConfiguration("1", {
      materialId: "1",
      materialName: "Pickles",
      baseUnit: "g",
      packageHierarchy: [
        { unit: "case", containsQuantity: 12, containsUnit: "jar" },
        { unit: "jar", containsQuantity: 500, containsUnit: "g" }
      ]
    });

    unitConverter.addPackagingConfiguration("2", {
      materialId: "2",
      materialName: "Beef Patties",
      baseUnit: "piece",
      packageHierarchy: [
        { unit: "box", containsQuantity: 4, containsUnit: "pack" },
        { unit: "pack", containsQuantity: 8, containsUnit: "piece" }
      ]
    });

    // Generate comprehensive report
    const report = reportGenerator.generateInventoryReport(
      testMaterials,
      testStockEntries
    );

    console.log("\n--- Inventory Report Summary ---");
    console.log("Total inventory value:", report.totalInventoryValue);
    console.log("Total materials:", report.totalMaterials);
    console.log("Total stock entries:", report.totalStockEntries);
    console.log("Low stock count:", report.lowStockCount);

    console.log("\n--- Category Breakdown ---");
    report.categoryBreakdown.forEach(category => {
      console.log(`${category.category}: $${category.totalValue.toFixed(2)} (${category.percentage.toFixed(1)}%)`);
    });

    console.log("\n--- Top Materials ---");
    report.topMaterialsByValue.forEach((material, index) => {
      console.log(`${index + 1}. ${material.materialName}: $${material.totalValue.toFixed(2)}`);
    });

    console.log("\n--- Supplier Analysis ---");
    report.supplierAnalysis.forEach(supplier => {
      console.log(`${supplier.supplier}: $${supplier.totalValue.toFixed(2)} (${supplier.totalPurchases} orders)`);
    });

    // Generate cost analysis
    const costAnalysis = reportGenerator.generateCostAnalysis(testMaterials, testStockEntries);
    console.log("\n--- Cost Analysis ---");
    costAnalysis.forEach(analysis => {
      console.log(`${analysis.materialName}: $${analysis.currentAverageCost.toFixed(4)}/${analysis.baseUnit} (${analysis.costTrend})`);
    });

    return { report, costAnalysis };
  }

  // Run all tests
  static runAllTests() {
    console.log("🧪 STARTING COMPREHENSIVE INVENTORY SYSTEM TEST");
    console.log("=" .repeat(60));

    try {
      const conversionResults = this.testUnitConversions();
      const costResults = this.testCostCalculations();
      const inventoryResults = this.testInventoryCalculations();
      const reportResults = this.testReportGeneration();

      console.log("\n" + "=".repeat(60));
      console.log("✅ ALL TESTS COMPLETED SUCCESSFULLY!");
      console.log("=" .repeat(60));

      return {
        conversions: conversionResults,
        costs: costResults,
        inventory: inventoryResults,
        reports: reportResults
      };

    } catch (error) {
      console.error("\n❌ TEST FAILED:", error);
      throw error;
    }
  }

  // Validate system integrity
  static validateSystemIntegrity() {
    console.log("\n🔍 VALIDATING SYSTEM INTEGRITY");
    
    const results = this.runAllTests();
    
    // Validation checks
    const validations = [
      {
        name: "Pickle case conversion",
        test: () => results.conversions.pickleResult1.success && results.conversions.pickleResult1.result === 6000,
        expected: "1 case = 6000g (12 jars × 500g each)"
      },
      {
        name: "Beef box conversion", 
        test: () => results.conversions.beefResult1.success && results.conversions.beefResult1.result === 32,
        expected: "1 box = 32 pieces (4 packs × 8 pieces each)"
      },
      {
        name: "Pickle cost calculation",
        test: () => results.costs.pickleCost.success && results.costs.pickleCost.totalCost > 0,
        expected: "Cost calculation should succeed with positive value"
      },
      {
        name: "Beef cost calculation",
        test: () => results.costs.beefCost.success && results.costs.beefCost.totalCost > 0,
        expected: "Cost calculation should succeed with positive value"
      },
      {
        name: "Inventory value calculation",
        test: () => results.inventory.pickleInventory.totalValue > 0 && results.inventory.beefInventory.totalValue > 0,
        expected: "Both materials should have positive inventory values"
      },
      {
        name: "Report generation",
        test: () => results.reports.report.totalInventoryValue > 0 && results.reports.report.totalMaterials === 2,
        expected: "Report should show positive total value and 2 materials"
      }
    ];

    console.log("\n--- Validation Results ---");
    let allPassed = true;
    
    validations.forEach(validation => {
      const passed = validation.test();
      console.log(`${passed ? '✅' : '❌'} ${validation.name}: ${validation.expected}`);
      if (!passed) allPassed = false;
    });

    if (allPassed) {
      console.log("\n🎉 SYSTEM INTEGRITY VALIDATED - ALL CHECKS PASSED!");
    } else {
      console.log("\n⚠️  SYSTEM INTEGRITY ISSUES DETECTED");
    }

    return allPassed;
  }
}

// Export for use in other modules
export const inventorySystemTest = InventorySystemTest;
