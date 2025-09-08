// // import { flexRender, Table as TanstackTable, Row } from "@tanstack/react-table";

// // interface TanStackTableProps<TData> {
// //   table: TanstackTable<TData>;
// //   className?: string;
// //   onRowClick?: (row: Row<TData>) => void;
// //   loading?: boolean;
// //   emptyMessage?: string;
// //   showSortIcons?: boolean;
// //   maxHeight?: string;
// // }

// // export const TanStackTable = <TData,>({ table, className = "", onRowClick, loading = false, emptyMessage = "No data available", showSortIcons = true, maxHeight = "calc(100vh - 192px)" }: TanStackTableProps<TData>) => {
// //   const rows = table.getRowModel().rows;

// //   if (loading) {
// //     return (
// //       <div className={`w-full h-64 border border-gray-200 rounded-xl overflow-auto bg-white shadow-lg flex items-center justify-center ${className}`}>
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto mb-3"></div>
// //           <p className="text-gray-600 text-sm font-medium">Loading...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // Empty state
// //   if (!rows.length) {
// //     return (
// //       <div className={`w-full h-64 border border-gray-200 rounded-xl overflow-auto bg-white shadow-lg flex flex-col ${className}`}>
// //         <table className="w-full border-collapse">
// //           <thead className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm">
// //             {table.getHeaderGroups().map(headerGroup => (
// //               <tr key={headerGroup.id} className="border-b border-gray-200">
// //                 {headerGroup.headers.map(header => (
// //                   <th key={header.id} style={{ width: header.getSize() }} className={`px-6 py-4 text-left text-sm font-semibold text-gray-800 relative transition-colors hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`} onClick={header.column.getToggleSortingHandler()}>
// //                     <div className="flex items-center gap-3">
// //                       {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
// //                       {showSortIcons && header.column.getCanSort() && <span className="text-xs text-gray-500 transition-transform duration-200 transform hover:scale-110">{{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as "asc" | "desc"] ?? "↕"}</span>}
// //                     </div>
// //                     <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-gray-300/50 opacity-0 hover:opacity-100 transition-opacity duration-200 ${header.column.getIsResizing() ? "bg-blue-600 opacity-100" : ""}`} />
// //                   </th>
// //                 ))}
// //               </tr>
// //             ))}
// //           </thead>
// //         </table>
// //         <div className="flex items-center justify-center h-32">
// //           <p className="text-gray-600 text-sm font-medium">{emptyMessage}</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // Standard table
// //   return (
// //     <div className={`w-full max-h-[calc(100vh-172px)] border border-gray-200 rounded-xl overflow-auto bg-white shadow-lg ${className}`}>
// //       <table className="w-full border-collapse">
// //         <thead className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm">
// //           {table.getHeaderGroups().map(headerGroup => (
// //             <tr key={headerGroup.id} className="border-b border-gray-200">
// //               {headerGroup.headers.map(header => (
// //                 <th key={header.id} style={{ width: header.getSize() }} className={`px-6 py-4 text-left text-sm font-semibold text-gray-800 relative transition-colors hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`} onClick={header.column.getToggleSortingHandler()}>
// //                   <div className="flex items-center gap-3">
// //                     {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
// //                     {showSortIcons && header.column.getCanSort() && <span className="text-xs text-gray-500 transition-transform duration-200 transform hover:scale-110">{{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as "asc" | "desc"] ?? "↕"}</span>}
// //                   </div>
// //                   <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-gray-300/50 opacity-0 hover:opacity-100 transition-opacity duration-200 ${header.column.getIsResizing() ? "bg-blue-600 opacity-100" : ""}`} />
// //                 </th>
// //               ))}
// //             </tr>
// //           ))}
// //         </thead>
// //         <tbody>
// //           {rows.map((row, index) => (
// //             <tr key={row.id} className={`border-b border-gray-100 transition-colors duration-150 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/50 active:bg-blue-100/50 ${onRowClick ? "cursor-pointer" : ""} focus:outline-none focus:ring-2 focus:ring-blue-300`} onClick={() => onRowClick?.(row)} tabIndex={onRowClick ? 0 : undefined}>
// //               {row.getVisibleCells().map(cell => (
// //                 <td key={cell.id} style={{ width: cell.column.getSize() }} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
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
// import React from "react";

// interface TanStackTableProps<TData> {
//   table: TanstackTable<TData>;
//   className?: string;
//   onRowClick?: (row: Row<TData>) => void;
//   loading?: boolean;
//   emptyMessage?: string;
//   showSortIcons?: boolean;
//   maxHeight?: string;
//   rowHeight?: number; // Added for better control over row heights
// }

// export const TanStackTable = <TData,>({
//   table,
//   className = "",
//   onRowClick,
//   loading = false,
//   emptyMessage = "No data available",
//   showSortIcons = true,
//   maxHeight = "calc(100vh - 192px)",
//   rowHeight = 64 // Default row height in pixels
// }: TanStackTableProps<TData>) => {
//   const { rows } = table.getRowModel();
//   const parentRef = React.useRef<HTMLDivElement>(null);

