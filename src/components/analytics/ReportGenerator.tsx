import { assignmentsAPI } from "@/api/assignments.api.ts";
import { materialsAPI } from "@/api/matierials.api.ts";
import { menuAPI } from "@/api/menu.api.ts";
import { salesAPI } from "@/api/sales.api.ts";
import { sectionAPI } from "@/api/sections.api.ts";
import { stockAPI } from "@/api/stock.api.ts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ReportGeneratorProps, SaleRecord, StockEntry } from "@/types/inventory";
import { getTableHeaders } from "@/utils/getTableHeaders";
import { format, isValid } from "date-fns";
import { CalendarIcon, Download, FileText, X } from "lucide-react";
import { useMemo, useState } from "react";
import { REPORT_CONFIGS, ReportType } from "./configs";
import { generateCategoryAnalysisReport, generateCostAnalysisReport, generateExpiryAlertsReport, generateInventorySummaryReport, generateMenuProfitabilityReport, generateSalesPerformanceReport, generateSectionPerformanceReport, generateStockPurchasesReport, generateSupplierPerformanceReport, generateVarianceAnalysisReport, generateWasteReport } from "./generationFunctions";
import { ReportSummary } from "./ReportSummary";
import { ReportTable } from "./ReportTable";

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
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [categories, setCategories] = useState<string[]>([]);
  const currentReportConfig = REPORT_CONFIGS.find(config => config.id === selectedReportType);

  const handleReportTypeChange = (newReportType: ReportType) => {
    if (newReportType === selectedReportType) return;
    setIsChangingReportType(true);
    setReportData([]);
    setHasGenerated(false);
    setIsLoading(false);
    setDateFromOpen(false);
    setDateToOpen(false);
    setSelectedCategory("all");
    setCategories([]);
    const newConfig = REPORT_CONFIGS.find(config => config.id === newReportType);
    if (!newConfig?.requiresDateRange) {
      setDateFrom(undefined);
      setDateTo(undefined);
    }
    if (newReportType === "sales-performance") {
      menuAPI
        .getMenus()
        .then(res => {
          try {
            const raw: string[] = (res?.data || []).map((i: any) => (typeof i?.category === "string" ? i.category : "")).filter((v: string) => v.trim().length > 0);
            const seen = new Set<string>();
            const dedup: string[] = [];
            for (const c of raw) {
              const key = c.trim().toLowerCase();
              if (!seen.has(key)) {
                seen.add(key);
                dedup.push(c.trim());
              }
            }
            setCategories(dedup);
          } catch {
            // ignore
          }
        })
        .catch(() => {
          // ignore fetch errors for categories in preloading
        });
    }
    setTimeout(() => {
      setSelectedReportType(newReportType);
      setIsChangingReportType(false);
    }, 150);
  };

  const isDateRangeValid = useMemo(() => {
    if (!currentReportConfig?.requiresDateRange) return true;
    if (!dateFrom && !dateTo) return true;
    if (dateFrom && dateTo) return dateFrom <= dateTo;
    return true;
  }, [dateFrom, dateTo, currentReportConfig]);

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
      let filteredData: { stockEntries: StockEntry[]; sales: SaleRecord[] } | undefined;
      let reportResults: Record<string, unknown>[] | undefined;

      if (currentReportConfig?.requiresDateRange && selectedReportType !== "sales-performance") {
        const today = new Date();
        const fromDate = new Date(dateFrom ?? today);
        const toDate = new Date(dateTo ?? today);
        toDate.setHours(23, 59, 59, 999);

        filteredData = {
          stockEntries: stockEntries.filter(entry => {
            const entryDate = new Date(entry.purchaseDate);
            return entryDate >= fromDate && entryDate <= toDate;
          }),
          sales: sales.data.filter(sale => {
            const saleDate = new Date(sale.saleDate);
            return saleDate >= fromDate && saleDate <= toDate;
          })
        };
      }

      switch (selectedReportType) {
        case "inventory-summary":
          reportResults = await generateInventorySummaryReport(materials, stockEntries);
          break;
        case "stock-purchases":
          reportResults = await generateStockPurchasesReport(filteredData?.stockEntries || [], materials);
          break;
        case "sales-performance": {
          const normalize = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");
          const categoryFilterActive = selectedCategory && selectedCategory !== "all";
          const selectedKey = normalize(selectedCategory);
          const filteredMenuItems = categoryFilterActive
            ? (menuItems.data || []).filter((i: any) => {
                const itemCategory = normalize(i?.category);
                return itemCategory === selectedKey;
              })
            : menuItems.data;

          // Apply date filtering if dates are selected
          let salesData = sales.data;
          if (dateFrom || dateTo) {
            const today = new Date();
            const fromDate = new Date(dateFrom ?? today);
            const toDate = new Date(dateTo ?? today);
            toDate.setHours(23, 59, 59, 999);

            salesData = sales.data.filter(sale => {
              const saleDate = new Date(sale.saleDate);
              return saleDate >= fromDate && saleDate <= toDate;
            });
          }

          reportResults = await generateSalesPerformanceReport(salesData, filteredMenuItems);
          break;
        }
        case "cost-analysis":
          reportResults = await generateCostAnalysisReport(materials, filteredData?.stockEntries || []);
          break;
        case "supplier-performance":
          reportResults = await generateSupplierPerformanceReport(filteredData?.stockEntries || [], materials);
          break;
        case "expiry-alerts":
          reportResults = await generateExpiryAlertsReport(stockEntries, materials);
          break;
        case "category-analysis":
          reportResults = await generateCategoryAnalysisReport(materials, filteredData?.stockEntries || [], filteredData?.sales || []);
          break;
        case "menu-profitability":
          reportResults = await generateMenuProfitabilityReport(menuItems.data, materials, filteredData?.sales || []);
          break;
        case "section-performance":
          reportResults = await generateSectionPerformanceReport(sections.data, assignments.data, filteredData?.sales || []);
          break;
        case "waste-report":
          {
            const today = new Date();
            const from = currentReportConfig?.requiresDateRange ? (dateFrom ?? today) : dateFrom;
            const to = currentReportConfig?.requiresDateRange ? (dateTo ?? today) : dateTo;
            reportResults = await generateWasteReport(from && format(from, "yyyy-MM-dd"), to && format(to, "yyyy-MM-dd"));
          }
          break;
        case "variance-analysis":
          {
            const today = new Date();
            const from = currentReportConfig?.requiresDateRange ? (dateFrom ?? today) : dateFrom;
            const to = currentReportConfig?.requiresDateRange ? (dateTo ?? today) : dateTo;
            reportResults = await generateVarianceAnalysisReport(materials, stockEntries, sales.data, from && format(from, "yyyy-MM-dd"), to && format(to, "yyyy-MM-dd"));
          }
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
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report. Please check the console for details.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedCategory("all");
    setReportData([]);
    setHasGenerated(false);

    toast({
      title: "Filters Cleared",
      description: "All filters have been reset.",
      duration: 1500
    });
  };

  const exportReport = () => {
    if (!hasGenerated || reportData.length === 0) return;

    // Helper function to format dates consistently as DD-MM-YYYY HH:MM:SS AM/PM for CSV
    const formatDateForCSV = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      // Convert to 12-hour format
      let hours = date.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      const hoursStr = hours.toString().padStart(2, "0");

      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      return `${day}-${month}-${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
    };

    const headers = getTableHeaders(selectedReportType);
    const csvContent = [
      headers.join(","),
      ...reportData.map(row =>
        headers
          .map(header => {
            let value = row[header] ?? row[header.toLowerCase().replace(/\s+/g, "")] ?? "-";

            // Format dates consistently for CSV export
            if (header.toLowerCase().includes("date") || header.toLowerCase().includes("purchase")) {
              if (value && value !== "-") {
                const dateValue = value instanceof Date ? value : new Date(String(value));
                if (!isNaN(dateValue.getTime())) {
                  value = formatDateForCSV(dateValue);
                }
              }
            }

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
    <div className={cn("w-full h-full flex flex-col", className)}>
      <Card className="flex flex-col h-full">
        <CardHeader className="flex-shrink-0 pt-4 pb-0 px-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Generator
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-3 min-h-0 overflow-hidden p-4">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-start">
              <div className="flex-1 md:flex-none md:w-72 lg:w-80 xl:w-96 space-y-2">
                <Select value={selectedReportType} onValueChange={handleReportTypeChange} disabled={isChangingReportType || isLoading}>
                  <SelectTrigger id="report-type" className={cn("h-16 w-full", isChangingReportType && "opacity-60")}>
                    <SelectValue placeholder="Select report type" />
                    {isChangingReportType && (
                      <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      </div>
                    )}
                  </SelectTrigger>
                  <SelectContent className="max-w-[90vw] sm:max-w-md ">
                    {REPORT_CONFIGS.map(config => (
                      <SelectItem key={config.id} value={config.id} className="cursor-pointer">
                        <div className="flex items-start gap-3 py-1 min-w-0 text-left">
                          <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{config.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2 leading-tight">{config.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentReportConfig?.requiresDateRange && (
                <div className="flex gap-3 md:gap-2 md:max-w-xs w-full">
                  <div className="flex-1 space-y-2">
                    <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full h-12 sm:h-16 justify-start text-left font-normal px-3", !dateFrom && "text-muted-foreground", (isChangingReportType || isLoading) && "pointer-events-none opacity-50")} disabled={isChangingReportType || isLoading}>
                          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{dateFrom ? format(dateFrom, "MMM d, yyyy") : "From Date"}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 max-w-[90vw]" align="start" side="bottom">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={date => {
                            if (isValid(date)) {
                              setDateFrom(date);
                            }
                            setDateFromOpen(false);
                          }}
                          initialFocus
                          className="p-3"
                          disabled={date => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full h-12 sm:h-16 justify-start text-left font-normal px-3", !dateTo && "text-muted-foreground", (isChangingReportType || isLoading) && "pointer-events-none opacity-50")} disabled={isChangingReportType || isLoading}>
                          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{dateTo ? format(dateTo, "MMM d, yyyy") : "To Date"}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 max-w-[90vw]" align="start" side="bottom">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={date => {
                            if (isValid(date)) {
                              setDateTo(date);
                            }
                            setDateToOpen(false);
                          }}
                          initialFocus
                          className="p-3"
                          disabled={date => date > new Date() || (dateFrom && date < dateFrom)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-3 md:gap-2 md:items-center flex-wrap">
              {/* Generate Report and Categories - inline on mobile only */}
              <div className="flex flex-row md:contents gap-2">
                <Button onClick={generateReport} disabled={isLoading || !isDateRangeValid || isChangingReportType} className="flex items-center justify-center gap-2 h-10 flex-1 min-w-0 md:flex-none md:w-[160px]">
                  {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : null}
                  <span className="truncate">{isLoading ? "Generating..." : "Generate Report"}</span>
                </Button>

                {/* Categories Selection */}
                {selectedReportType === "sales-performance" && (
                  <Select value={selectedCategory} onValueChange={val => setSelectedCategory(val)} disabled={isChangingReportType || isLoading}>
                    <SelectTrigger id="sales-category" className={cn("flex-1 min-w-0 md:w-[160px] h-10", (isChangingReportType || isLoading) && "opacity-60")}>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent className="max-w-[90vw] sm:max-w-md">
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat} className="cursor-pointer">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Clear and Export buttons - inline on mobile only */}
              {(dateFrom || dateTo || (selectedCategory && selectedCategory !== "all") || hasGenerated) && (
                <div className="flex flex-row md:contents gap-2">
                  {/* Clear Filters Button */}
                  {(dateFrom || dateTo || (selectedCategory && selectedCategory !== "all")) && (
                    <Button variant="outline" onClick={clearAllFilters} disabled={isChangingReportType || isLoading} className="flex items-center justify-center gap-2 h-10 flex-1 md:flex-none md:w-[120px] hover:bg-red-500/25 hover:text-red-500">
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Clear</span>
                      <span className="sm:hidden">Clear</span>
                    </Button>
                  )}

                  {/* Export Button */}
                  {hasGenerated && (
                    <Button variant="outline" onClick={exportReport} disabled={isChangingReportType || isLoading} className="flex items-center justify-center gap-2 h-10 flex-1 md:flex-none md:w-[140px] hover:!bg-green-500/25 hover:!text-green-500">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export</span>
                      <span className="sm:hidden">Export</span>
                    </Button>
                  )}
                </div>
              )}
            </div>

            {hasGenerated && (
              <Badge variant="secondary" className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1 self-center md:self-end whitespace-nowrap">
                <FileText className="h-3 w-3" />
                <span className="text-sm">{reportData.length} records</span>
              </Badge>
            )}
          </div>

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
            <div className="flex-1 flex flex-col space-y-4 animate-in fade-in-50 duration-300 min-h-0 overflow-hidden">
              {selectedReportType === "inventory-summary" && (
                <div className="flex-shrink-0">
                  <ReportSummary data={reportData} />
                </div>
              )}

              <div className="flex-1 min-h-0">
                <ReportTable reportType={selectedReportType} data={reportData} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
