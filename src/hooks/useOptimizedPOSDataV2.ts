/**
 * Optimized POS Data Hook V2
 * Uses RTK Query for automatic caching, deduplication, and polling
 * Replaces the old useOptimizedPOSData hook
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { POSItem, MenuItem } from "@/types/inventory";
import { Category } from "@/types/categories";
import { useGetFoodMenuItemsQuery, useGetBeverageMenuItemsQuery, useGetCategoriesByTypeQuery } from "@/store/api/posApi";
import { buildCategoriesMap, transformMenuItemsToPOSItems, extractCategories, filterPOSItemsByCategory } from "@/services/posDataService";
import { useAuth } from "@/contexts/AuthContext";
import { posCache } from "@/utils/posCache";

export interface UseOptimizedPOSDataResult {
  posItems: POSItem[];
  filteredPosItems: POSItem[];
  categories: string[];
  isLoading: boolean;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  refetch: () => void;
}

export function useOptimizedPOSDataV2(isPOSActionInProgress: boolean = false): UseOptimizedPOSDataResult {
  const { isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  // Refs for stable caching
  const categoriesMapRef = useRef<Map<number, string>>(new Map());
  const posItemsRef = useRef<POSItem[]>([]);
  const lastDataLengthRef = useRef({ food: 0, beverage: 0, menuCat: 0, bevCat: 0 });
  const initialLoadRef = useRef(false);

  // DESKTOP APP SPEED: Load from localStorage FIRST
  useEffect(() => {
    if (!initialLoadRef.current && isAuthenticated) {
      console.log("⚡ [useOptimizedPOSDataV2] Loading from localStorage cache...");
      
      // Try to load cached POS items
      const cachedPosItems = posCache.get<POSItem[]>(posCache.keys.FOOD_ITEMS + '_transformed');
      if (cachedPosItems && cachedPosItems.length > 0) {
        // Validate cached data has required properties
        const validItems = cachedPosItems.filter(item => item && item.id && item.name);
        if (validItems.length > 0) {
          posItemsRef.current = validItems;
          console.log(`✅ [useOptimizedPOSDataV2] Loaded ${validItems.length} items from cache INSTANTLY!`);
        } else {
          console.warn("⚠️ [useOptimizedPOSDataV2] Cached items are invalid, clearing cache");
          posCache.remove(posCache.keys.FOOD_ITEMS + '_transformed');
        }
      }
      
      initialLoadRef.current = true;
    }
  }, [isAuthenticated]);

  // Use RTK Query hooks - INSTANT from cache, update in background
  // Skip queries if not authenticated to prevent 401 errors
  const {
    data: foodMenuItems = [],
    isLoading: foodLoading,
    refetch: refetchFood
  } = useGetFoodMenuItemsQuery(true, {
    // DESKTOP APP SPEED: Use cache immediately, no refetch on mount
    refetchOnMountOrArgChange: false, // Use cache instantly
    refetchOnFocus: false, // Never refetch on focus
    pollingInterval: 0, // No polling
    skip: !isAuthenticated // Skip if not authenticated
  });

  const {
    data: beverageMenuItems = [],
    isLoading: beverageLoading,
    refetch: refetchBeverages
  } = useGetBeverageMenuItemsQuery(true, {
    refetchOnMountOrArgChange: false, // Use cache instantly
    refetchOnFocus: false,
    pollingInterval: 0,
    skip: !isAuthenticated
  });

  const { data: menuItemCategories = [], isLoading: menuCategoriesLoading } = useGetCategoriesByTypeQuery("menu_items", {
    refetchOnMountOrArgChange: false, // Use cache instantly
    refetchOnFocus: false,
    pollingInterval: 0,
    skip: !isAuthenticated
  });

  const { data: beverageCategories = [], isLoading: beverageCategoriesLoading } = useGetCategoriesByTypeQuery("beverages", {
    refetchOnMountOrArgChange: false, // Use cache instantly
    refetchOnFocus: false,
    pollingInterval: 0,
    skip: !isAuthenticated
  });

  // Build categories map (SMART CACHE - build once when data arrives, then cache)
  const categoriesMap = useMemo(() => {
    if (!isAuthenticated) return new Map();
    
    // Build once when data is available
    if (categoriesMapRef.current.size === 0 && menuItemCategories.length > 0 && beverageCategories.length > 0) {
      console.log("🔄 [useOptimizedPOSDataV2] Building categories map (ONCE)");
      categoriesMapRef.current = buildCategoriesMap(menuItemCategories, beverageCategories);
    }
    
    return categoriesMapRef.current;
  }, [menuItemCategories.length > 0, beverageCategories.length > 0, isAuthenticated]); // Trigger once when data arrives

  // Transform menu items to POS items (SMART CACHE - build once when data arrives, then cache)
  const posItems = useMemo(() => {
    if (!isAuthenticated || isPOSActionInProgress) {
      // Return cached items during POS actions
      return posItemsRef.current;
    }

    if (foodMenuItems.length === 0 && beverageMenuItems.length === 0) {
      // Return cached items if available
      return posItemsRef.current;
    }

    // Build once when data is available
    if (posItemsRef.current.length === 0 && (foodMenuItems.length > 0 || beverageMenuItems.length > 0)) {
      console.log("🔄 [useOptimizedPOSDataV2] Transforming menu items to POS items (ONCE)");
      const transformed = transformMenuItemsToPOSItems(foodMenuItems as MenuItem[], beverageMenuItems as MenuItem[], categoriesMapRef.current);
      
      // Validate transformed data before caching
      const validItems = transformed.filter(item => item && item.id && item.name);
      if (validItems.length !== transformed.length) {
        console.warn(`⚠️ [useOptimizedPOSDataV2] Filtered out ${transformed.length - validItems.length} invalid items`);
      }
      
      posItemsRef.current = validItems;
      
      // DESKTOP APP SPEED: Save to localStorage for instant load next time
      if (validItems.length > 0) {
        posCache.set(posCache.keys.FOOD_ITEMS + '_transformed', validItems);
        console.log(`💾 [useOptimizedPOSDataV2] Saved ${validItems.length} valid items to localStorage`);
      }
    }
    
    return posItemsRef.current;
  }, [foodMenuItems.length > 0, beverageMenuItems.length > 0, categoriesMapRef.current.size > 0, isPOSActionInProgress, isAuthenticated]); // Trigger once when data arrives

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
    console.log("🔄 [useOptimizedPOSDataV2] Refetching all data - clearing cache");
    // Clear cache to force rebuild
    categoriesMapRef.current = new Map();
    posItemsRef.current = [];
    lastDataLengthRef.current = { food: 0, beverage: 0, menuCat: 0, bevCat: 0 };
    // Refetch from API
    refetchFood();
    refetchBeverages();
  }, [refetchFood, refetchBeverages]);

  // Stable setActiveCategory
  const handleSetActiveCategory = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  // DESKTOP APP SPEED: Never show loading if we have cached data
  const isLoading = posItemsRef.current.length === 0 && (foodLoading || beverageLoading || menuCategoriesLoading || beverageCategoriesLoading);

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
