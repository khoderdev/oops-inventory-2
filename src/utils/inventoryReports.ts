import { Material, StockEntry, MaterialWithStock, MenuItem, SectionAssignment } from "@/types/inventory";
import { formatCurrency, formatNumber } from "./conversionLogic";
import { calculateMaterialInventory, findLowStockMaterials } from "./inventoryCalculations";

export interface InventoryReport {
  generatedAt: Date;
  totalInventoryValue: number;
  totalMaterials: number;
  totalStockEntries: number;
  lowStockCount: number;
  categoryBreakdown: CategoryBreakdown[];
  topMaterialsByValue: MaterialValueReport[];
  supplierAnalysis: SupplierReport[];
  expiryAlerts: ExpiryAlert[];
}

export interface CategoryBreakdown {
  category: string;
  materialCount: number;
  totalValue: number;
  averageValue: number;
  percentage: number;
}

export interface MaterialValueReport {
  materialId: string;
  materialName: string;
  category: string;
  totalValue: number;
  availableQuantity: number;
  baseUnit: string;
  stockEntries: number;
}

export interface SupplierReport {
  supplier: string;
  totalPurchases: number;
  totalValue: number;
  materialCount: number;
  averageOrderValue: number;
  lastPurchaseDate: Date;
}

export interface ExpiryAlert {
  stockEntryId: string;
  materialName: string;
  supplier: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  quantity: number;
  unit: string;
  value: number;
  urgency: "critical" | "warning" | "info";
}

export interface CostAnalysis {
  materialId: string;
  materialName: string;
  baseUnit: string;
  currentAverageCost: number;
  historicalCosts: HistoricalCost[];
  costTrend: "increasing" | "decreasing" | "stable";
  costVariance: number;
  recommendedReorderPoint: number;
}

export interface HistoricalCost {
  date: Date;
  costPerBaseUnit: number;
  supplier: string;
  quantity: number;
}

export class InventoryReportGenerator {
  
  // Generate comprehensive inventory report
  generateInventoryReport(
    materials: Material[],
    stockEntries: StockEntry[],
    menuItems: MenuItem[] = [],
    sectionAssignments: SectionAssignment[] = []
  ): InventoryReport {
    const materialsWithStock = materials.map(material => {
      const materialStockEntries = stockEntries.filter(entry => entry.materialId === material.id);
      return calculateMaterialInventory(material, materialStockEntries);
    });

    const totalInventoryValue = materialsWithStock.reduce((sum, material) => sum + material.totalValue, 0);
    const lowStockMaterials = findLowStockMaterials(materialsWithStock, 10);

    return {
      generatedAt: new Date(),
      totalInventoryValue,
      totalMaterials: materials.length,
      totalStockEntries: stockEntries.length,
      lowStockCount: lowStockMaterials.length,
      categoryBreakdown: this.generateCategoryBreakdown(materialsWithStock, totalInventoryValue),
      topMaterialsByValue: this.generateTopMaterialsByValue(materialsWithStock),
      supplierAnalysis: this.generateSupplierAnalysis(stockEntries, materials),
      expiryAlerts: this.generateExpiryAlerts(stockEntries, materials)
    };
  }