//   const rowVirtualizer = useVirtualizer({
//     count: rows.length,
//     getScrollElement: () => parentRef.current,
//     estimateSize: () => rowHeight,
//     overscan: 10
//   });

//   const virtualRows = rowVirtualizer.getVirtualItems();
//   const totalSize = rowVirtualizer.getTotalSize();

//   const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
//   const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0) : 0;

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
//           <thead className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm">
//             {table.getHeaderGroups().map(headerGroup => (
//               <tr key={headerGroup.id} className="border-b border-gray-200">
//                 {headerGroup.headers.map(header => (
//                   <th key={header.id} style={{ width: header.getSize() }} className={`px-6 py-4 text-left text-sm font-semibold text-gray-800 relative transition-colors hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`} onClick={header.column.getToggleSortingHandler()}>
//                     <div className="flex items-center gap-3">
//                       {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
//                       {showSortIcons && header.column.getCanSort() && <span className="text-xs text-gray-500 transition-transform duration-200 transform hover:scale-110">{{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as "asc" | "desc"] ?? "↕"}</span>}
//                     </div>
//                     <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-gray-300/50 opacity-0 hover:opacity-100 transition-opacity duration-200 ${header.column.getIsResizing() ? "bg-blue-600 opacity-100" : ""}`} />
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

//   return (
//     <div ref={parentRef} className={`w-full border border-gray-200 rounded-xl overflow-auto bg-white shadow-lg ${className}`} style={{ maxHeight, minHeight: "400px" }}>
//       <div style={{ height: totalSize, position: "relative" }}>
//         <table className="w-full border-collapse">
//           <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm">
//             {table.getHeaderGroups().map(headerGroup => (
//               <tr key={headerGroup.id} className="border-b border-gray-200">
//                 {headerGroup.headers.map(header => (
//                   <th key={header.id} style={{ width: header.getSize() }} className={`px-6 py-4 text-left text-sm font-semibold text-gray-800 relative transition-colors hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`} onClick={header.column.getToggleSortingHandler()}>
//                     <div className="flex items-center gap-3">
//                       {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
//                       {showSortIcons && header.column.getCanSort() && <span className="text-xs text-gray-500 transition-transform duration-200 transform hover:scale-110">{{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as "asc" | "desc"] ?? "↕"}</span>}
//                     </div>
//                     <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-gray-300/50 opacity-0 hover:opacity-100 transition-opacity duration-200 ${header.column.getIsResizing() ? "bg-blue-600 opacity-100" : ""}`} />
//                   </th>
//                 ))}
//               </tr>
//             ))}
//           </thead>
//           <tbody>
//             {paddingTop > 0 && (
//               <tr>
//                 <td style={{ height: `${paddingTop}px` }} />
//               </tr>
//             )}
//             {virtualRows.map(virtualRow => {
//               const row = rows[virtualRow.index];
//               return (
//                 <tr
//                   key={row.id}
//                   className={`border-b border-gray-100 transition-colors duration-150 ${virtualRow.index % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/50 active:bg-blue-100/50 ${onRowClick ? "cursor-pointer" : ""} focus:outline-none focus:ring-2 focus:ring-blue-300`}
//                   onClick={() => onRowClick?.(row)}
//                   tabIndex={onRowClick ? 0 : undefined}
//                   style={{
//                     position: "absolute",
//                     top: 0,
//                     left: 0,
//                     width: "100%",
//                     height: `${virtualRow.size}px`,
//                     transform: `translateY(${virtualRow.start}px)`
//                   }}
//                 >
//                   {row.getVisibleCells().map(cell => (
//                     <td key={cell.id} style={{ width: cell.column.getSize() }} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
//                       {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                     </td>
//                   ))}
//                 </tr>
//               );
//             })}
//             {paddingBottom > 0 && (
//               <tr>
//                 <td style={{ height: `${paddingBottom}px` }} />
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };
import { flexRender, Table as TanstackTable, Row } from "@tanstack/react-table";
import { useVirtual } from "react-virtual";
import { useRef, useEffect } from "react";
import React from "react";

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
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtual({
    size: rows.length,
    parentRef: tableContainerRef,
    estimateSize: React.useCallback(() => 60, []), // Estimate row height
    overscan: 10 // Number of rows to render outside visible area
  });

  // Scroll to top when sorting changes
  useEffect(() => {
    rowVirtualizer.scrollToIndex(0);
  }, [table.getState().sorting]);

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

  // Virtualized table
  return (
    <div ref={tableContainerRef} className={`w-full max-h-[calc(100vh-172px)] border border-gray-200 rounded-xl overflow-auto bg-white shadow-lg ${className}`} style={{ maxHeight }}>
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm z-10">
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
        <tbody
          style={{
            height: `${rowVirtualizer.totalSize}px`,
            position: "relative"
          }}
        >
          {rows.map(row => {
            return (
              <tr
                key={row.id}
                className={`border-b border-gray-100 transition-colors duration-150 ${row.index % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/50 active:bg-blue-100/50 ${onRowClick ? "cursor-pointer" : ""} focus:outline-none focus:ring-2 focus:ring-blue-300`}
                onClick={() => onRowClick?.(row)}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} style={{ width: cell.column.getSize() }} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
