import Category from "../models/Category.js";

// Cache for categories to avoid frequent database queries
let categoriesCache = {
  materials: null,
  menu_items: null,
  lastUpdated: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get categories from cache or database
export const getCategories = async (type = null, forceRefresh = false) => {
  const now = Date.now();
  
  // Check if cache is valid and not forcing refresh
  if (!forceRefresh && categoriesCache.lastUpdated && (now - categoriesCache.lastUpdated < CACHE_DURATION)) {
    if (type) {
      return categoriesCache[type] || [];
    }
    return {
      materials: categoriesCache.materials || [],
      menu_items: categoriesCache.menu_items || []
    };
  }

  try {
    // Fetch all active categories
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });

    // Group by type
    const materialCategories = categories
      .filter(cat => cat.type === 'materials')
      .map(cat => ({ value: cat.value, label: cat.name }));
    
    const menuCategories = categories
      .filter(cat => cat.type === 'menu_items')
      .map(cat => ({ value: cat.value, label: cat.name }));

    // Update cache
    categoriesCache = {
      materials: materialCategories,
      menu_items: menuCategories,
      lastUpdated: now
    };

    if (type) {
      return categoriesCache[type] || [];
    }

    return {
      materials: materialCategories,
      menu_items: menuCategories
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    
    // Return cached data if available, otherwise empty arrays
    if (type) {
      return categoriesCache[type] || [];
    }
    return {
      materials: categoriesCache.materials || [],
      menu_items: categoriesCache.menu_items || []
    };
  }
};

// Validate if a category exists and is active
export const isValidCategory = async (categoryValue, type) => {
  try {
    const category = await Category.findOne({
      where: {
        value: categoryValue,
        type: type,
        isActive: true
      }
    });
    return !!category;
  } catch (error) {
    console.error("Error validating category:", error);
    return false;
  }
};

// Clear categories cache (useful when categories are updated)
export const clearCategoriesCache = () => {
  categoriesCache = {
    materials: null,
    menu_items: null,
    lastUpdated: null
  };
};

// Get material categories (backward compatibility)
export const getMaterialCategories = async () => {
  return await getCategories('materials');
};

// Get menu item categories (backward compatibility)
export const getMenuItemCategories = async () => {
  return await getCategories('menu_items');
};

export default {
  getCategories,
  isValidCategory,
  clearCategoriesCache,
  getMaterialCategories,
  getMenuItemCategories
};
