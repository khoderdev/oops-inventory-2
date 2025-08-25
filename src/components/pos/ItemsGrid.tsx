import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductGridProps, POSItem } from "@/types/inventory";
import { formatPOSPrice } from "@/utils/conversionLogic";
import { Package, ShoppingCart, Plus } from "lucide-react";
import React, { useMemo, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useNavigate } from "react-router-dom";

export const ItemsGrid: React.FC<ProductGridProps> = ({ posItems, onAddToCart, rightPanelPixelWidth = 0, isLoading = false }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Calculate grid configuration based on panel width
  const gridConfig = useMemo(() => {
    const getColumnsCount = (width: number) => {
      if (width <= 300) return 2;
      if (width <= 450) return 3;
      if (width <= 650) return 4;
      if (width <= 850) return 4;
      if (width <= 1100) return 5;
      if (width <= 1400) return 6;
      return 7;
    };

    const columns = getColumnsCount(rightPanelPixelWidth);
    const itemHeight = 160;

    return {
      columns,
      itemHeight,
      gap: 12
    };
  }, [rightPanelPixelWidth]);

  // Calculate virtual rows (group items by columns)
  const virtualRows = useMemo(() => {
    const rows = Math.ceil(posItems.length / gridConfig.columns);
    return Array.from({ length: rows }, (_, rowIndex) => {
      const startIndex = rowIndex * gridConfig.columns;
      const endIndex = Math.min(startIndex + gridConfig.columns, posItems.length);
      return posItems.slice(startIndex, endIndex);
    });
  }, [posItems, gridConfig.columns]);

  // Dynamic text sizes based on panel width
  const textSizes = useMemo(() => {
    if (rightPanelPixelWidth <= 300)
      return {
        itemName: "text-xs",
        price: "text-sm",
        quantity: "text-xs"
      };
    if (rightPanelPixelWidth <= 450)
      return {
        itemName: "text-xs",
        price: "text-sm",
        quantity: "text-xs"
      };
    if (rightPanelPixelWidth <= 650)
      return {
        itemName: "text-sm",
        price: "text-base",
        quantity: "text-xs"
      };
    if (rightPanelPixelWidth <= 850)
      return {
        itemName: "text-base",
        price: "text-lg",
        quantity: "text-sm"
      };
    if (rightPanelPixelWidth <= 1100)
      return {
        itemName: "text-lg",
        price: "text-xl",
        quantity: "text-sm"
      };
    if (rightPanelPixelWidth <= 1400)
      return {
        itemName: "text-lg",
        price: "text-xl",
        quantity: "text-base"
      };
    return {
      itemName: "text-lg",
      price: "text-xl",
      quantity: "text-base"
    };
  }, [rightPanelPixelWidth]);

  // Setup virtualizer for rows
  const virtualizer = useVirtualizer({
    count: virtualRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => gridConfig.itemHeight + gridConfig.gap,
    overscan: 5
  });

  // Memoized image error handler for better performance
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>, itemType: string) => {
    const target = e.target as HTMLImageElement;
    const parent = target.parentElement;
    if (parent) {
      parent.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
          <div class="p-1.5 rounded-full bg-white/80 shadow-sm">
            ${
              itemType === "menu_item"
                ? '<svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path></svg>'
                : '<svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>'
            }
          </div>
        </div>
      `;
    }
  }, []);

  // Product item component with optimized rendering
  const ProductItem: React.FC<{ item: POSItem }> = React.memo(({ item }) => (
    <Card
      className="group relative items-card cursor-pointer select-none transition-all duration-200 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5 border border-gray-200 hover:border-primary/30 rounded-md bg-white/95 backdrop-blur-sm overflow-hidden btn-touch"
      onClick={() => onAddToCart(item)}
      style={{
        height: gridConfig.itemHeight
      }}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Image Container */}
        <div className="relative flex-1 w-full overflow-hidden">
          {item.type === "menu_item" && item.image ? (
            <img src={item.image.startsWith("data:") ? item.image : `http://localhost:3000${item.image}`} alt={item.name} className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105" onError={e => handleImageError(e, item.type)} loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="p-1.5 rounded-full bg-white/80 shadow-sm transition-transform duration-200 group-hover:scale-105">{item.type === "menu_item" ? <ShoppingCart className="w-4 h-4 text-primary" /> : <Package className="w-4 h-4 text-primary" />}</div>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

          {/* Price Overlay - Centered on Image */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-white/20">
              <div className="flex items-center justify-center">
                <span className={`${textSizes.price} font-bold text-primary`}>{formatPOSPrice(item.price)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-2 flex flex-col justify-center min-h-0">
          <div className="h-8 flex items-center justify-center">
            <h4 className={`${textSizes.itemName} font-medium text-gray-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200 text-center`}>{item.name}</h4>
          </div>
        </div>
      </CardContent>
    </Card>
  ));

  if (isLoading) {
    return (
      <div className="flex-1 p-3 overflow-y-auto safe-area-padding">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (posItems.length === 0 && !isLoading) {
    return (
      <div className="flex-1 p-3 overflow-y-auto safe-area-padding">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">You don't have any menu items yet</h3>
            <p className="text-gray-600 mb-6">Start by adding menu items to your inventory</p>
            <Button onClick={() => navigate("/menu")} className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Items
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-1 sm:p-2 lg:p-3 overflow-y-auto safe-area-padding">
      <div
        ref={parentRef}
        className="h-full overflow-auto"
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative"
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const rowItems = virtualRows[virtualRow.index];
          if (!rowItems || rowItems.length === 0) return null;

          return (
            <div
              key={virtualRow.index}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <div className={`grid gap-4 sm:gap-4 lg:gap-4 ${gridConfig.columns === 1 ? "grid-cols-1" : gridConfig.columns === 2 ? "grid-cols-2" : gridConfig.columns === 3 ? "grid-cols-3" : gridConfig.columns === 4 ? "grid-cols-4" : gridConfig.columns === 5 ? "grid-cols-5" : gridConfig.columns === 6 ? "grid-cols-6" : "grid-cols-7"} h-full`}>
                {rowItems.map(item => (
                  <ProductItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
