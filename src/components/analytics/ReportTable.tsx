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

// Helper function to get column width classes
function getColumnWidth(header: string): string {
  const wideColumns = ["material", "supplier", "description", "name", "item"];
  const narrowColumns = ["qty", "unit", "status", "entries", "count"];
  const mediumColumns = ["category", "section", "date"];

  const headerLower = header.toLowerCase();

  if (wideColumns.some(keyword => headerLower.includes(keyword))) {
    return "min-w-[150px] max-w-[250px]";
  }

  if (narrowColumns.some(keyword => headerLower.includes(keyword))) {
    return "min-w-[80px] max-w-[120px]";
  }

  if (mediumColumns.some(keyword => headerLower.includes(keyword))) {
    return "min-w-[120px] max-w-[180px]";
  }

  return "min-w-[100px] max-w-[200px]";
}

export function ReportTable({ reportType, data }: ReportTableProps) {
  const headers = getTableHeaders(reportType);

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
      {/* Single Unified Table with Perfect Alignment */}
      <div className="flex-1 overflow-hidden">
        <div 
          className="h-full overflow-auto scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600"
          style={{
            maxHeight: "calc(100vh - 280px)",
            minHeight: "300px"
          }}
        >
          <Table className="w-full table-fixed">
            {/* Sticky Header - Same Table Structure */}
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="border-b-2 border-primary/20 hover:bg-transparent bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800">
                {headers.map((header, index) => {
                  const alignment = getColumnAlignment(header);
                  return (
                    <TableHead 
                      key={header} 
                      className={cn(
                        // Base styles - EXACT same as TableCell
                        "font-bold text-xs sm:text-sm py-4 px-4",
                        "text-slate-700 dark:text-slate-200",
                        "border-r border-slate-200 dark:border-slate-600 last:border-r-0",
                        "transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/50",
                        "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800",
                        // Width - EXACT same calculation
                        getColumnWidth(header),
                        // Alignment - EXACT same as cells
                        alignment,
                        // Corner rounding
                        index === 0 && "rounded-tl-lg",
                        index === headers.length - 1 && "rounded-tr-lg"
                      )}
                      style={{
                        textAlign: alignment === "text-right" ? "right" : alignment === "text-center" ? "center" : "left"
                      }}
                    >
                      <div className="flex items-center gap-2 min-h-[24px]">
                        <span className="truncate font-bold">{header}</span>
                        {(header.toLowerCase().includes("qty") || 
                          header.toLowerCase().includes("cost") || 
                          header.toLowerCase().includes("value")) && 
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        }
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            {/* Table Body - Perfect Column Alignment */}
            <TableBody>
              {data.map((row, index) => (
                <TableRow 
                  key={index} 
                  className={cn(
                    "group transition-all duration-200",
                    "hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-indigo-50/40",
                    "dark:hover:from-blue-900/30 dark:hover:to-indigo-900/20",
                    "border-b border-slate-100 dark:border-slate-700",
                    index % 2 === 0 && "bg-slate-50/40 dark:bg-slate-800/40"
                  )}
                >
                  {headers.map((header, cellIndex) => {
                    const alignment = getColumnAlignment(header);
                    return (
                      <TableCell 
                        key={header} 
                        className={cn(
                          // Base styles - EXACT same as TableHead
                          "text-xs sm:text-sm py-4 px-4",
                          "border-r border-slate-100 dark:border-slate-600 last:border-r-0",
                          "transition-colors duration-200",
                          "group-hover:border-slate-200 dark:group-hover:border-slate-500",
                          // Width - EXACT same as header
                          getColumnWidth(header),
                          // Alignment - EXACT same as header
                          alignment
                        )}
                        style={{
                          textAlign: alignment === "text-right" ? "right" : alignment === "text-center" ? "center" : "left"
                        }}
                      >
                        <div className="flex items-center min-h-[24px]">
                          {formatCellValue(row, header, reportType)}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="flex-shrink-0 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-t-2 border-primary/20 px-4 py-3 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Showing {data.length} {data.length === 1 ? "record" : "records"}
            </span>
            {data.length > 10 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-blue-600">
                <span>📊</span>
                <span>Scroll to view all data</span>
              </span>
            )}
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-blue-500"></span>
              <span>Numeric data</span>
            </span>
            <span>Report: {reportType.replace("-", " ").toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
