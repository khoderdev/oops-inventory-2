import { Card, CardContent } from "@/components/ui/card";
import { ProductGridProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Package, ShoppingCart } from "lucide-react";
import React from "react";

export const ProductGrid: React.FC<ProductGridProps> = ({ posItems, onAddToCart, rightPanelPixelWidth = 0, isLoading = false }) => {
  const getGridColumns = (width: number) => {
    if (width <= 400) return "grid-cols-2";
    if (width <= 600) return "grid-cols-3";
    if (width <= 800) return "grid-cols-4";
    if (width <= 1000) return "grid-cols-5";
    return "grid-cols-6";
  };

  const gridColumns = getGridColumns(rightPanelPixelWidth);

  return (
    <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto safe-area-padding">
      <div className={`grid gap-3 sm:gap-4 lg:gap-5 ${gridColumns}`}>
        {/* Unified POS Items */}
        {posItems.map(item => (
          <Card key={item.id} className="group relative items-card cursor-pointer select-none transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 border border-gray-200/60 hover:border-primary/40 rounded-xl bg-white/95 backdrop-blur-sm overflow-hidden btn-touch" onClick={() => onAddToCart(item)}>
            <CardContent className="p-0 h-full flex flex-col">
              {/* Image Container */}
              <div className="relative aspect-square w-full overflow-hidden">
                {item.type === "menu_item" && item.image ? (
                  <img
                    src={item.image.startsWith("data:") ? item.image : `http://localhost:5000${item.image}`}
                    alt={item.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    onError={e => {
                      // Fallback to icon if image fails to load
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                            <div class="p-4 rounded-full bg-white/80 shadow-sm">
                              ${
                                item.type === "menu_item"
                                  ? '<svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path></svg>'
                                  : '<svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>'
                              }
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                    <div className="p-4 rounded-full bg-white/80 shadow-sm transition-transform duration-300 group-hover:scale-110">{item.type === "menu_item" ? <ShoppingCart className="w-8 h-8 text-primary" /> : <Package className="w-8 h-8 text-primary" />}</div>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
              </div>

              {/* Content Section */}
              <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">{item.name}</h4>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-center">
                    <span className="text-lg sm:text-xl font-bold text-primary">{formatCurrency(item.price)}</span>
                    {item.availableQuantity && item.availableQuantity !== 999 && (
                      <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                        {item.availableQuantity} {item.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && posItems.length === 0 && (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse">
              <Package className="w-12 h-12 text-blue-400 animate-bounce" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading products...</h3>
          <p className="text-sm text-center max-w-md text-gray-500 leading-relaxed">Please wait while we load your products.</p>
        </div>
      )}

      {/* Enhanced Empty State */}
      {!isLoading && posItems.length === 0 && (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-lg font-bold">!</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No products available</h3>
          <p className="text-sm text-center max-w-md text-gray-500 leading-relaxed">No products match your current filter. Try selecting a different category or check if items are marked as POS-enabled.</p>
        </div>
      )}
    </div>
  );
};
