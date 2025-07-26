import { Button } from "@/components/ui/button";
import { CategoryTabsProps } from "@/types/inventory";
import React from "react";

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center justify-between p-2">
        <div className="flex space-x-2">
          {categories.slice(0, 6).map(category => (
            <Button key={category} variant={activeCategory === category ? "default" : "outline"} size="sm" onClick={() => onCategoryChange(category)} className={`capitalize ${activeCategory === category ? "bg-teal-500 hover:bg-teal-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {category === "all" ? "All" : category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
