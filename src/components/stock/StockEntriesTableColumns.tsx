// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// import { Button } from "@/components/ui/button";
// import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
// import { Material, StockEntry, StockEntryWithMaterial } from "@/types/inventory";
// import { formatCleanCurrency } from "@/utils/numberFormatting";
// import { highlightText } from "@/utils/highlightText";
// import { AlertTriangle, Edit, Eye, EyeOff, Printer, Trash2 } from "lucide-react";
// import { useMemo } from "react";
// import { createColumnHelper, ColumnDef } from "@tanstack/react-table";

// type StockEntriesTableColumnsProps = {
//   searchTerm: string;
//   bulkSelectionMode: boolean;
//   sortBy: string;
//   sortOrder: "ASC" | "DESC";
//   handleSortChange: (sortBy: string, sortOrder: "ASC" | "DESC") => void;
//   handleTogglePOSVisibility: (entry: StockEntry & { material?: Material }) => Promise<void>;
//   handleOpenPrinterDialog: (entry: StockEntryWithMaterial) => void;
//   handleEditStockEntry: (stockEntry: StockEntry) => void;
//   handleDeleteStockEntry: (stockEntryId: string | number) => Promise<void>;
//   isAllowedPOSCategory: (material: Material | undefined) => boolean;
//   hasNegativeStock: (entry: StockEntryWithMaterial) => boolean;
//   renderQuantityDisplay: (entry: StockEntryWithMaterial) => JSX.Element;
//   renderUnitDisplay: (entry: StockEntryWithMaterial) => JSX.Element;
// };

// export function useStockEntriesTableColumns({ searchTerm, bulkSelectionMode, sortBy, sortOrder, handleSortChange, handleTogglePOSVisibility, handleOpenPrinterDialog, handleEditStockEntry, handleDeleteStockEntry, isAllowedPOSCategory, hasNegativeStock, renderQuantityDisplay, renderUnitDisplay }: StockEntriesTableColumnsProps) {
//   const columnHelper = createColumnHelper<StockEntryWithMaterial>();

//   const columns = useMemo<ColumnDef<StockEntryWithMaterial>[]>(
//     () => [
//       ...(bulkSelectionMode
//         ? [
//             columnHelper.display({
//               id: "select",
//               size: 50,
//               header: ({ table }) => <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} className="h-4 w-4" aria-label="Select all stock entries" />,
//               cell: ({ row }) => <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="h-4 w-4 " aria-label={`Select ${row.original.material?.name || "stock entry"}`} onClick={e => e.stopPropagation()} />
//             })
//           ]
//         : []),

//       columnHelper.display({
//         id: "materialName",
//         size: 180,
//         header: ({ column }) => (
//           <Button
//             variant="ghost"
//             onClick={() => {
//               const newOrder = sortBy === "materialName" && sortOrder === "ASC" ? "DESC" : "ASC";
//               handleSortChange("materialName", newOrder);
//             }}
//             className="h-8 px-2 font-semibold hover:bg-transparent text-left w-[180px] flex items-center"
//           >
//             Material Name
//             <span className="text-xs ml-1">{sortBy === "materialName" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
//           </Button>
//         ),
//         cell: ({ row }) => {
//           const entry = row.original;
//           const materialName = entry.material?.name;
//           const isNegativeStock = hasNegativeStock(entry);
//           return (
//             <div className="flex items-center gap-2 w-[180px] h-8 px-2">
//               {isNegativeStock && <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />}
//               <span className="truncate font-medium">{materialName ? highlightText(materialName, searchTerm) : `Unknown Material (ID: ${entry.materialId})`}</span>
//             </div>
//           );
//         },
//         enableSorting: false
//       }),

//       columnHelper.display({
//         id: "remainingQty",
//         size: 150,
//         header: ({ column }) => <div className="text-left w-[150px] font-semibold px-2 flex items-center h-8">Current Qty</div>,
//         cell: ({ row }) => <div className="text-left w-[150px] h-8 px-2 flex items-center">{renderQuantityDisplay(row.original)}</div>
//       }),

//       columnHelper.display({
//         id: "unit",
//         size: 80,
//         header: ({ column }) => <div className="text-left w-[80px] font-semibold px-2 flex items-center h-8">Base Unit</div>,
//         cell: ({ row }) => <div className="text-left w-[80px] h-8 px-2 flex items-center">{renderUnitDisplay(row.original)}</div>
//       }),

