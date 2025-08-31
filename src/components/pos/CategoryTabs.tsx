import { cn } from "@/lib/utils";
import { CategoryTabsProps } from "@/types/inventory";
import React from "react";

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
  // Process categories to ensure we have string values for display
  const processedCategories = React.useMemo(() => {
    return categories.map(category => {
      if (typeof category === 'string') {
        return category;
      } else if (category && typeof category === 'object' && 'value' in category) {
        // Using value instead of name for consistency with other components
        return category.value;
      }
      return 'unknown';
    });
  }, [categories]);

  // Split categories into two rows for better distribution
  const midpoint = Math.ceil(processedCategories.length / 2);
  const firstRow = processedCategories.slice(0, midpoint);
  const secondRow = processedCategories.slice(midpoint);

  const renderCategoryButton = (category: string, index: number) => {
    const isActive = activeCategory === category;
    const displayName = category === "all" ? "All Items" : category;

    return (
      <button
        key={category}
        onClick={() => onCategoryChange(category)}
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
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 select-none safe-area-padding">
      {/* Categories Grid - 2 Rows */}
      <div className="grid grid-rows-2">
        {/* First Row */}
        <div className="flex">{firstRow.map((category, index) => renderCategoryButton(category, index))}</div>

        {/* Second Row */}
        <div className="flex">{secondRow.map((category, index) => renderCategoryButton(category, index + firstRow.length))}</div>
      </div>
    </div>
  );
};
