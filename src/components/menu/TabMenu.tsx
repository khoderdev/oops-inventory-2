import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { MenuItem, Material, StockEntry, Section } from "@/types/inventory";
import { Category } from "@/types/categories";
import { MenuItemBuilder } from "./MenuBuilder";
import BeveragesMenuBuilder from "./BeveragesMenuBuilder";

interface TabMenuProps {
  menuItems: MenuItem[];
  stockEntries: StockEntry[];
  materials: Material[];
  categories: Category[];
  sections: Section[];
  onCreateMenuItem: (menuItem: Omit<MenuItem, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdateMenuItem: (id: string, menuItem: Partial<MenuItem>) => Promise<void>;
  onDeleteMenuItem: (id: string) => Promise<void>;
}

export const TabMenu: React.FC<TabMenuProps> = ({
  menuItems,
  stockEntries,
  materials,
  categories,
  sections,
  onCreateMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
}) => {
  const [activeTab, setActiveTab] = useState("menu-items");

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
          sections={sections}
          onCreateMenuItem={onCreateMenuItem}
          onUpdateMenuItem={onUpdateMenuItem}
          onDeleteMenuItem={onDeleteMenuItem}
        />
      </TabsContent>
      
      <TabsContent value="beverages" className="w-full">
        <BeveragesMenuBuilder
          menuItems={menuItems}
          stockEntries={stockEntries}
          materials={materials}
          categories={categories}
          sections={sections}
          onCreateMenuItem={onCreateMenuItem}
          onUpdateMenuItem={onUpdateMenuItem}
          onDeleteMenuItem={onDeleteMenuItem}
        />
      </TabsContent>
    </Tabs>
  );
};
