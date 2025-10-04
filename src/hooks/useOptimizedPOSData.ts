/**
 * Optimized POS Data Hook
 * Handles data loading and transformation with caching
 * NO CONTEXT - Uses direct API calls with smart caching
 */

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { POSItem, MenuItem } from "@/types/inventory";
import { Category } from "@/types/categories";
import { buildCategoriesMap, transformMenuItemsToPOSItems, loadPOSItemsFromCache, savePOSItemsToCache, invalidatePOSItemsCache, extractCategories, filterPOSItemsByCategory } from "@/services/posDataService";
import { menuAPI } from "@/api/menu.api";
import categoriesAPI from "@/api/categories.api";

export interface UseOptimizedPOSDataResult {
  posItems: POSItem[];
  filteredPosItems: POSItem[];
  categories: string[];
  isLoading: boolean;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export function useOptimizedPOSData(isPOSActionInProgress: boolean = false): UseOptimizedPOSDataResult {
  const [foodMenuItems, setFoodMenuItems] = useState<MenuItem[]>([]);
  const [beverageMenuItems, setBeverageMenuItems] = useState<MenuItem[]>([]);
  const [menuItemCategories, setMenuItemCategories] = useState<Category[]>([]);
  const [beverageCategories, setBeverageCategories] = useState<Category[]>([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  // Refs for stable data
  const posItemsRef = useRef<POSItem[]>([]);
  const categoriesMapRef = useRef<Map<number, string>>(new Map());
  const categoriesRef = useRef<string[]>(["all"]);
  const filteredCacheRef = useRef<Map<string, POSItem[]>>(new Map());

  // Track data versions to detect changes
  const lastFoodLengthRef = useRef(0);
  const lastBeverageLengthRef = useRef(0);
  const lastCategoriesLengthRef = useRef(0);
  const dataFetchedRef = useRef(false);

  // Fetch data on mount (once)
  useEffect(() => {
    if (dataFetchedRef.current) return;

    const fetchData = async () => {
      try {
        setMenuItemsLoading(true);

        // Fetch all data in parallel
        const [foodItems, beverageItems, menuCategories, bevCategories] = await Promise.all([menuAPI.getFoodMenuItems(true), menuAPI.getBeverageMenuItems(true), categoriesAPI.getCategoriesByType("menu_items"), categoriesAPI.getCategoriesByType("beverages")]);

        setFoodMenuItems(foodItems || []);
        setBeverageMenuItems(beverageItems || []);
        setMenuItemCategories(menuCategories.totalItems || []);
        setBeverageCategories(bevCategories.totalItems || []);

        dataFetchedRef.current = true;
      } catch (error) {
        console.error("Failed to fetch POS data:", error);
      } finally {
        setMenuItemsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Build categories map (memoized)
  const categoriesMap = useMemo(() => {
    const map = buildCategoriesMap(menuItemCategories, beverageCategories);
    categoriesMapRef.current = map;
    return map;
  }, [menuItemCategories, beverageCategories]);

  // Transform menu items to POS items (only when data changes)
  useEffect(() => {
    const foodLength = foodMenuItems?.length || 0;
    const beverageLength = beverageMenuItems?.length || 0;
    const categoriesLength = categoriesMap.size;

    // Check if data actually changed
    const dataChanged = foodLength !== lastFoodLengthRef.current || beverageLength !== lastBeverageLengthRef.current || categoriesLength !== lastCategoriesLengthRef.current;

    if (!dataChanged && posItemsRef.current.length > 0) {
      return; // No changes, skip transformation
    }

    // Update refs
    lastFoodLengthRef.current = foodLength;
    lastBeverageLengthRef.current = beverageLength;
    lastCategoriesLengthRef.current = categoriesLength;

    // Try to load from cache first
    if (posItemsRef.current.length === 0) {
      const cachedItems = loadPOSItemsFromCache();
      if (cachedItems && cachedItems.length > 0) {
        posItemsRef.current = cachedItems;
        categoriesRef.current = extractCategories(cachedItems);
        setIsLoading(false);
        return;
      }
    }

    // Transform data
    if (foodLength > 0 || beverageLength > 0) {
      setIsLoading(true);

      // Use setTimeout to defer heavy computation
      const timeoutId = setTimeout(() => {
        const transformedItems = transformMenuItemsToPOSItems(foodMenuItems || [], beverageMenuItems || [], categoriesMap);

        posItemsRef.current = transformedItems;
        categoriesRef.current = extractCategories(transformedItems);

        // Save to cache
        savePOSItemsToCache(transformedItems);

        // Clear filtered cache
        filteredCacheRef.current.clear();

        setIsLoading(false);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [foodMenuItems, beverageMenuItems, categoriesMap, menuItemsLoading]);

  // Invalidate cache when menu items change
  useEffect(() => {
    const foodLength = foodMenuItems?.length || 0;
    const beverageLength = beverageMenuItems?.length || 0;

    if (foodLength > 0 || beverageLength > 0) {
      invalidatePOSItemsCache();
    }
  }, [foodMenuItems?.length, beverageMenuItems?.length]);

  // Get POS items (stable reference)
  const posItems = useMemo(() => {
    if (isPOSActionInProgress && posItemsRef.current.length > 0) {
      return posItemsRef.current;
    }
    return posItemsRef.current;
  }, [isPOSActionInProgress, isLoading]);

  // Get filtered POS items (with caching)
  const filteredPosItems = useMemo(() => {
    if (isPOSActionInProgress) {
      const cached = filteredCacheRef.current.get(activeCategory);
      if (cached) return cached;
    }

    // Check cache first
    const cached = filteredCacheRef.current.get(activeCategory);
    if (cached && cached.length > 0) {
      return cached;
    }

    // Filter items
    const filtered = filterPOSItemsByCategory(posItems, activeCategory);

    // Cache result
    filteredCacheRef.current.set(activeCategory, filtered);

    // Limit cache size (keep only last 5 categories)
    if (filteredCacheRef.current.size > 5) {
      const firstKey = filteredCacheRef.current.keys().next().value;
      if (firstKey) {
        filteredCacheRef.current.delete(firstKey);
      }
    }

    return filtered;
  }, [posItems, activeCategory, isPOSActionInProgress]);

  // Get categories
  const categories = useMemo(() => {
    return categoriesRef.current;
  }, [posItems.length]);

  // Stable setActiveCategory
  const handleSetActiveCategory = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  return {
    posItems,
    filteredPosItems,
    categories,
    isLoading: isLoading || menuItemsLoading,
    activeCategory,
    setActiveCategory: handleSetActiveCategory
  };
}
