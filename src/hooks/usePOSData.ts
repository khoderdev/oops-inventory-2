import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { POSItem, MenuItem } from "@/types/inventory";
import { useGetFoodMenuItemsQuery, useGetBeverageMenuItemsQuery, useGetCategoriesByTypeQuery } from "@/store/api/posApi";
import { buildCategoriesMap, transformMenuItemsToPOSItems, extractCategories, filterPOSItemsByCategory } from "@/services/posDataService";
import { useAuth } from "@/contexts/AuthContext";
import { posCache } from "@/utils/posCache";
import { useAppSelector } from "@/store/hooks";
import { useDispatch } from "react-redux";
import { isOnline } from "@/utils/offlineDetection";
import { useOfflineDetection } from "./useOfflineDetection";

export interface UseOptimizedPOSDataResult {
  posItems: POSItem[];
  filteredPosItems: POSItem[];
  categories: string[];
  isLoading: boolean;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  refetch: () => void;
}

export function usePOSData(isPOSActionInProgress: boolean = false): UseOptimizedPOSDataResult {
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { offline } = useOfflineDetection();

  // Refs for stable caching
  const categoriesMapRef = useRef<Map<number, string>>(new Map());
  const posItemsRef = useRef<POSItem[]>([]);
  const lastDataLengthRef = useRef({ food: 0, beverage: 0, menuCat: 0, bevCat: 0 });
  const initialLoadRef = useRef(false);
  const offlineLoadedRef = useRef(false);

  // ULTRA-FAST: Load from localStorage FIRST before any API calls
  useEffect(() => {
    if (!initialLoadRef.current && isAuthenticated) {
      console.log("⚡ [usePOSData] Loading from localStorage cache...");

      // Try to load cached POS items
      const cachedPosItems = posCache.get<POSItem[]>(posCache.keys.FOOD_ITEMS + "_transformed");
      if (cachedPosItems && cachedPosItems.length > 0) {
        // Validate cached data has required properties
        const validItems = cachedPosItems.filter(item => item && item.id && item.name);
        if (validItems.length > 0) {
          posItemsRef.current = validItems;
          offlineLoadedRef.current = true;
          console.log(`✅ [usePOSData] Loaded ${validItems.length} items from cache INSTANTLY!`);
        } else {
          console.warn("⚠️ [usePOSData] Cached items are invalid, clearing cache");
          posCache.remove(posCache.keys.FOOD_ITEMS + "_transformed");
        }
      }

      // Try to load cached categories map
      try {
        const cachedMenuCategories = localStorage.getItem('pos_cache_menu_items_categories');
        const cachedBeverageCategories = localStorage.getItem('pos_cache_beverages_categories');
        
        if (cachedMenuCategories && cachedBeverageCategories) {
          const menuCats = JSON.parse(cachedMenuCategories).data || [];
          const bevCats = JSON.parse(cachedBeverageCategories).data || [];
          
          if (menuCats.length > 0 && bevCats.length > 0) {
            categoriesMapRef.current = buildCategoriesMap(menuCats, bevCats);
            console.log(`✅ [usePOSData] Built categories map from cache with ${categoriesMapRef.current.size} categories`);
          }
        }
      } catch (e) {
        console.warn("⚠️ [usePOSData] Error loading cached categories:", e);
      }

      initialLoadRef.current = true;
    }
  }, [isAuthenticated]);

  // Use RTK Query hooks with optimized caching strategy
  // Skip queries if not authenticated to prevent 401 errors
  const {
    data: foodMenuItems = [],
    isLoading: foodLoading,
    refetch: refetchFood
  } = useGetFoodMenuItemsQuery(true, {
    // ULTRA-FAST: Use cache immediately, update in background
    refetchOnMountOrArgChange: !offline, // Only update in background when online
    refetchOnFocus: false, // Never refetch on focus
    pollingInterval: offline ? 0 : 60 * 60 * 1000, // Only poll when online
    skip: !isAuthenticated // Skip if not authenticated
  });

  const {
    data: beverageMenuItems = [],
    isLoading: beverageLoading,
    refetch: refetchBeverages
  } = useGetBeverageMenuItemsQuery(true, {
    refetchOnMountOrArgChange: !offline, // Only update in background when online
    refetchOnFocus: false,
    pollingInterval: offline ? 0 : 60 * 60 * 1000, // Only poll when online
    skip: !isAuthenticated
  });

  const { data: menuItemCategories = [], isLoading: menuCategoriesLoading } = useGetCategoriesByTypeQuery("menu_items", {
    refetchOnMountOrArgChange: !offline, // Only update in background when online
    refetchOnFocus: false,
    pollingInterval: offline ? 0 : 60 * 60 * 1000, // Only poll when online
    skip: !isAuthenticated
  });

  const { data: beverageCategories = [], isLoading: beverageCategoriesLoading } = useGetCategoriesByTypeQuery("beverages", {
    refetchOnMountOrArgChange: !offline, // Only update in background when online
    refetchOnFocus: false,
    pollingInterval: offline ? 0 : 60 * 60 * 1000, // Only poll when online
    skip: !isAuthenticated
  });

  // Build categories map (SMART CACHE - build once when data arrives, then cache)
  const categoriesMap = useMemo(() => {
    if (!isAuthenticated) return new Map();

    // Build once when data is available
    if (categoriesMapRef.current.size === 0 && menuItemCategories.length > 0 && beverageCategories.length > 0) {
      console.log("🔄 [usePOSData] Building categories map (ONCE)");
      categoriesMapRef.current = buildCategoriesMap(menuItemCategories, beverageCategories);
      
      // Save to localStorage for ultra-fast loading next time
      try {
        localStorage.setItem('pos_categories_map', JSON.stringify({
          timestamp: Date.now(),
          size: categoriesMapRef.current.size,
          // Convert Map to array for serialization
          entries: Array.from(categoriesMapRef.current.entries())
        }));
      } catch (e) {
        console.warn("⚠️ [usePOSData] Failed to cache categories map:", e);
      }
    }

    return categoriesMapRef.current;
  }, [menuItemCategories.length > 0, beverageCategories.length > 0, isAuthenticated]); // Trigger once when data arrives

  // Transform menu items to POS items (SMART CACHE - build once when data arrives, then cache)
  const posItems = useMemo(() => {
    if (!isAuthenticated || isPOSActionInProgress) {
      // Return cached items during POS actions
      return posItemsRef.current;
    }

    // If we have offline data and no new data yet, use offline data
    if ((foodMenuItems.length === 0 && beverageMenuItems.length === 0) && offlineLoadedRef.current) {
      // Return cached items if available
      return posItemsRef.current;
    }

    // Build once when data is available
    if ((posItemsRef.current.length === 0 || foodMenuItems.length > 0 || beverageMenuItems.length > 0) && 
        categoriesMapRef.current.size > 0) {
      
      // Check if data has changed before rebuilding
      const foodChanged = foodMenuItems.length !== lastDataLengthRef.current.food;
      const beverageChanged = beverageMenuItems.length !== lastDataLengthRef.current.beverage;
      
      if (foodChanged || beverageChanged || posItemsRef.current.length === 0) {
        console.log("🔄 [usePOSData] Transforming menu items to POS items");
        const transformed = transformMenuItemsToPOSItems(
          foodMenuItems as MenuItem[], 
          beverageMenuItems as MenuItem[], 
          categoriesMapRef.current
        );

        // Validate transformed data before caching
        const validItems = transformed.filter(item => item && item.id && item.name);
        if (validItems.length !== transformed.length) {
          console.warn(`⚠️ [usePOSData] Filtered out ${transformed.length - validItems.length} invalid items`);
        }

        posItemsRef.current = validItems;
        
        // Update data length references
        lastDataLengthRef.current = {
          food: foodMenuItems.length,
          beverage: beverageMenuItems.length,
          menuCat: menuItemCategories.length,
          bevCat: beverageCategories.length
        };

        // ULTRA-FAST: Save to localStorage for instant load next time
        if (validItems.length > 0) {
          posCache.set(posCache.keys.FOOD_ITEMS + "_transformed", validItems);
          console.log(`💾 [usePOSData] Saved ${validItems.length} valid items to localStorage`);
        }
      } else {
        console.log("⚡ [usePOSData] Using cached POS items - no data changes detected");
      }
    }

    return posItemsRef.current;
  }, [foodMenuItems, beverageMenuItems, categoriesMap, isPOSActionInProgress, isAuthenticated]); // Improved dependency array

  // Get filtered POS items (memoized)
  const filteredPosItems = useMemo(() => {
    if (activeCategory === "all") {
      return posItems;
    }
    return filterPOSItemsByCategory(posItems, activeCategory);
  }, [posItems, activeCategory]);

  // Extract categories (memoized)
  const categories = useMemo(() => {
    return extractCategories(posItems);
  }, [posItems]);

  // Refetch all data (clears cache and rebuilds)
  const refetch = useCallback(() => {
    console.log("🔄 [usePOSData] Refetching all data - clearing cache");
    // Clear cache to force rebuild
    categoriesMapRef.current = new Map();
    posItemsRef.current = [];
    lastDataLengthRef.current = { food: 0, beverage: 0, menuCat: 0, bevCat: 0 };
    offlineLoadedRef.current = false;
    
    // Clear localStorage cache
    posCache.remove(posCache.keys.FOOD_ITEMS + "_transformed");
    localStorage.removeItem('pos_categories_map');
    localStorage.removeItem('pos_cache_food_items');
    localStorage.removeItem('pos_cache_beverage_items');
    localStorage.removeItem('pos_cache_menu_items_categories');
    localStorage.removeItem('pos_cache_beverages_categories');
    
    // Only refetch from API if online
    if (!offline) {
      refetchFood();
      refetchBeverages();
    } else {
      console.log("⚠️ [usePOSData] Offline mode - cannot refetch data");
    }
  }, [refetchFood, refetchBeverages, offline]);

  // Stable setActiveCategory
  const handleSetActiveCategory = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  // ULTRA-FAST: Never show loading if we have cached data
  const isLoading = posItemsRef.current.length === 0 && !offlineLoadedRef.current && 
    (foodLoading || beverageLoading || menuCategoriesLoading || beverageCategoriesLoading);

  return {
    posItems,
    filteredPosItems,
    categories,
    isLoading,
    activeCategory,
    setActiveCategory: handleSetActiveCategory,
    refetch
  };
}
