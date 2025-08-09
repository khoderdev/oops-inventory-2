import { cn } from "@/lib/utils";
import { CategoryTabsProps } from "@/types/inventory";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useRef } from "react";
import { Button } from "../ui/button";

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -150, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 150, behavior: "smooth" });
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-slate-50 to-gray-50 select-none safe-area-padding">
      {/* Left Scroll Button - Hidden on mobile */}
      <Button variant="ghost" size="sm" onClick={scrollLeft} className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 h-6 w-6 p-0 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 rounded-full">
        <ChevronLeft className="h-3 w-3" />
      </Button>

      {/* Categories Container */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-none "
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
                "relative flex-shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm transition-all duration-200 ease-out focus:outline-none btn-touch",
                "border shadow-sm hover:shadow-md",
                "min-w-[60px] sm:min-w-[90px] text-center whitespace-nowrap",
                isActive 
                  ? "bg-gradient-to-r from-primary to-primary/90 text-white border-primary shadow-md scale-105" 
                  : "bg-white/90 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-white hover:border-gray-300 hover:text-gray-900 hover:scale-102"
              )}
              style={{
                textTransform: "capitalize",
                animationDelay: `${index * 30}ms`
              }}
            >
              {/* Content */}
              <span className="relative z-10 font-medium tracking-tight">{displayName}</span>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-white/50" />
              )}

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />
            </button>
          );
        })}
      </div>

      {/* Right Scroll Button - Hidden on mobile */}
      <Button variant="ghost" size="sm" onClick={scrollRight} className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 h-6 w-6 p-0 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 rounded-full">
        <ChevronRight className="h-3 w-3" />
      </Button>

      {/* Gradient overlays for scroll indication - Desktop only */}
      <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none" />
      <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
    </div>
  );
};
