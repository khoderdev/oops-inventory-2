import React, { useMemo } from "react";
import { MenuItem, MenuItemCategory } from "@/types/inventory";
import { createColumnHelper } from "@tanstack/react-table";
import { Button } from "../../ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "../../ui/tooltip";
import { Eye, Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/utils/conversionLogic";

interface BeveragesMenuColumnsProps {
  categories: any[];
  bulkSelectionMode: boolean;
  handleTogglePOSVisibility: (item: MenuItem) => void;
  handleEditBeverageItem: (item: MenuItem) => void;
  handleDeleteBeverageItem: (id: string) => void;
}

export const useBeveragesMenuColumns = ({
  categories,
  bulkSelectionMode,
  handleTogglePOSVisibility,
  handleEditBeverageItem,
  handleDeleteBeverageItem
}: BeveragesMenuColumnsProps) => {
  const columnHelper = createColumnHelper<MenuItem>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => <div className="flex items-center justify-center">{bulkSelectionMode && <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} className="h-4 w-4" />}</div>,
        cell: ({ row }) => <div className="flex items-center justify-center">{bulkSelectionMode && <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="h-4 w-4" />}</div>,
        size: 40
      }),
      columnHelper.accessor("image", {
        header: "Image",
        cell: info => (
          <div className="flex items-center">
            {info.getValue() ? (
              <img src={info.getValue()} alt="Beverage" className="w-16 h-20 object-contain rounded-md border border-gray-200" />
            ) : (
              <div className="w-14 h-14 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No Image</span>
              </div>
            )}
          </div>
        ),
        size: 80
      }),
      columnHelper.accessor("name", {
        header: "Name",
        cell: info => <div className="font-medium">{info.getValue()}</div>,
        size: 200
      }),

      // Category column
      columnHelper.accessor(
        row => {
          if (typeof row.category === "string") {
            return row.category;
          } else if (typeof row.category === "object" && row.category?.name) {
            return row.category.name;
          } else if (typeof row.category === "number") {
            const categoryObj = categories.find(c => c.id === row.category);
            return categoryObj?.value || "Unknown";
          }
          return "Unknown";
        },
        {
          id: "category",
          header: "Category",
          cell: info => <div>{info.getValue()}</div>,
          size: 150
        }
      ),

      // Price column
      columnHelper.accessor("price", {
        header: "Price",
        cell: info => <div>{formatCurrency(info.getValue())}</div>,
        size: 100
      }),

      // Actions column
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
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
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleEditBeverageItem(row.original);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit {row.original.name}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteBeverageItem(row.original.id);
                  }}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete {row.original.name}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ),
        size: 120
      })
    ],
    [categories, bulkSelectionMode, handleTogglePOSVisibility, handleEditBeverageItem, handleDeleteBeverageItem]
  );

  return { columns, columnHelper };
};
