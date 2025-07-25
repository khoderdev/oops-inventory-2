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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ReportGeneratorProps, SaleRecord, StockEntry } from "@/types/inventory";
import { getTableHeaders } from "@/utils/getTableHeaders";
import { format, isValid } from "date-fns";
import { CalendarIcon, Download, FileText, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { REPORT_CONFIGS, ReportType } from "./configs";
import { generateCategoryAnalysisReport, generateCostAnalysisReport, generateExpiryAlertsReport, generateInventorySummaryReport, generateMenuProfitabilityReport, generateSalesPerformanceReport, generateSectionPerformanceReport, generateStockPurchasesReport, generateSupplierPerformanceReport, generateWasteReport } from "./generationFunctions";
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
  const currentReportConfig = REPORT_CONFIGS.find(config => config.id === selectedReportType);

  const handleReportTypeChange = (newReportType: ReportType) => {
    if (newReportType === selectedReportType) return;
    setIsChangingReportType(true);
    setReportData([]);
    setHasGenerated(false);
    setIsLoading(false);
    setDateFromOpen(false);
    setDateToOpen(false);
    const newConfig = REPORT_CONFIGS.find(config => config.id === newReportType);
    if (!newConfig?.requiresDateRange) {
      setDateFrom(undefined);
      setDateTo(undefined);
    }
    setTimeout(() => {
      setSelectedReportType(newReportType);
      setIsChangingReportType(false);
    }, 150);
  };

  const isDateRangeValid = useMemo(() => {
    if (!currentReportConfig?.requiresDateRange) return true;
    return dateFrom && dateTo && dateFrom <= dateTo;
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
        case "waste-report":
          reportResults = await generateWasteReport(dateFrom && format(dateFrom, "yyyy-MM-dd"), dateTo && format(dateTo, "yyyy-MM-dd"));
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

  const exportReport = () => {
    if (!hasGenerated || reportData.length === 0) return;

    const headers = getTableHeaders(selectedReportType);
    const csvContent = [
      headers.join(","),
      ...reportData.map(row =>
        headers
          .map(header => {
            const value = row[header] ?? row[header.toLowerCase().replace(/\s+/g, "")] ?? "-";
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
          <div className="space-y-4">
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
                            <div className="text-xs text-muted-foreground line-clamp-2 leading-tight">{config.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentReportConfig?.requiresDateRange && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">From Date</Label>
                    <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full h-10 justify-start text-left font-normal px-3", !dateFrom && "text-muted-foreground", (isChangingReportType || isLoading) && "pointer-events-none opacity-50")} disabled={isChangingReportType || isLoading}>
                          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{dateFrom ? format(dateFrom, "MMM d, yyyy") : "Pick a date"}</span>
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
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">To Date</Label>
                    <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full h-10 justify-start text-left font-normal px-3", !dateTo && "text-muted-foreground", (isChangingReportType || isLoading) && "pointer-events-none opacity-50")} disabled={isChangingReportType || isLoading}>
                          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{dateTo ? format(dateTo, "MMM d, yyyy") : "Pick a date"}</span>
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
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button onClick={generateReport} disabled={isLoading || !isDateRangeValid || isChangingReportType} className="flex items-center justify-center gap-2 h-10 min-w-[140px]">
                {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <TrendingUp className="h-4 w-4" />}
                <span className="truncate">{isLoading ? "Generating..." : "Generate Report"}</span>
              </Button>

              {hasGenerated && (
                <Button variant="outline" onClick={exportReport} disabled={isChangingReportType || isLoading} className="flex items-center justify-center gap-2 h-10">
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
              {selectedReportType === "inventory" && <ReportSummary data={reportData} />}

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
