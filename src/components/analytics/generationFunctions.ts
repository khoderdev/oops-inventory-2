import { stockAPI } from "@/api/stock.api.ts";
import { Material, MenuItem, MenuItemSale, SaleRecord, Section, SectionAssignment, SoldItem, StockEntry, WasteRecord } from "@/types/inventory";
import { getCategoryName } from "@/utils/getCategoryLabel";
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
      Category: getCategoryName(material),
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
  return stockEntries.map(entry => {
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
  const salesWithItems: any[] = [];
  const menuItemIds = new Set(menuItems.map(mi => mi.id));
  sales.forEach(sale => {
    if (sale.items.length === 0 && sale.menuItems.length === 0) {
      salesWithItems.push({
        Date: new Date(sale.saleDate),
        "Item Name": "No items recorded",
        Quantity: 1,
        "Unit Price": sale.totalAmount,
        "Total Price": sale.totalAmount,
        "Made By": sale.creator?.username || "-"
      });
      return;
    }
    sale.items.forEach(item => {
      const itemName = item.materialName || `Material ID: ${item.materialId}`;
      salesWithItems.push({
        Date: new Date(sale.saleDate),
        "Item Name": itemName,
        Quantity: item.quantity || 0,
        "Unit Price": item.unitPrice || 0,
        "Total Price": item.totalPrice || 0,
        "Made By": sale.creator?.username || "-"
      });
    });
    sale.menuItems.forEach(menuItem => {
      if (!menuItemIds.has(menuItem.menuItemId)) {
        return;
      }
      let itemName = menuItem.menuItemName;
      if (!itemName) {
        const foundMenuItem = menuItems.find(mi => mi.id === menuItem.menuItemId);
        itemName = foundMenuItem?.name || `Menu Item ID: ${menuItem.menuItemId}`;
      }
      salesWithItems.push({
        Date: new Date(sale.saleDate),
        "Item Name": itemName,
        Quantity: menuItem.quantity || 0,
        "Unit Price": menuItem.unitPrice || 0,
        "Total Price": menuItem.totalPrice || 0,
        "Made By": sale.creator?.username || "-"
      });
    });
  });
  return salesWithItems;
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

export async function generateCategoryAnalysisReport(materials: Material[], stockEntries: StockEntry[]) {
  const report = reportGenerator.generateInventoryReport(materials, stockEntries);
  return report.categoryBreakdown.map(category => ({
    Category: category.category,
    "Materials Count": category.materialCount,
    "Total Value": category.totalValue,
    "Avg Value": category.averageValue,
    Percentage: category.percentage,
    "Purchase Volume": Math.floor(Math.random() * 1000),
    "Sales Volume": Math.floor(Math.random() * 800)
  }));
}

export async function generateCategorySalesAnalysisReport(sales: SaleRecord[]) {
  console.log("Sales Analysis Debug:", {
    salesCount: sales.length,
    sampleSale: sales[0]
  });
  const categoryMap = new Map<
    string,
    {
      salesCount: number;
      totalRevenue: number;
      totalQuantity: number;
      menuItems: Set<string>;
    }
  >();

  sales.forEach(sale => {
    if (sale.menuItems && sale.menuItems.length > 0) {
      sale.menuItems.forEach(menuItemSale => {
        const itemName = menuItemSale.menuItemName || "Unknown";
        let category = "Other";
        if (itemName.toLowerCase().includes("shake") || itemName.toLowerCase().includes("drink")) {
          category = "Beverages";
        } else if (itemName.toLowerCase().includes("cake") || itemName.toLowerCase().includes("crookie") || itemName.toLowerCase().includes("sweet")) {
          category = "Desserts";
        } else if (itemName.toLowerCase().includes("pasta") || itemName.toLowerCase().includes("bread") || itemName.toLowerCase().includes("nachos")) {
          category = "Main Dishes";
        } else if (itemName.toLowerCase().includes("chicken") || itemName.toLowerCase().includes("balls") || itemName.toLowerCase().includes("sticks") || itemName.toLowerCase().includes("tenders")) {
          category = "Appetizers";
        } else if (itemName.toLowerCase().includes("arguileh") || itemName.toLowerCase().includes("shisha")) {
          category = "Shisha";
        }
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            salesCount: 0,
            totalRevenue: 0,
            totalQuantity: 0,
            menuItems: new Set()
          });
        }
        const categoryData = categoryMap.get(category)!;
        categoryData.salesCount += 1;
        categoryData.totalRevenue += menuItemSale.totalPrice || 0;
        categoryData.totalQuantity += menuItemSale.quantity || 0;
        categoryData.menuItems.add(itemName);
      });
    }
  });

  const totalRevenue = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.totalRevenue, 0);

  const result = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      Category: category,
      "Materials Count": data.menuItems.size,
      "Total Value": data.totalRevenue,
      "Avg Value": data.salesCount > 0 ? data.totalRevenue / data.salesCount : 0,
      Percentage: totalRevenue > 0 ? (data.totalRevenue / totalRevenue) * 100 : 0,
      "Purchase Volume": data.totalQuantity, // Total quantity sold
      "Sales Volume": data.salesCount // Total number of sales
    }))
    .filter(item => item["Sales Volume"] > 0); // Only show categories with sales

  console.log("Sales analysis result:", result);
  return result;
}

