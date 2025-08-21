import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { MenuItem, Material, StockEntry, Section, CreateMenuItemData } from "@/types/inventory";
import { Category } from "@/types/categories";
import { MenuItemBuilder } from "./MenuBuilder";
import BeveragesMenuBuilder from "./BeveragesMenuBuilder";
import { getCategoriesByType } from "@/api/categories.api";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "../ui/use-toast";

interface TabMenuProps {
  menuItems: MenuItem[];
  stockEntries: StockEntry[];
  materials: Material[];
  sections: Section[];
  categories?: Category[];
  onCreateMenuItem: (menuItem: CreateMenuItemData, imageFile?: File) => Promise<void>;
  onUpdateMenuItem: (id: string, menuItem: Partial<MenuItem>) => Promise<void>;
  onDeleteMenuItem: (id: string) => Promise<void>;
}

export const MenuPage: React.FC<TabMenuProps> = ({ 
  menuItems, 
  stockEntries, 
  materials, 
  sections, 
  categories: externalCategories, 
  onCreateMenuItem, 
  onUpdateMenuItem, 
  onDeleteMenuItem 
}) => {
  const [activeTab, setActiveTab] = useState("menu-items");
  const [menuItemCategories, setMenuItemCategories] = useState<Category[]>([]);
  const [beverageCategories, setBeverageCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Fetch categories from server with cache busting
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      
      // If external categories are provided, use them instead of fetching
      if (externalCategories && externalCategories.length > 0) {
        console.log("Using externally provided categories:", externalCategories.length);
        
        // Filter categories by type using categoryTypeIds or categoryTypes array
        // We need to check if the category has the appropriate type
        // This depends on how categories are structured in the app
        const menuItemCategories = [];
        const beverageCategories = [];
        
        // Sort categories into their respective arrays
        for (const category of externalCategories) {
          // Check if we can determine the type from categoryTypes
          if (category.categoryTypes && category.categoryTypes.length > 0) {
            if (category.categoryTypes.some(type => type.type === "menu_items")) {
              menuItemCategories.push(category);
            }
            if (category.categoryTypes.some(type => type.type === "beverages")) {
              beverageCategories.push(category);
            }
          } 
          // If no categoryTypes, try to infer from other properties
          // This is a fallback mechanism
          else if (category.value && typeof category.value === 'string') {
            // Some apps store type info in the value or name field
            const lowerValue = category.value.toLowerCase();
            const lowerName = category.name.toLowerCase();
            
            if (lowerValue.includes('menu') || lowerName.includes('menu') || 
                lowerValue.includes('food') || lowerName.includes('food')) {
              menuItemCategories.push(category);
            } else if (lowerValue.includes('beverage') || lowerName.includes('beverage') || 
                      lowerValue.includes('drink') || lowerName.includes('drink')) {
              beverageCategories.push(category);
            }
          }
        }
        
        setMenuItemCategories(menuItemCategories);
        setBeverageCategories(beverageCategories);
      } else {
        // Fetch both menu_items and beverages categories
        // The timestamp in the URL will be added by the API client
        const [menuItemsResponse, beveragesResponse] = await Promise.all([
          getCategoriesByType("menu_items", true),
          getCategoriesByType("beverages", true)
        ]);
        
        console.log("Fetched Menu categories:", menuItemsResponse.totalItems?.length || 0);
        console.log("Fetched Beverages categories:", beveragesResponse.totalItems?.length || 0);
        
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
      });
    } finally {
      setCategoriesLoading(false);
    }
  }, [externalCategories]);
  
  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Enhanced handlers that refresh categories
  const handleCreateMenuItem = useCallback(
    async (menuItem: CreateMenuItemData, imageFile?: File) => {
      await onCreateMenuItem(menuItem, imageFile);
      fetchCategories(); // Direct call to avoid circular dependency
    },
    [onCreateMenuItem, fetchCategories]
  );

  const handleUpdateMenuItem = useCallback(
    async (id: string, menuItem: Partial<MenuItem>) => {
      await onUpdateMenuItem(id, menuItem);
      fetchCategories(); // Direct call to avoid circular dependency
    },
    [onUpdateMenuItem, fetchCategories]
  );

  const handleDeleteMenuItem = useCallback(
    async (id: string) => {
      await onDeleteMenuItem(id);
      fetchCategories(); // Direct call to avoid circular dependency
    },
    [onDeleteMenuItem, fetchCategories]
  );

  // Log when categories are passed to child components
  useEffect(() => {
    if (menuItemCategories.length > 0 || beverageCategories.length > 0) {
      console.log("📦 MenuPage: Passing categories to child components:", {
        menuItemCategories: menuItemCategories.length,
        beverageCategories: beverageCategories.length
      });
    }
  }, [menuItemCategories, beverageCategories]);

  // Check if the screen is mobile size
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <Tabs defaultValue="menu-items" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="sticky top-0 z-10 bg-background pt-2 pb-3 mb-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="menu-items" className={`px-2 py-1.5 text-sm sm:text-base ${isMobile ? "text-xs" : ""}`}>
            Menu Items
          </TabsTrigger>
          <TabsTrigger value="beverages" className={`px-2 py-1.5 text-sm sm:text-base ${isMobile ? "text-xs" : ""}`}>
            Beverages
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="px-2 sm:px-4 md:px-6">
        <TabsContent value="menu-items" className="w-full mt-0">
          <MenuItemBuilder 
            menuItems={menuItems} 
            stockEntries={stockEntries} 
            materials={materials} 
            categories={menuItemCategories} 
            sections={sections} 
            onCreateMenuItem={handleCreateMenuItem} 
            onUpdateMenuItem={handleUpdateMenuItem} 
            onDeleteMenuItem={handleDeleteMenuItem} 
            categoriesLoading={categoriesLoading} 
            categoriesError={categoriesError} 
          />
        </TabsContent>

        <TabsContent value="beverages" className="w-full mt-0">
          <BeveragesMenuBuilder 
            menuItems={menuItems} 
            stockEntries={stockEntries} 
            materials={materials} 
            categories={beverageCategories} 
            sections={sections} 
            onCreateBeverageItem={handleCreateMenuItem} 
            onUpdateBeverageItem={handleUpdateMenuItem} 
            onDeleteBeverageItem={handleDeleteMenuItem} 
            categoriesLoading={categoriesLoading} 
            categoriesError={categoriesError} 
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};
