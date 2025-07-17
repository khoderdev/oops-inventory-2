import { CostCalculationPanel } from "@/components/inventory/CostCalculationPanel";
import { InventoryManagementPanel } from "@/components/inventory/InventoryManagementPanel";
import { InventoryReportsPanel } from "@/components/inventory/InventoryReportsPanel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryCRUD } from "@/hooks/useInventoryCRUD";
import { useInventoryData } from "@/hooks/useInventoryData";
import { CreateMaterialData, CreateStockEntryData, MaterialWithStock, UpdateMaterialData, UpdateStockEntryData } from "@/types/inventory";
import { unitConverter } from "@/utils/enhancedConversions";
import { calculateMaterialInventory } from "@/utils/inventoryCalculations";
import { BarChart3, Calculator, FileText, Loader2, Package } from "lucide-react";
import { useMemo } from "react";

export const InventoryManagementPage = () => {
  // Fetch data from backend
  const { materials, stockEntries, menuItems, sectionAssignments, loading, error, refetch } = useInventoryData();

  // CRUD operations
  const { createMaterial, updateMaterial, deleteMaterial, createStockEntry, updateStockEntry, deleteStockEntry, loading: crudLoading, error: crudError } = useInventoryCRUD(refetch);

  // Initialize packaging configurations
  useMemo(() => {
    // Add packaging configurations for demo materials
    unitConverter.addMaterialPackaging("1", [
      // Pickles
      { materialId: "1", packageType: "jar", quantityPerPackage: 0.5, packageUnit: "kg", baseUnit: "kg" },
      { materialId: "1", packageType: "case", quantityPerPackage: 12, packageUnit: "jar", baseUnit: "kg" }
    ]);

    unitConverter.addMaterialPackaging("2", [
      // Beef Patties
      { materialId: "2", packageType: "pack", quantityPerPackage: 8, packageUnit: "piece", baseUnit: "piece" },
      { materialId: "2", packageType: "box", quantityPerPackage: 4, packageUnit: "pack", baseUnit: "piece" }
    ]);

    unitConverter.addMaterialPackaging("3", [
      // Buns
      { materialId: "3", packageType: "pack", quantityPerPackage: 8, packageUnit: "piece", baseUnit: "piece" },
      { materialId: "3", packageType: "case", quantityPerPackage: 6, packageUnit: "pack", baseUnit: "piece" }
    ]);

    unitConverter.addMaterialPackaging("4", [
      // Cheese
      { materialId: "4", packageType: "pack", quantityPerPackage: 24, packageUnit: "piece", baseUnit: "piece" },
      { materialId: "4", packageType: "case", quantityPerPackage: 12, packageUnit: "pack", baseUnit: "piece" }
    ]);
  }, []);

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
    <div className="p-6 space-y-6">
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

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="h-4 w-4" />
            Inventory Management
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Calculator className="h-4 w-4" />
            Cost Calculator
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <InventoryReportsPanel materials={materials} stockEntries={stockEntries} menuItems={menuItems} sectionAssignments={sectionAssignments} />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryManagementPanel 
            materials={materials} 
            stockEntries={stockEntries} 
            onCreateMaterial={handleCreateMaterial}
            onUpdateMaterial={handleUpdateMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            onCreateStockEntry={handleCreateStockEntry}
            onUpdateStockEntry={handleUpdateStockEntry}
            onDeleteStockEntry={handleDeleteStockEntry}
          />
        </TabsContent>

        <TabsContent value="calculator">
          <CostCalculationPanel materials={materials} stockEntries={stockEntries} materialsWithStock={materialsWithStock} />
        </TabsContent>

        <TabsContent value="reports">
          <InventoryReportsPanel materials={materials} stockEntries={stockEntries} menuItems={menuItems} sectionAssignments={sectionAssignments} />
        </TabsContent>

        {/* <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Unit Conversion Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Supported Unit Types</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge variant="outline">Mass (kg, g, lb, oz)</Badge>
                    <Badge variant="outline">Volume (L, ml, gal, cup)</Badge>
                    <Badge variant="outline">Piece (piece, item, unit)</Badge>
                    <Badge variant="outline">Package (box, pack, case)</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Packaging Hierarchy</h4>
                  <div className="text-sm space-y-1">
                    <p>• Case → Box → Pack → Piece</p>
                    <p>• Jar/Bottle → Contents (kg/L)</p>
                    <p>• Custom packaging per material</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Material Packaging Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {materials.map(material => (
                  <div key={material.id} className="border rounded p-3">
                    <div className="font-medium">{material.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Base Unit: {material.baseUnit} ({material.unitType})
                    </div>
                    <div className="text-sm mt-1">Available Units: {unitConverter.getAvailableUnits(material).join(", ")}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cost Calculation Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Calculation Method</h4>
                  <div className="text-sm space-y-1">
                    <p>1. Convert all stock entries to base unit</p>
                    <p>2. Calculate weighted average cost per base unit</p>
                    <p>3. Convert requested quantity to base unit</p>
                    <p>4. Apply average cost to converted quantity</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Packaging Cost Distribution</h4>
                  <div className="text-sm space-y-1">
                    <p>• Case cost distributed across all contained units</p>
                    <p>• Pack cost distributed across individual pieces</p>
                    <p>• Jar/bottle cost distributed by weight/volume</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demo Data Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Sample Materials</h4>
                  <div className="text-sm space-y-1">
                    <p>• Pickles: 12-jar case (500g each) for $24.00</p>
                    <p>• Beef Patties: 4-pack box (8 patties each) for $32.00</p>
                    <p>• Buns: 6-pack case (8 buns each) for $18.00</p>
                    <p>• Cheese: 12-pack case (24 slices each) for $15.00</p>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>Try calculating costs for different quantities and units to see the conversion system in action!</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent> */}
      </Tabs>
    </div>
  );
};