//       columnHelper.display({
//         id: "costPerUnit",
//         size: 110,
//         header: ({ column }) => (
//           <Button
//             variant="ghost"
//             onClick={() => {
//               const newOrder = sortBy === "costPerBaseUnit" && sortOrder === "ASC" ? "DESC" : "ASC";
//               handleSortChange("costPerBaseUnit", newOrder);
//             }}
//             className="h-8 px-2 font-semibold hover:bg-transparent text-left w-[110px] flex items-center"
//           >
//             Unit Cost
//             <span className="text-xs ml-1">{sortBy === "costPerBaseUnit" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
//           </Button>
//         ),
//         cell: ({ row }) => {
//           const entry = row.original;
//           const cost = entry.costPerBaseUnit || entry.costPerPurchasedUnit;
//           const unit = entry.material?.baseUnit || entry.purchasedUnit;

//           return (
//             <div className="flex flex-col justify-center w-[110px] h-8 px-2">
//               <div className="font-medium">{formatCleanCurrency(cost)}</div>
//               <div className="text-xs text-muted-foreground">(per {unit})</div>
//             </div>
//           );
//         },
//         enableSorting: false
//       }),

//       columnHelper.display({
//         id: "totalCost",
//         size: 90,
//         header: ({ column }) => (
//           <Button
//             variant="ghost"
//             onClick={() => {
//               const newOrder = sortBy === "totalCost" && sortOrder === "ASC" ? "DESC" : "ASC";
//               handleSortChange("totalCost", newOrder);
//             }}
//             className="h-8 px-2 font-semibold hover:bg-transparent text-left w-[90px] flex items-center"
//           >
//             Total Cost
//             <span className="text-xs ml-1">{sortBy === "totalCost" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
//           </Button>
//         ),
//         cell: ({ row }) => {
//           const entry = row.original;
//           const currentTotalCost = entry.totalCost;
//           return (
//             <div className="text-left w-[90px] h-8 px-2 flex items-center">
//               <span className="font-medium">{formatCleanCurrency(currentTotalCost)}</span>
//             </div>
//           );
//         },
//         enableSorting: false
//       }),

//       columnHelper.accessor("purchaseDate", {
//         id: "purchaseDate",
//         size: 110,
//         header: ({ column }) => (
//           <Button
//             variant="ghost"
//             onClick={() => {
//               const newOrder = sortBy === "purchaseDate" && sortOrder === "ASC" ? "DESC" : "ASC";
//               handleSortChange("purchaseDate", newOrder);
//             }}
//             className="h-8 px-2 font-semibold hover:bg-transparent text-left w-[110px] flex items-center"
//           >
//             Purchase Date
//             <span className="text-xs ml-1">{sortBy === "purchaseDate" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
//           </Button>
//         ),
//         cell: ({ getValue }) => (
//           <div className="text-left w-[110px] h-8 -mr-5 px-2 flex items-center">
//             <span className="font-medium">{new Date(getValue()).toLocaleDateString()}</span>
//           </div>
//         ),
//         enableSorting: false
//       }),

//       columnHelper.display({
//         id: "actions",
//         size: 130,
//         enableSorting: false,
//         header: ({ column }) => <div className="text-left font-semibold px-2 w-[130px] flex items-center h-8">Actions</div>,
//         cell: ({ row }) => {
//           const entry = row.original;
//           return (
//             <div className="flex items-center gap-1 h-8 px-2 w-fit -mr-6">
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant={entry.isPOSItem ? "default" : "outline"}
//                     size="sm"
//                     disabled={!isAllowedPOSCategory(entry.material)}
//                     onClick={e => {
//                       e.stopPropagation();
//                       handleTogglePOSVisibility(entry);
//                     }}
//                     className={`h-8 w-8 p-0 ${!isAllowedPOSCategory(entry.material) ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400" : entry.isPOSItem ? "bg-teal-600 hover:bg-teal-700 text-white" : "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"}`}
//                   >
//                     {entry.isPOSItem ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent side="top" sideOffset={5}>
//                   <p>{!isAllowedPOSCategory(entry.material) ? "Only beverage items can be shown in POS" : entry.isPOSItem ? "Hide from POS" : "Show in POS"}</p>
//                 </TooltipContent>
//               </Tooltip>

