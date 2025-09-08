// // import { flexRender } from "@tanstack/react-table";

// // export const TanStackTable = ({ table, className = "", onRowClick, loading = false, emptyMessage = "No data available", showSortIcons = true }) => {
// //   const rows = table.getRowModel().rows;

// //   // Loading state
// //   if (loading) {
// //     return (
// //       <div className={`w-full h-64 border rounded-lg overflow-auto bg-white shadow-sm flex items-center justify-center ${className}`}>
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
// //           <p className="text-gray-500">Loading...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // Empty state
// //   if (!rows.length) {
// //     return (
// //       <div className={`w-full h-64 border rounded-lg overflow-auto bg-white shadow-sm flex items-center justify-center ${className}`}>
// //         <table className="w-full border-collapse">
// //           <thead className="sticky top-0 bg-gray-100">
// //             {table.getHeaderGroups().map(headerGroup => (
// //               <tr key={headerGroup.id} className="border-b border-gray-200">
// //                 {headerGroup.headers.map(header => (
// //                   <th key={header.id} style={{ width: header.getSize() }} className={`px-4 py-3 text-left font-semibold text-gray-900 relative ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`} onClick={header.column.getToggleSortingHandler()}>
// //                     <div className="flex items-center gap-2">
// //                       {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
// //                       {showSortIcons && header.column.getCanSort() && <span className="text-xs">{{ asc: "↑", desc: "↓" }[header.column.getIsSorted()] ?? "↕"}</span>}
// //                     </div>
// //                     <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={`absolute right-0 top-0 h-full w-1 cursor-col-resize bg-gray-300 opacity-0 hover:opacity-100 transition-opacity ${header.column.getIsResizing() ? "bg-blue-500 opacity-100" : ""}`} />
// //                   </th>
// //                 ))}
// //               </tr>
// //             ))}
// //           </thead>
// //         </table>
// //         <div className="flex items-center justify-center h-32">
// //           <p className="text-gray-500">{emptyMessage}</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // Standard table
// //   return (
// //     <div className={`w-full max-h-[calc(100vh-200px)] border rounded-lg overflow-auto bg-white shadow-sm ${className}`}>
// //       <table className="w-full border-collapse">
// //         <thead className="sticky top-0 bg-gray-100">
// //           {table.getHeaderGroups().map(headerGroup => (
// //             <tr key={headerGroup.id} className="border-b border-gray-200">
// //               {headerGroup.headers.map(header => (
// //                 <th key={header.id} style={{ width: header.getSize() }} className={`px-4 py-3 text-left font-semibold text-gray-900 relative ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`} onClick={header.column.getToggleSortingHandler()}>
// //                   <div className="flex items-center gap-2">
// //                     {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
// //                     {showSortIcons && header.column.getCanSort() && <span className="text-xs">{{ asc: "↑", desc: "↓" }[header.column.getIsSorted()] ?? "↕"}</span>}
// //                   </div>
// //                   <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={`absolute right-0 top-0 h-full w-1 cursor-col-resize bg-gray-300 opacity-0 hover:opacity-100 transition-opacity ${header.column.getIsResizing() ? "bg-blue-500 opacity-100" : ""}`} />
// //                 </th>
// //               ))}
// //             </tr>
// //           ))}
// //         </thead>
// //         <tbody>
// //           {rows.map(row => (
// //             <tr key={row.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`} onClick={() => onRowClick?.(row)}>
// //               {row.getVisibleCells().map(cell => (
// //                 <td key={cell.id} style={{ width: cell.column.getSize() }} className="px-4 py-3 text-gray-700">
// //                   {flexRender(cell.column.columnDef.cell, cell.getContext())}
// //                 </td>
// //               ))}
// //             </tr>
// //           ))}
// //         </tbody>
// //       </table>
// //     </div>
// //   );
// // };

// import { flexRender, Table as TanstackTable, Row } from "@tanstack/react-table";
// import { useVirtualizer } from "@tanstack/react-virtual";
// import { useRef } from "react";

// interface TanStackTableProps<TData> {
//   table: TanstackTable<TData>;
//   className?: string;
//   onRowClick?: (row: Row<TData>) => void;
//   loading?: boolean;
//   emptyMessage?: string;
//   showSortIcons?: boolean;
//   maxHeight?: string;
//   estimatedRowSize?: number;
//   overscan?: number;
//   virtualized?: boolean;
//   customHeaderAlignment?: Record<string, "left" | "center" | "right">;
//   customCellAlignment?: Record<string, "left" | "center" | "right">;
//   headerClassName?: string;
//   bodyClassName?: string;
//   rowClassName?: string | ((row: any) => string);
//   cellClassName?: string | ((cell: any) => string);
// }

// export const TanStackTable = <TData,>({ table, className = "", onRowClick, loading = false, emptyMessage = "No data available", showSortIcons = true, maxHeight = "calc(100vh - 192px)", estimatedRowSize = 48, overscan = 10, virtualized = true, customHeaderAlignment = {}, customCellAlignment = {}, headerClassName = "", bodyClassName = "", rowClassName = "", cellClassName = "" }: TanStackTableProps<TData>) => {
//   const rows = table.getRowModel().rows;
//   const parentRef = useRef<HTMLDivElement>(null);

//   const rowVirtualizer = virtualized
//     ? useVirtualizer({
//         count: rows.length,
//         getScrollElement: () => parentRef.current,
//         estimateSize: () => estimatedRowSize,
//         overscan
//       })
//     : null;

