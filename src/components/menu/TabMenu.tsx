import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { MenuItem, CreateMenuItemData } from "@/types/inventory";
import { Category } from "@/types/categories";
import { MenuItemBuilder } from "./MenuBuilder";
import BeveragesMenuBuilder from "./BeveragesMenuBuilder";
import { getCategoriesByType } from "@/api/categories.api";
import { menuAPI } from "@/api/menu.api.ts";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "../ui/use-toast";
import { Loader2 } from "lucide-react";

interface TabMenuProps {
  categories?: Category[];
  onCreateMenuItem: (menuItem: CreateMenuItemData, imageFile?: File) => Promise<void>;
  onUpdateMenuItem: (id: string, menuItem: Partial<MenuItem>) => Promise<void>;
  onDeleteMenuItem: (id: string) => Promise<void>;
}

export const MenuPage: React.FC<TabMenuProps> = ({ categories: externalCategories, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  const [activeTab, setActiveTab] = useState("menu-items");
  const [foodMenuItems, setFoodMenuItems] = useState<MenuItem[]>([]);
  const [beverageMenuItems, setBeverageMenuItems] = useState<MenuItem[]>([]);
  const [menuItemCategories, setMenuItemCategories] = useState<Category[]>([]);
  const [beverageCategories, setBeverageCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [menuItemsLoading, setMenuItemsLoading] = useState(true);
  const [menuItemsError, setMenuItemsError] = useState<string | null>(null);
  
  // Handle tab change to fetch data only when needed
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    
    // If switching to beverages tab and we don't have beverage data yet, fetch it
    if (value === "beverages" && beverageMenuItems.length === 0) {
      fetchBeverageItems();
    }
  }, [beverageMenuItems.length]);
  
  // Separate function to fetch only beverage items
  const fetchBeverageItems = useCallback(async () => {
    try {
      setMenuItemsLoading(true);
      setMenuItemsError(null);
      
      console.log("🥤 TabMenu: Fetching beverage menu items...");
      const beverageItems = await menuAPI.getBeverageMenuItems(true);
      console.log("🥤 TabMenu: Fetched beverage menu items:", beverageItems.length);
      setBeverageMenuItems(beverageItems);
    } catch (error) {
      console.error("Failed to fetch beverage items:", error);
      setMenuItemsError("Failed to load beverage items");
      toast({
        title: "Error",
        description: "Failed to load beverage items. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setMenuItemsLoading(false);
    }
  }, []);

  // Fetch categories by type for forms and filtering
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);

      if (externalCategories && externalCategories.length > 0) {
        // If external categories are provided, use them
        const menuItemCategories = externalCategories.filter(category => (category.categoryTypes && category.categoryTypes.some(type => type.type === "menu_items")) || (category.value && typeof category.value === "string" && (category.value.toLowerCase().includes("menu") || category.name.toLowerCase().includes("menu") || category.value.toLowerCase().includes("food") || category.name.toLowerCase().includes("food"))));

        const beverageCategories = externalCategories.filter(category => (category.categoryTypes && category.categoryTypes.some(type => type.type === "beverages")) || (category.value && typeof category.value === "string" && (category.value.toLowerCase().includes("beverage") || category.name.toLowerCase().includes("beverage") || category.value.toLowerCase().includes("drink") || category.name.toLowerCase().includes("drink"))));

        setMenuItemCategories(menuItemCategories);
        setBeverageCategories(beverageCategories);
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

  const fetchMenuItems = useCallback(async () => {
    try {
      setMenuItemsLoading(true);
      setMenuItemsError(null);

      console.log("🔄 TabMenu: Fetching menu items...");

      // Only fetch food menu items when needed for the food tab
      const foodItems = await menuAPI.getFoodMenuItems(true);
      console.log("📋 TabMenu: Fetched food menu items:", foodItems.length);
      setFoodMenuItems(foodItems);
      
      // Only fetch beverage items when the beverages tab is active
      if (activeTab === "beverages") {
        const beverageItems = await menuAPI.getBeverageMenuItems(true);
        console.log("🥤 TabMenu: Fetched beverage menu items:", beverageItems.length);
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

  useEffect(() => {
    // Only fetch food menu items on initial load
    fetchMenuItems();
    fetchCategories(); // Fetch categories directly for forms
  }, [fetchCategories]);

  const handleCreateMenuItem = useCallback(
    async (menuItem: CreateMenuItemData, imageFile?: File) => {
      await onCreateMenuItem(menuItem, imageFile);
      
      // Only refresh the appropriate tab data
      if (menuItem.isBeverage) {
        if (activeTab === "beverages") {
          fetchBeverageItems();
        }
      } else {
        fetchMenuItems();
      }
    },
    [onCreateMenuItem, fetchMenuItems, fetchBeverageItems, activeTab]
  );

  const handleUpdateMenuItem = useCallback(
    async (id: string, menuItem: Partial<MenuItem>) => {
      await onUpdateMenuItem(id, menuItem);
      
      // Only refresh the appropriate tab data
      if (menuItem.isBeverage) {
        if (activeTab === "beverages") {
          fetchBeverageItems();
        }
      } else {
        fetchMenuItems();
      }
    },
    [onUpdateMenuItem, fetchMenuItems, fetchBeverageItems, activeTab]
  );

  const handleDeleteMenuItem = useCallback(
    async (id: string, isBeverage: boolean = false) => {
      await onDeleteMenuItem(id);
      
      // Only refresh the appropriate tab data
      if (isBeverage) {
        if (activeTab === "beverages") {
          fetchBeverageItems();
        }
      } else {
        fetchMenuItems();
      }
    },
    [onDeleteMenuItem, fetchMenuItems, fetchBeverageItems, activeTab]
  );

  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <Tabs defaultValue="menu-items" value={activeTab} onValueChange={handleTabChange} className="w-full">
      <div className="sticky top-0 z-10 bg-background">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="menu-items" className={`px-2 py-1.5 text-sm sm:text-base ${isMobile ? "text-xs" : ""}`}>
            Menu Items
          </TabsTrigger>
          <TabsTrigger value="beverages" className={`px-2 py-1.5 text-sm sm:text-base ${isMobile ? "text-xs" : ""}`}>
            Beverages
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="px-2 sm:px-4 md:px-6">
        {menuItemsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading menu items...</span>
          </div>
        ) : menuItemsError ? (
          <div className="p-4 text-center text-red-500">
            <p>{menuItemsError}</p>
            <button onClick={fetchMenuItems} className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Retry
            </button>
          </div>
        ) : (
          <>
            <TabsContent value="menu-items" className="w-full mt-0">
              <MenuItemBuilder menuItems={foodMenuItems} categories={menuItemCategories} onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} categoriesLoading={categoriesLoading} categoriesError={categoriesError} />
            </TabsContent>

            <TabsContent value="beverages" className="w-full mt-0">
              <BeveragesMenuBuilder menuItems={beverageMenuItems} categories={beverageCategories} onCreateBeverageItem={handleCreateMenuItem} onUpdateBeverageItem={handleUpdateMenuItem} onDeleteBeverageItem={(id) => handleDeleteMenuItem(id, true)} categoriesLoading={categoriesLoading} categoriesError={categoriesError} />
            </TabsContent>
          </>
        )}
      </div>
    </Tabs>
  );
};