export async function generateMenuProfitabilityReport(menuItems: MenuItem[]) {
  return menuItems.map(item => {
    const totalCost = item.ingredients.reduce((sum, ingredient) => sum + ingredient.cost, 0);
    const profit = item.price - totalCost;
    const profitMargin = item.price > 0 ? (profit / item.price) * 100 : 0;

    return {
      "Menu Item": item.name,
      Category: getCategoryName(item.category),
      Price: item.price,
      Cost: totalCost,
      Profit: profit,
      "Profit Margin %": profitMargin,
      "Sales Count": Math.floor(Math.random() * 50),
      "Total Profit": profit * Math.floor(Math.random() * 50)
    };
  });
}

export async function generateSectionPerformanceReport(sections: Section[], assignments: SectionAssignment[]) {
  // Import the dayOperations API to get actual daily report data
  const { dayOperationsAPI } = await import("@/api/dayOperations.api.ts");

  try {
    // Get today's date for the daily report
    const today = new Date().toISOString().split("T")[0];
    const dailyReportData = await dayOperationsAPI.getDailyReport(today);
    const salesBySection = dailyReportData.report?.sales?.salesBySection || {};

    return sections.map(section => {
      const sectionAssignments = assignments.filter(a => a.sectionId === section.id);
      const assignmentCount = sectionAssignments.length;

      // Get actual sales data for this section from daily report
      const sectionSalesData = salesBySection[section.name] || { count: 0, total: 0 };
      const salesVolume = sectionSalesData.count;
      const revenue = sectionSalesData.total;

      // Calculate total value based on assignments and their estimated operational value
      const avgAssignmentValue = 250; // Estimated operational value per assignment
      const totalValue = assignmentCount * avgAssignmentValue;

      // Calculate utilization based on assignments vs optimal capacity
      const optimalCapacity = 6; // Optimal assignments per section for efficiency
      const utilization = Math.min((assignmentCount / optimalCapacity) * 100, 100);

      // Calculate average ticket if there are sales
      const avgTicket = salesVolume > 0 ? revenue / salesVolume : 0;

      // Performance rating based on actual metrics from daily operations
      let performance: string;
      if (utilization >= 75 && avgTicket >= 8 && salesVolume >= 8) {
        performance = "Excellent";
      } else if (utilization >= 50 && avgTicket >= 6 && salesVolume >= 4) {
        performance = "Good";
      } else if (utilization >= 25 && salesVolume >= 1) {
        performance = "Average";
      } else {
        performance = "Needs Improvement";
      }

      return {
        Section: section.name,
        Assignments: assignmentCount,
        "Total Value": totalValue,
        "Sales Volume": salesVolume,
        Revenue: revenue,
        "Utilization %": Math.round(utilization * 10) / 10,
        Performance: performance
      };
    });
  } catch (error) {
    console.error("Error fetching daily report data:", error);
    // Fallback to assignment-based calculations if daily report is unavailable
    return sections.map(section => {
      const sectionAssignments = assignments.filter(a => a.sectionId === section.id);
      const assignmentCount = sectionAssignments.length;

      // Fallback calculations
      const totalValue = assignmentCount * 250;
      const utilization = Math.min((assignmentCount / 6) * 100, 100);

      return {
        Section: section.name,
        Assignments: assignmentCount,
        "Total Value": totalValue,
        "Sales Volume": 0,
        Revenue: 0,
        "Utilization %": Math.round(utilization * 10) / 10,
        Performance: "No Data"
      };
    });
  }
}

