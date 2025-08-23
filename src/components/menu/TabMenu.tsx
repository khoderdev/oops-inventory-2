import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { MenuItem, CreateMenuItemData } from "@/types/inventory";
import { Category } from "@/types/categories";
import { MenuItemBuilder } from "./MenuBuilder";
import BeveragesMenuBuilder from "./BeveragesMenuBuilder";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MenuItemsProvider, useMenuItems } from "@/contexts/MenuItemsContext";

interface TabMenuProps {
  categories?: Category[];
  onCreateMenuItem: (menuItem: CreateMenuItemData, imageFile?: File) => Promise<void>;
  onUpdateMenuItem: (id: string, menuItem: Partial<MenuItem>) => Promise<void>;
  onDeleteMenuItem: (id: string) => Promise<void>;
}

// Inner component that uses the context
const MenuPageContent: React.FC = () => {
  const { foodMenuItems, beverageMenuItems, menuItemCategories, beverageCategories, categoriesLoading, categoriesError, activeTab, handleTabChange, handleCreateMenuItem, handleUpdateMenuItem, handleDeleteMenuItem } = useMenuItems();

  const isMobile = useMediaQuery("(max-width: 640px)");

  // Map the tab values from context to component
  const tabValue = activeTab === "food" ? "menu-items" : "beverages";

  // Handle tab change with appropriate mapping
  const onTabChange = (value: string) => {
    handleTabChange(value === "menu-items" ? "food" : "beverages");
  };

  return (
    <Tabs defaultValue="menu-items" value={tabValue} onValueChange={onTabChange} className="w-full">
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

      <>
        <TabsContent value="menu-items" className="w-full mt-0">
          <MenuItemBuilder menuItems={foodMenuItems} categories={menuItemCategories} onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} categoriesLoading={categoriesLoading} categoriesError={categoriesError} />
        </TabsContent>

        <TabsContent value="beverages" className="w-full mt-0">
          <BeveragesMenuBuilder menuItems={beverageMenuItems} categories={beverageCategories} onCreateBeverageItem={handleCreateMenuItem} onUpdateBeverageItem={handleUpdateMenuItem} onDeleteBeverageItem={id => handleDeleteMenuItem(id, true)} categoriesLoading={categoriesLoading} categoriesError={categoriesError} />
        </TabsContent>
      </>
    </Tabs>
  );
};

// Wrapper component that provides the context
export const MenuPage: React.FC<TabMenuProps> = ({ categories: externalCategories, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  return (
    <MenuItemsProvider externalCategories={externalCategories} onCreateMenuItem={onCreateMenuItem} onUpdateMenuItem={onUpdateMenuItem} onDeleteMenuItem={onDeleteMenuItem}>
      <MenuPageContent />
    </MenuItemsProvider>
  );
};