  // Generate category breakdown analysis
  private generateCategoryBreakdown(materialsWithStock: MaterialWithStock[], totalValue: number): CategoryBreakdown[] {
    const categoryMap = new Map<string, { materials: MaterialWithStock[], totalValue: number }>();

    materialsWithStock.forEach(material => {
      const existing = categoryMap.get(material.category) || { materials: [], totalValue: 0 };
      existing.materials.push(material);
      existing.totalValue += material.totalValue;
      categoryMap.set(material.category, existing);
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      materialCount: data.materials.length,
      totalValue: data.totalValue,
      averageValue: data.totalValue / data.materials.length,
      percentage: (data.totalValue / totalValue) * 100
    })).sort((a, b) => b.totalValue - a.totalValue);
  }

  // Generate top materials by value
  private generateTopMaterialsByValue(materialsWithStock: MaterialWithStock[]): MaterialValueReport[] {
    return materialsWithStock
      .map(material => ({
        materialId: material.id,
        materialName: material.name,
        category: material.category,
        totalValue: material.totalValue,
        availableQuantity: material.totalQuantityInBaseUnit,
        baseUnit: material.baseUnit,
        stockEntries: material.stockEntries.length
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 20);
  }

  // Generate supplier analysis
  private generateSupplierAnalysis(stockEntries: StockEntry[], materials: Material[]): SupplierReport[] {
    const supplierMap = new Map<string, {
      entries: StockEntry[],
      totalValue: number,
      materialIds: Set<string>
    }>();

    stockEntries.forEach(entry => {
      const existing = supplierMap.get(entry.supplier) || {
        entries: [],
        totalValue: 0,
        materialIds: new Set()
      };
      existing.entries.push(entry);
      existing.totalValue += entry.totalCost;
      existing.materialIds.add(entry.materialId);
      supplierMap.set(entry.supplier, existing);
    });

    return Array.from(supplierMap.entries()).map(([supplier, data]) => ({
      supplier,
      totalPurchases: data.entries.length,
      totalValue: data.totalValue,
      materialCount: data.materialIds.size,
      averageOrderValue: data.totalValue / data.entries.length,
      lastPurchaseDate: new Date(Math.max(...data.entries.map(e => e.purchaseDate.getTime())))
    })).sort((a, b) => b.totalValue - a.totalValue);
  }

  // Generate expiry alerts
  private generateExpiryAlerts(stockEntries: StockEntry[], materials: Material[]): ExpiryAlert[] {
    const today = new Date();
    const alerts: ExpiryAlert[] = [];

    stockEntries.forEach(entry => {
      if (entry.expiryDate) {
        const daysUntilExpiry = Math.ceil((entry.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const material = materials.find(m => m.id === entry.materialId);
        
        if (daysUntilExpiry <= 30) { // Alert for items expiring within 30 days
          let urgency: "critical" | "warning" | "info" = "info";
          if (daysUntilExpiry <= 3) urgency = "critical";
          else if (daysUntilExpiry <= 7) urgency = "warning";

          alerts.push({
            stockEntryId: entry.id,
            materialName: material?.name || "Unknown",
            supplier: entry.supplier,
            expiryDate: entry.expiryDate,
            daysUntilExpiry,
            quantity: entry.purchasedQuantity,
            unit: entry.purchasedUnit,
            value: entry.totalCost,
            urgency
          });
        }
      }
    });

    return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }

  // Generate cost analysis for materials
  generateCostAnalysis(materials: Material[], stockEntries: StockEntry[]): CostAnalysis[] {
    return materials.map(material => {
      const materialEntries = stockEntries
        .filter(entry => entry.materialId === material.id)
        .sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime());

      const historicalCosts: HistoricalCost[] = materialEntries.map(entry => ({
        date: entry.purchaseDate,
        costPerBaseUnit: entry.costPerPurchasedUnit, // Simplified - should convert to base unit
        supplier: entry.supplier,
        quantity: entry.purchasedQuantity
      }));

      const currentAverageCost = materialEntries.length > 0 
        ? materialEntries.reduce((sum, entry) => sum + entry.costPerPurchasedUnit, 0) / materialEntries.length
        : 0;

      // Simple trend analysis
      let costTrend: "increasing" | "decreasing" | "stable" = "stable";
      if (historicalCosts.length >= 2) {
        const recent = historicalCosts.slice(-3).map(h => h.costPerBaseUnit);
        const older = historicalCosts.slice(0, -3).map(h => h.costPerBaseUnit);
        
        if (recent.length > 0 && older.length > 0) {
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
          
          if (recentAvg > olderAvg * 1.05) costTrend = "increasing";
          else if (recentAvg < olderAvg * 0.95) costTrend = "decreasing";
        }
      }

      const costVariance = historicalCosts.length > 1 
        ? this.calculateVariance(historicalCosts.map(h => h.costPerBaseUnit))
        : 0;

      return {
        materialId: material.id,
        materialName: material.name,
        baseUnit: material.baseUnit,
        currentAverageCost,
        historicalCosts,
        costTrend,
        costVariance,
        recommendedReorderPoint: this.calculateReorderPoint(materialEntries)
      };
    });
  }

  // Calculate variance for cost analysis
  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  // Calculate recommended reorder point
  private calculateReorderPoint(stockEntries: StockEntry[]): number {
    if (stockEntries.length === 0) return 0;
    
    // Simple calculation based on average consumption
    const totalQuantity = stockEntries.reduce((sum, entry) => sum + entry.purchasedQuantity, 0);
    const averageOrderSize = totalQuantity / stockEntries.length;
    
    // Recommend reordering when stock falls below 2x average order size
    return averageOrderSize * 2;
  }

  // Export report to formatted string
  exportReportToString(report: InventoryReport): string {
    let output = `INVENTORY REPORT - ${report.generatedAt.toLocaleDateString()}\n`;
    output += `${"=".repeat(50)}\n\n`;
    
    output += `SUMMARY:\n`;
    output += `Total Inventory Value: ${formatCurrency(report.totalInventoryValue)}\n`;
    output += `Total Materials: ${report.totalMaterials}\n`;
    output += `Total Stock Entries: ${report.totalStockEntries}\n`;
    output += `Low Stock Items: ${report.lowStockCount}\n\n`;
    
    output += `CATEGORY BREAKDOWN:\n`;
    report.categoryBreakdown.forEach(category => {
      output += `${category.category}: ${formatCurrency(category.totalValue)} (${category.percentage.toFixed(1)}%)\n`;
    });
    output += `\n`;
    
    output += `TOP MATERIALS BY VALUE:\n`;
    report.topMaterialsByValue.slice(0, 10).forEach((material, index) => {
      output += `${index + 1}. ${material.materialName}: ${formatCurrency(material.totalValue)}\n`;
    });
    output += `\n`;
    
    output += `SUPPLIER ANALYSIS:\n`;
    report.supplierAnalysis.forEach(supplier => {
      output += `${supplier.supplier}: ${formatCurrency(supplier.totalValue)} (${supplier.totalPurchases} orders)\n`;
    });
    output += `\n`;
    
    if (report.expiryAlerts.length > 0) {
      output += `EXPIRY ALERTS:\n`;
      report.expiryAlerts.forEach(alert => {
        output += `${alert.materialName} (${alert.supplier}): expires in ${alert.daysUntilExpiry} days\n`;
      });
    }
    
    return output;
  }
}

// Export singleton instance
export const reportGenerator = new InventoryReportGenerator();
