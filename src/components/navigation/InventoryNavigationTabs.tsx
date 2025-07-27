import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Boxes, MapPin, Package } from "lucide-react";
import React from "react";

interface InventoryNavigationTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  materialsContent: React.ReactNode;
  stockEntriesContent: React.ReactNode;
  sectionsContent: React.ReactNode;
  className?: string;
}

const InventoryNavigationTabs: React.FC<InventoryNavigationTabsProps> = ({ activeTab, onTabChange, materialsContent, stockEntriesContent, sectionsContent, className = "" }) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={className}>
      <TabsList className="grid w-full grid-cols-3 bg-gray-700 p-1 rounded-lg">
        <TabsTrigger value="materials" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-red data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200">
          <Boxes className="h-4 w-4" />
          <span className="hidden sm:inline">Materials</span>
          <span className="sm:hidden">Mat.</span>
        </TabsTrigger>
        <TabsTrigger value="stock-entries" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Stock Entries</span>
          <span className="sm:hidden">Stock</span>
        </TabsTrigger>
        <TabsTrigger value="sections" className="flex items-center gap-2 text-gray-700 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">Sections</span>
          <span className="sm:hidden">Sec.</span>
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="materials" className="space-y-4">
          {materialsContent}
        </TabsContent>

        <TabsContent value="stock-entries" className="space-y-4">
          {stockEntriesContent}
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          {sectionsContent}
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default InventoryNavigationTabs;
