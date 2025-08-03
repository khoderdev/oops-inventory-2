import { Copy, Link, RotateCw, Trash2, Users } from "lucide-react";
import React from "react";
import { FurnitureItem } from "../../types/floor-plan";

interface PropertiesPanelProps {
  selectedFurniture: FurnitureItem | null;
  onUpdateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  onDeleteFurniture: (id: string) => void;
  onDuplicateFurniture: (id: string) => void;
  parentTable?: FurnitureItem | null;
  childChairs?: FurnitureItem[];
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedFurniture, onUpdateFurniture, onDeleteFurniture, onDuplicateFurniture, parentTable, childChairs = [] }) => {
  if (!selectedFurniture) {
    return (
      <div className="w-60 h-full bg-white border-l border-gray-200 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="font-medium mb-2">No Item Selected</h3>
            <p className="text-sm">Select a furniture item to view and edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  const handleRotate = () => {
    const newRotation = (selectedFurniture.rotation + 90) % 360;
    onUpdateFurniture(selectedFurniture.id, { rotation: newRotation });
  };

  const handleDimensionChange = (dimension: "width" | "height", value: number) => {
    onUpdateFurniture(selectedFurniture.id, {
      dimensions: {
        ...selectedFurniture.dimensions,
        [dimension]: Math.max(10, value)
      }
    });
  };

  const handleColorChange = (color: string) => {
    onUpdateFurniture(selectedFurniture.id, { color });
  };

  const handleNameChange = (name: string) => {
    onUpdateFurniture(selectedFurniture.id, { name });
  };

  const presetColors = ["#8B4513", "#654321", "#800000", "#2F4F4F", "#4A4A4A", "#708090", "#B8860B", "#CD853F", "#A0522D", "#8FBC8F", "#20B2AA", "#4682B4"];

  return (
    <div className="w-60 h-full bg-white border-l border-gray-200 flex flex-col">
      <div className="p-2 border-b border-gray-200 shrink-0">
        <h2 className="text-xl font-semibold text-slate-800">Properties</h2>
        <p className="text-sm text-gray-600 mt-1">Customize selected item</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-6 min-h-0">
        {/* Item Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
          <input type="text" value={selectedFurniture.name} onChange={e => handleNameChange(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
        </div>

        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Dimensions (inches)</label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Width</label>
              <input type="number" value={selectedFurniture.dimensions.width} onChange={e => handleDimensionChange("width", parseInt(e.target.value) || 0)} min="10" className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Height</label>
              <input type="number" value={selectedFurniture.dimensions.height} onChange={e => handleDimensionChange("height", parseInt(e.target.value) || 0)} min="10" className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
            </div>
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Position</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X</label>
              <input
                type="number"
                value={Math.round(selectedFurniture.position.x)}
                onChange={e =>
                  onUpdateFurniture(selectedFurniture.id, {
                    position: { ...selectedFurniture.position, x: parseInt(e.target.value) || 0 }
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedFurniture.position.y)}
                onChange={e =>
                  onUpdateFurniture(selectedFurniture.id, {
                    position: { ...selectedFurniture.position, y: parseInt(e.target.value) || 0 }
                  })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Color</label>
          <div className="grid grid-cols-6 gap-2 mb-3">
            {presetColors.map(color => (
              <button key={color} onClick={() => handleColorChange(color)} className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${selectedFurniture.color === color ? "border-amber-500 ring-2 ring-amber-200" : "border-gray-300 hover:border-gray-400"}`} style={{ backgroundColor: color }} />
            ))}
          </div>
          <input type="color" value={selectedFurniture.color} onChange={e => handleColorChange(e.target.value)} className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer" />
        </div>

        {/* Seating Capacity */}
        {selectedFurniture.seatingCapacity && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seating Capacity</label>
            <input
              type="number"
              value={selectedFurniture.seatingCapacity}
              onChange={e =>
                onUpdateFurniture(selectedFurniture.id, {
                  seatingCapacity: Math.max(1, parseInt(e.target.value) || 1)
                })
              }
              min="1"
              className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Relationships */}
        {(parentTable || childChairs.length > 0) && (
          <div className="pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">Relationships</label>
            <div className="space-y-2">
              {parentTable && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <Link className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Linked to: <strong>{parentTable.name}</strong>
                  </span>
                </div>
              )}
              {childChairs.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    {childChairs.length} chair{childChairs.length !== 1 ? "s" : ""} linked
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-6 border-t border-gray-200">
          <button onClick={handleRotate} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200">
            <RotateCw className="w-4 h-4" />
            Rotate 90°
          </button>

          <button onClick={() => onDuplicateFurniture(selectedFurniture.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors duration-200">
            <Copy className="w-4 h-4" />
            Duplicate
          </button>

          <button onClick={() => onDeleteFurniture(selectedFurniture.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
