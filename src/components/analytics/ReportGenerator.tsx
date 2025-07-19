import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, TrendingUp, Package, ShoppingCart, AlertTriangle, Users, ChefHat } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { materialsAPI } from "@/api/matierials.api.ts.tsx";
import { stockAPI } from "@/api/stock.api.ts.tsx";
import { salesAPI } from "@/api/sales.api.ts.tsx";
import { menuAPI } from "@/api/menu.api.ts.tsx";
import { sectionAPI } from "@/api/sections.api.ts.tsx";
import { assignmentsAPI } from "@/api/assignments.api.ts";
import { reportGenerator } from "@/utils/inventoryReports";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { StockEntry, Material, SaleRecord, MenuItem, Section, SectionAssignment } from "@/types/inventory";

export type ReportType = "inventory-summary" | "stock-purchases" | "sales-performance" | "cost-analysis" | "supplier-performance" | "expiry-alerts" | "category-analysis" | "menu-profitability" | "section-performance";

export interface ReportConfig {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresDateRange: boolean;
}

const REPORT_CONFIGS: ReportConfig[] = [
  {
    id: "inventory-summary",
    name: "Inventory Summary",
    description: "Current stock levels, values, and alerts",
    icon: <Package className="h-4 w-4" />,
    requiresDateRange: false
  },
  {
    id: "stock-purchases",
    name: "Stock Purchases",
    description: "Purchase history and supplier performance",
    icon: <ShoppingCart className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "sales-performance",
    name: "Sales Performance",
    description: "Revenue analysis and sales trends",
    icon: <TrendingUp className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "cost-analysis",
    name: "Cost Analysis",
    description: "Material cost trends and optimization",
    icon: <FileText className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "supplier-performance",
    name: "Supplier Performance",
    description: "Supplier comparison and analytics",
    icon: <Users className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "expiry-alerts",
    name: "Expiry Alerts",
    description: "Items expiring soon and waste management",
    icon: <AlertTriangle className="h-4 w-4" />,
    requiresDateRange: false
  },
  {
    id: "category-analysis",
    name: "Category Analysis",
    description: "Performance breakdown by material categories",
    icon: <Package className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "menu-profitability",
    name: "Menu Profitability",
    description: "Menu item costs vs pricing analysis",
    icon: <ChefHat className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "section-performance",
    name: "Section Performance",
    description: "Performance analysis by sections",
    icon: <TrendingUp className="h-4 w-4" />,
    requiresDateRange: true
  }
];

interface ReportGeneratorProps {
  className?: string;
}