//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={e => {
//                       e.stopPropagation();
//                       handleOpenPrinterDialog(entry);
//                     }}
//                     className={`h-8 w-8 p-0 ${entry.assignedPrinter ? "border-blue-500 text-blue-600" : "hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"}`}
//                   >
//                     <Printer className="h-4 w-4" />
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent side="top" sideOffset={5}>
//                   <p>{entry.assignedPrinter ? `Assigned to: ${entry.assignedPrinter.name}` : "Assign printer to " + (entry.material?.name || "stock entry")}</p>
//                 </TooltipContent>
//               </Tooltip>

//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={e => {
//                       e.stopPropagation();
//                       handleEditStockEntry(entry as StockEntry);
//                     }}
//                     className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
//                   >
//                     <Edit className="h-4 w-4" />
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent side="top" sideOffset={5}>
//                   <p>Edit {entry.material?.name || "stock entry"}</p>
//                 </TooltipContent>
//               </Tooltip>

//               <AlertDialog>
//                 <Tooltip>
//                   <AlertDialogTrigger asChild>
//                     <TooltipTrigger asChild>
//                       <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-700">
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </TooltipTrigger>
//                   </AlertDialogTrigger>
//                   <TooltipContent side="top" sideOffset={5}>
//                     <p>Delete {entry.material?.name || "stock entry"}</p>
//                   </TooltipContent>
//                 </Tooltip>
//                 <AlertDialogContent>
//                   <AlertDialogHeader>
//                     <AlertDialogTitle>Delete Stock Entry</AlertDialogTitle>
//                     <AlertDialogDescription>
//                       Are you sure you want to delete this stock entry? This action cannot be undone.
//                       {hasNegativeStock(entry) && (
//                         <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
//                           <strong>Warning:</strong> This entry has negative stock quantities.
//                         </div>
//                       )}
//                     </AlertDialogDescription>
//                   </AlertDialogHeader>
//                   <AlertDialogFooter>
//                     <AlertDialogCancel>Cancel</AlertDialogCancel>
//                     <AlertDialogAction onClick={() => handleDeleteStockEntry(entry.id)} className="bg-red-600 hover:bg-red-700">
//                       Delete
//                     </AlertDialogAction>
//                   </AlertDialogFooter>
//                 </AlertDialogContent>
//               </AlertDialog>
//             </div>
//           );
//         }
//       })
//     ],
//     [searchTerm, bulkSelectionMode, handleTogglePOSVisibility, handleOpenPrinterDialog, handleEditStockEntry, handleDeleteStockEntry, isAllowedPOSCategory, sortBy, sortOrder, handleSortChange, hasNegativeStock, renderQuantityDisplay, renderUnitDisplay]
//   );

