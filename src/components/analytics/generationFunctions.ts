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
  return stockEntries
    .filter(entry => !entry.wasteReason)
    .map(entry => {
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
      section: "All Sections",
      totalsales: salesList.length,
      itemssold: totalItems,
      revenue: totalRevenue,
      topitem: "Various",
      performance: totalRevenue > 1000 ? "Excellent" : totalRevenue > 500 ? "Good" : "Average"
    };
  });
}

export async function generateCostAnalysisReport(materials: Material[], stockEntries: StockEntry[]) {
  return reportGenerator.generateCostAnalysis(materials, stockEntries).map(analysis => ({
    material: analysis.materialName,
    currentcost: analysis.currentAverageCost,
    previouscost: analysis.previousAverageCost,
    trend: analysis.costTrend,
    "variance%": analysis.costVariance,
    entries: analysis.stockEntriesCount,
    recommendation: analysis.recommendation
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
      menuitem: item.name,
      category: item.category,
      price: item.price,
      cost: totalCost,
      profit: profit,
      profitmargin: profitMargin,
      salescount: Math.floor(Math.random() * 50),
      totalprofit: profit * Math.floor(Math.random() * 50)
    };
  });
}

export async function generateSectionPerformanceReport(sections: Section[], assignments: SectionAssignment[], sales: SaleRecord[]) {
  return sections.map(section => {
    const sectionAssignments = assignments.filter(a => a.sectionId === section.id);
    const totalValue = sectionAssignments.length * 100;

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
      const totalCost = record.totalCost !== 0 ? record.totalCost : Math.abs(record.quantity) * (record.costPerBaseUnit || 0);
      console.log("Calculated totalCost:", totalCost);

      const existing = acc.find(item => item.material === record.materialName);
      if (existing) {
        console.log("Found existing entry for material:", record.materialName);
        existing.wastequantity += record.quantity;
        existing.totalcost += totalCost;
        existing.reason.add(reason);
        existing.entriesaffected += 1;
        if (record.wasteDate && (!existing.wastedate || new Date(record.wasteDate) > new Date(existing.wastedate))) {
          existing.wastedate = record.wasteDate;
        }
      } else {
        console.log("Creating new entry for material:", record.materialName);
        acc.push({
          material: record.materialName,
          category: record.category || "unknown",
          wastequantity: record.quantity,
          unit: record.unit,
          reason: new Set([reason]),
          totalcost: totalCost,
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
      totalcost: number;
      wastedate: Date | string | null;
      entriesaffected: number;
    }>
  );

  console.log("Aggregated waste data:", wasteByMaterial);

  // Format the aggregated data for the report
  const formattedReport = wasteByMaterial
    .map(item => ({
      Material: item.material,
      Category: item.category,
      "Waste Quantity": Math.abs(item.wastequantity),
      Unit: item.unit,
      Reason: Array.from(item.reason).join(", "),
      "Total Cost": `$${Number(item.totalcost).toFixed(2)}`,
      "Waste Date": item.wastedate ? format(new Date(item.wastedate), "MMM d, yyyy") : null,
      "Entries Affected": item.entriesaffected
    }))
    .filter(waste => waste["Entries Affected"] > 0);

  console.log("Final formatted report:", formattedReport);
  console.log("Final report data:", formattedReport);
  console.log("Expected headers:", getTableHeaders("waste-report"));
  console.log("First row keys:", formattedReport.length > 0 ? Object.keys(formattedReport[0]) : []);
  return formattedReport;
}

// export async function generateWasteReport(dateFrom?: string, dateTo?: string) {
//   // Parse and validate dates
//   const parseDate = (dateStr?: string): string | null => {
//     if (!dateStr) return null;
//     const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
//     if (!isValid(parsed)) {
//       const fallback = parse(dateStr, "MM/dd/yyyy", new Date());
//       return isValid(fallback) ? format(fallback, "yyyy-MM-dd") : null;
//     }
//     return format(parsed, "yyyy-MM-dd");
//   };

//   const formattedDateFrom = parseDate(dateFrom);
//   const formattedDateTo = parseDate(dateTo);

//   // Call the wastage API with date range
//   let response;
//   try {
//     response = await stockAPI.getWastageReport({
//       startDate: formattedDateFrom,
//       endDate: formattedDateTo || format(new Date(), "yyyy-MM-dd")
//     });
//   } catch (error) {
//     console.error("Error fetching wastage report:", error);
//     return [];
//   }

//   // Check if response.data is an array
//   if (!Array.isArray(response.data)) {
//     console.warn("Wastage report data is not an array:", response.data);
//     return [];
//   }

//   // Aggregate waste by material
//   const wasteByMaterial = response.data.reduce(
//     (acc, record: WasteRecord) => {
//       // Skip invalid records
//       if (!record.materialName || record.quantity === undefined || record.quantity === null || isNaN(record.quantity)) {
//         console.warn("Skipping invalid waste record:", record);
//         return acc;
//       }

//       // Extract reason from supplier if wasteReason is not available
//       const reason = record.reason || "Unknown";

//       // Calculate total cost for waste
//       const totalCost = record.totalCost !== 0 ? record.totalCost : Math.abs(record.quantity) * record.costPerBaseUnit;

//       const existing = acc.find(item => item.material === record.materialName);
//       if (existing) {
//         existing.wastequantity += record.quantity;
//         existing.totalcost += totalCost;
//         existing.reason.add(reason);
//         existing.entriesaffected += 1;
//         if (record.wasteDate && (!existing.wastedate || new Date(record.wasteDate) > new Date(existing.wastedate))) {
//           existing.wastedate = record.wasteDate;
//         }
//       } else {
//         acc.push({
//           material: record.materialName,
//           category: record.materialUnitType || "unknown",
//           wastequantity: record.quantity,
//           unit: record.unit,
//           reason: new Set([reason]),
//           totalcost: totalCost,
//           wastedate: record.wasteDate,
//           entriesaffected: 1
//         });
//       }
//       return acc;
//     },
//     [] as Array<{
//       material: string;
//       category: string;
//       wastequantity: number;
//       unit: string;
//       reason: Set<string>;
//       totalcost: number;
//       wastedate: Date | string | null;
//       entriesaffected: number;
//     }>
//   );

//   // Format the aggregated data for the report
//   return wasteByMaterial
//     .map(item => ({
//       Material: item.material,
//       Category: item.category,
//       WasteQuantity: Math.abs(item.wastequantity),
//       Unit: item.unit,
//       Reason: Array.from(item.reason).join(", "),
//       TotalCost: `$${Number(item.totalcost).toFixed(2)}`,
//       WasteDate: item.wastedate ? format(new Date(item.wastedate), "MMM d, yyyy") : null,
//       EntriesAffected: item.entriesaffected
//     }))
//     .filter(waste => waste.EntriesAffected > 0);
// }
