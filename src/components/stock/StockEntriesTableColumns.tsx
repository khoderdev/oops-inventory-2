import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

export function useStockEntriesTableColumns({
  searchTerm,
  bulkSelectionMode,
  sortBy,
  sortOrder,
  handleSortChange,
  handleTogglePOSVisibility,
  handleOpenPrinterDialog,
  handleEditStockEntry,
  handleDeleteStockEntry,
  isAllowedPOSCategory,
  hasNegativeStock,
  renderQuantityDisplay,
  renderUnitDisplay,
}: StockEntriesTableColumnsProps) {
  const columnHelper = createColumnHelper<StockEntryWithMaterial>();

  const columns = useMemo<ColumnDef<StockEntryWithMaterial>[]>(
    () => [
      ...(bulkSelectionMode
        ? [
            columnHelper.display({
              id: "select",
              size: 50,
              header: ({ table }) => <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} className="h-4 w-4" aria-label="Select all stock entries" />,
              cell: ({ row }) => <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="h-4 w-4 " aria-label={`Select ${row.original.material?.name || "stock entry"}`} onClick={e => e.stopPropagation()} />
            })
          ]
        : []),

      columnHelper.display({
        id: "materialName",
        size: 220,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "materialName" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("materialName", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent justify-start bg-green-400"
          >
            Material Name
            <span className="text-xs">{sortBy === "materialName" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ row }) => {
          const entry = row.original;
          const materialName = entry.material?.name;
          const isNegativeStock = hasNegativeStock(entry);
          return (
            <div className="flex items-center gap-2 w-full border border-green-400">
              {isNegativeStock && <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />}
              <span className="truncate font-medium">{materialName ? highlightText(materialName, searchTerm) : `Unknown Material (ID: ${entry.materialId})`}</span>
            </div>
          );
        },
        enableSorting: false
      }),

      columnHelper.display({
        id: "remainingQty",
        size: 120,
        header: ({ column }) => <div className="text-center w-full font-semibold flex items-center justify-center bg-teal-400">Current Qty</div>,
        cell: ({ row }) => <div className="text-center w-full flex items-center justify-center -ml-2 border border-teal-400">{renderQuantityDisplay(row.original)}</div>
      }),

      columnHelper.display({
        id: "unit",
        size: 120,
        header: ({ column }) => <div className="text-center font-semibold bg-orange-400">Base Unit</div>,
        cell: ({ row }) => <div className="text-center w-full border border-orange-400">{renderUnitDisplay(row.original)}</div>
      }),

      columnHelper.accessor("costPerPurchasedUnit", {
        id: "costPerUnit",
        size: 150,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "costPerPurchasedUnit" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("costPerPurchasedUnit", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent justify-start bg-blue-400"
          >
            Unit Cost
            <span className="text-xs">{sortBy === "costPerPurchasedUnit" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ row, getValue }) => {
          const cost = getValue();
          const entry = row.original;
          const purchasedUnit = entry.purchasedUnit;
          
          return (
            <div className="flex items-center justify-start space-y-1 gap-2 w-full border border-blue-400">
              <div className="font-medium text-left">{formatCleanCurrency(cost)}</div>
              <div className="text-xs text-muted-foreground text-left">(per {purchasedUnit})</div>
            </div>
          );
        },
        enableSorting: false
      }),

      columnHelper.accessor("totalCost", {
        id: "totalCost",
        size: 10,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "totalCost" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("totalCost", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent justify-start bg-yellow-400"
          >
            Total Cost
            <span className="text-xs">{sortBy === "totalCost" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="text-left w-full px-2 border border-yellow-400">
            <span className="font-medium">{formatCleanCurrency(getValue())}</span>
          </div>
        ),
        enableSorting: false
      }),

      columnHelper.accessor("purchaseDate", {
        id: "purchaseDate",
        size: 80,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const newOrder = sortBy === "purchaseDate" && sortOrder === "ASC" ? "DESC" : "ASC";
              handleSortChange("purchaseDate", newOrder);
            }}
            className="h-auto p-0 font-semibold hover:bg-transparent justify-start bg-purple-400"
          >
            Purchase Date
            <span className="text-xs">{sortBy === "purchaseDate" ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}</span>
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="text-left w-full px-2 border border-purple-400">
            <span className="font-medium">{new Date(getValue()).toLocaleDateString()}</span>
          </div>
        ),
        enableSorting: false
      }),

      columnHelper.display({
        id: "actions",
        size: 140,
        enableSorting: false,
        header: ({ column }) => <div className="text-left font-semibold  bg-red-400">Actions</div>,
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <div className="flex items-center justify-start gap-1 border border-red-400">
              <Tooltip>
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
                <TooltipContent side="top" sideOffset={5}>
                  <p>{!isAllowedPOSCategory(entry.material) ? "Only beverage items can be shown in POS" : entry.isPOSItem ? "Hide from POS" : "Show in POS"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
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
                <TooltipContent side="top" sideOffset={5}>
                  <p>{entry.assignedPrinter ? `Assigned to: ${entry.assignedPrinter.name}` : "Assign printer to " + (entry.material?.name || "stock entry")}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
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
                <TooltipContent side="top" sideOffset={5}>
                  <p>Edit {entry.material?.name || "stock entry"}</p>
                </TooltipContent>
              </Tooltip>

              <AlertDialog>
                <Tooltip>
                  <AlertDialogTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                  </AlertDialogTrigger>
                  <TooltipContent side="top" sideOffset={5}>
                    <p>Delete {entry.material?.name || "stock entry"}</p>
                  </TooltipContent>
                </Tooltip>
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
        }
      })
    ],
    [
      searchTerm,
      bulkSelectionMode,
      handleTogglePOSVisibility,
      handleOpenPrinterDialog,
      handleEditStockEntry,
      handleDeleteStockEntry,
      isAllowedPOSCategory,
      sortBy,
      sortOrder,
      handleSortChange,
      hasNegativeStock,
      renderQuantityDisplay,
      renderUnitDisplay,
    ]
  );

  return columns;
}
