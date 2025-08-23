import React from "react";
import { MenuItem, MenuItemIngredient } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Button } from "@/components/ui/button";
import { Edit, Eye, EyeOff, ImageIcon, Printer, Trash2 } from "lucide-react";

interface MenuItemCardViewProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onTogglePosVisibility: (id: string, visible: boolean) => void;
  onPrinterAssignment: (item: MenuItem) => void;
  onSelect?: (id: string, selected: boolean) => void;
  selectedItems?: Set<string>;
  bulkSelectionMode?: boolean;
  highlightSearchTerm?: (text: string) => React.ReactNode;
  categories: { value: string; name: string }[];
  calculateMenuItemCost?: (ingredients: MenuItemIngredient[]) => number;
}

const MenuItemCardView: React.FC<MenuItemCardViewProps> = ({ items, onEdit, onDelete, onTogglePosVisibility, onPrinterAssignment, onSelect, selectedItems = new Set(), bulkSelectionMode = false, highlightSearchTerm, categories, calculateMenuItemCost }) => {
  return (
    <div className="grid grid-cols-1 gap-4 pb-4 overflow-y-auto">
      {items.map(item => {
        const isSelected = selectedItems.has(item.id);
        const categoryName = categories.find(c => c.value === item.category)?.name || (typeof item.category === "object" && item.category?.name ? item.category.name : typeof item.category === "string" || typeof item.category === "number" ? String(item.category) : "Uncategorized");

        return (
          <div key={item.id} className={`border rounded-lg overflow-hidden shadow-sm transition-all ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`} onClick={() => bulkSelectionMode && onSelect && onSelect(item.id, !isSelected)}>
            <div className="flex items-center p-3">
              {bulkSelectionMode && (
                <div className="mr-3">
                  <input type="checkbox" checked={isSelected} onChange={e => onSelect && onSelect(item.id, e.target.checked)} onClick={e => e.stopPropagation()} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                </div>
              )}

              <div className="flex-shrink-0 h-16 w-16 mr-3 relative bg-gray-100 rounded overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    onError={e => {
                      (e.target as HTMLImageElement).src = "/placeholder-food.png";
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">{highlightSearchTerm ? highlightSearchTerm(item.name) : item.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{categoryName}</p>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{formatCurrency(item.price)}</span>
                  {item.ingredients &&
                    item.ingredients.length > 0 &&
                    calculateMenuItemCost &&
                    (() => {
                      const cost = calculateMenuItemCost(item.ingredients);
                      return cost > 0 ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Cost: {formatCurrency(cost)}</span> : null;
                    })()}
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={e => {
                    e.stopPropagation();
                    onTogglePosVisibility(item.id, !item.isPOSItem);
                  }}
                >
                  {item.isPOSItem ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={e => {
                    e.stopPropagation();
                    onPrinterAssignment(item);
                  }}
                >
                  <Printer className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={e => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {item.ingredients && item.ingredients.length > 0 && (
              <div className="px-3 pb-3 pt-0">
                <p className="text-xs text-gray-500 mb-1">Ingredients:</p>
                <div className="flex flex-wrap gap-1">
                  {item.ingredients.slice(0, 3).map(ing => (
                    <span key={ing.materialId} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {ing.materialId}
                    </span>
                  ))}
                  {item.ingredients.length > 3 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">+{item.ingredients.length - 3} more</span>}
                  {item.ingredients &&
                    item.ingredients.length > 0 &&
                    calculateMenuItemCost &&
                    (() => {
                      const cost = calculateMenuItemCost(item.ingredients);
                      return cost > 0 ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Cost: {formatCurrency(cost)}</span> : null;
                    })()}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MenuItemCardView;
