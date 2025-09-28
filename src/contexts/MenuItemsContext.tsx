import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { logDevOnly, logErrorDevOnly } from "@/utils/logDevOnly";
import { menuAPI } from "@/api/menu.api.ts";
import { MenuItem, Material } from "@/types/inventory";
import { getCategoriesByType } from "@/api/categories.api";
import { Category } from "@/types/categories";
import { materialsAPI } from "@/api/materials.api";
import { MenuItemsContextState } from "@/types/menuItems";

// LocalStorage keys for menu items and categories
const STORAGE_KEYS = {
  FOOD_MENU_ITEMS: 'oops_food_menu_items',
  BEVERAGE_MENU_ITEMS: 'oops_beverage_menu_items',
  MENU_ITEM_CATEGORIES: 'oops_menu_item_categories',
  BEVERAGE_CATEGORIES: 'oops_beverage_categories',
  MATERIALS_WITH_STOCK: 'oops_materials_with_stock',
  LAST_FETCH_TIME: 'oops_menu_items_last_fetch',
  STORAGE_VERSION: 'oops_storage_version'
};

// Current storage version - increment when data structure changes
const CURRENT_STORAGE_VERSION = '1.0';

// Cache duration (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Helper functions for localStorage
const storage = {
  get: <T,>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      logErrorDevOnly(`Error getting ${key} from localStorage:`, error);
      return defaultValue;
    }
  },
  set: <T,>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logErrorDevOnly(`Error setting ${key} in localStorage:`, error);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logErrorDevOnly(`Error removing ${key} from localStorage:`, error);
    }
  },
  isValid: (): boolean => {
    try {
      const version = localStorage.getItem(STORAGE_KEYS.STORAGE_VERSION);
      return version === CURRENT_STORAGE_VERSION;
    } catch (error) {
      return false;
    }
  },
  isCacheValid: (): boolean => {
    try {
      const lastFetchTime = localStorage.getItem(STORAGE_KEYS.LAST_FETCH_TIME);
      if (!lastFetchTime) return false;
      
      const now = Date.now();
      return now - parseInt(lastFetchTime) < CACHE_DURATION;
    } catch (error) {
      return false;
    }
  },
  clearAll: (): void => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    } catch (error) {
      logErrorDevOnly('Error clearing localStorage:', error);
    }
  },
  updateFetchTime: (): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_FETCH_TIME, Date.now().toString());
      localStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, CURRENT_STORAGE_VERSION);
    } catch (error) {
      logErrorDevOnly('Error updating fetch time:', error);
    }
  }
};

const MenuItemsContext = createContext<MenuItemsContextState | undefined>(undefined);

interface MenuItemsProviderProps {
  children: ReactNode;
  externalCategories?: Category[];
  onCreateMenuItem?: (menuItem: any, imageFile?: File) => Promise<void>;
  onUpdateMenuItem?: (id: string, menuItem: Partial<MenuItem>) => Promise<void>;
  onDeleteMenuItem?: (id: string) => Promise<void>;
}

