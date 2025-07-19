import { CostCalculationPanel } from "@/components/inventory/CostCalculationPanel";
import { InventoryManagementPanel } from "@/components/inventory/InventoryManagementPanel";
import { InventoryReportsPanel } from "@/components/inventory/InventoryReportsPanel";
import { ReportGenerator } from "@/components/analytics/ReportGenerator";
import { POSPanel } from "@/components/POSPanel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryCRUD } from "@/hooks/useInventoryCRUD";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { CreateMaterialData, CreateStockEntryData, MaterialWithStock, MenuItem, UpdateMaterialData, UpdateStockEntryData } from "@/types/inventory";
import { calculateMaterialInventory } from "@/utils/inventoryCalculations";
import { BarChart3, Loader2, Package, RefreshCw, FileText } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export const InventoryManagementPage = () => {
  // Fetch data from backend
  const { materials, stockEntries, menuItems, sections, sectionAssignments, loading, error, refetch } = useInventoryData();
  // CRUD operations
  const { createMaterial, updateMaterial, deleteMaterial, createStockEntry, updateStockEntry, deleteStockEntry, createMenuItem, updateMenuItem, deleteMenuItem, createSection, updateSection, deleteSection, loading: crudLoading, error: crudError } = useInventoryCRUD(refetch);
  // Optimistic updates for instant UI changes
  const { handleDeleteMaterial: optimisticDeleteMaterial } = useInventoryStore();

  // Tab management and auto-refresh
  const [activeTab, setActiveTab] = useState("pos");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh data when switching tabs
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      // Refresh data when switching to POS or Reports tabs for real-time data
      if (value === "pos" || value === "reports") {
        const timeSinceLastRefresh = Date.now() - lastRefresh.getTime();
        // Only refresh if it's been more than 30 seconds since last refresh
        if (timeSinceLastRefresh > 30000) {
          refetch();
          setLastRefresh(new Date());
        }
      }
    },
    [refetch, lastRefresh]
  );

  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Auto-refresh every 5 minutes when on POS tab
  useEffect(() => {
    if (activeTab === "pos") {
      const interval = setInterval(() => {
        refetch();
        setLastRefresh(new Date());
      }, 300000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [activeTab, refetch]);

  // Calculate materials with stock information
  const materialsWithStock: MaterialWithStock[] = useMemo(() => {
    return materials.map(material => {
      const materialStockEntries = stockEntries.filter(entry => entry.materialId === material.id);
      return calculateMaterialInventory(material, materialStockEntries);
    });
  }, [materials, stockEntries]);

  // CRUD handlers - now use backend API
  const handleCreateMaterial = async (data: CreateMaterialData) => {
    try {
      await createMaterial(data);
    } catch (error) {
      console.error("Failed to create material:", error);
    }
  };

  const handleUpdateMaterial = async (id: string, data: UpdateMaterialData) => {
    try {
      await updateMaterial(id, data);
    } catch (error) {
      console.error("Failed to update material:", error);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      // Use optimistic delete for instant UI updates
      await optimisticDeleteMaterial(id);
    } catch (error) {
      console.error("Failed to delete material:", error);
    }
  };

  const handleCreateStockEntry = async (data: CreateStockEntryData) => {
    try {
      await createStockEntry(data);
    } catch (error) {
      console.error("Failed to create stock entry:", error);
    }
  };

  const handleUpdateStockEntry = async (id: string, data: UpdateStockEntryData) => {
    try {
      await updateStockEntry(id, data);
    } catch (error) {
      console.error("Failed to update stock entry:", error);
    }
  };

  const handleDeleteStockEntry = async (id: string) => {
    try {
      await deleteStockEntry(id);
    } catch (error) {
      console.error("Failed to delete stock entry:", error);
    }
  };

  const handleCreateMenuItem = async (data: MenuItem) => {
    try {
      await createMenuItem(data);
    } catch (error) {
      console.error("Failed to create menu item:", error);
    }
  };

  const handleUpdateMenuItem = async (id: string, data: MenuItem) => {
    try {
      await updateMenuItem(id, data);
    } catch (error) {
      console.error("Failed to update menu item:", error);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      await deleteMenuItem(id);
    } catch (error) {
      console.error("Failed to delete menu item:", error);
    }
  };

  const handleCreateSection = async (data: { name: string; description?: string }) => {
    try {
      await createSection(data);
    } catch (error) {
      console.error("Failed to create section:", error);
    }
  };

  const handleUpdateSection = async (id: string, data: { name: string; description?: string }) => {
    try {
      await updateSection(id, data);
    } catch (error) {
      console.error("Failed to update section:", error);
    }
  };

  const handleDeleteSection = async (id: string) => {
    try {
      await deleteSection(id);
    } catch (error) {
      console.error("Failed to delete section:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading inventory data...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load inventory data: {error}
            <button onClick={refetch} className="ml-2 underline hover:no-underline">
              Retry
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {/* Show CRUD loading/error states */}
      {crudLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Processing request...</AlertDescription>
        </Alert>
      )}

      {crudError && (
        <Alert variant="destructive">
          <AlertDescription>{crudError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="">
        <TabsList className="grid w-full grid-cols-3 sticky top-0 bg-white !z-50">
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Button variant="ghost" size="sm" onClick={handleManualRefresh} disabled={isRefreshing || loading} className="h-8 w-8 p-0" title="Refresh all data">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <TabsTrigger value="pos" className="flex items-center gap-2 text-gray-950 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
            POS
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2 text-gray-950 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2 text-gray-950 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="p-4">
          <InventoryManagementPanel onDeleteMaterial={handleDeleteMaterial} onDeleteStockEntry={handleDeleteStockEntry} onCreateMenuItem={handleCreateMenuItem} onUpdateMenuItem={handleUpdateMenuItem} onDeleteMenuItem={handleDeleteMenuItem} onCreateSection={handleCreateSection} onUpdateSection={handleUpdateSection} onDeleteSection={handleDeleteSection} />
        </TabsContent>

        <TabsContent value="pos" className="p-4">
          <POSPanel materials={materialsWithStock} sectionAssignments={sectionAssignments} />
        </TabsContent>

        <TabsContent value="reports" className="p-4">
          <ReportGenerator className="w-full" />
        </TabsContent>
      </Tabs>
    </>
  );
};
