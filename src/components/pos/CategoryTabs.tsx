import { cn } from "@/lib/utils";
import { CategoryTabsProps } from "@/types/inventory";
import React, { useRef, useCallback, useMemo } from "react";
import { PerformanceMonitor } from "../common/PerformanceMonitor";

// Custom equality function to prevent unnecessary re-renders
const categoryTabsPropsAreEqual = (prevProps: CategoryTabsProps, nextProps: CategoryTabsProps) => {
  // Check if active category has changed
  if (prevProps.activeCategory !== nextProps.activeCategory) return false;
  
  // Check if categories array reference is the same
  if (prevProps.categories === nextProps.categories) return true;
  
  // Check if categories array length has changed
  if (prevProps.categories.length !== nextProps.categories.length) return false;
  
  // Check if any category has changed
  return prevProps.categories.every((cat, i) => cat === nextProps.categories[i]);
};

export const CategoryTabs: React.FC<CategoryTabsProps> = React.memo(({ categories, activeCategory, onCategoryChange }) => {
  // Create a stable callback reference for category changes
  const handleCategoryChange = useCallback((category: string) => {
    onCategoryChange(category);
  }, [onCategoryChange]);
  // Render counter removed - component should now have stable renders
  // Split categories into two rows for better distribution
  const midpoint = Math.ceil(categories.length / 2);
  const firstRow = categories.slice(0, midpoint);
  const secondRow = categories.slice(midpoint);

  // Memoize category button rendering function
  const renderCategoryButton = useCallback((category: string, index: number) => {
    const isActive = activeCategory === category;
    const displayName = category === "all" ? "All Items" : category;

    return (
      <button
        key={category}
        onClick={() => handleCategoryChange(category)}
        className={cn("relative flex-1 !px-0 py-1.5 font-medium text-xs sm:text-sm transition-all duration-200 ease-out", "border shadow-sm hover:shadow-md text-center whitespace-nowrap", isActive ? "bg-gradient-to-r from-primary to-primary/90 text-white border-primary shadow-md " : "bg-white/90 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-white hover:border-gray-300")}
        style={{
          textTransform: "capitalize",
          animationDelay: `${index * 30}ms`,
          padding: "6px 2px"
        }}
      >
        {/* Content */}
        <span className="relative z-10 font-medium tracking-tight">{displayName}</span>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />
      </button>
    );
  }, [activeCategory, handleCategoryChange]);

  // Memoize the rendered rows to prevent unnecessary re-renders
  const firstRowButtons = useMemo(() => {
    return firstRow.map((category, index) => renderCategoryButton(category, index));
  }, [firstRow, renderCategoryButton]);

  const secondRowButtons = useMemo(() => {
    return secondRow.map((category, index) => renderCategoryButton(category, index + firstRow.length));
  }, [secondRow, firstRow.length, renderCategoryButton]);

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 select-none safe-area-padding">
      <PerformanceMonitor componentName="CategoryTabs" maxRenders={5} />
      {/* Categories Grid - 2 Rows */}
      <div className="grid grid-rows-2">
        {/* First Row */}
        <div className="flex">{firstRowButtons}</div>

        {/* Second Row */}
        <div className="flex">{secondRowButtons}</div>
      </div>
    </div>
  );
}, categoryTabsPropsAreEqual);
