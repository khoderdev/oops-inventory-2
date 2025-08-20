import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { MenuItem, Material, StockEntry, Section, CreateMenuItemData } from "@/types/inventory";
import { Category } from "@/types/categories";
import { MenuItemBuilder } from "./MenuBuilder";
import BeveragesMenuBuilder from "./BeveragesMenuBuilder";
import { getCategoriesByType } from "@/api/categories.api";
import { toast } from "../ui/use-toast";

interface TabMenuProps {
  menuItems: MenuItem[];
  stockEntries: StockEntry[];
  materials: Material[];
  sections: Section[];
  onCreateMenuItem: (menuItem: CreateMenuItemData, imageFile?: File) => Promise<void>;
  onUpdateMenuItem: (id: string, menuItem: Partial<MenuItem>) => Promise<void>;
  onDeleteMenuItem: (id: string) => Promise<void>;
}

export const MenuPage: React.FC<TabMenuProps> = ({
  menuItems,
  stockEntries,
  materials,
  sections,
  onCreateMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
}) => {
  const [activeTab, setActiveTab] = useState("menu-items");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Fetch categories from server
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      
      console.log('🔄 MenuPage: Fetching categories from server - SINGLE SOURCE OF TRUTH');
      console.time('⏱️ Categories fetch duration');
      
      // Fetch both menu_items and beverages categories
      const [menuItemsResponse, beveragesResponse] = await Promise.all([
        getCategoriesByType("menu_items", true),
        getCategoriesByType("beverages", true)
      ]);
      
      // Combine categories from both types
      const allCategories = [
        ...menuItemsResponse.totalItems,
        ...beveragesResponse.totalItems
      ];
      
      console.timeEnd('⏱️ Categories fetch duration');
      console.log('✅ MenuPage: Categories fetched successfully:', {
        menuItems: menuItemsResponse.totalItems.length,
        beverages: beveragesResponse.totalItems.length,
        total: allCategories.length,
        categoryTypes: allCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          types: cat.categoryTypes?.map(t => t.type)
        }))
      });
      
      setCategories(allCategories);
    } catch (error) {
      console.error('❌ MenuPage: Failed to fetch categories:', error);
      setCategoriesError('Failed to load categories');
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Refresh categories when menu items are created/updated/deleted
  const handleCategoryRefresh = useCallback(() => {
    console.log('🔄 MenuPage: Refreshing categories after menu item change');
    console.log('⚠️ This should be the only place categories are fetched outside initial load');
    fetchCategories();
  }, [fetchCategories]);

  // Enhanced handlers that refresh categories
  const handleCreateMenuItem = useCallback(async (menuItem: CreateMenuItemData, imageFile?: File) => {
    await onCreateMenuItem(menuItem, imageFile);
    handleCategoryRefresh();
  }, [onCreateMenuItem, handleCategoryRefresh]);

  const handleUpdateMenuItem = useCallback(async (id: string, menuItem: Partial<MenuItem>) => {
    await onUpdateMenuItem(id, menuItem);
    handleCategoryRefresh();
  }, [onUpdateMenuItem, handleCategoryRefresh]);

  const handleDeleteMenuItem = useCallback(async (id: string) => {
    await onDeleteMenuItem(id);
    handleCategoryRefresh();
  }, [onDeleteMenuItem, handleCategoryRefresh]);

  // Log when categories are passed to child components
  useEffect(() => {
    if (categories.length > 0) {
      console.log('📦 MenuPage: Passing categories to child components:', {
        count: categories.length,
        menuItemCategories: categories.filter(c => c.categoryTypes?.some(t => t.type === "menu_items")).length,
        beverageCategories: categories.filter(c => c.categoryTypes?.some(t => t.type === "beverages")).length
      });
    }
  }, [categories]);

  return (
    <Tabs defaultValue="menu-items" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="menu-items">Menu Items</TabsTrigger>
        <TabsTrigger value="beverages">Beverages</TabsTrigger>
      </TabsList>
      
      <TabsContent value="menu-items" className="w-full">
        <MenuItemBuilder
          menuItems={menuItems}
          stockEntries={stockEntries}
          materials={materials}
          categories={categories}
          sections={sections}
          onCreateMenuItem={handleCreateMenuItem}
          onUpdateMenuItem={handleUpdateMenuItem}
          onDeleteMenuItem={handleDeleteMenuItem}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
        />
      </TabsContent>
      
      <TabsContent value="beverages" className="w-full">
        <BeveragesMenuBuilder
          menuItems={menuItems}
          stockEntries={stockEntries}
          materials={materials}
          categories={categories}
          sections={sections}
          onCreateBeverageItem={handleCreateMenuItem}
          onUpdateBeverageItem={handleUpdateMenuItem}
          onDeleteBeverageItem={handleDeleteMenuItem}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
        />
      </TabsContent>
    </Tabs>
  );
};
