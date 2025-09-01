import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductGridProps, POSItem } from "@/types/inventory";
import { formatPOSPrice } from "@/utils/conversionLogic";
import { Package, ShoppingCart, Plus, ChevronDown } from "lucide-react";
import React, { useMemo, useRef, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VariantSelectionModal } from "./VariantSelectionModal";

export const ItemsGrid: React.FC<ProductGridProps> = ({ posItems, onAddToCart, rightPanelPixelWidth = 0, isLoading = false }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // State for variant selection modal
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<POSItem | null>(null);

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

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setVariantModalOpen(false);
    setSelectedItem(null);
  }, []);

  // Product item component with optimized rendering
  const ProductItem: React.FC<{ item: POSItem }> = React.memo(({ item }) => {
    // Check if the item has variants
    const hasVariants = item.variants && item.variants.length > 0;

    // Check if this is a beverage item with variants
    const isBeverage = item.type === "menu_item" && hasVariants;

    // Handle direct click for items
    const handleItemClick = () => {
      // Special handling for beverage items with variants
      if (isBeverage) {
        setSelectedItem(item);
        setVariantModalOpen(true);
        return;
      }

      if (!hasVariants) {
        onAddToCart(item);
      }
      // For other items with variants, the click is handled by the popover
    };

    return (
      <Card
        className={`select-none border border-gray-200 hover:border-primary/40 rounded-lg bg-white/95 backdrop-blur-sm overflow-hidden ${!hasVariants || isBeverage ? "cursor-pointer btn-touch" : ""}`}
        onClick={handleItemClick}
        style={{
          height: gridConfig.itemHeight
        }}
      >
        <CardContent className="p-0 h-full flex flex-col">
          {/* Image Section */}
          <div className="relative flex-1 group">
            {item.imageUrl ? (
              <div className="relative w-full h-full">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" onError={e => handleImageError(e, item.type)} />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="p-1.5 rounded-full bg-white/80 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">{item.type === "menu_item" ? <ShoppingCart className="w-4 h-4 text-primary" /> : <Package className="w-4 h-4 text-primary" />}</div>
              </div>
            )}

            {/* Enhanced Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Price Overlay - Enhanced with subtle animation - Only show for items without variants */}
            {!hasVariants && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-md px-3 py-1.5 shadow-md border border-white/20 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                  <div className="flex items-center justify-center">
                    <span className={`${textSizes.price} font-bold text-primary`}>{formatPOSPrice(item.price)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-2 flex flex-col justify-center min-h-0">
            <div className="h-8 flex items-center justify-center">
              <h4 className={`${textSizes.itemName} font-medium text-gray-900 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300 text-center`}>{item.name}</h4>
            </div>

            {/* Variant Selection Button - Only for non-beverage items with variants */}
            {hasVariants && !isBeverage && (
              <div className="mt-1 flex justify-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary" onClick={e => e.stopPropagation()}>
                      Select Variant <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="center">
                    <ScrollArea className="h-auto max-h-[200px]">
                      <div className="p-1">
                        {item.variants.map(variant => (
                          <Button
                            key={variant.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between mb-1 text-left font-normal"
                            onClick={e => {
                              e.stopPropagation();
                              // Create a modified item with the selected variant
                              const itemWithVariant = {
                                ...item,
                                selectedVariant: variant,
                                // Update price to variant price if available
                                price: variant.price ? parseFloat(variant.price.toString()) : item.price,
                                // Add variant info to the name for cart display
                                displayName: `${item.name} (${variant.name} - ${variant.volume}${variant.unit})`
                              };
                              onAddToCart(itemWithVariant);
                            }}
                          >
                            <span>
                              {variant.name} - {variant.volume}
                              {variant.unit}
                            </span>
                            <span className="font-medium text-primary">{formatPOSPrice(parseFloat(variant.price.toString()) || item.price)}</span>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  });

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
    <div className="h-full p-1 sm:p-2 lg:p-3 safe-area-padding">
      {/* Variant Selection Modal */}
      <VariantSelectionModal isOpen={variantModalOpen} selectedItem={selectedItem} onClose={handleModalClose} onAddToCart={onAddToCart} />

      <div ref={parentRef} className="h-full overflow-auto hide-scrollbar">
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: "100%",
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
    </div>
  );
};
