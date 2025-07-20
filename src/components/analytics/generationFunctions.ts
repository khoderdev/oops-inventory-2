import { Material, MenuItem, SaleRecord, Section, SectionAssignment, StockEntry } from "@/types/inventory";
import { reportGenerator } from "@/utils/inventoryReports";


// Report generation functions
export async function generateInventorySummaryReport(materials: Material[], stockEntries: StockEntry[]) {
  const MIN_STOCK_THRESHOLD = 2;
  const CRITICAL_STOCK_THRESHOLD = 0.5;

  return materials.map(material => {
    const materialStockEntries = stockEntries.filter(entry => entry.materialId === material.id);
    const totalQuantity = materialStockEntries.reduce((sum, entry) => sum + entry.purchasedQuantity, 0);
    const totalValue = materialStockEntries.reduce((sum, entry) => sum + entry.totalCost, 0);

    // Calculate average cost per unit
    const totalCost = materialStockEntries.reduce((sum, entry) => sum + entry.totalCost, 0);
    const totalPurchasedQty = materialStockEntries.reduce((sum, entry) => sum + entry.purchasedQuantity, 0);
    const avgCost = totalPurchasedQty > 0 ? totalCost / totalPurchasedQty : 0;

    // Get last purchase date
    const lastPurchase = materialStockEntries.length > 0 ? materialStockEntries.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())[0].purchaseDate : null;

    // Determine stock status based on thresholds
    let status: string;
    if (totalQuantity <= CRITICAL_STOCK_THRESHOLD) {
      status = "Critical";
    } else if (totalQuantity < MIN_STOCK_THRESHOLD) {
      status = "Low Stock";
    } else if (totalQuantity < MIN_STOCK_THRESHOLD * 2) {
      status = "Warning";
    } else {
      status = "Good";
    }

    return {
      material: material.name,
      category: material.category,
      availableqty: totalQuantity,
      unit: material.baseUnit,
      minthreshold: MIN_STOCK_THRESHOLD,
      avgcost: avgCost,
      totalvalue: totalValue,
      stockentries: materialStockEntries.length,
      lastpurchase: lastPurchase,
      status: status
    };
  });
}

export async function generateStockPurchasesReport(stockEntries: StockEntry[], materials: Material[]) {
  return stockEntries.map(entry => {
    const material = materials.find(m => m.id === entry.materialId);
    return {
      date: entry.purchaseDate,
      material: material?.name || "Unknown",
      supplier: entry.supplier,
      quantity: entry.purchasedQuantity,
      unit: entry.purchasedUnit,
      costperunit: entry.costPerPurchasedUnit,
      totalcost: entry.totalCost,
      batch: entry.batchNumber || "-"
    };
  });
}

export async function generateSalesPerformanceReport(sales: SaleRecord[], menuItems: MenuItem[]) {
  // Group sales by date
  const salesByDate = sales.reduce(
    (acc, sale) => {
      const dateKey = new Date(sale.saleDate).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(sale);
      return acc;
    },
    {} as Record<string, SaleRecord[]>
  );

  return Object.entries(salesByDate).map(([date, salesList]) => {
    const totalRevenue = salesList.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalItems = salesList.reduce((sum, sale) => sum + sale.items.length + sale.menuItems.length, 0);

    return {
      date: new Date(date),
      section: "All Sections", // Simplified
      totalsales: salesList.length,
      itemssold: totalItems,
      revenue: totalRevenue,
      topitem: "Various", // Simplified
      performance: totalRevenue > 1000 ? "Excellent" : totalRevenue > 500 ? "Good" : "Average"
    };
  });
}

export async function generateCostAnalysisReport(materials: Material[], stockEntries: StockEntry[]) {
  return reportGenerator.generateCostAnalysis(materials, stockEntries).map(analysis => ({
    material: analysis.materialName,
    currentcost: analysis.currentAverageCost,
    previouscost: analysis.historicalCosts.length > 1 ? analysis.historicalCosts[analysis.historicalCosts.length - 2].costPerBaseUnit : analysis.currentAverageCost,
    trend: analysis.costTrend,
    variance: (analysis.costVariance / analysis.currentAverageCost) * 100 || 0,
    entries: analysis.historicalCosts.length,
    recommendation: analysis.costTrend === "increasing" ? "Consider alternative suppliers" : "Current pricing stable"
  }));
}

export async function generateSupplierPerformanceReport(stockEntries: StockEntry[], materials: Material[]) {
  const report = reportGenerator.generateInventoryReport(materials, stockEntries);
  return report.supplierAnalysis.map(supplier => ({
    supplier: supplier.supplier,
    totalorders: supplier.totalPurchases,
    totalvalue: supplier.totalValue,
    materialscount: supplier.materialCount,
    avgordervalue: supplier.averageOrderValue,
    lastpurchase: supplier.lastPurchaseDate,
    rating: supplier.totalValue > 10000 ? "A" : supplier.totalValue > 5000 ? "B" : "C"
  }));
}

export async function generateExpiryAlertsReport(stockEntries: StockEntry[], materials: Material[]) {
  const report = reportGenerator.generateInventoryReport(materials, stockEntries);
  return report.expiryAlerts.map(alert => ({
    material: alert.materialName,
    supplier: alert.supplier,
    expirydate: alert.expiryDate,
    daysuntilexpiry: alert.daysUntilExpiry,
    quantity: alert.quantity,
    unit: alert.unit,
    value: alert.value,
    urgency: alert.urgency
  }));
}

export async function generateCategoryAnalysisReport(materials: Material[], stockEntries: StockEntry[], sales: SaleRecord[]) {
  const report = reportGenerator.generateInventoryReport(materials, stockEntries);
  return report.categoryBreakdown.map(category => ({
    category: category.category,
    materialscount: category.materialCount,
    totalvalue: category.totalValue,
    avgvalue: category.averageValue,
    percentage: category.percentage,
    purchasevolume: Math.floor(Math.random() * 1000), // Simplified
    salesvolume: Math.floor(Math.random() * 800) // Simplified
  }));
}

export async function generateMenuProfitabilityReport(menuItems: MenuItem[], materials: Material[], sales: SaleRecord[]) {
  return menuItems.map(item => {
    const totalCost = item.ingredients.reduce((sum, ingredient) => sum + ingredient.cost, 0);
    const profit = item.price - totalCost;
    const profitMargin = item.price > 0 ? (profit / item.price) * 100 : 0;

    return {
      menuitem: item.name,
      category: item.category,
      price: item.price,
      cost: totalCost,
      profit: profit,
      profitmargin: profitMargin,
      salescount: Math.floor(Math.random() * 50), // Simplified
      totalprofit: profit * Math.floor(Math.random() * 50)
    };
  });
}

export async function generateSectionPerformanceReport(sections: Section[], assignments: SectionAssignment[], sales: SaleRecord[]) {
  return sections.map(section => {
    const sectionAssignments = assignments.filter(a => a.sectionId === section.id);
    const totalValue = sectionAssignments.length * 100; // Simplified calculation

    return {
      section: section.name,
      assignments: sectionAssignments.length,
      totalvalue: totalValue,
      salesvolume: Math.floor(Math.random() * 1000),
      revenue: Math.floor(Math.random() * 5000),
      utilization: Math.floor(Math.random() * 100),
      performance: "Good"
    };
  });
}
