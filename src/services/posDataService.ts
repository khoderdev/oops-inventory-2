/**
 * POS Data Service
 * Handles data transformation and caching outside of React components
 * Optimized for performance with Web Worker support
 */

import { POSItem, MenuItem } from "@/types/inventory";
import { Category } from "@/types/categories";

// Cache keys
const CACHE_KEYS = {
  POS_ITEMS: "oops_pos_items",
  POS_ITEMS_TIMESTAMP: "oops_pos_items_timestamp",
  CATEGORIES_MAP: "oops_categories_map",
} as const;

// Cache duration: 24 hours
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

/**
 * Transform variants to standardized format
 */
export function transformVariants(
  variants: any
): Array<{
  id: string | number;
  name: string;
  volume: number;
  unit: string;
  price: string | number;
}> {
  if (Array.isArray(variants)) return variants;

  if (variants && typeof variants === "object") {
    if (variants.variantVolumes) {
      return Object.keys(variants.variantVolumes).map((variantKey) => ({
        id: variantKey,
        name: variantKey,
        volume: variants.variantVolumes[variantKey] || 0,
        unit: variants.variantVolumeUnits?.[variantKey] || "cl",
        price: variants.variantPrices?.[variantKey] || 0,
      }));
    }

    return Object.entries(variants).map(([key, value]: [string, any]) => ({
      id: key,
      name: key,
      volume: value.volume || value.size || 0,
      unit: value.unit || "cl",
      price: value.price || 0,
    }));
  }

  return [];
}

/**
 * Build categories map from category arrays
 */
export function buildCategoriesMap(
  menuItemCategories: Category[] = [],
  beverageCategories: Category[] = []
): Map<number, string> {
  const categoryMap = new Map<number, string>();

  menuItemCategories
    .filter((c) => c?.isActive)
    .forEach((c) => {
      if (c?.id && c?.name) categoryMap.set(c.id, c.name);
    });

  beverageCategories
    .filter((c) => c?.isActive)
    .forEach((c) => {
      if (c?.id && c?.name) categoryMap.set(c.id, c.name);
    });

  return categoryMap;
}

/**
 * Transform menu items to POS items
 * This is the expensive operation that should run outside React render
 */
export function transformMenuItemsToPOSItems(
  foodMenuItems: MenuItem[],
  beverageMenuItems: MenuItem[],
  categoriesMap: Map<number, string>
): POSItem[] {
  const allMenuItems = [...foodMenuItems, ...beverageMenuItems];
  const transformedItems: POSItem[] = [];

  for (let i = 0; i < allMenuItems.length; i++) {
    const menuItem = allMenuItems[i];
    if (!menuItem || menuItem.isPOSItem === false) continue;

    let categoryName = "Uncategorized";
    if (menuItem.category) {
      if (
        typeof menuItem.category === "object" &&
        menuItem.category !== null &&
        "id" in menuItem.category
      ) {
        categoryName =
          categoriesMap.get(menuItem.category.id) ||
          (menuItem.category as any).name ||
          "Uncategorized";
      } else if (typeof menuItem.category === "number") {
        categoryName = categoriesMap.get(menuItem.category) || "Uncategorized";
      } else if (typeof menuItem.category === "string") {
        categoryName = menuItem.category;
      }
    }

    const variants = menuItem.variants
      ? transformVariants(menuItem.variants)
      : undefined;

    transformedItems.push({
      id: `menu-${menuItem.id}`,
      name: menuItem.name,
      price:
        typeof menuItem.price === "number" && !isNaN(menuItem.price)
          ? menuItem.price
          : 0,
      category: categoryName,
      type: "menu_item" as const,
      menuItemId: menuItem.id,
      unit: menuItem.unit || "unit",
      availableQuantity: menuItem.availableQuantity || 0,
      costPerUnit: menuItem.costPerUnit || 0,
      createdAt: menuItem.createdAt?.toString() || new Date().toISOString(),
      updatedAt: menuItem.updatedAt?.toString() || new Date().toISOString(),
      description: menuItem.description,
      image: menuItem.image,
      imageUrl: menuItem.image ? `/uploads/${menuItem.image}` : undefined,
      variants: variants,
    });
  }

  return transformedItems;
}

/**
 * Load POS items from cache
 */
export function loadPOSItemsFromCache(): POSItem[] | null {
  try {
    const cachedPosItems = localStorage.getItem(CACHE_KEYS.POS_ITEMS);
    const cachedTimestamp = localStorage.getItem(CACHE_KEYS.POS_ITEMS_TIMESTAMP);

    if (!cachedPosItems || !cachedTimestamp) return null;

    const now = Date.now();
    const age = now - parseInt(cachedTimestamp);

    if (age > CACHE_MAX_AGE) {
      // Cache expired
      localStorage.removeItem(CACHE_KEYS.POS_ITEMS);
      localStorage.removeItem(CACHE_KEYS.POS_ITEMS_TIMESTAMP);
      return null;
    }

    const parsedItems = JSON.parse(cachedPosItems) as POSItem[];
    if (parsedItems && Array.isArray(parsedItems) && parsedItems.length > 0) {
      return parsedItems;
    }

    return null;
  } catch (err) {
    console.error("Error loading POS items from cache:", err);
    return null;
  }
}

/**
 * Save POS items to cache
 */
export function savePOSItemsToCache(items: POSItem[]): void {
  try {
    localStorage.setItem(CACHE_KEYS.POS_ITEMS, JSON.stringify(items));
    localStorage.setItem(CACHE_KEYS.POS_ITEMS_TIMESTAMP, Date.now().toString());
  } catch (err) {
    console.error("Error saving POS items to cache:", err);
  }
}

/**
 * Invalidate POS items cache
 */
export function invalidatePOSItemsCache(): void {
  try {
    localStorage.removeItem(CACHE_KEYS.POS_ITEMS);
    localStorage.removeItem(CACHE_KEYS.POS_ITEMS_TIMESTAMP);
  } catch (err) {
    console.error("Error invalidating POS items cache:", err);
  }
}

/**
 * Extract unique categories from POS items
 */
export function extractCategories(posItems: POSItem[]): string[] {
  const uniqueCategories = new Set<string>(["all"]);

  for (let i = 0; i < posItems.length; i++) {
    const item = posItems[i];
    if (item?.category && typeof item.category === "string") {
      uniqueCategories.add(item.category);
    }
  }

  const categoriesArray = Array.from(uniqueCategories);
  categoriesArray.sort((a, b) => {
    if (a === "all") return -1;
    if (b === "all") return 1;
    return a.localeCompare(b);
  });

  return categoriesArray;
}

/**
 * Filter POS items by category
 */
export function filterPOSItemsByCategory(
  posItems: POSItem[],
  category: string
): POSItem[] {
  if (category === "all") return posItems;

  return posItems.filter(
    (item) => typeof item.category === "string" && item.category === category
  );
}
