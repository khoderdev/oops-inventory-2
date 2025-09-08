import { flexRender, Table as TanstackTable, Row } from "@tanstack/react-table";

interface TanStackTableProps<TData> {
  table: TanstackTable<TData>;
  className?: string;
  onRowClick?: (row: Row<TData>) => void;
  loading?: boolean;
  emptyMessage?: string;
  showSortIcons?: boolean;
  maxHeight?: string;
}

export const TanStackTable = <TData,>({ table, className = "", onRowClick, loading = false, emptyMessage = "No data available", showSortIcons = true, maxHeight = "calc(100vh - 192px)" }: TanStackTableProps<TData>) => {
  const rows = table.getRowModel().rows;

  if (loading) {
    return (
      <div className={`w-full h-64 border border-gray-200 rounded-xl overflow-auto bg-white shadow-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!rows.length) {
    return (
      <div className={`w-full h-64 border border-gray-200 rounded-xl overflow-auto bg-white shadow-lg flex flex-col ${className}`}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-gray-200">
                {headerGroup.headers.map(header => (
                  <th key={header.id} style={{ width: header.getSize() }} className={`px-6 py-4 text-left text-sm font-semibold text-gray-800 relative transition-colors hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`} onClick={header.column.getToggleSortingHandler()}>
                    <div className="flex items-center gap-3">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {showSortIcons && header.column.getCanSort() && <span className="text-xs text-gray-500 transition-transform duration-200 transform hover:scale-110">{{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as "asc" | "desc"] ?? "↕"}</span>}
                    </div>
                    <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-gray-300/50 opacity-0 hover:opacity-100 transition-opacity duration-200 ${header.column.getIsResizing() ? "bg-blue-600 opacity-100" : ""}`} />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
        </table>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-600 text-sm font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Standard table
  return (
    <div className={`w-full max-h-[calc(100vh-172px)] border border-gray-200 rounded-xl overflow-auto bg-white shadow-lg ${className}`}>
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="border-b border-gray-200">
              {headerGroup.headers.map(header => (
                <th key={header.id} style={{ width: header.getSize() }} className={`px-6 py-4 text-left text-sm font-semibold text-gray-800 relative transition-colors hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`} onClick={header.column.getToggleSortingHandler()}>
                  <div className="flex items-center gap-3">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    {showSortIcons && header.column.getCanSort() && <span className="text-xs text-gray-500 transition-transform duration-200 transform hover:scale-110">{{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as "asc" | "desc"] ?? "↕"}</span>}
                  </div>
                  <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-gray-300/50 opacity-0 hover:opacity-100 transition-opacity duration-200 ${header.column.getIsResizing() ? "bg-blue-600 opacity-100" : ""}`} />
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className={`border-b border-gray-100 transition-colors duration-150 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/50 active:bg-blue-100/50 ${onRowClick ? "cursor-pointer" : ""} focus:outline-none focus:ring-2 focus:ring-blue-300`} onClick={() => onRowClick?.(row)} tabIndex={onRowClick ? 0 : undefined}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} style={{ width: cell.column.getSize() }} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