export const MenuItemsProvider: React.FC<MenuItemsProviderProps> = ({ children, externalCategories, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  const [foodMenuItems, setFoodMenuItems] = useState<MenuItem[]>(() => 
    storage.get<MenuItem[]>(STORAGE_KEYS.FOOD_MENU_ITEMS, [])
  );
  const [beverageMenuItems, setBeverageMenuItems] = useState<MenuItem[]>(() => 
    storage.get<MenuItem[]>(STORAGE_KEYS.BEVERAGE_MENU_ITEMS, [])
  );
  const [menuItemsLoading, setMenuItemsLoading] = useState<boolean>(false);
  const [menuItemsError, setMenuItemsError] = useState<string | null>(null);

  // Categories state
  const [menuItemCategories, setMenuItemCategories] = useState<Category[]>(() => 
    storage.get<Category[]>(STORAGE_KEYS.MENU_ITEM_CATEGORIES, [])
  );
  const [beverageCategories, setBeverageCategories] = useState<Category[]>(() => 
    storage.get<Category[]>(STORAGE_KEYS.BEVERAGE_CATEGORIES, [])
  );
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Materials state
  const [materialsWithStock, setMaterialsWithStock] = useState<Material[]>(() => 
    storage.get<Material[]>(STORAGE_KEYS.MATERIALS_WITH_STOCK, [])
  );
  const [materialsLoading, setMaterialsLoading] = useState<boolean>(false);
  const [materialsError, setMaterialsError] = useState<string | null>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>("food");

  // Track if initial data has been loaded
  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(() => {
    // Check if we have valid cached data
    return storage.isCacheValid() && 
           storage.get<MenuItem[]>(STORAGE_KEYS.FOOD_MENU_ITEMS, []).length > 0;
  });
  
  // Ultra-optimized fetch menu items function with progressive loading and caching
  const fetchMenuItems = useCallback(
    async (mode?: 'food' | 'beverages' | 'both' | 'force') => {
      // Skip redundant fetches if data is already loaded and not forced
      if (initialDataLoaded && mode !== 'force' && storage.isCacheValid()) {
        // Only check the data we need based on mode
        if (
          (mode === 'food' && foodMenuItems.length > 0) ||
          (mode === 'beverages' && beverageMenuItems.length > 0) ||
          (mode === 'both' && foodMenuItems.length > 0 && beverageMenuItems.length > 0) ||
          (!mode && foodMenuItems.length > 0)
        ) {
          logDevOnly(`💾 Using cached menu items: ${foodMenuItems.length} food, ${beverageMenuItems.length} beverage items`);
          return;
        }
      }
      
      // Determine what data we need to fetch
      const needFood = mode === 'food' || mode === 'both' || !mode;
      const needBeverages = mode === 'beverages' || mode === 'both';
      
      logDevOnly(`🔍 Fetching menu items (mode: ${mode || 'default'}, food: ${needFood}, beverages: ${needBeverages})`);
      
      try {
        // Only set loading true for data we're actually fetching
        if ((needFood && foodMenuItems.length === 0) || (needBeverages && beverageMenuItems.length === 0)) {
          setMenuItemsLoading(true);
        }
        setMenuItemsError(null);

        // Start measuring performance
        const startTime = performance.now();
        
        // Only fetch what we need
        const promises = [];
        if (needFood) {
          promises.push(menuAPI.getFoodMenuItems(true));
        } else {
          promises.push(Promise.resolve(foodMenuItems));
        }
        
        if (needBeverages) {
          promises.push(menuAPI.getBeverageMenuItems(true));
        } else {
          promises.push(Promise.resolve(beverageMenuItems));
        }
        
        // Execute promises in parallel
        const [foodItems, beverageItems] = await Promise.all(promises);
        const fetchTime = performance.now() - startTime;
        
        // Only log if we actually fetched something
        if (needFood || needBeverages) {
          logDevOnly(`✅ Fetched menu items in ${fetchTime.toFixed(0)}ms: ${needFood ? foodItems.length : '(cached)'} food, ${needBeverages ? beverageItems.length : '(cached)'} beverage items`);
        }
        
        // Only update state for what we fetched
        if (needFood && foodItems !== foodMenuItems) {
          setFoodMenuItems(foodItems);
          storage.set(STORAGE_KEYS.FOOD_MENU_ITEMS, foodItems);
        }
        
        if (needBeverages && beverageItems !== beverageMenuItems) {
          setBeverageMenuItems(beverageItems);
          storage.set(STORAGE_KEYS.BEVERAGE_MENU_ITEMS, beverageItems);
        }
        
        // Mark as initialized if we've loaded what we need
        if ((needFood && foodItems.length > 0) || (needBeverages && beverageItems.length > 0)) {
          setInitialDataLoaded(true);
          storage.updateFetchTime();
        }
      } catch (error) {
        logErrorDevOnly("❌ Failed to fetch menu items:", error);
        setMenuItemsError("Failed to load menu items");
      } finally {
        setMenuItemsLoading(false);
      }
    },
    [foodMenuItems, beverageMenuItems, initialDataLoaded]
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

  // Optimized fetch categories function that returns a Promise for chaining
  const fetchCategories = useCallback(async () => {
    // Skip if we already have categories loaded and cache is valid
    if (menuItemCategories.length > 0 && beverageCategories.length > 0 && storage.isCacheValid()) {
      logDevOnly('📋 Using cached categories:', { 
        menuItems: menuItemCategories.length, 
        beverages: beverageCategories.length 
      });
      return Promise.resolve();
    }
    
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      
      // Use external categories if provided (much faster)
      if (externalCategories && externalCategories.length > 0) {
        // Optimize the filtering with a single pass through the array
        const menuItemCats: Category[] = [];
        const beverageCats: Category[] = [];
        
        externalCategories.forEach(category => {
          // Check for menu items
          if ((category.categoryTypes && category.categoryTypes.some(type => type.type === "menu_items")) || 
              (category.value && typeof category.value === "string" && 
               (category.value.toLowerCase().includes("menu") || 
                category.name.toLowerCase().includes("menu") || 
                category.value.toLowerCase().includes("food") || 
                category.name.toLowerCase().includes("food")))) {
            menuItemCats.push(category);
          }
          
          // Check for beverages
          if ((category.categoryTypes && category.categoryTypes.some(type => type.type === "beverages")) || 
              (category.value && typeof category.value === "string" && 
               (category.value.toLowerCase().includes("beverage") || 
                category.name.toLowerCase().includes("beverage") || 
                category.value.toLowerCase().includes("drink") || 
                category.name.toLowerCase().includes("drink")))) {
            beverageCats.push(category);
          }
        });
        
        setMenuItemCategories(menuItemCats);
        storage.set(STORAGE_KEYS.MENU_ITEM_CATEGORIES, menuItemCats);
        
        setBeverageCategories(beverageCats);
        storage.set(STORAGE_KEYS.BEVERAGE_CATEGORIES, beverageCats);
        
        logDevOnly('📋 Using external categories:', { 
          menuItems: menuItemCats.length, 
          beverages: beverageCats.length 
        });
      } else {
        // Use Promise.all for parallel requests
        const [menuItemsResponse, beveragesResponse] = await Promise.all([
          getCategoriesByType("menu_items", true),
          getCategoriesByType("beverages", true)
        ]);
        
        // Process and store results
        if (menuItemsResponse.totalItems) {
          setMenuItemCategories(menuItemsResponse.totalItems);
          storage.set(STORAGE_KEYS.MENU_ITEM_CATEGORIES, menuItemsResponse.totalItems);
        }
        if (beveragesResponse.totalItems) {
          setBeverageCategories(beveragesResponse.totalItems);
          storage.set(STORAGE_KEYS.BEVERAGE_CATEGORIES, beveragesResponse.totalItems);
        }
        
        logDevOnly('📋 Fetched categories from API:', { 
          menuItems: menuItemsResponse.totalItems?.length || 0, 
          beverages: beveragesResponse.totalItems?.length || 0 
        });
      }
      
      storage.updateFetchTime();
      return Promise.resolve();
    } catch (error) {
      logErrorDevOnly("❌ Failed to fetch categories:", error);
      setCategoriesError("Failed to load categories");
      return Promise.reject(error);
    } finally {
      setCategoriesLoading(false);
    }
  }, [externalCategories, menuItemCategories.length, beverageCategories.length]);

  // Optimized fetch materials function with caching and Promise return
  const fetchMaterials = useCallback(async () => {
    // Skip if we already have materials loaded and cache is valid
    if (materialsWithStock.length > 0 && storage.isCacheValid()) {
      logDevOnly('💾 Using cached materials:', { count: materialsWithStock.length });
      return Promise.resolve();
    }
    
    try {
      setMaterialsLoading(true);
      setMaterialsError(null);
      
      // Add cache-busting parameter
      const startTime = performance.now();
      const materials = await materialsAPI.getMaterials({ _t: Date.now() });
      
      // Store the materials
      setMaterialsWithStock(materials);
      storage.set(STORAGE_KEYS.MATERIALS_WITH_STOCK, materials);
      
      const fetchTime = performance.now() - startTime;
      logDevOnly(`✅ Fetched ${materials.length} materials in ${fetchTime.toFixed(0)}ms`);
      
      storage.updateFetchTime();
      return Promise.resolve();
    } catch (error) {
      logErrorDevOnly("❌ Failed to fetch materials:", error);
      setMaterialsError("Failed to load materials");
      return Promise.reject(error);
    } finally {
      setMaterialsLoading(false);
    }
  }, [materialsWithStock.length]);

  // Progressive initial data loading with prioritization and performance tracking
  useEffect(() => {
    const startTime = performance.now();
    logDevOnly('💾 MenuItemsContext: Starting progressive initial data load');
    
    // Check if we have valid cached data
    if (storage.isCacheValid() && foodMenuItems.length > 0) {
      logDevOnly('💾 MenuItemsContext: Using cached data from localStorage');
      setInitialDataLoaded(true);
      return;
    }
    
    // Track loading stages
    let categoriesLoaded = false;
    let foodItemsLoaded = false;
    let beverageItemsLoaded = false;
    let materialsLoaded = false;
    
    // Stage 1: Load categories first (they're small and needed for UI)
    fetchCategories()
      .then(() => {
        categoriesLoaded = true;
        const stage1Time = performance.now() - startTime;
        logDevOnly(`🔹 Stage 1: Categories loaded in ${stage1Time.toFixed(0)}ms`);
        
        // Stage 2: Load food items (most commonly needed)
        return fetchMenuItems('food');
      })
      .then(() => {
        foodItemsLoaded = true;
        const stage2Time = performance.now() - startTime;
        logDevOnly(`🔹 Stage 2: Food items loaded in ${stage2Time.toFixed(0)}ms`);
        
        // Stage 3: Load materials (needed for forms)
        return fetchMaterials();
      })
      .then(() => {
        materialsLoaded = true;
        const stage3Time = performance.now() - startTime;
        logDevOnly(`🔹 Stage 3: Materials loaded in ${stage3Time.toFixed(0)}ms`);
        
        // Stage 4: Load beverage items (less commonly needed)
        // Only if we're on the beverages tab
        if (activeTab === 'beverages') {
          return fetchMenuItems('beverages');
        }
      })
      .then(() => {
        if (activeTab === 'beverages') {
          beverageItemsLoaded = true;
        }
        
        const totalTime = performance.now() - startTime;
        logDevOnly(`✅ MenuItemsContext: Progressive data load completed in ${totalTime.toFixed(0)}ms`);
        logDevOnly(`📊 Load status: Categories: ${categoriesLoaded}, Food: ${foodItemsLoaded}, Beverages: ${activeTab === 'beverages' ? beverageItemsLoaded : 'deferred'}, Materials: ${materialsLoaded}`);
      })
      .catch(err => {
        logErrorDevOnly('❌ MenuItemsContext: Error during progressive data load:', err);
      });
      
    // Lazy-load beverage items if not on beverages tab
    if (activeTab !== 'beverages') {
      // Delay beverage items loading to prioritize UI responsiveness
      const beverageLoadTimer = setTimeout(() => {
        fetchMenuItems('beverages')
          .then(() => {
            beverageItemsLoaded = true;
            const beverageTime = performance.now() - startTime;
            logDevOnly(`🔹 Background: Beverage items loaded in ${beverageTime.toFixed(0)}ms`);
          })
          .catch(err => {
            logErrorDevOnly('❌ Error loading beverage items in background:', err);
          });
      }, 2000); // 2 second delay to prioritize other data
      
      return () => clearTimeout(beverageLoadTimer);
    }
  }, [fetchCategories, fetchMenuItems, fetchMaterials, activeTab, foodMenuItems.length]);

  const handleCreateMenuItem = useCallback(
    async (menuItem: any, imageFile?: File) => {
      try {
        if (onCreateMenuItem) {
          await onCreateMenuItem(menuItem, imageFile);
        }
        fetchMenuItems('force'); // Force refresh after creation
        return Promise.resolve();
      } catch (error) {
        logErrorDevOnly("Error creating menu item:", error);
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
        fetchMenuItems('force'); // Force refresh after update
        return Promise.resolve();
      } catch (error) {
        logErrorDevOnly("Error updating menu item:", error);
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
        fetchMenuItems('force'); // Force refresh after deletion
        return Promise.resolve();
      } catch (error) {
        logErrorDevOnly("❌ Error deleting menu item:", error);
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