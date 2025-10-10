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
import { logDevOnly } from "@/utils/logDevOnly";
import { PerformanceMonitor } from "../common/PerformanceMonitor";

// Stable empty array reference to prevent unnecessary re-renders
const EMPTY_ARRAY: POSItem[] = [];

// ULTRA-AGGRESSIVE equality function to prevent almost all re-renders
const itemsGridPropsAreEqual = (prevProps: ProductGridProps, nextProps: ProductGridProps): boolean => {
  // Fast path: check references first
  if (prevProps === nextProps) {
    return true;
  }

  // If loading state changed, only re-render if it's a meaningful change
  if (prevProps.isLoading !== nextProps.isLoading) {
    if (prevProps.isLoading === true && nextProps.isLoading === false) {
      logDevOnly("ItemsGrid re-render: loading finished");
      return false;
    } else if (prevProps.isLoading === false && nextProps.isLoading === true) {
      logDevOnly("ItemsGrid re-render: loading started");
      return false;
    } else {
      // If both are true or both are false but references changed, consider equal
      logDevOnly("ItemsGrid props equality check: loading state reference changed but value is the same");
    }
  }

  // Only check width if it changed significantly (round to nearest 200px for even more stability)
  const prevWidth = Math.round(prevProps.rightPanelPixelWidth / 200) * 200;
  const nextWidth = Math.round(nextProps.rightPanelPixelWidth / 200) * 200;
  if (prevWidth !== nextWidth) {
    logDevOnly("ItemsGrid re-render: panel width changed significantly");
    return false;
  }

  // Check items array
  // 1. Length check (very fast)
  if (prevProps.posItems?.length !== nextProps.posItems?.length) {
    logDevOnly("ItemsGrid re-render: items length changed");
    return false;
  }

  if (prevProps.posItems === nextProps.posItems) {
    logDevOnly("ItemsGrid props equality check: same array reference");
    return true;
  }

  // If array is empty in both cases, consider equal
  if ((prevProps.posItems?.length === 0 && nextProps.posItems?.length === 0) || 
      (!prevProps.posItems && !nextProps.posItems)) {
    logDevOnly("ItemsGrid props equality check: both arrays empty");
    return true;
  }

  if (prevProps.posItems?.length > 0) {
    // Sample check: Check first, middle and last items for ID equality
    const midIndex = Math.floor(prevProps.posItems.length / 2);
    if (prevProps.posItems[0]?.id !== nextProps.posItems[0]?.id || 
        prevProps.posItems[midIndex]?.id !== nextProps.posItems[midIndex]?.id || 
        prevProps.posItems[prevProps.posItems.length - 1]?.id !== nextProps.posItems[nextProps.posItems.length - 1]?.id) {
      logDevOnly("ItemsGrid re-render: sampled items changed");
      return false;
    }

    // If we got here, consider the arrays equal
    logDevOnly("ItemsGrid props equality check: arrays considered equal (sampled)");
    return true;
  }

  // If we got here, the arrays are empty but equal
  logDevOnly("ItemsGrid props equality check: empty arrays");
  return true;
};

