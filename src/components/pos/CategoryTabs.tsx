import { CategoryTabsProps } from "@/types/inventory";
import React, { useRef } from "react";

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border-b border-gray-200 select-none">
      <div
        ref={containerRef}
        className="rounded-none"
        style={{
          // overflowX: "scroll",
          whiteSpace: "nowrap",
          width: "100%"
          // maxWidth: "600px"
        }}
      >
        {/* Original categories */}
        {categories.map(category => (
          <button
            key={category}
            onClick={() => {
              onCategoryChange(category);
            }}
            style={{
              display: "inline-block",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              backgroundColor: activeCategory === category ? "#334155" : "#14b8a6",
              color: activeCategory === category ? "white" : "white",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              textTransform: "capitalize",
              whiteSpace: "nowrap"
            }}
          >
            {category === "all" ? "All" : category}
          </button>
        ))}
      </div>
    </div>
  );
};
