import { Card, CardContent } from "@/components/ui/card";
import { ProductGridProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Package, ShoppingCart } from "lucide-react";
import React from "react";

export const ProductGrid: React.FC<ProductGridProps> = ({ posItems, onAddToCart, rightPanelPixelWidth = 0 }) => {
  const getGridColumns = (width: number) => {
    if (width <= 400) return "grid-cols-2";
    if (width <= 600) return "grid-cols-3";
    if (width <= 800) return "grid-cols-4";
    if (width <= 1000) return "grid-cols-5";
    return "grid-cols-6";
  };

  const gridColumns = getGridColumns(rightPanelPixelWidth);

  return (
    <div className="flex-1 p-2 sm:p-4 overflow-y-auto safe-area-padding">
      <div className={`grid gap-3 sm:gap-4 lg:gap-5 ${gridColumns}`}>
        {/* Unified POS Items */}
        {posItems.map(item => (
          <Card key={item.id} className="items-card cursor-pointer select-none transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 border-gray-200 hover:border-primary rounded-lg bg-white/80 backdrop-blur-sm btn-touch" onClick={() => onAddToCart(item)}>
            <CardContent className="p-3 sm:p-4 text-center">
              {/* Image or Icon Display */}
              <div className="w-16 h-16 sm:w-full sm:h-full mx-auto mb-2 sm:mb-3 rounded-lg overflow-hidden flex items-center justify-center">
                {item.type === "menu_item" && item.image ? (
                  <img
                    src={item.image.startsWith("data:") ? item.image : `http://localhost:5000${item.image}`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      // Fallback to icon if image fails to load
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full flex items-center justify-center">${
                          item.type === "menu_item"
                            ? '<svg class="w-6 h-6 sm:w-8 sm:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path></svg>'
                            : '<svg class="w-6 h-6 sm:w-8 sm:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>'
                        }</div>`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">{item.type === "menu_item" ? <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> : <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />}</div>
                )}
              </div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 line-clamp-2 leading-tight">{item.name}</h4>
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
