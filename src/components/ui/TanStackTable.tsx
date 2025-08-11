import React, { useRef } from "react";
import { flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface TanStackTableProps {
  table: any; // ReactTable instance
  virtualized?: boolean;
  estimatedRowSize?: number;
  overscan?: number;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string | ((row: any) => string);
  cellClassName?: string | ((cell: any) => string);
  onRowClick?: (row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
  stickyHeader?: boolean;
  maxHeight?: string;
  showSortIcons?: boolean;
  customHeaderAlignment?: Record<string, "left" | "center" | "right">;
  customCellAlignment?: Record<string, "left" | "center" | "right">;
}

export const TanStackTable: React.FC<TanStackTableProps> = ({ table, virtualized = false, estimatedRowSize = 60, overscan = 10, className = "", headerClassName = "", bodyClassName = "", rowClassName = "", cellClassName = "", onRowClick, loading = false, emptyMessage = "No data available", stickyHeader = true, maxHeight = "calc(100vh-260px)", showSortIcons = true, customHeaderAlignment = {}, customCellAlignment = {} }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;

  const rowVirtualizer = virtualized
    ? useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimatedRowSize,
        overscan
      })
    : null;

  const getHeaderAlignment = (headerId: string) => {
    return customHeaderAlignment[headerId] || "left";
  };

  const getCellAlignment = (cellId: string) => {
    return customCellAlignment[cellId] || "";
  };

  const getRowClassName = (row: any) => {
    if (typeof rowClassName === "function") {
      return rowClassName(row);
    }
    return rowClassName;
  };

  const getCellClassName = (cell: any) => {
    const alignment = getCellAlignment(cell.column.id);
    const alignmentClass = alignment ? `text-${alignment}` : "";

    if (typeof cellClassName === "function") {
      return `${cellClassName(cell)} ${alignmentClass}`.trim();
    }
    return `${cellClassName} ${alignmentClass}`.trim();
  };

  // Loading state
  if (loading) {
    return (
      <div className={`w-full h-[${maxHeight}] border rounded-lg overflow-auto bg-white shadow-sm ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!rows.length) {
    return (
      <div className={`w-full h-[${maxHeight}] border rounded-lg overflow-auto bg-white shadow-sm ${className}`}>
        <Table>
          <TableHeader className={`${stickyHeader ? "sticky top-0 bg-gray-50 z-10" : ""} ${headerClassName}`}>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id} className="border-b border-gray-200">
                {headerGroup.headers.map((header: any) => {
                  const alignment = getHeaderAlignment(header.id);
                  return (
                    <TableHead key={header.id} style={{ width: header.getSize() }} className={`px-6 py-4 text-${alignment} font-semibold text-gray-900 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`} onClick={header.column.getToggleSortingHandler()}>
                      {header.isPlaceholder ? null : (
                        <div className={`flex items-center gap-2 ${alignment === "center" ? "justify-center" : alignment === "right" ? "justify-end" : ""}`}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {showSortIcons && header.column.getCanSort() && (
                            <span className="text-xs">
                              {{
                                asc: "↑",
                                desc: "↓"
                              }[header.column.getIsSorted() as string] ?? "↕"}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
        </Table>
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Virtualized table
  if (virtualized && rowVirtualizer) {
    return (
      <div className={`w-full h-[${maxHeight}] border rounded-lg overflow-hidden bg-white shadow-sm ${className}`}>
        <div className="flex flex-col h-full">
          {/* Table Header */}
          <div className={`flex-shrink-0 border-b bg-gray-50 ${stickyHeader ? "sticky top-0 z-10" : ""} ${headerClassName}`}>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup: any) => (
                  <TableRow key={headerGroup.id} className="border-b border-gray-200">
                    {headerGroup.headers.map((header: any) => {
                      const alignment = getHeaderAlignment(header.id);
                      return (
                        <TableHead key={header.id} style={{ width: header.getSize() }} className={`px-6 py-4 text-${alignment} font-semibold text-gray-900 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`} onClick={header.column.getToggleSortingHandler()}>
                          {header.isPlaceholder ? null : (
                            <div className={`flex items-center gap-2 ${alignment === "center" ? "justify-center" : alignment === "right" ? "justify-end" : ""}`}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {showSortIcons && header.column.getCanSort() && (
                                <span className="text-xs">
                                  {{
                                    asc: "↑",
                                    desc: "↓"
                                  }[header.column.getIsSorted() as string] ?? "↕"}
                                </span>
                              )}
                            </div>
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
            </Table>
          </div>

          {/* Virtualized Table Body */}
          <div className={`flex-1 overflow-auto ${bodyClassName}`} ref={parentRef}>
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative"
              }}
            >
              {rowVirtualizer.getVirtualItems().map(virtualItem => {
                const row = rows[virtualItem.index];
                const rowClasses = getRowClassName(row);

                return (
                  <div
                    key={virtualItem.key}
                    className={`hover:bg-gray-50/50 border-b border-gray-100 transition-colors ${rowClasses} ${onRowClick ? "cursor-pointer" : ""}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`
                    }}
                    onClick={() => onRowClick?.(row)}
                  >
                    <Table>
                      <TableBody>
                        <TableRow>
                          {row.getVisibleCells().map((cell: any) => (
                            <TableCell key={cell.id} style={{ width: cell.column.getSize() }} className={`px-6 py-4 ${getCellClassName(cell)}`}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard table (non-virtualized)
  return (
    <div className={`w-full h-[${maxHeight}] border rounded-lg overflow-auto bg-white shadow-sm ${className}`}>
      <Table>
        <TableHeader className={`${stickyHeader ? "sticky top-0 bg-gray-50 z-10" : ""} ${headerClassName}`}>
          {table.getHeaderGroups().map((headerGroup: any) => (
            <TableRow key={headerGroup.id} className="border-b border-gray-200">
              {headerGroup.headers.map((header: any) => {
                const alignment = getHeaderAlignment(header.id);
                return (
                  <TableHead key={header.id} style={{ width: header.getSize() }} className={`px-6 py-4 text-${alignment} font-semibold text-gray-900 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`} onClick={header.column.getToggleSortingHandler()}>
                    {header.isPlaceholder ? null : (
                      <div className={`flex items-center gap-2 ${alignment === "center" ? "justify-center" : alignment === "right" ? "justify-end" : ""}`}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {showSortIcons && header.column.getCanSort() && (
                          <span className="text-xs">
                            {{
                              asc: "↑",
                              desc: "↓"
                            }[header.column.getIsSorted() as string] ?? "↕"}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className={bodyClassName}>
          {rows.map((row: any) => {
            const rowClasses = getRowClassName(row);
            return (
              <TableRow key={row.id} className={`transition-colors border-b border-gray-100 hover:bg-gray-50 ${rowClasses} ${onRowClick ? "cursor-pointer" : ""}`} onClick={() => onRowClick?.(row)}>
                {row.getVisibleCells().map((cell: any) => (
                  <TableCell key={cell.id} style={{ width: cell.column.getSize() }} className={`px-6 py-4 ${getCellClassName(cell)}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TanStackTable;
