import { Card, CardContent } from "@/components/ui/card";
import { ProductGridProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Package, ShoppingCart } from "lucide-react";
import React from "react";

export const ProductGrid: React.FC<ProductGridProps> = ({ posItems, onAddToCart, rightPanelPixelWidth = 0, isLoading = false }) => {
  const getGridColumns = (width: number) => {
    // Enhanced responsive breakpoints for better panel resizing experience
    if (width <= 300) return "grid-cols-1"; // Very narrow panels
    if (width <= 450) return "grid-cols-2"; // Small panels
    if (width <= 650) return "grid-cols-3"; // Medium panels
    if (width <= 850) return "grid-cols-4"; // Large panels
    if (width <= 1100) return "grid-cols-5"; // Extra large panels
    if (width <= 1400) return "grid-cols-6"; // Very large panels
    return "grid-cols-7"; // Ultra-wide panels
  };

  // Dynamic text sizes based on panel width instead of screen width
  const getTextSizes = (width: number) => {
    if (width <= 300) return {
      itemName: "text-xs",
      price: "text-sm",
      quantity: "text-xs"
    };
    if (width <= 450) return {
      itemName: "text-xs",
      price: "text-sm",
      quantity: "text-xs"
    };
    if (width <= 650) return {
      itemName: "text-sm",
      price: "text-base",
      quantity: "text-xs"
    };
    if (width <= 850) return {
      itemName: "text-base",
      price: "text-lg",
      quantity: "text-sm"
    };
    if (width <= 1100) return {
      itemName: "text-lg",
      price: "text-xl",
      quantity: "text-sm"
    };
    if (width <= 1400) return {
      itemName: "text-lg",
      price: "text-xl",
      quantity: "text-base"
    };
    return {
      itemName: "text-lg",
      price: "text-xl",
      quantity: "text-base"
    };
  };

  const gridColumns = getGridColumns(rightPanelPixelWidth);
  const textSizes = getTextSizes(rightPanelPixelWidth);


  return (
    <div className="flex-1 p-1 sm:p-2 lg:p-3 overflow-y-auto safe-area-padding">
      <div className={`grid gap-2 sm:gap-4 lg:gap-4 ${gridColumns}`}>
        {/* Unified POS Items */}
        {posItems.map(item => (
          <Card key={item.id} className="group relative items-card cursor-pointer select-none transition-all duration-200 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5 border border-gray-200/50 hover:border-primary/30 rounded-md bg-white/95 backdrop-blur-sm overflow-hidden btn-touch" onClick={() => onAddToCart(item)}>
            <CardContent className="p-0 h-full flex flex-col">
              {/* Image Container */}
              <div className="relative aspect-[5/3] w-full overflow-hidden">
                {item.type === "menu_item" && item.image ? (
                  <img
                    src={item.image.startsWith("data:") ? item.image : `http://localhost:3000${item.image}`}
                    alt={item.name}
                    className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                    onError={e => {
                      // Fallback to icon if image fails to load
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                            <div class="p-1.5 rounded-full bg-white/80 shadow-sm">
                              ${
                                item.type === "menu_item"
                                  ? '<svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path></svg>'
                                  : '<svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>'
                              }
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                    <div className="p-1.5 rounded-full bg-white/80 shadow-sm transition-transform duration-200 group-hover:scale-105">{item.type === "menu_item" ? <ShoppingCart className="w-4 h-4 text-primary" /> : <Package className="w-4 h-4 text-primary" />}</div>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
              </div>

              {/* Content Section */}
              <div className="flex-1 p-1 flex flex-col justify-between">
                <div className="space-y-0">
                  <h4 className={`${textSizes.itemName} font-medium text-gray-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200`}>{item.name}</h4>
                </div>

                <div className="mt-0.5 pt-0.5 border-t border-gray-100">
                  <div className="flex items-center justify-center">
                    <span className={`${textSizes.price} font-bold text-primary`}>{formatCurrency(item.price)}</span>
                    {item.availableQuantity && item.availableQuantity !== 999 && (
                      <span className={`${textSizes.quantity} text-gray-500 bg-gray-50 px-1 py-0.5 rounded-full ml-0.5 text-xs`}>
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
    </div>
  );
};
