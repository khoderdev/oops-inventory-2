import { CategoryTabsProps } from "@/types/inventory";
import React, { useRef } from "react";

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border-b border-gray-200 select-none">
      <div
        ref={containerRef}
        className="p-2"
        style={{
          overflowX: "scroll",
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
              marginRight: "8px",
              padding: "8px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: activeCategory === category ? "#14b8a6" : "white",
              color: activeCategory === category ? "white" : "#374151",
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