//   return columns;
// }
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Material, StockEntry, StockEntryWithMaterial } from "@/types/inventory";
import { formatCleanCurrency } from "@/utils/numberFormatting";
import { highlightText } from "@/utils/highlightText";
import { AlertTriangle, Edit, Eye, EyeOff, Printer, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";

type StockEntriesTableColumnsProps = {
  searchTerm: string;
  bulkSelectionMode: boolean;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  handleSortChange: (sortBy: string, sortOrder: "ASC" | "DESC") => void;
  handleTogglePOSVisibility: (entry: StockEntry & { material?: Material }) => Promise<void>;
  handleOpenPrinterDialog: (entry: StockEntryWithMaterial) => void;
  handleEditStockEntry: (stockEntry: StockEntry) => void;
  handleDeleteStockEntry: (stockEntryId: string | number) => Promise<void>;
  isAllowedPOSCategory: (material: Material | undefined) => boolean;
  hasNegativeStock: (entry: StockEntryWithMaterial) => boolean;
  renderQuantityDisplay: (entry: StockEntryWithMaterial) => JSX.Element;
  renderUnitDisplay: (entry: StockEntryWithMaterial) => JSX.Element;
};

export function useStockEntriesTableColumns({ searchTerm, bulkSelectionMode, sortBy, sortOrder, handleSortChange, handleTogglePOSVisibility, handleOpenPrinterDialog, handleEditStockEntry, handleDeleteStockEntry, isAllowedPOSCategory, hasNegativeStock, renderQuantityDisplay, renderUnitDisplay }: StockEntriesTableColumnsProps) {
  const columnHelper = createColumnHelper<StockEntryWithMaterial>();

  const columns = useMemo<ColumnDef<StockEntryWithMaterial>[]>(
    () => [
      ...(bulkSelectionMode
        ? [
            columnHelper.display({
              id: "select",
              size: 50,
              header: ({ table }) => (
                <div className="flex items-center justify-center w-full">
                  <input 
                    type="checkbox" 
                    checked={table.getIsAllRowsSelected()} 
                    onChange={table.getToggleAllRowsSelectedHandler()} 
                    className="h-4 w-4" 
                    aria-label="Select all stock entries" 
                  />
                </div>
              ),
              cell: ({ row }) => (
                <div className="flex items-center justify-center w-full">
                  <input 
                    type="checkbox" 
                    checked={row.getIsSelected()} 
                    onChange={row.getToggleSelectedHandler()} 
                    className="h-4 w-4" 
                    aria-label={`Select ${row.original.material?.name || "stock entry"}`} 
                    onClick={e => e.stopPropagation()} 
                  />
                </div>
              ),
              enableSorting: false,
            })
          ]
        : []),

      // Use accessor instead of display for better typing
      columnHelper.accessor(row => row.material?.name || `Unknown Material (ID: ${row.materialId})`, {
        id: "materialName",
        header: () => (
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => {
                const newOrder = sortBy === "materialName" && sortOrder === "ASC" ? "DESC" : "ASC";
                handleSortChange("materialName", newOrder);
              }}
              className="text-xs h-auto p-0 font-semibold hover:bg-transparent hover:text-black flex items-center gap-1"
            >
              Material Name
              <span className="text-xs">{sortBy === "materialName" ? (sortOrder === "ASC" ? "↑" : "↓") : ""}</span>
            </Button>
          </div>
        ),
        cell: ({ row }) => {
          const entry = row.original;
          const materialName = entry.material?.name;
          const isNegativeStock = hasNegativeStock(entry);
          return (
            <div className="flex items-center gap-2 min-w-0">
              {isNegativeStock && <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />}
              <span className="truncate font-medium">
                {materialName ? highlightText(materialName, searchTerm) : `Unknown Material (ID: ${entry.materialId})`}
              </span>
            </div>
          );
        },
        enableSorting: false,
        size: 220,
        minSize: 180
      }),

      columnHelper.display({
        id: "remainingQty",
        header: () => (
          <div className="flex items-center justify-end w-full">
            <Button
              variant="ghost"
              onClick={() => {
                const newOrder = sortBy === "remainingQty" && sortOrder === "ASC" ? "DESC" : "ASC";
                handleSortChange("remainingQty", newOrder);
              }}
              className="text-xs h-auto p-0 font-semibold hover:bg-transparent hover:text-black flex items-center gap-1"
            >
              Current Qty
              <span className="text-xs">{sortBy === "remainingQty" ? (sortOrder === "ASC" ? "↑" : "↓") : ""}</span>
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-end w-full">
            {renderQuantityDisplay(row.original)}
          </div>
        ),
        enableSorting: false,
        size: 140,
        minSize: 120
      }),

      columnHelper.display({
        id: "unit",
        header: () => (
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="text-xs h-auto p-0 font-semibold hover:bg-transparent hover:text-black"
            >
              Base Unit
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center">
            {renderUnitDisplay(row.original)}
          </div>
        ),
        enableSorting: false,
        size: 120,
        minSize: 100
      }),

      columnHelper.accessor(row => row.costPerBaseUnit || row.costPerPurchasedUnit, {
        id: "costPerUnit",
        header: () => (
          <div className="flex items-center justify-end w-full">
            <Button
              variant="ghost"
              onClick={() => {
                const newOrder = sortBy === "costPerBaseUnit" && sortOrder === "ASC" ? "DESC" : "ASC";
                handleSortChange("costPerBaseUnit", newOrder);
              }}
              className="text-xs h-auto p-0 font-semibold hover:bg-transparent hover:text-black flex items-center gap-1"
            >
              Unit Cost
              <span className="text-xs">{sortBy === "costPerBaseUnit" ? (sortOrder === "ASC" ? "↑" : "↓") : ""}</span>
            </Button>
          </div>
        ),
        cell: ({ row }) => {
          const entry = row.original;
          const cost = entry.costPerBaseUnit || entry.costPerPurchasedUnit;
          const unit = entry.material?.baseUnit || entry.purchasedUnit;

          return (
            <div className="flex flex-col items-end w-full">
              <div className="font-medium">{formatCleanCurrency(cost)}</div>
              <div className="text-xs text-muted-foreground">(per {unit})</div>
            </div>
          );
        },
        enableSorting: false,
        size: 140,
        minSize: 120
      }),

      columnHelper.accessor("totalCost", {
        id: "totalCost",
        header: () => (
          <div className="flex items-center justify-end w-full">
            <Button
              variant="ghost"
              onClick={() => {
                const newOrder = sortBy === "totalCost" && sortOrder === "ASC" ? "DESC" : "ASC";
                handleSortChange("totalCost", newOrder);
              }}
              className="text-xs h-auto p-0 font-semibold hover:bg-transparent hover:text-black flex items-center gap-1"
            >
              Total Cost
              <span className="text-xs">{sortBy === "totalCost" ? (sortOrder === "ASC" ? "↑" : "↓") : ""}</span>
            </Button>
          </div>
        ),
        cell: ({ getValue }) => (
          <div className="flex justify-end w-full">
            <span className="font-medium">{formatCleanCurrency(getValue())}</span>
          </div>
        ),
        enableSorting: false,
        size: 140,
        minSize: 120
      }),

      columnHelper.accessor("purchaseDate", {
        id: "purchaseDate",
        header: () => (
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => {
                const newOrder = sortBy === "purchaseDate" && sortOrder === "ASC" ? "DESC" : "ASC";
                handleSortChange("purchaseDate", newOrder);
              }}
              className="text-xs h-auto p-0 font-semibold hover:bg-transparent hover:text-black flex items-center gap-1"
            >
              Purchase Date
              <span className="text-xs">{sortBy === "purchaseDate" ? (sortOrder === "ASC" ? "↑" : "↓") : ""}</span>
            </Button>
          </div>
        ),
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-700">
            {getValue() ? new Date(getValue()).toLocaleDateString() : "-"}
          </div>
        ),
        enableSorting: false,
        size: 150,
        minSize: 130
      }),

      columnHelper.display({
        id: "actions",
        header: () => (
          <div className="flex items-center justify-end w-full pr-6 text-xs font-semibold">
            Actions
          </div>
        ),
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <div className="flex items-center justify-end w-full gap-1 pr-6">
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={entry.isPOSItem ? "default" : "outline"}
                      size="sm"
                      disabled={!isAllowedPOSCategory(entry.material)}
                      onClick={e => {
                        e.stopPropagation();
                        handleTogglePOSVisibility(entry);
                      }}
                      className={`h-8 w-8 p-0 ${!isAllowedPOSCategory(entry.material) ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400" : entry.isPOSItem ? "bg-teal-600 hover:bg-teal-700 text-white" : "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"}`}
                    >
                      {entry.isPOSItem ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{!isAllowedPOSCategory(entry.material) ? "Only beverage items can be shown in POS" : entry.isPOSItem ? "Hide from POS" : "Show in POS"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleOpenPrinterDialog(entry);
                      }}
                      className={`h-8 w-8 p-0 ${entry.assignedPrinter ? "border-blue-500 text-blue-600" : "hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"}`}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{entry.assignedPrinter ? `Assigned to: ${entry.assignedPrinter.name}` : "Assign printer to " + (entry.material?.name || "stock entry")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleEditStockEntry(entry as StockEntry);
                      }}
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit {entry.material?.name || "stock entry"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <AlertDialog>
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <AlertDialogTrigger asChild>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                    </AlertDialogTrigger>
                    <TooltipContent>
                      <p>Delete {entry.material?.name || "stock entry"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Stock Entry</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this stock entry? This action cannot be undone.
                      {hasNegativeStock(entry) && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                          <strong>Warning:</strong> This entry has negative stock quantities.
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteStockEntry(entry.id)} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
        enableSorting: false,
        size: 160,
        minSize: 140,
        enableResizing: false,
      })
    ],
    [searchTerm, bulkSelectionMode, handleTogglePOSVisibility, handleOpenPrinterDialog, handleEditStockEntry, handleDeleteStockEntry, isAllowedPOSCategory, sortBy, sortOrder, handleSortChange, hasNegativeStock, renderQuantityDisplay, renderUnitDisplay]
  );

  return columns;
}