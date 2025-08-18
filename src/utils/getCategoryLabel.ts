import { getCategoriesByType } from "@/api/categories.api";
import { Category } from "@/types/categories";

// Cache for categories to avoid repeated API calls
let materialCategoriesCache: Category[] | null = null;
let menuCategoriesCache: Category[] | null = null;
let beverageCategoriesCache: Category[] | null = null;

// Get category label by value and type
export const getCategoryLabel = async (categoryValue: string, type: "materials" | "menu_items" | "beverages" = "materials"): Promise<string> => {
  try {
    let categories: Category[];

    // Use cached categories if available
    if (type === "materials" && materialCategoriesCache) {
      categories = materialCategoriesCache;
    } else if (type === "menu_items" && menuCategoriesCache) {
      categories = menuCategoriesCache;
    } else if (type === "beverages" && beverageCategoriesCache) {
      categories = beverageCategoriesCache;
    } else {
      // Fetch categories from API
      const response = await getCategoriesByType(type, true);
      categories = response.totalItems;

      // Cache the results
      if (type === "materials") {
        materialCategoriesCache = categories;
      } else if (type === "menu_items") {
        menuCategoriesCache = categories;
      } else if (type === "beverages") {
        beverageCategoriesCache = categories;
      }
    }

    const category = categories.find(c => c.value === categoryValue);
    return category?.name || categoryValue;
  } catch (error) {
    console.error(`Failed to fetch ${type} categories:`, error);
    return categoryValue; // Fallback to original value
  }
};

// Synchronous version for cases where categories are already available
export const getCategoryLabelSync = (categoryValue: string, categories: Category[]): string => {
  const category = categories.find(c => c.value === categoryValue);
  return category?.name || categoryValue;
};

// Clear cache (useful for testing or when categories are updated)
export const clearCategoryCache = () => {
  materialCategoriesCache = null;
  menuCategoriesCache = null;
  beverageCategoriesCache = null;
};

export const getCategoryName = (material: any): string => {
  if (material?.category) {
    const cat = material.category;
    if (typeof cat === "object") {
      return cat.name || cat.value || cat.label || "Uncategorized";
    } else if (typeof cat === "string") {
      return cat;
    }
  }
  if (material?.categoryId) {
    return `Category ${material.categoryId}`;
  }
  return "Uncategorized";
};
