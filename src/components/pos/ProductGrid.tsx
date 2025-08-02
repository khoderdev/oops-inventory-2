import { Card, CardContent } from "@/components/ui/card";
import { ProductGridProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Package, ShoppingCart } from "lucide-react";
import React from "react";

export const ProductGrid: React.FC<ProductGridProps> = ({ posItems, onAddToCart, rightPanelPixelWidth = 0 }) => {
  // Determine grid columns based on right panel width
  // Responsive breakpoints for right panel:
  // ≤ 400px: 2 columns (very narrow)
  // 401-600px: 3 columns (narrow)
  // 601-800px: 4 columns (medium)
  // 801-1000px: 5 columns (wide)
  // > 1000px: 6 columns (very wide)
  const getGridColumns = (width: number) => {
    if (width <= 400) return "grid-cols-2";
    if (width <= 600) return "grid-cols-3";
    if (width <= 800) return "grid-cols-4";
    if (width <= 1000) return "grid-cols-5";
    return "grid-cols-6";
  };

  const gridColumns = getGridColumns(rightPanelPixelWidth);

  // Debug: Log the panel width and grid decision
  React.useEffect(() => {
    console.log("🎯 ProductGrid RESPONSIVE DEBUG:", {
      rightPanelWidth: rightPanelPixelWidth,
      gridColumns: gridColumns,
      breakpoints: {
        "≤400px": "2 cols",
        "401-600px": "3 cols",
        "601-800px": "4 cols",
        "801-1000px": "5 cols",
        ">1000px": "6 cols"
      },
      currentLayout: rightPanelPixelWidth <= 400 ? "2 cols" : rightPanelPixelWidth <= 600 ? "3 cols" : rightPanelPixelWidth <= 800 ? "4 cols" : rightPanelPixelWidth <= 1000 ? "5 cols" : "6 cols"
    });
  }, [rightPanelPixelWidth, gridColumns]);

  return (
    <div className="flex-1 p-2 sm:p-4 overflow-y-auto safe-area-padding">
      <div className={`grid gap-3 sm:gap-4 lg:gap-5 ${gridColumns}`}>
        {/* Unified POS Items */}
        {posItems.map(item => (
          <Card key={item.id} className="items-card cursor-pointer select-none transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 border-gray-200 hover:border-primary rounded-lg bg-white/80 backdrop-blur-sm btn-touch" onClick={() => onAddToCart(item)}>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm">{item.type === "menu_item" ? <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> : <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}</div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 line-clamp-2 leading-tight">{item.name}</h4>
              <p className="text-xs text-gray-500 mb-2 truncate">
                {item.availableQuantity} {item.unit} available
              </p>
              <p className="text-sm sm:text-base font-bold text-primary">{formatCurrency(item.price)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {posItems.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Package className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No products available</p>
          <p className="text-sm text-center max-w-sm">No products match your current filter. Try selecting a different category.</p>
        </div>
      )}
    </div>
  );
};
