import { getTableHeaders } from "@/utils/getTableHeaders";
import { ReportType } from "./configs";
import { FileText, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { formatCellValue } from "./formatCellValue";
import { cn } from "@/lib/utils";

// Dynamic Report Table Component
interface ReportTableProps {
  reportType: ReportType;
  data: Record<string, unknown>[];
}

// Helper function to determine column alignment based on header type
function getColumnAlignment(header: string): string {
  const rightAlignedHeaders = ["qty", "quantity", "cost", "value", "price", "profit", "revenue", "amount", "total", "avg", "average", "count", "entries", "threshold", "percentage", "margin", "volume", "utilization", "days"];

  const centerAlignedHeaders = ["status", "urgency", "trend", "rating", "performance"];

  const headerLower = header.toLowerCase();

  if (rightAlignedHeaders.some(keyword => headerLower.includes(keyword)) || headerLower.includes("%")) {
    return "text-right";
  }

  if (centerAlignedHeaders.some(keyword => headerLower.includes(keyword))) {
    return "text-center";
  }

  return "text-left";
}

// Helper function to get responsive column width classes
function getColumnWidth(header: string): string {
  const wideColumns = ["material", "supplier", "description", "name", "item"];
  const narrowColumns = ["qty", "unit", "status", "entries", "count"];
  const mediumColumns = ["category", "section", "date"];
  const costColumns = ["cost", "value", "price", "profit", "revenue", "amount"];

  const headerLower = header.toLowerCase();

  // Wide columns (names, descriptions)
  if (wideColumns.some(keyword => headerLower.includes(keyword))) {
    return "w-[120px] sm:w-[150px] lg:w-[200px] xl:w-[250px] min-w-[120px] max-w-[300px]";
  }

  // Cost/Value columns
  if (costColumns.some(keyword => headerLower.includes(keyword))) {
    return "w-[90px] sm:w-[110px] lg:w-[130px] min-w-[90px] max-w-[150px]";
  }

  // Narrow columns (status, qty, units)
  if (narrowColumns.some(keyword => headerLower.includes(keyword))) {
    return "w-[70px] sm:w-[80px] lg:w-[100px] min-w-[70px] max-w-[120px]";
  }

  // Medium columns (categories, dates)
  if (mediumColumns.some(keyword => headerLower.includes(keyword))) {
    return "w-[100px] sm:w-[120px] lg:w-[150px] min-w-[100px] max-w-[180px]";
  }

  // Default columns
  return "w-[85px] sm:w-[100px] lg:w-[130px] min-w-[85px] max-w-[180px]";
}

export function ReportTable({ reportType, data }: ReportTableProps) {
  const headers = getTableHeaders(reportType);

  // Mobile card view component for very small screens
  const MobileCardView = () => (
    <div className="block sm:hidden space-y-4 p-4">
      {data.map((row, index) => (
        <div key={index} className={cn("bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm", "hover:shadow-md transition-shadow duration-200")}>
          <div className="space-y-3">
            {headers.map((header, headerIndex) => {
              const value = formatCellValue(row, header, reportType);
              const alignment = getColumnAlignment(header);

              // Skip empty values to reduce clutter
              if (!value || value === "-") return null;

              return (
                <div key={header} className="flex justify-between items-center py-1">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate pr-3">{header}:</span>
                  <div className={cn("text-sm font-semibold text-slate-900 dark:text-slate-100 flex-shrink-0", alignment === "text-right" && "text-right", alignment === "text-center" && "text-center")}>{value}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-6 sm:p-8 text-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border-2 border-dashed border-muted-foreground/20">
        <div className="relative mb-6">
          <div className="rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-lg">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <div className="absolute -top-1 -right-1 rounded-full bg-yellow-100 p-1">
            <FileText className="h-4 w-4 text-yellow-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-3">No Data Available</h3>
        <p className="text-sm text-muted-foreground/80 max-w-md leading-relaxed mb-4">No records found for the selected criteria. Try adjusting your filters, date range, or generate a different report type.</p>
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          <span>💡</span>
          <span>Tip: Some reports require date ranges to show data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-card rounded-lg border shadow-sm overflow-hidden">
      {/* Mobile Card View for Small Screens */}
      {data.length > 0 && <MobileCardView />}

      {/* Responsive Table View for Medium+ Screens */}
      <div className="hidden sm:flex flex-col h-full">
        {/* Single Unified Table with Perfect Alignment */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className={cn(
              "h-full overflow-auto",
              // Custom scrollbars for different screen sizes
              "scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400",
              "dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600",
              // Touch scrolling for mobile
              "scroll-smooth"
            )}
            style={{
              maxHeight: "calc(100vh - 240px)",
              minHeight: "250px"
            }}
          >
            <Table
              className={cn(
                // Responsive table layout
                "w-full",
                "sm:table-auto lg:table-fixed",
                // Minimum width to prevent cramping
                "min-w-[600px] sm:min-w-[700px] md:min-w-[800px] lg:min-w-full"
              )}
            >
              {/* Responsive Sticky Header */}
              <TableHeader className="sticky top-0 z-20">
                <TableRow className="border-b-2 border-primary/20 hover:bg-transparent bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800">
                  {headers.map((header, index) => {
                    const alignment = getColumnAlignment(header);
                    return (
                      <TableHead
                        key={header}
                        className={cn(
                          // Responsive typography
                          "font-bold text-xs sm:text-sm lg:text-sm xl:text-base",
                          "text-slate-700 dark:text-slate-200",
                          // Responsive padding
                          "py-3 px-2 sm:py-4 sm:px-3 lg:px-4",
                          "border-r border-slate-200 dark:border-slate-600 last:border-r-0",
                          "transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/50",
                          "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800",
                          // Responsive width
                          getColumnWidth(header),
                          // Alignment
                          alignment,
                          // Corner rounding
                          index === 0 && "rounded-tl-lg",
                          index === headers.length - 1 && "rounded-tr-lg"
                        )}
                        style={{
                          textAlign: alignment === "text-right" ? "right" : alignment === "text-center" ? "center" : "left"
                        }}
                      >
                        <div className="flex items-center gap-1 sm:gap-2 min-h-[20px] sm:min-h-[24px]">
                          <span className="truncate font-bold leading-tight">{header}</span>
                          {(header.toLowerCase().includes("qty") || header.toLowerCase().includes("cost") || header.toLowerCase().includes("value")) && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>

              {/* Responsive Table Body */}
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index} className={cn("group transition-all duration-200", "hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-indigo-50/40", "dark:hover:from-blue-900/30 dark:hover:to-indigo-900/20", "border-b border-slate-100 dark:border-slate-700", index % 2 === 0 && "bg-slate-50/40 dark:bg-slate-800/40")}>
                    {headers.map((header, cellIndex) => {
                      const alignment = getColumnAlignment(header);
                      return (
                        <TableCell
                          key={header}
                          className={cn(
                            // Responsive typography
                            "text-xs sm:text-sm lg:text-sm",
                            // Responsive padding
                            "py-3 px-2 sm:py-4 sm:px-3 lg:px-4",
                            "border-r border-slate-100 dark:border-slate-600 last:border-r-0",
                            "transition-colors duration-200",
                            "group-hover:border-slate-200 dark:group-hover:border-slate-500",
                            // Width matching header
                            getColumnWidth(header),
                            // Alignment matching header
                            alignment
                          )}
                          style={{
                            textAlign: alignment === "text-right" ? "right" : alignment === "text-center" ? "center" : "left"
                          }}
                        >
                          <div className="flex items-center min-h-[20px] sm:min-h-[24px]">{formatCellValue(row, header, reportType)}</div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Enhanced Responsive Footer */}
        <div className="flex-shrink-0 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-t-2 border-primary/20 px-3 sm:px-4 py-2 sm:py-3 rounded-b-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs sm:text-sm">
                  {data.length} {data.length === 1 ? "record" : "records"}
                </span>
              </span>
              {data.length > 10 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-blue-600 text-xs">
                  <span>📊</span>
                  <span>Scroll to view all</span>
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                <span>Numeric data</span>
              </span>
              <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{reportType.replace("-", " ").toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
