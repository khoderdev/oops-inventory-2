import { stockAPI } from "@/api/stock.api.ts";
import { Material, MenuItem, SaleRecord, Section, SectionAssignment, StockEntry, WasteRecord } from "@/types/inventory";
import { getTableHeaders } from "@/utils/getTableHeaders";
import { reportGenerator } from "@/utils/inventoryReports";
import { format, isValid, parse } from "date-fns";

export async function generateInventorySummaryReport(materials: Material[], stockEntries: StockEntry[]) {
  const MIN_STOCK_THRESHOLD = 2;
  const CRITICAL_STOCK_THRESHOLD = 0.5;

  return materials.map(material => {
    const materialStockEntries = stockEntries.filter(entry => entry.materialId === material.id);

    const totalQuantity = materialStockEntries.reduce((sum, entry) => {
      if (entry.purchasedIndividualQuantity !== undefined) {
        return sum + entry.purchasedIndividualQuantity;
      }
      if (material.unitType === "package" && material.packageQuantity) {
        return sum + entry.purchasedQuantity * material.packageQuantity;
      }
      return sum + entry.purchasedQuantity;
    }, 0);

    const totalValue = materialStockEntries.reduce((sum, entry) => sum + entry.totalCost, 0);
    const totalCost = materialStockEntries.reduce((sum, entry) => sum + entry.totalCost, 0);
    const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    const lastPurchase = materialStockEntries.length > 0 ? materialStockEntries.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())[0].purchaseDate : null;

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
      Material: material.name,
      Category: material.category,
      "Available Qty": totalQuantity,
      Unit: material.baseUnit,
      "Avg Cost": avgCost,
      "Total Value": totalValue,
      "Stock Entries": materialStockEntries.length,
      "Last Purchase": lastPurchase,
      Status: status
    };
  });
}

export async function generateStockPurchasesReport(stockEntries: StockEntry[], materials: Material[]) {
  return stockEntries
    .filter(entry => !entry.wasteReason)
    .map(entry => {
      const material = materials.find(m => m.id === entry.materialId);
      return {
        Date: entry.purchaseDate,
        Material: material?.name || "Unknown",
        Supplier: entry.supplier,
        Quantity: entry.purchasedQuantity,
        Unit: entry.purchasedUnit,
        "Cost per Unit": entry.costPerPurchasedUnit,
        "Total Cost": entry.totalCost,
        Batch: entry.batchNumber || "-"
      };
    });
}

export async function generateSalesPerformanceReport(sales: SaleRecord[], menuItems: MenuItem[]) {
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
      Date: new Date(date),
      Section: "All Sections",
      "Total Sales": salesList.length,
      "Items Sold": totalItems,
      Revenue: totalRevenue,
      "Top Item": "Various",
      Performance: totalRevenue > 1000 ? "Excellent" : totalRevenue > 500 ? "Good" : "Average"
    };
  });
}

export async function generateCostAnalysisReport(materials: Material[], stockEntries: StockEntry[]) {
  return reportGenerator.generateCostAnalysis(materials, stockEntries).map(analysis => ({
    Material: analysis.materialName,
    "Current Cost": analysis.currentAverageCost,
    "Previous Cost": analysis.previousAverageCost,
    Trend: analysis.costTrend,
    "Variance %": analysis.costVariance,
    Entries: analysis.stockEntriesCount,
    Recommendation: analysis.recommendation
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
    purchasevolume: Math.floor(Math.random() * 1000),
    salesvolume: Math.floor(Math.random() * 800)
  }));
}

export async function generateMenuProfitabilityReport(menuItems: MenuItem[], materials: Material[], sales: SaleRecord[]) {
  return menuItems.map(item => {
    const totalCost = item.ingredients.reduce((sum, ingredient) => sum + ingredient.cost, 0);
    const profit = item.price - totalCost;
    const profitMargin = item.price > 0 ? (profit / item.price) * 100 : 0;

    return {
      "Menu Item": item.name,
      Category: item.category,
      Price: item.price,
      Cost: totalCost,
      Profit: profit,
      "Profit Margin %": profitMargin,
      "Sales Count": Math.floor(Math.random() * 50),
      "Total Profit": profit * Math.floor(Math.random() * 50)
    };
  });
}

