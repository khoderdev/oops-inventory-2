import { CostCalculationPanel } from "@/components/inventory/CostCalculationPanel";
import { InventoryManagementPanel } from "@/components/inventory/InventoryManagementPanel";
import { InventoryReportsPanel } from "@/components/inventory/InventoryReportsPanel";
import { POSPanel } from "@/components/POSPanel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryCRUD } from "@/hooks/useInventoryCRUD";
import { useInventoryData } from "@/hooks/useInventoryData";
import { CreateMaterialData, CreateStockEntryData, MaterialWithStock, MenuItem, UpdateMaterialData, UpdateStockEntryData } from "@/types/inventory";
import { calculateMaterialInventory } from "@/utils/inventoryCalculations";
import { BarChart3, FileText, Loader2, Package } from "lucide-react";
import { useMemo } from "react";

export const InventoryManagementPage = () => {
  // Fetch data from backend
  const { materials, stockEntries, menuItems, sections, sectionAssignments, loading, error, refetch } = useInventoryData();
  // CRUD operations
  const { createMaterial, updateMaterial, deleteMaterial, createStockEntry, updateStockEntry, deleteStockEntry, createMenuItem, updateMenuItem, deleteMenuItem, loading: crudLoading, error: crudError } = useInventoryCRUD(refetch);

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
      await deleteMaterial(id);
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

      <Tabs defaultValue="inventory" className="">
        <TabsList className="grid w-full grid-cols-4 sticky top-0 bg-white !z-50">
          <TabsTrigger value="pos" className="flex items-center gap-2 text-gray-950 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
            POS
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2 text-gray-950 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
            Dashboard
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

        <TabsContent value="dashboard" className="p-4">
          <InventoryReportsPanel materials={materials} stockEntries={stockEntries} menuItems={menuItems} sectionAssignments={sectionAssignments} />
        </TabsContent>

        <TabsContent value="inventory" className="p-4">
          <InventoryManagementPanel
            materials={materialsWithStock}
            stockEntries={stockEntries}
            sections={sections}
            sectionAssignments={sectionAssignments}
            menuItems={menuItems}
            onCreateMaterial={handleCreateMaterial}
            onUpdateMaterial={handleUpdateMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            onCreateStockEntry={handleCreateStockEntry}
            onUpdateStockEntry={handleUpdateStockEntry}
            onDeleteStockEntry={handleDeleteStockEntry}
            onCreateMenuItem={handleCreateMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
          />
        </TabsContent>

        <TabsContent value="pos" className="p-4">
          <POSPanel materials={materialsWithStock} sectionAssignments={sectionAssignments} />
        </TabsContent>
        <TabsContent value="calculator" className="p-4">
          <CostCalculationPanel materials={materials} stockEntries={stockEntries} materialsWithStock={materialsWithStock} />
        </TabsContent>
        <TabsContent value="reports" className="p-4">
          <InventoryReportsPanel materials={materials} stockEntries={stockEntries} menuItems={menuItems} sectionAssignments={sectionAssignments} />
        </TabsContent>
      </Tabs>
    </>
  );
};
