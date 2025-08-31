import { MenuItem } from "@/types/inventory";
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Eye, Package, Printer, Trash2 } from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { highlightText } from "@/utils/highlightText";
import { MenuItemColumnsProps } from "@/types/menuItems";

export const useMenuItemColumns = ({ searchTerm, categories, calculateMenuItemCost, handleTogglePOSVisibility, handleOpenPrinterDialog, handleDeleteMenuItem, setEditingMenuItem, setShowMenuItemForm }: MenuItemColumnsProps): ColumnDef<MenuItem>[] => {
  const columnHelper = createColumnHelper<MenuItem>();

  return [
    columnHelper.display({
      id: "select",
      header: ({ table }) => <input type="checkbox" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} className="h-4 w-4" aria-label="Select all menu items" />,
      cell: ({ row }) => <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="h-4 w-4" aria-label={`Select ${row.original.name}`} />,
      enableSorting: false,
      enableHiding: false,
      size: 48
    }),

    columnHelper.display({
      id: "image",
      header: "Image",
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.image ? (
            <img src={row.original.image} alt={row.original.name} className="w-12 h-12 object-cover rounded-md border" />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-md border flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
      ),
      enableSorting: false,
      size: 80
    }),

    // Name column
    columnHelper.accessor("name", {
      header: "Name",
      cell: ({ getValue }) => <div className="font-medium">{highlightText(getValue(), searchTerm)}</div>,
      size: 200
    }),

    columnHelper.accessor("category", {
      header: "Category",
      cell: ({ getValue }) => {
        const category = getValue();
        let categoryLabel;
        if (typeof category === "object" && category !== null) {
          categoryLabel = category.name || "Uncategorized";
        } else if (typeof category === "string") {
          const matchingCategory = categories.find(c => c.value === category) || categories.find(c => c.name?.toLowerCase() === category.toLowerCase());
          categoryLabel = matchingCategory?.name || category || "Uncategorized";
        } else if (typeof category === "number") {
          const matchingCategory = categories.find(c => c.id === category);
          categoryLabel = matchingCategory?.name || "Uncategorized";
        } else {
          categoryLabel = "Uncategorized";
        }
        return <span>{String(categoryLabel)}</span>;
      },
      size: 128
    }),

    // Ingredients column
    columnHelper.display({
      id: "ingredients",
      header: "Ingredients",
      cell: ({ row }) => {
        // Count both materials and sauces
        const materialCount = row.original.menuItemIngredients?.length || 0;
        const sauceCount = row.original.menuItemSauces?.length || 0;
        return <div className="text-left font-medium">{materialCount + sauceCount}</div>;
      },
      enableSorting: false,
      size: 100
    }),


    // Price column
    columnHelper.accessor("price", {
      header: "Price",
      cell: ({ getValue }) => <div className="text-left font-medium">{formatCurrency(getValue())}</div>,
      size: 96
    }),

    // Profit column
    columnHelper.display({
      id: "profit",
      header: "Profit",
      cell: ({ row }) => {
        const totalCost = calculateMenuItemCost(row.original.ingredients || []);
        const profit = row.original.price - totalCost;
        const profitMargin = row.original.price && row.original.price > 0 ? (profit / row.original.price) * 100 : 0;
        return (
          <div className={`text-left font-medium ${profit >= 0 ? "text-teal-600" : "text-red-600"}`}>
            <div>{formatCurrency(profit)}</div>
            <div className="text-xs">({formatNumber(isNaN(profitMargin) ? 0 : profitMargin)}%)</div>
          </div>
        );
      },
      size: 112
    }),

    // Actions column
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-start">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={row.original.isPOSItem ? "default" : "outline"}
                className={row.original.isPOSItem ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
                onClick={e => {
                  e.stopPropagation();
                  handleTogglePOSVisibility(row.original);
                }}
                aria-label={`${row.original.isPOSItem ? "Hide from" : "Show in"} POS`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{row.original.isPOSItem ? "Hide from POS" : "Show in POS"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={e => {
                  e.stopPropagation();
                  handleOpenPrinterDialog(row.original);
                }}
                aria-label={`Assign printer to ${row.original.name}`}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Assign printer to {row.original.name}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={e => {
                  e.stopPropagation();
                  setEditingMenuItem(row.original);
                  setShowMenuItemForm(true);
                }}
                aria-label={`Edit ${row.original.name}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit {row.original.name}</p>
            </TooltipContent>
          </Tooltip>

          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${row.original.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete {row.original.name}</p>
              </TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete "{row.original.name}" and cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteMenuItem(row.original.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
      enableSorting: false,
      size: 160
    })
  ];
};

export default useMenuItemColumns;
