import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { menuAPI } from "@/api/menu.api.ts";
import { MenuItem, Material } from "@/types/inventory";
import { getCategoriesByType } from "@/api/categories.api";
import { Category } from "@/types/categories";
import { materialsAPI } from "@/api/materials.api";
import { MenuItemsContextState } from "@/types/menuItems";

const MenuItemsContext = createContext<MenuItemsContextState | undefined>(undefined);

interface MenuItemsProviderProps {
  children: ReactNode;
  externalCategories?: Category[];
  onCreateMenuItem?: (menuItem: any, imageFile?: File) => Promise<void>;
  onUpdateMenuItem?: (id: string, menuItem: Partial<MenuItem>) => Promise<void>;
  onDeleteMenuItem?: (id: string) => Promise<void>;
}

export const MenuItemsProvider: React.FC<MenuItemsProviderProps> = ({ children, externalCategories, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  const [foodMenuItems, setFoodMenuItems] = useState<MenuItem[]>([]);
  const [beverageMenuItems, setBeverageMenuItems] = useState<MenuItem[]>([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState<boolean>(false);
  const [menuItemsError, setMenuItemsError] = useState<string | null>(null);

  // Categories state
  const [menuItemCategories, setMenuItemCategories] = useState<Category[]>([]);
  const [beverageCategories, setBeverageCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Materials state
  const [materialsWithStock, setMaterialsWithStock] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState<boolean>(false);
  const [materialsError, setMaterialsError] = useState<string | null>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>("food");

  // Track if initial data has been loaded
  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false);
  
  // Optimized fetch menu items function with caching
  const fetchMenuItems = useCallback(
    async (mode?: 'food' | 'beverages' | 'both' | 'force') => {
      // Skip redundant fetches if data is already loaded
      if (initialDataLoaded && mode !== 'force') {
        if (foodMenuItems.length > 0 && beverageMenuItems.length > 0) {
          console.log(`💾 Using cached menu items: ${foodMenuItems.length} food, ${beverageMenuItems.length} beverage items`);
          return;
        }
      }
      
      console.log(`🔍 Fetching menu items (mode: ${mode || 'default'})`);
      try {
        // Only set loading true if we don't have data yet
        if (!initialDataLoaded || foodMenuItems.length === 0) {
          setMenuItemsLoading(true);
        }
        setMenuItemsError(null);

        // Use a single Promise.all for all data to improve performance
        const startTime = performance.now();
        const [foodItems, beverageItems] = await Promise.all([
          menuAPI.getFoodMenuItems(true),
          menuAPI.getBeverageMenuItems(true)
        ]);
        const fetchTime = performance.now() - startTime;
        console.log(`✅ Fetched all menu items in ${fetchTime.toFixed(0)}ms: ${foodItems.length} food, ${beverageItems.length} beverage items`);
        
        // Batch state updates
        setFoodMenuItems(foodItems);
        setBeverageMenuItems(beverageItems);
        setInitialDataLoaded(true);
      } catch (error) {
        console.error("❌ Failed to fetch menu items:", error);
        setMenuItemsError("Failed to load menu items");
      } finally {
        setMenuItemsLoading(false);
      }
    },
    [foodMenuItems.length, beverageMenuItems.length, initialDataLoaded]
  );

  // Handle tab change to fetch data only when needed
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);

      // If switching to beverages tab and we don't have beverage data yet, fetch it
      if (value === "beverages" && beverageMenuItems.length === 0) {
        fetchMenuItems('beverages');
      }
    },
    [beverageMenuItems.length, fetchMenuItems]
  );

  // Fetch categories by type for forms and filtering
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      if (externalCategories && externalCategories.length > 0) {
        const menuItemCats = externalCategories.filter(category => (category.categoryTypes && category.categoryTypes.some(type => type.type === "menu_items")) || (category.value && typeof category.value === "string" && (category.value.toLowerCase().includes("menu") || category.name.toLowerCase().includes("menu") || category.value.toLowerCase().includes("food") || category.name.toLowerCase().includes("food"))));

        const beverageCats = externalCategories.filter(category => (category.categoryTypes && category.categoryTypes.some(type => type.type === "beverages")) || (category.value && typeof category.value === "string" && (category.value.toLowerCase().includes("beverage") || category.name.toLowerCase().includes("beverage") || category.value.toLowerCase().includes("drink") || category.name.toLowerCase().includes("drink"))));
        setMenuItemCategories(menuItemCats);
        setBeverageCategories(beverageCats);
      } else {
        const [menuItemsResponse, beveragesResponse] = await Promise.all([getCategoriesByType("menu_items", true), getCategoriesByType("beverages", true)]);
        if (menuItemsResponse.totalItems) {
          setMenuItemCategories(menuItemsResponse.totalItems);
        }
        if (beveragesResponse.totalItems) {
          setBeverageCategories(beveragesResponse.totalItems);
        }
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategoriesError("Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  }, [externalCategories]);

  // Fetch materials for forms
  const fetchMaterials = useCallback(async () => {
    try {
      setMaterialsLoading(true);
      setMaterialsError(null);
      const materials = await materialsAPI.getMaterials({ _t: Date.now() });
      setMaterialsWithStock(materials);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
      setMaterialsError("Failed to load materials");
    } finally {
      setMaterialsLoading(false);
    }
  }, []);
  // Optimized initial data loading with performance tracking
  useEffect(() => {
    const startTime = performance.now();
    console.log('💾 MenuItemsContext: Starting optimized initial data load');
    
    // Use Promise.all to load everything in parallel
    Promise.all([
      fetchMenuItems('both'),
      fetchCategories(),
      fetchMaterials()
    ])
    .then(() => {
      const loadTime = performance.now() - startTime;
      console.log(`✅ MenuItemsContext: All initial data loaded in ${loadTime.toFixed(0)}ms`);
    })
    .catch(err => {
      console.error('❌ MenuItemsContext: Error during initial data load:', err);
    });
  }, [fetchCategories, fetchMenuItems, fetchMaterials]);
  const handleCreateMenuItem = useCallback(
    async (menuItem: any, imageFile?: File) => {
      try {
        if (onCreateMenuItem) {
          await onCreateMenuItem(menuItem, imageFile);
        }
        fetchMenuItems();
        return Promise.resolve();
      } catch (error) {
        console.error("Error creating menu item:", error);
        return Promise.reject(error);
      }
    },
    [onCreateMenuItem, fetchMenuItems]
  );

  // Handle update menu item
  const handleUpdateMenuItem = useCallback(
    async (id: string, menuItem: Partial<MenuItem>) => {
      try {
        if (onUpdateMenuItem) {
          await onUpdateMenuItem(id, menuItem);
        }
        fetchMenuItems();
        return Promise.resolve();
      } catch (error) {
        console.error("Error updating menu item:", error);
        return Promise.reject(error);
      }
    },
    [onUpdateMenuItem, fetchMenuItems]
  );

  // Handle delete menu item
  const handleDeleteMenuItem = useCallback(
    async (id: string, isBeverage: boolean = false) => {
      try {
        const idStr = String(id).trim();
        const isNumeric = /^\d+$/.test(idStr);
        if (!isNumeric) {
          const msg = idStr.startsWith("menu-") ? "Cannot delete unsaved menu item. Please save it first." : `Invalid menu item ID: ${idStr}`;
          console.warn("🚫 Invalid delete ID:", { id });
          throw { message: msg, status: 400 };
        }
        if (onDeleteMenuItem) {
          await onDeleteMenuItem(idStr);
        } else {
          await menuAPI.deleteMenuItem(idStr);
        }
        fetchMenuItems();
        return Promise.resolve();
      } catch (error) {
        console.error("❌ Error deleting menu item:", error);
        const err = error as any;
        const description = err?.message || err?.details?.message || "Failed to delete menu item";
        return Promise.reject(error);
      }
    },
    [onDeleteMenuItem, fetchMenuItems]
  );

  const contextValue: MenuItemsContextState = {
    foodMenuItems,
    beverageMenuItems,
    menuItemsLoading,
    menuItemsError,
    menuItemCategories,
    beverageCategories,
    categoriesLoading,
    categoriesError,
    materialsWithStock,
    materialsLoading,
    materialsError,
    activeTab,
    fetchMenuItems,
    fetchCategories,
    fetchMaterials,
    handleTabChange,
    handleCreateMenuItem,
    handleUpdateMenuItem,
    handleDeleteMenuItem
  };

  return <MenuItemsContext.Provider value={contextValue}>{children}</MenuItemsContext.Provider>;
};

// Custom hook for using the context
export const useMenuItems = (): MenuItemsContextState => {
  const context = useContext(MenuItemsContext);

  if (context === undefined) {
    throw new Error("useMenuItems must be used within a MenuItemsProvider");
  }

  return context;
};
