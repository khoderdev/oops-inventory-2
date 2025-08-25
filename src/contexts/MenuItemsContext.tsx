import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { toast } from "@/components/ui/use-toast";
import { menuAPI } from "@/api/menu.api.ts";
import { MenuItem, Material } from "@/types/inventory";
import { getCategoriesByType } from "@/api/categories.api";
import { Category } from "@/types/categories";
import { materialsAPI } from "@/api/materials.api";
import { MenuItemsContextState } from "@/types/menuItems";

// Create the context with default values
const MenuItemsContext = createContext<MenuItemsContextState | undefined>(undefined);

// Provider props interface
interface MenuItemsProviderProps {
  children: ReactNode;
  externalCategories?: Category[];
  onCreateMenuItem?: (menuItem: any, imageFile?: File) => Promise<void>;
  onUpdateMenuItem?: (id: string, menuItem: Partial<MenuItem>) => Promise<void>;
  onDeleteMenuItem?: (id: string) => Promise<void>;
}

// Provider component
export const MenuItemsProvider: React.FC<MenuItemsProviderProps> = ({ children, externalCategories, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  // Menu items state
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

  // Fetch menu items function
  const fetchMenuItems = useCallback(async () => {
    try {
      setMenuItemsLoading(true);
      setMenuItemsError(null);
      // Always fetch food menu items
      const foodItems = await menuAPI.getFoodMenuItems(true);
      console.log("🍔 MenuItemsContext: Fetched food menu items:", foodItems.length);
      setFoodMenuItems(foodItems);

      // Only fetch beverage items when the beverages tab is active
      if (activeTab === "beverages") {
        const beverageItems = await menuAPI.getBeverageMenuItems(true);
        console.log("🍹 MenuItemsContext: Fetched beverage menu items:", beverageItems.length);
        setBeverageMenuItems(beverageItems);
      }
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
      setMenuItemsError("Failed to load menu items");
      toast({
        title: "Error",
        description: "Failed to load menu items. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setMenuItemsLoading(false);
    }
  }, [activeTab]);

  // Handle tab change to fetch data only when needed
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);

      // If switching to beverages tab and we don't have beverage data yet, fetch it
      if (value === "beverages" && beverageMenuItems.length === 0) {
        fetchMenuItems();
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
        // If external categories are provided, use them
        const menuItemCats = externalCategories.filter(category => (category.categoryTypes && category.categoryTypes.some(type => type.type === "menu_items")) || (category.value && typeof category.value === "string" && (category.value.toLowerCase().includes("menu") || category.name.toLowerCase().includes("menu") || category.value.toLowerCase().includes("food") || category.name.toLowerCase().includes("food"))));

        const beverageCats = externalCategories.filter(category => (category.categoryTypes && category.categoryTypes.some(type => type.type === "beverages")) || (category.value && typeof category.value === "string" && (category.value.toLowerCase().includes("beverage") || category.name.toLowerCase().includes("beverage") || category.value.toLowerCase().includes("drink") || category.name.toLowerCase().includes("drink"))));

        setMenuItemCategories(menuItemCats);
        setBeverageCategories(beverageCats);
      } else {
        // Fetch categories from API by type
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
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setCategoriesLoading(false);
    }
  }, [externalCategories]);

  // Fetch materials for forms
  const fetchMaterials = useCallback(async () => {
    try {
      setMaterialsLoading(true);
      setMaterialsError(null);

      // Add cache-busting parameter to ensure fresh data
      const materials = await materialsAPI.getMaterials({ _t: Date.now() });
      setMaterialsWithStock(materials);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
      setMaterialsError("Failed to load materials");
      toast({
        title: "Error",
        description: "Failed to load materials. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setMaterialsLoading(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    // Only fetch food menu items on initial load
    fetchMenuItems();
    fetchCategories(); // Fetch categories directly for forms
    fetchMaterials(); // Fetch materials for forms
  }, [fetchCategories, fetchMenuItems, fetchMaterials]);

  // Handle create menu item
  const handleCreateMenuItem = useCallback(
    async (menuItem: any, imageFile?: File) => {
      try {
        if (onCreateMenuItem) {
          await onCreateMenuItem(menuItem, imageFile);
        }

        // Refresh the appropriate data based on current tab
        fetchMenuItems();

        return Promise.resolve();
      } catch (error) {
        console.error("Error creating menu item:", error);
        toast({
          title: "Error",
          description: "Failed to create menu item",
          variant: "destructive",
          duration: 5000
        });
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

        // Refresh the appropriate data based on current tab
        fetchMenuItems();

        return Promise.resolve();
      } catch (error) {
        console.error("Error updating menu item:", error);
        toast({
          title: "Error",
          description: "Failed to update menu item",
          variant: "destructive",
          duration: 5000
        });
        return Promise.reject(error);
      }
    },
    [onUpdateMenuItem, fetchMenuItems]
  );

  // Handle delete menu item
  const handleDeleteMenuItem = useCallback(
    async (id: string, isBeverage: boolean = false) => {
      try {
        if (onDeleteMenuItem) {
          await onDeleteMenuItem(id);
        }

        // Refresh the appropriate data based on current tab
        fetchMenuItems();

        return Promise.resolve();
      } catch (error) {
        console.error("Error deleting menu item:", error);
        toast({
          title: "Error",
          description: "Failed to delete menu item",
          variant: "destructive",
          duration: 5000
        });
        return Promise.reject(error);
      }
    },
    [onDeleteMenuItem, fetchMenuItems]
  );

  // Context value
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
