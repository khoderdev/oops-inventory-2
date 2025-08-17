import * as ContextMenu from "@radix-ui/react-context-menu";
import { Edit3, Move, RefreshCw, Trash2 } from "lucide-react";
import React from "react";
import { Table } from "@/types/inventory";

interface TableContextMenuProps {
  table: Table | null;
  tableOrders: Record<string, number>;
  onRename: (table: Table) => void;
  onTransfer: (table: Table) => void;
  onClear: (table: Table) => void;
  onDelete: (table: Table) => void;
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export const TableContextMenu = ({
  table,
  tableOrders,
  onRename,
  onTransfer,
  onClear,
  onDelete,
  children,
  onOpenChange
}: TableContextMenuProps) => {
  return (
    <ContextMenu.Root onOpenChange={onOpenChange}>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content 
          className="min-w-[220px] bg-white rounded-md overflow-hidden p-1 shadow-lg border border-gray-200 z-[9999]"
          onContextMenu={(e) => e.preventDefault()}
        >
          {table && (
            <>
              <ContextMenu.Label className="px-2 py-1 text-sm font-medium text-gray-700">
                Table {table.number}
              </ContextMenu.Label>
              <ContextMenu.Separator className="h-px bg-gray-200 m-1" />

              <ContextMenu.Item 
                className="text-sm text-gray-700 flex items-center px-2 py-1.5 rounded hover:bg-gray-100 outline-none cursor-pointer"
                onClick={() => onRename(table)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Rename Table
              </ContextMenu.Item>

              {(table.status === "opened" || table.currentOrder || tableOrders[table.number?.toString()]) && (
                <ContextMenu.Item 
                  className="text-sm text-gray-700 flex items-center px-2 py-1.5 rounded hover:bg-gray-100 outline-none cursor-pointer"
                  onClick={() => onTransfer(table)}
                >
                  <Move className="w-4 h-4 mr-2" />
                  Transfer Order
                </ContextMenu.Item>
              )}

              <ContextMenu.Item 
                className={`text-sm flex items-center px-2 py-1.5 rounded outline-none cursor-pointer ${
                  table.status !== "opened" && table.status !== "reserved" 
                    ? "text-gray-400 cursor-not-allowed" 
                    : "text-orange-600 hover:bg-orange-50"
                }`}
                onClick={() => (table.status === "opened" || table.status === "reserved") && onClear(table)}
                disabled={table.status !== "opened" && table.status !== "reserved"}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Table
              </ContextMenu.Item>

              <ContextMenu.Separator className="h-px bg-gray-200 m-1" />

              <ContextMenu.Item 
                className={`text-sm flex items-center px-2 py-1.5 rounded outline-none cursor-pointer ${
                  table.status === "opened" 
                    ? "text-gray-400 cursor-not-allowed" 
                    : "text-red-600 hover:bg-red-50"
                }`}
                onClick={() => table.status !== "opened" && onDelete(table)}
                disabled={table.status === "opened"}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Table
              </ContextMenu.Item>
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};