export async function generateWasteReport(dateFrom?: string, dateTo?: string) {
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
  let response;
  try {
    response = await stockAPI.getWastageReport({
      startDate: formattedDateFrom,
      endDate: formattedDateTo || format(new Date(), "yyyy-MM-dd")
    });
  } catch (error) {
    console.error("Error fetching wastage report:", error);
    return [];
  }
  if (!Array.isArray(response.data)) {
    console.warn("Wastage report data is not an array:", response.data);
    return [];
  }
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

  const wasteByMaterial = response.data.reduce(
    (acc, record: WasteRecord) => {
      if (!record.materialName || record.quantity === undefined || record.quantity === null || isNaN(record.quantity)) {
        console.warn("Skipping invalid waste record:", record);
        return acc;
      }
      const reason = record.reason || "Unknown";
      const recordTotalCost = Number(record.totalCost) || 0;
      const recordCostPerUnit = Number(record.costPerBaseUnit) || 0;
      const recordQuantity = Math.abs(Number(record.quantity) || 0);
      const totalCost = recordTotalCost !== 0 ? recordTotalCost : recordQuantity * recordCostPerUnit;
      const existing = acc.find(item => item.material === record.materialName);
      if (existing) {
        existing.wastequantity += Number(record.quantity) || 0;
        existing.totalcost += Number(totalCost) || 0;
        existing.reason.add(reason);
        existing.entriesaffected += 1;
        existing.costperunit = Math.abs(existing.wastequantity) > 0 ? existing.totalcost / Math.abs(existing.wastequantity) : 0;
        if (record.wasteDate && (!existing.wastedate || new Date(record.wasteDate) > new Date(existing.wastedate))) {
          existing.wastedate = record.wasteDate;
        }
      } else {
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

  const formattedData = wasteByMaterial.map(item => {
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

  const sortedData = formattedData.sort((a, b) => b.totalcost - a.totalcost);
  const formattedReport = sortedData
    .map(item => {
      const totalCost = Number(item.totalcost) || 0;
      return {
        Material: item.material,
        "Waste Quantity": Math.abs(item.wastequantity),
        Unit: item.unit,
        Reason: item.reason,
        Cost: `$${totalCost.toFixed(2)}`,
        "Waste Date": item.wastedate !== "N/A" ? format(new Date(item.wastedate), "MMM d, yyyy") : "N/A"
      };
    })
    .filter(waste => waste["Cost"] !== "$0.00");

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
  const reportWithSummary = formattedReport as typeof formattedReport & { summary: typeof reportSummary };
  reportWithSummary.summary = reportSummary;
  return reportWithSummary;
}

export async function generateVarianceAnalysisReport(materials: Material[], stockEntries: StockEntry[], sales: SaleRecord[], dateFrom?: string, dateTo?: string) {
  const parseDate = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
    if (!isValid(parsed)) {
      const fallback = parse(dateStr, "MM/dd/yyyy", new Date());
      return isValid(fallback) ? fallback : null;
    }
    return parsed;
  };
  const fromDate = parseDate(dateFrom);
  const toDate = parseDate(dateTo) || new Date();
  toDate.setHours(23, 59, 59, 999);
  let wasteData: WasteRecord[] = [];
  try {
    const wasteResponse = await stockAPI.getWastageReport({
      startDate: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
      endDate: format(toDate, "yyyy-MM-dd")
    });
    const response = wasteResponse as { data: WasteRecord[] };
    wasteData = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching waste data:", error);
  }
  const filteredStockEntries = fromDate
    ? stockEntries.filter(entry => {
        const entryDate = new Date(entry.purchaseDate);
        return entryDate >= fromDate && entryDate <= toDate;
      })
    : stockEntries;

  const filteredSales = fromDate
    ? sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= fromDate && saleDate <= toDate;
      })
    : sales;
  const varianceAnalysis = materials.map(material => {
    const materialStockEntries = filteredStockEntries.filter(entry => entry.materialId === material.id);
    const allMaterialStockEntries = stockEntries.filter(entry => entry.materialId === material.id);
    let openingStock = 0;
    let purchases = 0;
    let actualCurrentStock = 0;
    if (fromDate) {
      const openingStockEntries = stockEntries.filter(entry => {
        const entryDate = new Date(entry.purchaseDate);
        return entry.materialId === material.id && entryDate < fromDate;
      });
      openingStock = openingStockEntries.reduce((sum, entry) => {
        if (entry.purchasedIndividualQuantity !== undefined) {
          return sum + entry.purchasedIndividualQuantity;
        }
        if (material.unitType === "package" && material.packageQuantity) {
          return sum + entry.purchasedQuantity * material.packageQuantity;
        }
        return sum + entry.purchasedQuantity;
      }, 0);
    }
    purchases = materialStockEntries.reduce((sum, entry) => {
      if (entry.purchasedIndividualQuantity !== undefined) {
        return sum + entry.purchasedIndividualQuantity;
      }
      if (material.unitType === "package" && material.packageQuantity) {
        return sum + entry.purchasedQuantity * material.packageQuantity;
      }
      return sum + entry.purchasedQuantity;
    }, 0);

    actualCurrentStock = allMaterialStockEntries.reduce((sum, entry) => {
      if (entry.purchasedIndividualQuantity !== undefined) {
        return sum + entry.purchasedIndividualQuantity;
      }
      if (material.unitType === "package" && material.packageQuantity) {
        return sum + entry.purchasedQuantity * material.packageQuantity;
      }
      return sum + entry.purchasedQuantity;
    }, 0);

    let salesImpact = 0;
    let salesValue = 0;

    filteredSales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: SoldItem) => {
          if (item.materialId === material.id) {
            salesImpact += Number(item.quantity) || 0;
            salesValue += Number(item.totalPrice) || 0;
          }
        });
      }

      // Menu items sold (check ingredients)
      if (sale.menuItems && Array.isArray(sale.menuItems)) {
        sale.menuItems.forEach((menuItem: MenuItemSale) => {
          if (menuItem.ingredients && Array.isArray(menuItem.ingredients)) {
            menuItem.ingredients.forEach((ingredient: { materialId: string; materialName?: string; quantity: number; unit: string }) => {
              if (ingredient.materialId === material.id) {
                const ingredientQuantity = Number(ingredient.quantity) || 0;
                const menuQuantity = Number(menuItem.quantity) || 1;
                salesImpact += ingredientQuantity * menuQuantity;
                // Estimate sales value based on menu item price
                salesValue += menuQuantity * (Number(menuItem.unitPrice) || 0);
              }
            });
          }
        });
      }
    });

    // Calculate waste impact
    const materialWasteRecords = wasteData.filter(waste => waste.materialName === material.name);
    const wasteImpact = materialWasteRecords.reduce((sum, waste) => {
      return sum + Math.abs(Number(waste.quantity) || 0);
    }, 0);

    const wasteCost = materialWasteRecords.reduce((sum, waste) => {
      const totalCost = Number(waste.totalCost) || 0;
      const costPerUnit = Number(waste.costPerBaseUnit) || 0;
      const quantity = Math.abs(Number(waste.quantity) || 0);
      return sum + (totalCost !== 0 ? totalCost : quantity * costPerUnit);
    }, 0);

    // Calculate expected stock
    const expectedStock = openingStock + purchases - salesImpact - wasteImpact;

    // Calculate variance
    const varianceQuantity = actualCurrentStock - expectedStock;
    const variancePercentage = expectedStock !== 0 ? (varianceQuantity / expectedStock) * 100 : 0;

    // Calculate cost variance
    const avgCostPerUnit =
      allMaterialStockEntries.length > 0
        ? allMaterialStockEntries.reduce((sum, entry) => sum + entry.totalCost, 0) /
          allMaterialStockEntries.reduce((sum, entry) => {
            if (entry.purchasedIndividualQuantity !== undefined) {
              return sum + entry.purchasedIndividualQuantity;
            }
            if (material.unitType === "package" && material.packageQuantity) {
              return sum + entry.purchasedQuantity * material.packageQuantity;
            }
            return sum + entry.purchasedQuantity;
          }, 0)
        : material.costPerUnit || 0;

    const costVariance = Math.abs(varianceQuantity) * avgCostPerUnit;

    return {
      material: material.name,
      category: material.category,
      expectedStock: Number(expectedStock.toFixed(2)),
      actualStock: Number(actualCurrentStock.toFixed(2)),
      varianceQuantity: Number(varianceQuantity.toFixed(2)),
      variancePercentage: Number(variancePercentage.toFixed(1)),
      salesImpact: Number(salesImpact.toFixed(2)),
      wasteImpact: Number(wasteImpact.toFixed(2)),
      costVariance: Number(costVariance.toFixed(2)),
      unit: material.baseUnit,
      avgCostPerUnit: Number(avgCostPerUnit.toFixed(4)),
      openingStock: Number(openingStock.toFixed(2)),
      purchases: Number(purchases.toFixed(2)),
      salesValue: Number(salesValue.toFixed(2)),
      wasteCost: Number(wasteCost.toFixed(2))
    };
  });

  // Filter out materials with no activity
  const activeVariances = varianceAnalysis.filter(variance => variance.expectedStock !== 0 || variance.actualStock !== 0 || variance.salesImpact !== 0 || variance.wasteImpact !== 0);

  // Sort by absolute variance percentage (highest variances first)
  const sortedVariances = activeVariances.sort((a, b) => Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage));

  // Format for report display
  const formattedReport = sortedVariances.map(variance => ({
    Material: `${variance.material}\n${variance.category}`,
    "Expected Stock": `${variance.expectedStock} ${variance.unit}`,
    "Actual Stock": `${variance.actualStock} ${variance.unit}`,
    "Variance Qty": `${variance.varianceQuantity >= 0 ? "+" : ""}${variance.varianceQuantity} ${variance.unit}`,
    "Variance %": `${variance.variancePercentage >= 0 ? "+" : ""}${variance.variancePercentage}%`,
    "Sales Impact": `${variance.salesImpact} ${variance.unit}`,
    "Waste Impact": `${variance.wasteImpact} ${variance.unit}`,
    "Cost Variance": `$${Math.abs(variance.costVariance).toFixed(2)}`
  }));

  // Calculate summary metrics
  const totalMaterials = formattedReport.length;
  const totalCostVariance = sortedVariances.reduce((sum, v) => sum + Math.abs(v.costVariance), 0);
  const avgVariancePercentage = totalMaterials > 0 ? sortedVariances.reduce((sum, v) => sum + Math.abs(v.variancePercentage), 0) / totalMaterials : 0;

  const reportSummary = {
    totalMaterials,
    totalCostVariance: Number(totalCostVariance.toFixed(2)),
    avgVariancePercentage: Number(avgVariancePercentage.toFixed(1)),
    dateRange: {
      from: fromDate ? format(fromDate, "yyyy-MM-dd") : null,
      to: format(toDate, "yyyy-MM-dd")
    },
    highestVariance:
      formattedReport.length > 0
        ? {
            material: sortedVariances[0].material,
            percentage: sortedVariances[0].variancePercentage
          }
        : null,
    totalSalesImpact: sortedVariances.reduce((sum, v) => sum + v.salesImpact, 0),
    totalWasteImpact: sortedVariances.reduce((sum, v) => sum + v.wasteImpact, 0),
    totalSalesValue: sortedVariances.reduce((sum, v) => sum + v.salesValue, 0),
    totalWasteCost: sortedVariances.reduce((sum, v) => sum + v.wasteCost, 0)
  };

  // Add summary as metadata
  const reportWithSummary = formattedReport as typeof formattedReport & { summary: typeof reportSummary };
  reportWithSummary.summary = reportSummary;

  return reportWithSummary;
}
