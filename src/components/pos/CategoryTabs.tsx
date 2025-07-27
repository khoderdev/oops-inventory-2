// import { Button } from "@/components/ui/button";
// import { CategoryTabsProps } from "@/types/inventory";
// import React from "react";

// export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
//   return (
//     <div className="border-b border-gray-200">
//       <div className="flex items-center justify-between p-0">
//         <div className="flex space-x-">
//           {categories.slice(0, 6).map(category => (
//             <Button key={category} variant={activeCategory === category ? "default" : "outline"} size="sm" onClick={() => onCategoryChange(category)} className={`capitalize rounded-none ${activeCategory === category ? "bg-teal-500 hover:bg-teal-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
//               {category === "all" ? "All" : category}
//             </Button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

import { Button } from "@/components/ui/button";
import { CategoryTabsProps } from "@/types/inventory";
import React from "react";

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="border-b border-gray-200 p-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 w-full">
        {categories.slice(0, 6).map(category => (
          <Button key={category} variant={activeCategory === category ? "default" : "outline"} size="sm" onClick={() => onCategoryChange(category)} className={`w-full capitalize rounded-md text-sm ${activeCategory === category ? "bg-teal-500 hover:bg-teal-600 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {category === "all" ? "All" : category}
          </Button>
        ))}
      </div>
    </div>
  );
};
