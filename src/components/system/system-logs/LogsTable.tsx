import { LogType } from "@/components/system/system-logs/configs";
import { cn } from "@/lib/utils";
import { getLogsTableHeaders } from "@/utils/getLogsTableHeaders";
import { Database, FileText } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { getColumnAlignment, getInitialWidth, getResponsiveColumnClasses } from "../../analytics/columnFunctions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { formatLogsCellValue } from "./formatLogsCellValue";

export interface LogsTableProps {
  logType: LogType;
  data: Record<string, unknown>[];
}

export function LogsTable({ logType, data }: LogsTableProps) {
  console.log("LogsTable received data:", data);
  const headers = getLogsTableHeaders(logType);
  console.log("Headers:", headers);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [isAutoFitting, setIsAutoFitting] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const doubleClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getColumnWidth = useCallback(
    (header: string): number => {
      return columnWidths[header] || getInitialWidth(header);
    },
    [columnWidths]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, header: string) => {
      if (doubleClickTimeoutRef.current) {
        clearTimeout(doubleClickTimeoutRef.current);
        doubleClickTimeoutRef.current = null;
        return;
      }

      e.preventDefault();
      setIsResizing(header);

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      startXRef.current = clientX;
      startWidthRef.current = getColumnWidth(header);

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [getColumnWidth]
  );

  const handleResize = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isResizing) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - startXRef.current;
      const newWidth = Math.max(60, startWidthRef.current + deltaX);

      setColumnWidths(prev => ({
        ...prev,
        [isResizing]: newWidth
      }));
    },
    [isResizing]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const autoFitAllColumns = useCallback(() => {
    if (!tableRef.current) return;

    setIsAutoFitting("all");

    const calculateOptimalWidth = (columnHeader: string) => {
      let maxWidth = getInitialWidth(columnHeader);
      const measurer = document.createElement("div");
      measurer.style.position = "absolute";
      measurer.style.visibility = "hidden";
      measurer.style.whiteSpace = "nowrap";
      measurer.style.fontSize = "14px";
      measurer.style.fontWeight = "bold";
      document.body.appendChild(measurer);
      measurer.textContent = columnHeader;
      const headerWidth = measurer.offsetWidth + 60;
      maxWidth = Math.max(maxWidth, headerWidth);
      measurer.style.fontWeight = "normal";

      data.slice(0, Math.min(20, data.length)).forEach(row => {
        const cellValue = formatLogsCellValue(row, columnHeader, logType);
        if (cellValue && typeof cellValue === "string") {
          measurer.textContent = cellValue;
          const contentWidth = measurer.offsetWidth + 40;
          maxWidth = Math.max(maxWidth, contentWidth);
        }
      });
      document.body.removeChild(measurer);
      return Math.min(Math.max(maxWidth, 80), 400);
    };

    const newColumnWidths: Record<string, number> = {};
    headers.forEach(header => {
      newColumnWidths[header] = calculateOptimalWidth(header);
    });
    setColumnWidths(newColumnWidths);

    setTimeout(() => {
      setIsAutoFitting(null);
    }, 300);
  }, [headers, data, logType]);

  React.useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => handleResize(e);
      const handleMouseUp = () => handleResizeEnd();
      const handleTouchMove = (e: TouchEvent) => handleResize(e);
      const handleTouchEnd = () => handleResizeEnd();
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

  React.useEffect(() => {
    return () => {
      if (doubleClickTimeoutRef.current) {
        clearTimeout(doubleClickTimeoutRef.current);
      }
    };
  }, []);

  const MobileCardView = () => (
    <div className="block sm:hidden space-y-4 p-4">
      {data.map((row, index) => (
        <div key={index} className={cn("bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm", "hover:shadow-md transition-shadow duration-200")}>
          <div className="space-y-3">
            {headers.map((header, headerIndex) => {
              const value = formatLogsCellValue(row, header, logType);
              const alignment = getColumnAlignment(header);
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
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border-2 border-dashed border-muted-foreground/20">
        <div className="relative mb-6">
          <div className="rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-lg">
            <Database className="h-8 w-8 text-blue-600" />
          </div>
          <div className="absolute -top-1 -right-1 rounded-full bg-yellow-100 p-1">
            <FileText className="h-4 w-4 text-yellow-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-3">No Logs Available</h3>
        <p className="text-sm text-muted-foreground/80 max-w-md leading-relaxed mb-4">No log records found for the selected criteria. Try adjusting your filters, date range, or generate a different log type.</p>
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          <span>💡</span>
          <span>Tip: Some log types require additional parameters to show data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-card rounded-lg border shadow-sm overflow-hidden" style={{ contain: "layout" }}>
      {data.length > 0 && <MobileCardView />}

      <div className="hidden sm:flex flex-col h-full">
        <div className={cn("flex-1 overflow-hidden relative", isResizing && "select-none")}>
          <div
            className={cn("h-full overflow-auto", "scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400", "dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600", "scroll-smooth", "scrollbar-gutter-stable")}
            style={{
              height: "100%",
              minHeight: "200px",
              scrollbarGutter: "stable"
            }}
          >
            <Table
              ref={tableRef}
              className="w-full table-fixed min-w-[800px] relative"
              style={{
                tableLayout: "fixed",
                willChange: "auto",
                backfaceVisibility: "hidden"
              }}
            >
              <TableHeader className="sticky top-0 z-30 bg-white dark:bg-card shadow-sm backdrop-blur-sm">
                <TableRow className="border-b-2 border-primary/20 hover:bg-transparent bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800">
                  {headers.map((header, index) => {
                    const alignment = getColumnAlignment(header);
                    return (
                      <TableHead
                        key={header}
                        className={cn(
                          "font-bold text-sm",
                          "text-slate-800 dark:text-slate-100",
                          "py-4 px-3 sm:py-5 sm:px-4 lg:px-5",
                          "whitespace-nowrap",
                          index < headers.length - 1 && cn("border-r-2 border-slate-300 dark:border-slate-600", "hover:border-blue-400 dark:hover:border-blue-500 hover:border-r-[3px] transition-all duration-200", isResizing === header && "border-blue-500 dark:border-blue-400 border-r-4 shadow-sm", isAutoFitting === "all" && "border-green-500 dark:border-green-400 border-r-[5px] shadow-md", "hover:shadow-[2px_0_4px_rgba(59,130,246,0.1)] dark:hover:shadow-[2px_0_4px_rgba(96,165,250,0.15)]"),
                          index === headers.length - 1 && "border-r-0",
                          "transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-700/50",
                          "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800",
                          "relative group/header",
                          getResponsiveColumnClasses(header),
                          alignment,
                          index === 0 && "rounded-tl-lg",
                          index === headers.length - 1 && "rounded-tr-lg"
                        )}
                        style={{
                          width: `${getColumnWidth(header)}px`,
                          textAlign: alignment === "text-right" ? "right" : alignment === "text-center" ? "center" : "left"
                        }}
                      >
                        <div className="flex items-center gap-1 sm:gap-2 min-h-[16px] sm:min-h-[16px] relative h-full">
                          <span className="truncate font-bold leading-tight">{header}</span>

                          {index < headers.length - 1 && (
                            <>
                              <div
                                className={cn("absolute -right-1.5 top-0 w-3 h-full cursor-col-resize z-20", "hover:bg-transparent transition-colors", isAutoFitting === "all" && "bg-green-400/20")}
                                onMouseDown={e => handleResizeStart(e, header)}
                                onTouchStart={e => handleResizeStart(e, header)}
                                onDoubleClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (doubleClickTimeoutRef.current) {
                                    clearTimeout(doubleClickTimeoutRef.current);
                                  }
                                  doubleClickTimeoutRef.current = setTimeout(() => {
                                    doubleClickTimeoutRef.current = null;
                                  }, 300);

                                  autoFitAllColumns();
                                }}
                                title={`Drag to resize • Double-click to auto-fit all columns`}
                              />
                              <div className={cn("absolute -right-px top-0 w-0.5 h-full z-30 pointer-events-none", "group-hover/header:bg-blue-400/40 group-hover/header:w-1 transition-all duration-150", isResizing === header && "bg-blue-600/60 w-1.5 shadow-md", isAutoFitting === "all" && "bg-green-500/80 w-2 shadow-lg animate-pulse", "transform-gpu")} />
                            </>
                          )}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index} className={cn("group transition-colors duration-200 ease-in-out", "hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/60", "dark:hover:from-blue-900/40 dark:hover:to-indigo-900/30", "border-b border-slate-200/60 dark:border-slate-700/60", index % 2 === 0 && "bg-gradient-to-r from-slate-50/60 to-gray-50/40 dark:from-slate-800/60 dark:to-gray-800/40")}>
                    {headers.map((header, cellIndex) => {
                      const alignment = getColumnAlignment(header);
                      return (
                        <TableCell
                          key={header}
                          className={cn("text-sm sm:text-base lg:text-sm", "py-4 px-3 sm:py-5 sm:px-4 lg:px-5", cellIndex < headers.length - 1 && "border-r border-slate-200/40 dark:border-slate-600/40", cellIndex === headers.length - 1 && "border-r-0", "transition-colors duration-200 ease-in-out", "group-hover:border-slate-300/60 dark:group-hover:border-slate-500/60", "group-hover:bg-white/20 dark:group-hover:bg-slate-700/20", getResponsiveColumnClasses(header), alignment)}
                          style={{
                            width: `${getColumnWidth(header)}px`,
                            textAlign: alignment === "text-right" ? "right" : alignment === "text-center" ? "center" : "left"
                          }}
                        >
                          <div className="flex items-center min-h-[20px] sm:min-h-[24px] overflow-hidden">{formatLogsCellValue(row, header, logType)}</div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex-shrink-0 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-t-2 border-primary/20 px-3 sm:px-4 py-2 sm:py-3 rounded-b-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <span className="flex items-center gap-1 font-medium">
                <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{logType.replace("-", " ").toUpperCase()}</span>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs sm:text-sm">
                  {data.length} {data.length === 1 ? "record" : "records"}
                </span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                <span>System logs</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