//   const virtualItems = rowVirtualizer?.getVirtualItems() ?? [];

//   // Get alignment utility class for headers
//   const getHeaderAlignmentClass = (headerId: string) => {
//     const align = customHeaderAlignment[headerId] || "left";
//     return align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
//   };

//   // Get alignment utility class for cells
//   const getCellAlignmentClass = (cellId: string) => {
//     const align = customCellAlignment[cellId] || "left";
//     return align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
//   };

//   const getRowClassName = (row: any) => (typeof rowClassName === "function" ? rowClassName(row) : rowClassName);

//   const getCellClassName = (cell: any) => {
//     const alignmentClass = getCellAlignmentClass(cell.column.id);
//     const customClass = typeof cellClassName === "function" ? cellClassName(cell) : cellClassName;
//     return `${alignmentClass} ${customClass}`.trim();
//   };

//   // Loading state
//   if (loading) {
//     return (
//       <div className={`w-full h-64 border border-gray-200 rounded-xl overflow-auto bg-white shadow-lg flex items-center justify-center ${className}`}>
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto mb-3"></div>
//           <p className="text-gray-600 text-sm font-medium">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   // Empty state
//   if (!rows.length) {
//     return (
//       <div className={`w-full h-64 border border-gray-200 rounded-xl overflow-auto bg-white shadow-lg flex flex-col ${className}`}>
//         <table className="w-full border-collapse">
//           <thead className={`sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm ${headerClassName}`}>
//             {table.getHeaderGroups().map(headerGroup => (
//               <tr key={headerGroup.id} className="border-b border-gray-200">
//                 {headerGroup.headers.map(header => (
//                   <th key={header.id} style={{ width: header.getSize() }} className={`px-6 py-4 text-sm font-semibold text-gray-800 relative ${getHeaderAlignmentClass(header.column.id)} ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`}>
//                     <div className="flex items-center gap-2">
//                       {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
//                       {showSortIcons && header.column.getCanSort() && (
//                         <span className="text-xs text-gray-500">
//                           {{
//                             asc: "↑",
//                             desc: "↓"
//                           }[header.column.getIsSorted() as "asc" | "desc"] ?? "↕"}
//                         </span>
//                       )}
//                     </div>
//                     {/* Column Resize Handle */}
//                     <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={`absolute right-0 top-0 h-full w-1 cursor-col-resize bg-gray-300 opacity-0 hover:opacity-100 transition-opacity ${header.column.getIsResizing() ? "bg-blue-500 opacity-100" : ""}`} />
//                   </th>
//                 ))}
//               </tr>
//             ))}
//           </thead>
//         </table>
//         <div className="flex items-center justify-center h-32">
//           <p className="text-gray-600 text-sm font-medium">{emptyMessage}</p>
//         </div>
//       </div>
//     );
//   }

//   // Virtualized table
//   return (
//     <div ref={parentRef} className={`w-full border border-gray-200 rounded-xl overflow-auto bg-white ${className}`} style={{ maxHeight }}>
//       <table className="w-full border-collapse relative">
//         <thead className={`sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm z-10 ${headerClassName}`}>
//           {table.getHeaderGroups().map(headerGroup => (
//             <tr key={headerGroup.id} className="border-b border-gray-200">
//               {headerGroup.headers.map(header => (
//                 <th key={header.id} style={{ width: header.getSize() }} className={`px-6 py-3 text-sm font-semibold text-gray-800 relative ${getHeaderAlignmentClass(header.column.id)} ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`} onClick={header.column.getToggleSortingHandler()}>
//                   <div className="flex items-center gap-2">
//                     {flexRender(header.column.columnDef.header, header.getContext())}
//                     {showSortIcons && header.column.getCanSort() && (
//                       <span className="text-xs text-gray-500">
//                         {{
//                           asc: "↑",
//                           desc: "↓"
//                         }[header.column.getIsSorted() as "asc" | "desc"] ?? "↕"}
//                       </span>
//                     )}
//                   </div>
//                   {/* Column Resize Handle - ADDED FROM OLD IMPLEMENTATION */}
//                   <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={`absolute right-0 top-0 h-full w-1 cursor-col-resize bg-gray-300 opacity-0 hover:opacity-100 transition-opacity ${header.column.getIsResizing() ? "bg-blue-500 opacity-100" : ""}`} />
//                 </th>
//               ))}
//             </tr>
//           ))}
//         </thead>

//         <tbody
//           className={bodyClassName}
//           style={{
//             height: rowVirtualizer?.getTotalSize(),
//             position: "relative"
//           }}
//         >
//           {virtualItems.map(virtualRow => {
//             const row = rows[virtualRow.index];
//             return (
//               <tr key={row.id} data-index={virtualRow.index} ref={rowVirtualizer?.measureElement} className={`absolute left-0 right-0 border-b border-gray-100 ${virtualRow.index % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/50 ${getRowClassName(row)} ${onRowClick ? "cursor-pointer" : ""}`} style={{ transform: `translateY(${virtualRow.start}px)` }} onClick={() => onRowClick?.(row)}>
//                 {row.getVisibleCells().map(cell => (
//                   <td key={cell.id} style={{ width: cell.column.getSize() }} className={`px-6 py-3 text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis ${getCellClassName(cell)}`}>
//                     {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                   </td>
//                 ))}
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// };

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
