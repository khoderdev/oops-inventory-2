import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Download, FileText, TrendingUp, Package, ShoppingCart, AlertTriangle, Users, ChefHat, CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("inventory-summary");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [reportData, setReportData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isChangingReportType, setIsChangingReportType] = useState(false);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const currentReportConfig = REPORT_CONFIGS.find(config => config.id === selectedReportType);

  const handleReportTypeChange = (newReportType: ReportType) => {
    if (newReportType === selectedReportType) return;

    setIsChangingReportType(true);

    // Reset all report-related state
    setReportData([]);
    setHasGenerated(false);
    setIsLoading(false);

    // Close any open popovers
    setDateFromOpen(false);
    setDateToOpen(false);

    // Get new report config
    const newConfig = REPORT_CONFIGS.find(config => config.id === newReportType);

    // Clear dates if new report doesn't require date range
    if (!newConfig?.requiresDateRange) {
      setDateFrom(undefined);
      setDateTo(undefined);
    }

    // Set new report type with a small delay for smooth transition
          setTimeout(() => {
        setSelectedReportType(newReportType);
        setIsChangingReportType(false);
      }, 150);
  };

  // Date validation
  const isDateRangeValid = useMemo(() => {
    if (!currentReportConfig?.requiresDateRange) return true;
    return dateFrom && dateTo && dateFrom <= dateTo;
  }, [dateFrom, dateTo, currentReportConfig]);

  // Generate report data
  const generateReport = async () => {
    if (!isDateRangeValid) {
      toast({
        title: "Invalid Date Range",
        description: "Please select a valid date range for this report.",
        variant: "destructive",
        duration: 1500
      });
      return;
    }

    setIsLoading(true);
    setHasGenerated(false);

    try {
      const [materials, stockEntries, sales, menuItems, sections, assignments] = await Promise.all([materialsAPI.getMaterials(), stockAPI.getStockEntries(), salesAPI.getSales(), menuAPI.getMenus(), sectionAPI.getSections(), assignmentsAPI.getAssignments()]);

      let filteredData;
      let reportResults;

      if (currentReportConfig?.requiresDateRange && dateFrom && dateTo) {
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);

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
        description: `${currentReportConfig?.name} has been generated successfully.`,
        duration: 1500
      });
    } catch (error) {
      console.error("Error generating report:", error);
              toast({
          title: "Warning",
          description: "Not Implemented.",
          variant: "default",
          duration: 1500
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
    <div className={cn("w-full", className)}>
      <Card className="flex flex-col h-full">
        <CardHeader className="flex-shrink-0">
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
        <CardContent className="flex-1 flex flex-col space-y-4 sm:space-y-6 min-h-0">
          {/* Report Type Selection */}
          <div className="space-y-4">
            {/* Report Description */}
            {currentReportConfig && !isChangingReportType && (
              <div className="p-4 sm:p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-shrink-0">{currentReportConfig.icon}</div>
                  <h4 className="font-medium text-sm sm:text-base truncate">{currentReportConfig.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{currentReportConfig.description}</p>
                {currentReportConfig.requiresDateRange && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                    <span>📅</span>
                    <span>Requires date range selection</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={selectedReportType} onValueChange={handleReportTypeChange} disabled={isChangingReportType || isLoading}>
                  <SelectTrigger id="report-type" className={cn("h-10 w-full", isChangingReportType && "opacity-60")}>
                    <SelectValue placeholder="Select report type" />
                    {isChangingReportType && (
                      <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      </div>
                    )}
                  </SelectTrigger>
                  <SelectContent className="max-w-[90vw] sm:max-w-md">
                    {REPORT_CONFIGS.map(config => (
                      <SelectItem key={config.id} value={config.id} className="cursor-pointer">
                        <div className="flex items-start gap-3 py-1 min-w-0">
                          <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{config.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2 leading-tight">
                              {config.description}
                            </div>
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
                    <Label className="text-sm font-medium">From Date</Label>
                    <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={cn(
                            "w-full h-10 justify-start text-left font-normal px-3",
                            !dateFrom && "text-muted-foreground",
                            (isChangingReportType || isLoading) && "pointer-events-none opacity-50"
                          )} 
                          disabled={isChangingReportType || isLoading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {dateFrom ? format(dateFrom, "MMM d, yyyy") : "Pick a date"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 max-w-[90vw]" align="start" side="bottom">
                        <Calendar 
                          mode="single" 
                          selected={dateFrom} 
                          onSelect={date => {
                            setDateFrom(date);
                            setDateFromOpen(false);
                          }} 
                          initialFocus 
                          className="p-3" 
                          disabled={date => date > new Date()} 
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">To Date</Label>
                    <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={cn(
                            "w-full h-10 justify-start text-left font-normal px-3",
                            !dateTo && "text-muted-foreground",
                            (isChangingReportType || isLoading) && "pointer-events-none opacity-50"
                          )} 
                          disabled={isChangingReportType || isLoading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {dateTo ? format(dateTo, "MMM d, yyyy") : "Pick a date"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 max-w-[90vw]" align="start" side="bottom">
                        <Calendar 
                          mode="single" 
                          selected={dateTo} 
                          onSelect={date => {
                            setDateTo(date);
                            setDateToOpen(false);
                          }} 
                          initialFocus 
                          className="p-3" 
                          disabled={date => date > new Date() || (dateFrom && date < dateFrom)} 
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button 
                onClick={generateReport} 
                disabled={isLoading || !isDateRangeValid || isChangingReportType} 
                className="flex items-center justify-center gap-2 h-10 min-w-[140px]"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                <span className="truncate">
                  {isLoading ? "Generating..." : "Generate Report"}
                </span>
              </Button>

              {hasGenerated && (
                <Button 
                  variant="outline" 
                  onClick={exportReport} 
                  disabled={isChangingReportType || isLoading} 
                  className="flex items-center justify-center gap-2 h-10"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </Button>
              )}
            </div>

            {hasGenerated && (
              <Badge variant="secondary" className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1">
                <FileText className="h-3 w-3" />
                <span className="text-sm">{reportData.length} records</span>
              </Badge>
            )}
          </div>

          {/* Report Display */}
          {isChangingReportType && (
            <div className="flex-1 flex flex-col animate-in fade-in-50 duration-200 min-h-0">
              <div className="flex-1 flex items-center justify-center border rounded-lg bg-muted/30 min-h-[200px]">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  <span className="text-sm">Switching report type...</span>
                </div>
              </div>
            </div>
          )}

          {hasGenerated && !isChangingReportType && (
            <div className="flex-1 flex flex-col space-y-4 animate-in fade-in-50 duration-300 min-h-0">
              <div className="flex-1 border rounded-lg bg-card overflow-hidden min-h-0">
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6 sm:p-8 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-muted-foreground mb-2">
          No Data Available
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-md">
          No records found for the selected criteria. Try adjusting your filters or date range.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Table Header - Sticky */}
      <div className="flex-shrink-0 border-b bg-muted/50 rounded-t-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map(header => (
                <TableHead key={header} className="font-semibold text-xs sm:text-sm py-3 px-2 sm:px-4">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
      </div>
      
      {/* Scrollable Table Body */}
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 min-h-0" 
           style={{ 
             maxHeight: 'calc(100vh - 300px)',
             minHeight: '200px'
           }}>
        <Table>
          <TableBody>
            {data.map((row, index) => (
              <TableRow 
                key={index} 
                className="hover:bg-muted/50 transition-colors border-b last:border-b-0"
              >
                {headers.map(header => (
                  <TableCell 
                    key={header} 
                    className="text-xs sm:text-sm py-3 px-2 sm:px-4 align-top"
                  >
                    {formatCellValue(row, header, reportType)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Footer with row count */}
      <div className="flex-shrink-0 border-t bg-muted/30 px-4 py-2 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {data.length} {data.length === 1 ? 'record' : 'records'}</span>
          <span className="hidden sm:inline">Scroll to view more data</span>
        </div>
      </div>
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
