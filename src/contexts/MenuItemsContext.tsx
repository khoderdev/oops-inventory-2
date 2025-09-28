import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { logDevOnly, logErrorDevOnly } from "@/utils/logDevOnly";
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
  
  // Ultra-optimized fetch menu items function with progressive loading and caching
  const fetchMenuItems = useCallback(
    async (mode?: 'food' | 'beverages' | 'both' | 'force') => {
      // Skip redundant fetches if data is already loaded and not forced
      if (initialDataLoaded && mode !== 'force') {
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
        }
        
        if (needBeverages && beverageItems !== beverageMenuItems) {
          setBeverageMenuItems(beverageItems);
        }
        
        // Mark as initialized if we've loaded what we need
        if ((needFood && foodItems.length > 0) || (needBeverages && beverageItems.length > 0)) {
          setInitialDataLoaded(true);
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
    // Skip if we already have categories loaded
    if (menuItemCategories.length > 0 && beverageCategories.length > 0) {
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
        setBeverageCategories(beverageCats);
        
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
        }
        if (beveragesResponse.totalItems) {
          setBeverageCategories(beveragesResponse.totalItems);
        }
        
        logDevOnly('📋 Fetched categories from API:', { 
          menuItems: menuItemsResponse.totalItems?.length || 0, 
          beverages: beveragesResponse.totalItems?.length || 0 
        });
      }
      
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
    // Skip if we already have materials loaded
    if (materialsWithStock.length > 0) {
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
      
      const fetchTime = performance.now() - startTime;
      logDevOnly(`✅ Fetched ${materials.length} materials in ${fetchTime.toFixed(0)}ms`);
      
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
  }, [fetchCategories, fetchMenuItems, fetchMaterials, activeTab]);
  const handleCreateMenuItem = useCallback(
    async (menuItem: any, imageFile?: File) => {
      try {
        if (onCreateMenuItem) {
          await onCreateMenuItem(menuItem, imageFile);
        }
        fetchMenuItems();
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
        fetchMenuItems();
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
        fetchMenuItems();
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
