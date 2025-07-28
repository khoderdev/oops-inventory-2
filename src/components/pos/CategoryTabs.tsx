import { CategoryTabsProps } from "@/types/inventory";
import { cn } from "@/lib/utils";
import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200/80 shadow-sm select-none">
      {/* Left Scroll Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={scrollLeft}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200 rounded-full"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Categories Container */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-none px-12 py-3 gap-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {categories.map((category, index) => {
          const isActive = activeCategory === category;
          const displayName = category === "all" ? "All Items" : category;
          
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={cn(
                "relative flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ease-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2",
                "border-2 shadow-sm hover:shadow-md",
                "min-w-[120px] text-center whitespace-nowrap",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg hover:from-blue-700 hover:to-indigo-700"
                  : "bg-white/80 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-white hover:border-gray-300 hover:text-gray-900"
              )}
              style={{
                textTransform: 'capitalize',
                animationDelay: `${index * 50}ms`
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-xl animate-pulse" />
              )}
              
              {/* Content */}
              <span className="relative z-10 font-medium">
                {displayName}
              </span>
              
              {/* Bottom indicator for active state */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/80 rounded-full transform translate-y-1" />
              )}
              
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            </button>
          );
        })}
      </div>

      {/* Right Scroll Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={scrollRight}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200 rounded-full"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Gradient overlays for scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
    </div>
  );
};
