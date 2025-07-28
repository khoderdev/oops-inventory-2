import { cn } from "@/lib/utils";
import { CategoryTabsProps } from "@/types/inventory";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useRef } from "react";
import { Button } from "../ui/button";

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-slate-50 to-gray-50 select-none safe-area-padding">
      {/* Left Scroll Button - Hidden on mobile */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={scrollLeft} 
        className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200 rounded-full btn-touch"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Categories Container */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-none px-2 sm:px-12 py-2 sm:py-3 gap-1 sm:gap-2"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none"
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
                "relative flex-shrink-0 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ease-out transform hover:scale-105 focus:outline-none btn-touch",
                "border-2 shadow-sm hover:shadow-md",
                "min-w-[80px] sm:min-w-[120px] text-center whitespace-nowrap",
                isActive ? "bg-gradient-to-r from-primary to-primary text-white border-primary shadow-lg hover:from-primary/90 hover:to-primary/90" : "bg-white/80 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-white hover:border-gray-300 hover:text-gray-900"
              )}
              style={{
                textTransform: "capitalize",
                animationDelay: `${index * 50}ms`
              }}
            >
              {/* Content */}
              <span className="relative z-10 font-medium">{displayName}</span>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            </button>
          );
        })}
      </div>

      {/* Right Scroll Button - Hidden on mobile */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={scrollRight} 
        className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200 rounded-full btn-touch"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Gradient overlays for scroll indication - Desktop only */}
      <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none" />
      <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
    </div>
  );
};
