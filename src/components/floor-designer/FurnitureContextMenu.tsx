import { Copy, Link, Move, Trash2, Unlink } from "lucide-react";
import React from "react";
import { FurnitureItem } from "../../types/floor-plan";

interface FurnitureContextMenuProps {
  furniture: FurnitureItem;
  position: { x: number; y: number };
  onClose: () => void;
  onLinkToTable: (chairId: string, tableId: string) => void;
  onUnlinkFromTable: (chairId: string) => void;
  onMoveWithChairs: (tableId: string) => void;
  onDuplicate: (furnitureId: string) => void;
  onDelete: (furnitureId: string) => void;
  availableTables: FurnitureItem[];
  childChairs: FurnitureItem[];
  parentTable: FurnitureItem | null;
}

export const FurnitureContextMenu: React.FC<FurnitureContextMenuProps> = ({ furniture, position, onClose, onLinkToTable, onUnlinkFromTable, onMoveWithChairs, onDuplicate, onDelete, availableTables, childChairs, parentTable }) => {
  const isTable = ["round-table", "square-table", "rectangular-table", "booth"].includes(furniture.type);
  const isChair = furniture.type === "chair";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Context Menu */}
      <div
        className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-48"
        style={{
          left: position.x,
          top: position.y
        }}
      >
        <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">{furniture.name}</div>

        {/* Chair-specific options */}
        {isChair && (
          <>
            {!parentTable && availableTables.length > 0 && (
              <div className="px-1 py-1">
                <div className="px-3 py-1 text-xs text-gray-500">Link to Table</div>
                {availableTables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => {
                      onLinkToTable(furniture.id, table.id);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Link className="w-4 h-4" />
                    {table.name}
                  </button>
                ))}
              </div>
            )}

            {parentTable && (
              <button
                onClick={() => {
                  onUnlinkFromTable(furniture.id);
                  onClose();
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <Unlink className="w-4 h-4" />
                Unlink from {parentTable.name}
              </button>
            )}
          </>
        )}

        {/* Table-specific options */}
        {isTable && childChairs.length > 0 && (
          <button
            onClick={() => {
              onMoveWithChairs(furniture.id);
              onClose();
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Move className="w-4 h-4" />
            Move with {childChairs.length} chair{childChairs.length !== 1 ? "s" : ""}
          </button>
        )}

        {/* Universal options */}
        <div className="border-t border-gray-100 mt-1 pt-1">
          <button
            onClick={() => {
              onDuplicate(furniture.id);
              onClose();
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>

          <button
            onClick={() => {
              onDelete(furniture.id);
              onClose();
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete{isTable && childChairs.length > 0 ? ` (+ ${childChairs.length} chairs)` : ""}
          </button>
        </div>
      </div>
    </>
  );
};