export async function generateSectionPerformanceReport(sections: Section[], assignments: SectionAssignment[], sales: SaleRecord[]) {
  return sections.map(section => {
    const sectionAssignments = assignments.filter(a => a.sectionId === section.id);
    const totalValue = sectionAssignments.length * 100;

    return {
      Section: section.name,
      Assignments: sectionAssignments.length,
      "Total Value": totalValue,
      "Sales Volume": Math.floor(Math.random() * 1000),
      Revenue: Math.floor(Math.random() * 5000),
      "Utilization %": Math.floor(Math.random() * 100),
      Performance: "Good"
    };
  });
}

export async function generateWasteReport(dateFrom?: string, dateTo?: string) {
  console.log("Starting generateWasteReport with dates:", { dateFrom, dateTo });

  // Parse and validate dates
  const parseDate = (dateStr?: string): string | null => {
    if (!dateStr) return null;
    const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
    if (!isValid(parsed)) {
      const fallback = parse(dateStr, "MM/dd/yyyy", new Date());
      return isValid(fallback) ? format(fallback, "yyyy-MM-dd") : null;
    }
    return format(parsed, "yyyy-MM-dd");
  };

  const formattedDateFrom = parseDate(dateFrom);
  const formattedDateTo = parseDate(dateTo);
  console.log("Formatted dates:", { formattedDateFrom, formattedDateTo });

  // Call the wastage API with date range
  let response;
  try {
    console.log("Calling stockAPI.getWastageReport...");
    response = await stockAPI.getWastageReport({
      startDate: formattedDateFrom,
      endDate: formattedDateTo || format(new Date(), "yyyy-MM-dd")
    });
    console.log("API response:", response);
  } catch (error) {
    console.error("Error fetching wastage report:", error);
    return [];
  }

  // Check if response.data is an array
  if (!Array.isArray(response.data)) {
    console.warn("Wastage report data is not an array:", response.data);
    return [];
  }

  console.log("Raw waste records:", response.data);

  // Calculate total waste metrics for percentage calculations
  const totalWasteQuantity = response.data.reduce((sum, record: WasteRecord) => {
    return sum + (record.quantity || 0);
  }, 0);
  
  const totalWasteCost = response.data.reduce((sum, record: WasteRecord) => {
    const totalCost = Number(record.totalCost) || 0;
    const costPerUnit = Number(record.costPerBaseUnit) || 0;
    const quantity = Math.abs(Number(record.quantity) || 0);
    
    const cost = totalCost !== 0 ? totalCost : quantity * costPerUnit;
    return sum + Number(cost);
  }, 0);

  console.log("Total waste metrics:", { totalWasteQuantity, totalWasteCost });

  // Aggregate waste by material
  const wasteByMaterial = response.data.reduce(
    (acc, record: WasteRecord) => {
      console.log("Processing record:", record);

      // Skip invalid records
      if (!record.materialName || record.quantity === undefined || record.quantity === null || isNaN(record.quantity)) {
        console.warn("Skipping invalid waste record:", record);
        return acc;
      }

      // Extract reason from supplier if wasteReason is not available
      const reason = record.reason || "Unknown";
      console.log("Determined reason:", reason);

      // Calculate total cost for waste
      const recordTotalCost = Number(record.totalCost) || 0;
      const recordCostPerUnit = Number(record.costPerBaseUnit) || 0;
      const recordQuantity = Math.abs(Number(record.quantity) || 0);
      
      const totalCost = recordTotalCost !== 0 ? recordTotalCost : recordQuantity * recordCostPerUnit;
      console.log("Calculated totalCost:", totalCost);

      const existing = acc.find(item => item.material === record.materialName);
      if (existing) {
        console.log("Found existing entry for material:", record.materialName);
        existing.wastequantity += Number(record.quantity) || 0;
        existing.totalcost += Number(totalCost) || 0;
        existing.reason.add(reason);
        existing.entriesaffected += 1;
        existing.costperunit = Math.abs(existing.wastequantity) > 0 ? existing.totalcost / Math.abs(existing.wastequantity) : 0;
        if (record.wasteDate && (!existing.wastedate || new Date(record.wasteDate) > new Date(existing.wastedate))) {
          existing.wastedate = record.wasteDate;
        }
      } else {
        console.log("Creating new entry for material:", record.materialName);
        acc.push({
          material: record.materialName,
          category: record.category || "unknown",
          wastequantity: Number(record.quantity) || 0,
          unit: record.unit,
          reason: new Set([reason]),
          costperunit: Number(record.costPerBaseUnit) || 0,
          totalcost: Number(totalCost) || 0,
          wastedate: record.wasteDate,
          entriesaffected: 1
        });
      }
      return acc;
    },
    [] as Array<{
      material: string;
      category: string;
      wastequantity: number;
      unit: string;
      reason: Set<string>;
      costperunit: number;
      totalcost: number;
      wastedate: Date | string | null;
      entriesaffected: number;
    }>
  );

  console.log("Aggregated waste data:", wasteByMaterial);

  // Format the final data for the report
  const formattedData = wasteByMaterial.map(item => {
    // Calculate percentage of total waste
    const percentageOfTotal = totalWasteQuantity > 0 ? (item.wastequantity / totalWasteQuantity) * 100 : 0;
    
    return {
      material: item.material,
      category: item.category,
      wastequantity: item.wastequantity,
      unit: item.unit,
      reason: Array.from(item.reason).join(", "),
      costperunit: item.costperunit,
      totalcost: item.totalcost,
      percentageoftotal: percentageOfTotal,
      wastedate: item.wastedate ? format(new Date(item.wastedate), "yyyy-MM-dd") : "N/A",
      entriesaffected: item.entriesaffected
    };
  });

  // Sort by total cost descending for better insights
  const sortedData = formattedData.sort((a, b) => b.totalcost - a.totalcost);

  // Format the aggregated data for the final report display
  const formattedReport = sortedData
    .map(item => {
      // Ensure proper number formatting
      const costPerUnit = Number(item.costperunit) || 0;
      const totalCost = Number(item.totalcost) || 0;
      const percentage = Number(item.percentageoftotal) || 0;
      
      return {
        Material: `${item.material}\n${item.category}`,
        "Waste Quantity": Math.abs(item.wastequantity),
        Unit: item.unit,
        Reason: item.reason,
        "Cost": `$${totalCost.toFixed(2)}`,
        "Waste Date": item.wastedate !== "N/A" ? format(new Date(item.wastedate), "MMM d, yyyy") : "N/A"
      };
    })
    .filter(waste => waste["Cost"] !== "$0.00");

  // Calculate summary totals for frontend performance
  const reportSummary = {
    totalMaterials: formattedReport.length,
    totalWasteQuantity: Number(totalWasteQuantity),
    totalWasteCost: Number(totalWasteCost),
    totalEntriesAffected: formattedData.reduce((sum, item) => sum + (item.entriesaffected || 0), 0),
    averageCostPerUnit: totalWasteQuantity > 0 ? totalWasteCost / totalWasteQuantity : 0,
    dateRange: {
      from: formattedDateFrom,
      to: formattedDateTo || format(new Date(), "yyyy-MM-dd")
    },
    topWasteMaterial: formattedReport.length > 0 ? formattedReport[0].Material : null,
    topWasteCost: formattedReport.length > 0 ? formattedReport[0]["Total Cost"] : "$0.00"
  };

  console.log("Final formatted report:", formattedReport);
  console.log("Report summary:", reportSummary);
  console.log("Expected headers:", getTableHeaders("waste-report"));
  console.log("First row keys:", formattedReport.length > 0 ? Object.keys(formattedReport[0]) : []);
  
  // Add summary as metadata to the report array for frontend access
  const reportWithSummary = formattedReport as typeof formattedReport & { summary: typeof reportSummary };
  reportWithSummary.summary = reportSummary;
  
  return reportWithSummary;
}
