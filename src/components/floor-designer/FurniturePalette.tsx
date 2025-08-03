import React from "react";
import { FurnitureTemplate } from "../../types/floor-plan";
import { furnitureTemplates } from "./furniture-templates";

interface FurniturePaletteProps {
  onAddFurniture: (template: FurnitureTemplate) => void;
}

export const FurniturePalette: React.FC<FurniturePaletteProps> = ({ onAddFurniture }) => {
  const categories = {
    tables: furnitureTemplates.filter(t => t.category === "tables"),
    seating: furnitureTemplates.filter(t => t.category === "seating"),
    service: furnitureTemplates.filter(t => t.category === "service")
  };

  return (
    <div className="w-52 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-slate-800">Furniture Library</h2>
        <p className="text-sm text-gray-600 mt-1">Drag items onto the floor plan</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(categories).map(([categoryName, items]) => (
          <div key={categoryName}>
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-3">{categoryName}</h3>
            <div className="grid grid-cols-2 gap-3">
              {items.map(template => (
                <button key={template.type} onClick={() => onAddFurniture(template)} className="p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-all duration-200 group">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{template.icon}</div>
                  <div className="text-xs font-medium text-gray-700 mb-1">{template.name}</div>
                  {template.seatingCapacity && <div className="text-xs text-gray-500">Seats {template.seatingCapacity}</div>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