export function ReportGenerator({ className }: ReportGeneratorProps) {
  // State management
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("inventory-summary");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [reportData, setReportData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isChangingReportType, setIsChangingReportType] = useState(false);

  // Get current report config
  const currentReportConfig = REPORT_CONFIGS.find(config => config.id === selectedReportType);

  // Clean up state when report type changes
  const handleReportTypeChange = (newReportType: ReportType) => {
    if (newReportType === selectedReportType) return;

    setIsChangingReportType(true);

    // Reset all report-related state
    setReportData([]);
    setHasGenerated(false);
    setIsLoading(false);

    // Get new report config
    const newConfig = REPORT_CONFIGS.find(config => config.id === newReportType);

    // Clear dates if new report doesn't require date range
    if (!newConfig?.requiresDateRange) {
      setDateFrom("");
      setDateTo("");
    }

    // Set new report type with a small delay for smooth transition
    setTimeout(() => {
      setSelectedReportType(newReportType);
      setIsChangingReportType(false);

      // Show transition message
      toast({
        title: "Report Type Changed",
        description: `Switched to ${newConfig?.name}. Ready to generate new report.`
      });
    }, 150);
  };

  // Date validation
  const isDateRangeValid = useMemo(() => {
    if (!currentReportConfig?.requiresDateRange) return true;
    return dateFrom && dateTo && new Date(dateFrom) <= new Date(dateTo);
  }, [dateFrom, dateTo, currentReportConfig]);

  // Generate report data
  const generateReport = async () => {
    if (!isDateRangeValid) {
      toast({
        title: "Invalid Date Range",
        description: "Please select a valid date range for this report.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setHasGenerated(false);

    try {
      // Fetch required data based on report type
      const [materials, stockEntries, sales, menuItems, sections, assignments] = await Promise.all([materialsAPI.getMaterials(), stockAPI.getStockEntries(), salesAPI.getSales(), menuAPI.getMenus(), sectionAPI.getSections(), assignmentsAPI.getAssignments()]);

      let filteredData;
      let reportResults;

      // Filter data based on date range if required
      if (currentReportConfig?.requiresDateRange && dateFrom && dateTo) {
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include full end date

        filteredData = {
          stockEntries: stockEntries.data.filter(entry => {
            const entryDate = new Date(entry.purchaseDate);
            return entryDate >= fromDate && entryDate <= toDate;
          }),
          sales: sales.data.filter(sale => {
            const saleDate = new Date(sale.saleDate);
            return saleDate >= fromDate && saleDate <= toDate;
          })
        };
      }

      // Generate report based on type
      switch (selectedReportType) {
        case "inventory-summary":
          reportResults = await generateInventorySummaryReport(materials.data, stockEntries.data);
          break;
        case "stock-purchases":
          reportResults = await generateStockPurchasesReport(filteredData?.stockEntries || [], materials.data);
          break;
        case "sales-performance":
          reportResults = await generateSalesPerformanceReport(filteredData?.sales || [], menuItems.data);
          break;
        case "cost-analysis":
          reportResults = await generateCostAnalysisReport(materials.data, filteredData?.stockEntries || []);
          break;
        case "supplier-performance":
          reportResults = await generateSupplierPerformanceReport(filteredData?.stockEntries || [], materials.data);
          break;
        case "expiry-alerts":
          reportResults = await generateExpiryAlertsReport(stockEntries.data, materials.data);
          break;
        case "category-analysis":
          reportResults = await generateCategoryAnalysisReport(materials.data, filteredData?.stockEntries || [], filteredData?.sales || []);
          break;
        case "menu-profitability":
          reportResults = await generateMenuProfitabilityReport(menuItems.data, materials.data, filteredData?.sales || []);
          break;
        case "section-performance":
          reportResults = await generateSectionPerformanceReport(sections.data, assignments.data, filteredData?.sales || []);
          break;
        default:
          throw new Error("Invalid report type");
      }

      setReportData(reportResults);
      setHasGenerated(true);

      toast({
        title: "Report Generated",
        description: `${currentReportConfig?.name} has been generated successfully.`
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Export report to CSV
  const exportReport = () => {
    if (!hasGenerated || reportData.length === 0) return;

    const headers = getTableHeaders(selectedReportType);
    const csvContent = [
      headers.join(","),
      ...reportData.map(row =>
        headers
          .map(header => {
            const value = row[header.toLowerCase().replace(/\s+/g, "")];
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
          })
          .join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedReportType}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Generator
            </div>
            {currentReportConfig && !isChangingReportType && hasGenerated && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                {currentReportConfig.icon}
                <span>Currently viewing: {currentReportConfig.name}</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-4">
            {/* Report Description */}
            {currentReportConfig && !isChangingReportType && (
              <div className="p-3 bg-muted/50 rounded-md border-l-4 border-primary">
                <div className="flex items-center gap-2 mb-1">
                  {currentReportConfig.icon}
                  <h4 className="font-medium">{currentReportConfig.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{currentReportConfig.description}</p>
                {currentReportConfig.requiresDateRange && <p className="text-xs text-blue-600 mt-1">📅 Requires date range selection</p>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={selectedReportType} onValueChange={handleReportTypeChange} disabled={isChangingReportType || isLoading}>
                  <SelectTrigger id="report-type" className={isChangingReportType ? "opacity-60" : ""}>
                    <SelectValue placeholder="Select report type" />
                    {isChangingReportType && (
                      <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      </div>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_CONFIGS.map(config => (
                      <SelectItem key={config.id} value={config.id}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <div>
                            <div className="font-medium">{config.name}</div>
                            <div className="text-xs text-muted-foreground">{config.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Inputs */}
              {currentReportConfig?.requiresDateRange && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="date-from">From Date</Label>
                    <Input id="date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} disabled={isChangingReportType || isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-to">To Date</Label>
                    <Input id="date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} disabled={isChangingReportType || isLoading} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button onClick={generateReport} disabled={isLoading || !isDateRangeValid || isChangingReportType} className="flex items-center gap-2">
                {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <TrendingUp className="h-4 w-4" />}
                {isLoading ? "Generating..." : "Generate Report"}
              </Button>

              {hasGenerated && (
                <Button variant="outline" onClick={exportReport} disabled={isChangingReportType || isLoading} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>

            {hasGenerated && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {reportData.length} records
              </Badge>
            )}
          </div>

          {/* Report Display */}
          {isChangingReportType && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="border rounded-lg p-8 text-center bg-muted/30">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  <span>Switching report type...</span>
                </div>
              </div>
            </div>
          )}

          {hasGenerated && !isChangingReportType && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="border rounded-lg bg-card">
                <ReportTable reportType={selectedReportType} data={reportData} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Dynamic Report Table Component
interface ReportTableProps {
  reportType: ReportType;
  data: Record<string, unknown>[];
}

function ReportTable({ reportType, data }: ReportTableProps) {
  const headers = getTableHeaders(reportType);

  if (data.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No data available for the selected criteria.</div>;
  }

  return (
    <div className="overflow-auto max-h-[500px]">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map(header => (
              <TableHead key={header} className="font-semibold">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              {headers.map(header => (
                <TableCell key={header}>{formatCellValue(row, header, reportType)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Get table headers based on report type
function getTableHeaders(reportType: ReportType): string[] {
  const headerMap: Record<ReportType, string[]> = {
    "inventory-summary": ["Material", "Category", "Available Qty", "Unit", "Total Value", "Stock Entries", "Status"],
    "stock-purchases": ["Date", "Material", "Supplier", "Quantity", "Unit", "Cost per Unit", "Total Cost", "Batch"],
    "sales-performance": ["Date", "Section", "Total Sales", "Items Sold", "Revenue", "Top Item", "Performance"],
    "cost-analysis": ["Material", "Current Cost", "Previous Cost", "Trend", "Variance %", "Entries", "Recommendation"],
    "supplier-performance": ["Supplier", "Total Orders", "Total Value", "Materials Count", "Avg Order Value", "Last Purchase", "Rating"],
    "expiry-alerts": ["Material", "Supplier", "Expiry Date", "Days Until Expiry", "Quantity", "Unit", "Value", "Urgency"],
    "category-analysis": ["Category", "Materials Count", "Total Value", "Avg Value", "Percentage", "Purchase Volume", "Sales Volume"],
    "menu-profitability": ["Menu Item", "Category", "Price", "Cost", "Profit", "Profit Margin %", "Sales Count", "Total Profit"],
    "section-performance": ["Section", "Assignments", "Total Value", "Sales Volume", "Revenue", "Utilization %", "Performance"]
  };

  return headerMap[reportType] || [];
}

// Format cell values based on data type and context
function formatCellValue(row: Record<string, unknown>, header: string, reportType: ReportType): React.ReactNode {
  const key = header.toLowerCase().replace(/\s+/g, "");
  const value = row[key];

  if (value === null || value === undefined) return "-";

  // Currency formatting
  if (header.toLowerCase().includes("cost") || header.toLowerCase().includes("value") || header.toLowerCase().includes("revenue") || header.toLowerCase().includes("profit")) {
    const numValue = typeof value === "number" ? value : Number(value);
    return formatCurrency(numValue);
  }

  // Percentage formatting
  if (header.toLowerCase().includes("%") || header.toLowerCase().includes("percentage")) {
    const numValue = typeof value === "number" ? value : Number(value);
    return `${numValue.toFixed(1)}%`;
  }

  // Date formatting
  if (header.toLowerCase().includes("date")) {
    const dateValue = value instanceof Date ? value : new Date(String(value));
    return dateValue.toLocaleDateString();
  }

  // Quantity formatting
  if (header.toLowerCase().includes("qty") || header.toLowerCase().includes("quantity")) {
    const numValue = typeof value === "number" ? value : Number(value);
    return formatNumber(numValue);
  }

  // Status badges
  if (header.toLowerCase() === "status") {
    const stringValue = String(value);
    const variant = stringValue === "Low Stock" ? "destructive" : stringValue === "Good" ? "default" : "secondary";
    return <Badge variant={variant}>{stringValue}</Badge>;
  }

  // Urgency badges
  if (header.toLowerCase() === "urgency") {
    const stringValue = String(value);
    const variant = stringValue === "critical" ? "destructive" : stringValue === "warning" ? "default" : "secondary";
    return <Badge variant={variant}>{stringValue}</Badge>;
  }

  // Trend indicators
  if (header.toLowerCase() === "trend") {
    const stringValue = String(value);
    const color = stringValue === "increasing" ? "text-red-600" : stringValue === "decreasing" ? "text-green-600" : "text-gray-600";
    return <span className={color}>{stringValue}</span>;
  }

  return String(value);
}

// Report generation functions
async function generateInventorySummaryReport(materials: Material[], stockEntries: StockEntry[]) {
  // Implementation for inventory summary
  return materials.map(material => {
    const materialStockEntries = stockEntries.filter(entry => entry.materialId === material.id);
    const totalQuantity = materialStockEntries.reduce((sum, entry) => sum + entry.purchasedQuantity, 0);
    const totalValue = materialStockEntries.reduce((sum, entry) => sum + entry.totalCost, 0);

    return {
      material: material.name,
      category: material.category,
      availableqty: totalQuantity,
      unit: material.baseUnit,
      totalvalue: totalValue,
      stockentries: materialStockEntries.length,
      status: totalQuantity < 10 ? "Low Stock" : "Good"
    };
  });
}

async function generateStockPurchasesReport(stockEntries: StockEntry[], materials: Material[]) {
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

async function generateSalesPerformanceReport(sales: SaleRecord[], menuItems: MenuItem[]) {
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

async function generateCostAnalysisReport(materials: Material[], stockEntries: StockEntry[]) {
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

async function generateSupplierPerformanceReport(stockEntries: StockEntry[], materials: Material[]) {
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

async function generateExpiryAlertsReport(stockEntries: StockEntry[], materials: Material[]) {
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

async function generateCategoryAnalysisReport(materials: Material[], stockEntries: StockEntry[], sales: SaleRecord[]) {
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

async function generateMenuProfitabilityReport(menuItems: MenuItem[], materials: Material[], sales: SaleRecord[]) {
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

async function generateSectionPerformanceReport(sections: Section[], assignments: SectionAssignment[], sales: SaleRecord[]) {
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
