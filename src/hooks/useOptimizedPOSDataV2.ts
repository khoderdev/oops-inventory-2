/**
 * Optimized POS Data Hook V2
 * Uses RTK Query for automatic caching, deduplication, and polling
 * Replaces the old useOptimizedPOSData hook
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { POSItem, MenuItem } from "@/types/inventory";
import { Category } from "@/types/categories";
import { useGetFoodMenuItemsQuery, useGetBeverageMenuItemsQuery, useGetCategoriesByTypeQuery } from "@/store/api/posApi";
import { buildCategoriesMap, transformMenuItemsToPOSItems, extractCategories, filterPOSItemsByCategory } from "@/services/posDataService";
import { useAuth } from "@/contexts/AuthContext";

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

  // Use RTK Query hooks - automatic caching and deduplication
  // Skip queries if not authenticated to prevent 401 errors
  const {
    data: foodMenuItems = [],
    isLoading: foodLoading,
    refetch: refetchFood
  } = useGetFoodMenuItemsQuery(true, {
    // Refetch on mount and window focus
    refetchOnMountOrArgChange: true,
    refetchOnFocus: false, // Disable refetch on focus to prevent unnecessary re-renders
    // Keep data for 5 minutes
    pollingInterval: 0, // Disable automatic polling, we'll use smart polling
    skip: !isAuthenticated // Skip if not authenticated
  });

  const {
    data: beverageMenuItems = [],
    isLoading: beverageLoading,
    refetch: refetchBeverages
  } = useGetBeverageMenuItemsQuery(true, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: false, // Disable refetch on focus
    pollingInterval: 0,
    skip: !isAuthenticated
  });

  const { data: menuItemCategories = [], isLoading: menuCategoriesLoading } = useGetCategoriesByTypeQuery("menu_items", {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: false, // Disable refetch on focus
    pollingInterval: 0,
    skip: !isAuthenticated
  });

  const { data: beverageCategories = [], isLoading: beverageCategoriesLoading } = useGetCategoriesByTypeQuery("beverages", {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: false, // Disable refetch on focus
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
      return [];
    }

    // Build once when data is available
    if (posItemsRef.current.length === 0 && (foodMenuItems.length > 0 || beverageMenuItems.length > 0)) {
      console.log("🔄 [useOptimizedPOSDataV2] Transforming menu items to POS items (ONCE)");
      posItemsRef.current = transformMenuItemsToPOSItems(foodMenuItems as MenuItem[], beverageMenuItems as MenuItem[], categoriesMapRef.current);
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

  const isLoading = foodLoading || beverageLoading || menuCategoriesLoading || beverageCategoriesLoading;

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
