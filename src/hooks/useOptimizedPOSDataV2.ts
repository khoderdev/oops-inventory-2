/**
 * Optimized POS Data Hook V2
 * Uses RTK Query for automatic caching, deduplication, and polling
 * Replaces the old useOptimizedPOSData hook
 */

import { useState, useMemo, useCallback } from "react";
import { POSItem, MenuItem } from "@/types/inventory";
import { Category } from "@/types/categories";
import { useGetFoodMenuItemsQuery, useGetBeverageMenuItemsQuery, useGetCategoriesByTypeQuery } from "@/store/api/posApi";
import { buildCategoriesMap, transformMenuItemsToPOSItems, extractCategories, filterPOSItemsByCategory } from "@/services/posDataService";

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
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Use RTK Query hooks - automatic caching and deduplication
  const {
    data: foodMenuItems = [],
    isLoading: foodLoading,
    refetch: refetchFood
  } = useGetFoodMenuItemsQuery(true, {
    // Refetch on mount and window focus
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    // Keep data for 5 minutes
    pollingInterval: 0 // Disable automatic polling, we'll use smart polling
  });

  const {
    data: beverageMenuItems = [],
    isLoading: beverageLoading,
    refetch: refetchBeverages
  } = useGetBeverageMenuItemsQuery(true, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    pollingInterval: 0
  });

  const { data: menuItemCategories = [], isLoading: menuCategoriesLoading } = useGetCategoriesByTypeQuery("menu_items", {
    refetchOnMountOrArgChange: true,
    pollingInterval: 0
  });

  const { data: beverageCategories = [], isLoading: beverageCategoriesLoading } = useGetCategoriesByTypeQuery("beverages", {
    refetchOnMountOrArgChange: true,
    pollingInterval: 0
  });

  // Build categories map (memoized)
  const categoriesMap = useMemo(() => {
    return buildCategoriesMap(menuItemCategories, beverageCategories);
  }, [menuItemCategories, beverageCategories]);

  // Transform menu items to POS items (memoized)
  const posItems = useMemo(() => {
    if (isPOSActionInProgress) {
      // Return empty during POS actions to prevent grid refresh
      return [];
    }

    if (foodMenuItems.length === 0 && beverageMenuItems.length === 0) {
      return [];
    }

    console.log("🔄 [useOptimizedPOSDataV2] Transforming menu items to POS items");
    return transformMenuItemsToPOSItems(foodMenuItems as MenuItem[], beverageMenuItems as MenuItem[], categoriesMap);
  }, [foodMenuItems, beverageMenuItems, categoriesMap, isPOSActionInProgress]);

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

  // Refetch all data
  const refetch = useCallback(() => {
    console.log("🔄 [useOptimizedPOSDataV2] Refetching all data");
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