// Define ProductItem component outside of the main component
// This prevents it from being recreated on each render
const ProductItem = React.memo(({ item, onItemClick, onVariantClick, textSizes, gridConfig, handleImageError }: { item: POSItem; onItemClick: (item: POSItem) => void; onVariantClick: (item: POSItem, variant: any) => void; textSizes: any; gridConfig: any; handleImageError: (e: React.SyntheticEvent<HTMLImageElement>, type: string) => void }) => {
  // Check if the item has variants
  const hasVariants = item.variants && item.variants.length > 0;
  // Check if this is a beverage item with variants
  const isBeverage = item.type === "menu_item" && hasVariants;

  // Handle direct click for items
  const handleClick = () => {
    if (!hasVariants || isBeverage) {
      onItemClick(item);
    }
    // For other items with variants, the click is handled by the popover
  };

  return (
    <Card
      className={`select-none border border-gray-200 hover:border-primary/40 rounded-lg bg-white/95 backdrop-blur-sm overflow-hidden ${!hasVariants || isBeverage ? "cursor-pointer btn-touch" : ""}`}
      onClick={handleClick}
      style={{
        height: gridConfig.itemHeight
      }}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative flex-1 group">
          {item.imageUrl ? (
            <div className="relative w-full h-full">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={e => handleImageError(e, item.type)}
              />
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
                      {item.variants &&
                        item.variants.map(variant => (
                          <Button
                            key={variant.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between mb-1 text-left font-normal"
                            onClick={e => {
                              e.stopPropagation();
                              onVariantClick(item, variant);
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

export const ItemsGrid: React.FC<ProductGridProps> = React.memo(({ posItems = EMPTY_ARRAY, onAddToCart, rightPanelPixelWidth = 0, isLoading = false }) => {
  // Performance optimization: removed debug logging

  // IMPORTANT: All hooks must be called in the same order on every render
  // Define all refs first
  const parentRef = useRef<HTMLDivElement>(null);

  // Define all state hooks
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<POSItem | null>(null);

  // Define all callback hooks
  const navigate = useNavigate();

  const stableOnAddToCart = useCallback(
    (item: POSItem) => {
      onAddToCart(item);
    },
    [onAddToCart]
  );

  const getColumnsCount = useCallback((width: number) => {
    if (width <= 300) return 2;
    if (width <= 450) return 3;
    if (width <= 650) return 4;
    if (width <= 850) return 4;
    if (width <= 1100) return 5;
    if (width <= 1400) return 6;
    return 7;
  }, []);

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

  const handleModalClose = useCallback(() => {
    setVariantModalOpen(false);
    setSelectedItem(null);
  }, []);

  const handleItemClick = useCallback(
    (item: POSItem) => {
      // Special handling for beverage items with variants
      if (item.type === "menu_item" && item.variants && item.variants.length > 0) {
        setSelectedItem(item);
        setVariantModalOpen(true);
        return;
      }

      stableOnAddToCart(item);
    },
    [stableOnAddToCart]
  );

  const handleVariantClick = useCallback(
    (item: POSItem, variant: any) => {
      // Create a modified item with the selected variant
      const itemWithVariant = {
        ...item,
        selectedVariant: variant,
        // Update price to variant price if available
        price: variant.price ? parseFloat(variant.price.toString()) : item.price,
        // Add variant info to the name for cart display
        displayName: `${item.name} (${variant.name} - ${variant.volume}${variant.unit})`
      };
      stableOnAddToCart(itemWithVariant);
    },
    [stableOnAddToCart]
  );

  // Calculate derived values - round to nearest 50px for more stability
  const roundedWidth = Math.round(rightPanelPixelWidth / 50) * 50;

  // Define all memo hooks with stable references
  const gridConfig = useMemo(() => {
    const columns = getColumnsCount(roundedWidth);
    const itemHeight = 160;

    return {
      columns,
      itemHeight,
      gap: 12
    };
  }, [roundedWidth, getColumnsCount]);

  const textSizes = useMemo(() => {
    // Define text size configurations once
    const smallConfig = {
      itemName: "text-xs",
      price: "text-sm",
      quantity: "text-xs"
    };

    const mediumConfig = {
      itemName: "text-sm",
      price: "text-base",
      quantity: "text-xs"
    };

    const largeConfig = {
      itemName: "text-base",
      price: "text-lg",
      quantity: "text-sm"
    };

    const xlargeConfig = {
      itemName: "text-lg",
      price: "text-xl",
      quantity: "text-sm"
    };

    const xxlargeConfig = {
      itemName: "text-lg",
      price: "text-xl",
      quantity: "text-base"
    };

    // Return the appropriate config based on width
    if (roundedWidth <= 300) return smallConfig;
    if (roundedWidth <= 450) return smallConfig;
    if (roundedWidth <= 650) return mediumConfig;
    if (roundedWidth <= 850) return largeConfig;
    if (roundedWidth <= 1100) return xlargeConfig;
    if (roundedWidth <= 1400) return xxlargeConfig;
    return xxlargeConfig;
  }, [roundedWidth]);

  // Cache the previous posItems reference to avoid unnecessary recalculations
  const posItemsRef = useRef(posItems);
  const prevGridColumnsRef = useRef(gridConfig.columns);
  const virtualRowsRef = useRef<POSItem[][]>([]);
  
  // These hooks must always be called, even when loading or empty
  const virtualRows = useMemo(() => {
    // Use cached value if inputs haven't changed
    if (posItemsRef.current === posItems && prevGridColumnsRef.current === gridConfig.columns && virtualRowsRef.current.length > 0) {
      return virtualRowsRef.current;
    }
    
    // Always return an array, even if empty
    if (!posItems || posItems.length === 0) {
      virtualRowsRef.current = [];
      return [];
    }
    
    const rows = Math.ceil(posItems.length / gridConfig.columns);
    const newVirtualRows = Array.from({ length: rows }, (_, rowIndex) => {
      const startIndex = rowIndex * gridConfig.columns;
      const endIndex = Math.min(startIndex + gridConfig.columns, posItems.length);
      return posItems.slice(startIndex, endIndex);
    });
    
    // Update refs
    posItemsRef.current = posItems;
    prevGridColumnsRef.current = gridConfig.columns;
    virtualRowsRef.current = newVirtualRows;
    
    return newVirtualRows;
  }, [posItems, gridConfig.columns]);

  // Ultra-optimized virtualizer with hyper-tuned parameters for maximum performance
  const virtualizer = useVirtualizer({
    count: virtualRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => gridConfig.itemHeight + gridConfig.gap,
    overscan: 3, // Reduced overscan for better initial load time but still smooth scrolling
    measureElement: undefined, // Skip measuring for better performance
    paddingStart: 8,
    paddingEnd: 8,
    scrollPaddingStart: 8,
    scrollPaddingEnd: 8,
    initialOffset: 0,
    getItemKey: index => `row-${index}-${gridConfig.columns}`, // Include columns in key for proper re-rendering
    // Use stable references for callbacks to prevent re-renders
    scrollToFn: (offset, { behavior }) => {
      // Use smooth scrolling only for small distances
      const element = parentRef.current;
      if (!element) return;
      
      // For large scrolls, use instant scrolling
      const currentScroll = element.scrollTop;
      const scrollDistance = Math.abs(currentScroll - offset);
      
      // Use smooth scrolling only for small distances (less than 1000px)
      const effectiveBehavior = scrollDistance > 1000 ? 'auto' : behavior;
      
      element.scrollTo({
        top: offset,
        behavior: effectiveBehavior as ScrollBehavior
      });
    }
  });

  // Cache grid columns class to avoid recalculating it on each render
  const gridColsClassRef = useRef<string>("");
  
  // Get grid columns class with caching
  const getGridColsClass = useCallback((columns: number) => {
    if (gridColsClassRef.current && prevGridColumnsRef.current === columns) {
      return gridColsClassRef.current;
    }
    
    const newGridColsClass = columns === 1 ? "grid-cols-1" : 
                           columns === 2 ? "grid-cols-2" : 
                           columns === 3 ? "grid-cols-3" : 
                           columns === 4 ? "grid-cols-4" : 
                           columns === 5 ? "grid-cols-5" : 
                           columns === 6 ? "grid-cols-6" : "grid-cols-7";
    
    gridColsClassRef.current = newGridColsClass;
    prevGridColumnsRef.current = columns;
    return newGridColsClass;
  }, []);
  
  // Always create virtualItems with same dependencies and stable references
  const virtualItems = useMemo(() => {
    // Always return an array, even if empty
    if (virtualRows.length === 0) {
      return [];
    }
    
    // Get grid columns class once
    const gridColsClass = getGridColsClass(gridConfig.columns);
    
    return virtualizer.getVirtualItems().map(virtualRow => {
      const rowItems = virtualRows[virtualRow.index];
      
      return {
        virtualRow,
        rowItems,
        gridColsClass
      };
    });
  }, [virtualizer.getVirtualItems(), virtualRows, gridConfig.columns, getGridColsClass]);

  // Render loading state
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

  // Render empty state
  if (!posItems || posItems.length === 0) {
    return (
      <div className="flex-1 p-3 overflow-y-auto safe-area-padding">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No menu items available</h3>
            <p className="text-gray-600 mb-6">Check if items are marked as POS items in your inventory</p>
            <Button onClick={() => navigate("/menu")} className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Manage Menu Items
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render main content
  return (
    <div className="relative h-full w-full overflow-hidden">
      <PerformanceMonitor componentName="ItemsGrid" maxRenders={5} />
      {/* Variant Selection Modal */}
      <VariantSelectionModal isOpen={variantModalOpen} selectedItem={selectedItem} onClose={handleModalClose} onAddToCart={stableOnAddToCart} />

      <div ref={parentRef} className="h-full overflow-auto hide-scrollbar">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative"
          }}
        >
          {/* Render the virtual items */}
          {virtualItems.map(({ virtualRow, rowItems, gridColsClass }) => (
            <div
              key={`row-${virtualRow.index}`}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                willChange: "transform" // Optimize for GPU acceleration
              }}
            >
              <div className={`grid gap-4 sm:gap-4 lg:gap-4 ${gridColsClass} h-full`}>
                {rowItems.map(item => (
                  <ProductItem key={item.id} item={item} onItemClick={handleItemClick} onVariantClick={handleVariantClick} textSizes={textSizes} gridConfig={gridConfig} handleImageError={handleImageError} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}, itemsGridPropsAreEqual);

// Default export for React.lazy()
export default ItemsGrid;
