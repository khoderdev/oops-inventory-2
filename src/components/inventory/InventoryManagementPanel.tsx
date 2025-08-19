import { MaterialForm } from "@/components/materials/MaterialForm";
import { MaterialTable } from "@/components/materials/MaterialTable";
import { StockEntriesTable } from "@/components/stock/StockEntriesTable";
import { StockForm } from "@/components/stock/StockForm";
import { CategoryManagement } from "@/components/categories/CategoryManagement";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { materialsAPI } from "@/api/matierials.api.ts.tsx";
import { stockAPI } from "@/api/stock.api.ts.tsx";
import { InventoryManagementPanelProps, MaterialWithStock, StockEntry, MaterialFormData, StockFormData, RecordWasteData, CreateStockEntryData, MaterialCategory, Material } from "@/types/inventory";
import { Package, Warehouse, Loader2, Tags } from "lucide-react";
import { useAtom } from "jotai";
import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { activeTabAtom, showMaterialFormAtom, showStockFormAtom, selectedMaterialAtom, selectedStockEntryAtom } from "@/store/inventoryAtoms";

export function InventoryManagementPanel({ onDeleteMaterial, onDeleteStockEntry }: InventoryManagementPanelProps = {}) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stock, setStock] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState({
    materials: false,
    stock: false
  });

  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [showMaterialForm, setShowMaterialForm] = useAtom(showMaterialFormAtom);
  const [showStockForm, setShowStockForm] = useAtom(showStockFormAtom);
  const [selectedMaterial, setSelectedMaterial] = useAtom(selectedMaterialAtom) as [MaterialWithStock | null, (value: MaterialWithStock | null) => void];
  const [selectedStockEntry, setSelectedStockEntry] = useAtom(selectedStockEntryAtom) as [StockEntry | null, (value: StockEntry | null) => void];
  const [operationLoading, setOperationLoading] = useState<Record<string, boolean>>({});

  // Fetch materials function
  const fetchMaterials = useCallback(async () => {
    setLoading(prev => ({ ...prev, materials: true }));
    try {
      // Add cache-busting parameter to prevent stale data
      const response = await materialsAPI.getMaterials({ limit: 10000, _t: Date.now() });
      // Handle both response formats: direct array or nested in data property
      if (response) {
        if (Array.isArray(response)) {
          setMaterials(response);
        } else if ((response as any).data && Array.isArray((response as any).data)) {
          setMaterials((response as any).data);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching materials:", error);
      toast({
        title: "Loading Error",
        description: "Failed to load materials data",
        variant: "destructive",
        duration: 1000
      });
    } finally {
      setLoading(prev => ({ ...prev, materials: false }));
    }
  }, []);

  // Fetch stock entries function
  const fetchStock = useCallback(async () => {
    setLoading(prev => ({ ...prev, stock: true }));
    try {
      // Add cache-busting parameter to prevent stale data
      const response = await stockAPI.getStockEntries({ limit: 10000, _t: Date.now() });
      // Handle both response formats: direct array or nested in data property
      if (response) {
        if (Array.isArray(response)) {
          setStock(response);
        } else if ((response as any).data && Array.isArray((response as any).data)) {
          setStock((response as any).data);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching stock entries:", error);
      toast({
        title: "Loading Error",
        description: "Failed to load stock data",
        variant: "destructive",
        duration: 1000
      });
    } finally {
      setLoading(prev => ({ ...prev, stock: false }));
    }
  }, []);

  const refresh = useCallback(async (type?: "materials" | "stock") => {
    console.log('🔄 Manual refresh - fetching fresh data...', type || 'all');
    if (!type || type === "materials") {
      await fetchMaterials();
    }
    if (!type || type === "stock") {
      await fetchStock();
    }
  }, [fetchMaterials, fetchStock]);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      if (activeTab === "material" || activeTab === "stock") {
        await refresh();
      } else if (activeTab === "material") {
        await fetchMaterials();
      } else if (activeTab === "stock") {
        await fetchStock();
      }
    };
    
    loadInitialData();
  }, []);

  const materialsWithStock = useMemo(() => {
    const baseMaterials = materials.map(material => {
      const materialStockEntries = stock.filter(entry => entry.materialId === material.id);

      const totalQuantityInBaseUnit = materialStockEntries.reduce((sum, entry) => {
        return sum + (entry.purchasedConvertedQuantity || entry.purchasedQuantity);
      }, 0);

      const totalValue = materialStockEntries.reduce((sum, entry) => {
        return sum + entry.totalCost;
      }, 0);

      const averageCostPerBaseUnit = totalQuantityInBaseUnit > 0 ? totalValue / totalQuantityInBaseUnit : 0;

      return {
        ...material,
        stockEntries: materialStockEntries,
        totalQuantityInBaseUnit,
        totalValue,
        averageCostPerBaseUnit,
        availableQuantity: totalQuantityInBaseUnit
      } as MaterialWithStock;
    });

    if (selectedMaterial && !baseMaterials.find(m => m.id.toString() === selectedMaterial.id.toString())) {
      baseMaterials.push(selectedMaterial);
    }

    return baseMaterials;
  }, [materials, stock, selectedMaterial]);

  const tabLoading = {
    material: loading.materials && materials.length === 0,
    stock: loading.stock && stock.length === 0
  };
  const handleTabChange = useCallback(
    async (value: string) => {
      setActiveTab(value);
      switch (value) {
        case "material":
          await fetchMaterials();
          break;
        case "stock":
          await fetchStock();
          break;
      }
    },
    [setActiveTab, fetchMaterials, fetchStock]
  );

  const handleMaterialSubmit = useCallback(
    async (data: MaterialFormData) => {
      setOperationLoading(prev => ({ ...prev, material: true }));
      try {
        if (selectedMaterial) {
          await materialsAPI.updateMaterial(selectedMaterial.id, {
            ...data,
            category: selectedMaterial.category,
            isPOSItem: selectedMaterial.isPOSItem
          });
          toast({
            title: "Updated",
            description: `${data.name} updated`,
            duration: 1000
          });
        } else {
          await materialsAPI.createMaterial({
            ...data,
            category: data.category as MaterialCategory,
            isPOSItem: false
          });
          toast({
            title: "Created",
            description: `${data.name} created`,
            duration: 1000
          });
        }
        await refresh("materials");
        setShowMaterialForm(false);
        setSelectedMaterial(null);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to ${selectedMaterial ? "update" : "create"} material`,
          variant: "destructive",
          duration: 1000
        });
      } finally {
        setOperationLoading(prev => ({ ...prev, material: false }));
      }
    },
    [selectedMaterial, setShowMaterialForm, setSelectedMaterial, refresh]
  );

  const handleStockSubmit = useCallback(
    async (data: StockFormData) => {
      setOperationLoading(prev => ({ ...prev, stock: true }));
      try {
        if (selectedStockEntry) {
          await stockAPI.updateStockEntry(selectedStockEntry.id, data);
          toast({
            title: "Updated",
            description: "Stock entry updated",
            duration: 1000
          });
        } else {
          await stockAPI.createStockEntry(data);
          toast({
            title: "Created",
            description: "Stock entry created",
            duration: 1000
          });
        }
        // Force fresh data fetch to ensure latest data
        console.log('🔄 Forcing fresh stock data fetch after stock operation...');
        await refresh("stock");
        await refresh("materials");
        setShowStockForm(false);
        setSelectedStockEntry(null);
        setSelectedMaterial(null);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to ${selectedStockEntry ? "update" : "create"} stock entry`,
          variant: "destructive",
          duration: 1000
        });
      } finally {
        setOperationLoading(prev => ({ ...prev, stock: false }));
      }
    },
    [selectedStockEntry, setShowStockForm, setSelectedStockEntry, setSelectedMaterial, refresh]
  );

  const handleEditMaterial = useCallback(
    (material: MaterialWithStock) => {
      setSelectedMaterial(material);
      setShowMaterialForm(true);
    },
    [setSelectedMaterial, setShowMaterialForm]
  );

  const handleAddStock = useCallback(
    async (materialId: string | number) => {
      const idToFind = materialId.toString();
      let material = materialsWithStock.find(m => m.id.toString() === idToFind);
      if (!material) {
        console.log("🔄 Material not in current data, fetching directly from MaterialTable API...", materialId);
        try {
          await refresh("materials");
          material = materialsWithStock.find(m => m.id.toString() === idToFind);
          if (!material) {
            console.log("🔍 Fetching material directly from materialsAPI...", materialId);
            const materialResponse = await materialsAPI.getMaterial(idToFind);
            if (materialResponse && materialResponse.data) {
              const fetchedMaterial = materialResponse.data;
              material = {
                ...fetchedMaterial,
                stockEntries: [],
                totalQuantityInBaseUnit: 0,
                totalValue: 0,
                averageCostPerBaseUnit: 0,
                availableQuantity: 0
              };
              console.log("✅ Successfully fetched material from API:", material.name);
              console.log("🔄 Adding fetched material to cache for StockForm availability...");
              await refresh("materials");
            }
          }
        } catch (error) {
          console.error("❌ Failed to fetch material from API:", error);
          if (error.status === 404) {
            console.warn("🗑️ Material ID", materialId, "does not exist in database. This is a data inconsistency issue.");
            toast({
              title: "Material Not Found",
              description: `Material ID ${materialId} does not exist in the database. Please refresh the materials list.`,
              variant: "destructive",
              duration: 1000
            });
            console.log("🔄 Forcing materials refresh to sync with backend...");
            await refresh("materials");
            return;
          }
        }
      }

      if (material) {
        console.log("🎯 Loading material for stock entry:", material.name, "ID:", materialId);
        setSelectedMaterial(material);
        setSelectedStockEntry(null);
        setShowStockForm(true);
        setActiveTab("stock");
      
      } else {
        console.error("❌ Material not found with ID:", materialId, "Even after direct API fetch. This material may not exist.");
        console.log("🔄 Forcing complete data refresh due to material not found...");
        await refresh("materials");
        toast({
          title: "Material Not Found",
          description: `Material ID ${materialId} could not be found. The materials list has been refreshed to sync with the database.`,
          variant: "destructive",
          duration: 1000
        });
      }
    },
    [materialsWithStock, materials, stock, setSelectedMaterial, setSelectedStockEntry, setShowStockForm, setActiveTab, refresh]
  );

  const handleDeleteMaterial = useCallback(
    async (materialId: string) => {
      setOperationLoading(prev => ({ ...prev, [`delete-material-${materialId}`]: true }));
      try {
        await materialsAPI.deleteMaterial(materialId);
        // Force fresh data fetch to ensure latest data
        console.log('🔄 Forcing fresh data fetch after material deletion...');
        await refresh("materials");
        await refresh("stock");
        toast({
          title: "Deleted",
          description: "Material deleted",
          duration: 1000
        });
        if (onDeleteMaterial) {
          onDeleteMaterial(materialId);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete material",
          variant: "destructive",
          duration: 1000
        });
      } finally {
        setOperationLoading(prev => ({ ...prev, [`delete-material-${materialId}`]: false }));
      }
    },
    [onDeleteMaterial, refresh]
  );

  const handleDeleteStockEntry = useCallback(
    async (stockEntryId: string) => {
      setOperationLoading(prev => ({ ...prev, [`delete-stock-${stockEntryId}`]: true }));
      try {
        await stockAPI.deleteStockEntry(stockEntryId);
        // Force fresh data fetch to ensure latest data
        console.log('🔄 Forcing fresh data fetch after stock entry deletion...');
        await refresh("stock");
        await refresh("materials");
        toast({
          title: "Deleted",
          description: "Stock entry deleted",
          duration: 1000
        });
        // Only call the callback if it exists
        if (onDeleteStockEntry) {
          onDeleteStockEntry(stockEntryId);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete stock entry",
          variant: "destructive",
          duration: 1000
        });
      } finally {
        setOperationLoading(prev => ({ ...prev, [`delete-stock-${stockEntryId}`]: false }));
      }
    },
    [onDeleteStockEntry, refresh]
  );

  const handleAddStockOperation = useCallback(
    async (data: Partial<CreateStockEntryData> & { wasteQuantity?: number; wasteReason?: string }) => {
      try {
        // Convert the data to CreateStockEntryData format
        const stockEntryData = {
          materialId: data.materialId!,
          supplier: data.supplier!,
          purchasedQuantity: data.purchasedQuantity!,
          purchasedUnit: data.purchasedUnit!,
          costPerPurchasedUnit: data.costPerPurchasedUnit!,
          totalCost: data.totalCost!,
          purchaseDate: data.purchaseDate!,
          expiryDate: data.expiryDate,
          batchNumber: data.batchNumber,
          notes: data.notes
        };
        await stockAPI.createStockEntry(stockEntryData);
        // Force fresh data fetch to ensure latest data
        console.log('🔄 Forcing fresh stock data fetch after add stock operation...');
        await refresh("stock");
        await refresh("materials");
        toast({
          title: "Added",
          description: "Stock added",
          duration: 1000
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add stock",
          variant: "destructive",
          duration: 1000
        });
      }
    },
    [refresh]
  );

  const handleRecordWasteOperation = useCallback(
    async (data: RecordWasteData) => {
      try {
        await stockAPI.recordWaste(data);
        // Force fresh data fetch to ensure latest data
        console.log('🔄 Forcing fresh stock data fetch after waste operation...');
        await refresh("stock");
        await refresh("materials");
        toast({
          title: "Recorded",
          description: "Waste recorded",
          duration: 1000
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to record waste",
          variant: "destructive",
          duration: 1000
        });
      }
    },
    [refresh]
  );

  const handleAddToSpecificEntryOperation = useCallback(
    async (
      data: {
        materialId?: string;
        supplier?: string;
        purchasedQuantity?: number;
        costPerPurchasedUnit?: number;
        totalCost?: number;
        purchasedUnit?: string;
        wasteQuantity?: number;
        purchaseDate?: Date;
        expiryDate?: Date;
        batchNumber?: string;
        notes?: string;
        wasteReason?: string;
      } & { stockEntryId: string }
    ) => {
      try {
        const addData = {
          additionalQuantity: data.purchasedQuantity || 0,
          unit: data.purchasedUnit || "g",
          additionDate: new Date(),
          notes: data.notes
        };
        await stockAPI.addToSpecificEntry(data.stockEntryId, addData);
        // Force fresh data fetch to ensure latest data
        console.log('🔄 Forcing fresh stock data fetch after add to specific entry...');
        await refresh("stock");
        await refresh("materials");
        setShowStockForm(false);
        toast({
          title: "Added",
          description: "Stock added",
          duration: 1000
        });
      } catch (error) {
        console.error("❌ Error adding to specific entry:", error);
        toast({
          title: "Error",
          description: "Failed to add stock",
          variant: "destructive",
          duration: 1000
        });
      }
    },
    [refresh, setShowStockForm]
  );

  const handleRefreshAll = useCallback(async () => {
    console.log('🔄 Manual refresh - forcing fresh data fetch...');
    await refresh("stock");
    await refresh("materials");
  }, [refresh]);

  // This function is already defined above with more complete implementation

  const handleTogglePOSVisibility = useCallback(
    async (entry: StockEntry & { material?: Material }) => {
      await stockAPI.updateStockEntryPOS(entry.id.toString(), { isPOSItem: !entry.isPOSItem });
      // Force fresh data fetch to ensure latest data
      console.log('🔄 Forcing fresh stock data fetch after POS visibility toggle...');
      await refresh("stock");
    },
    [refresh]
  );

  const handleAssignPrinter = useCallback(
    async (id: string | number, printerId: number | null) => {
      const res: any = await stockAPI.assignPrinter(id, printerId);
      // Force fresh data fetch to ensure latest data
      console.log('🔄 Forcing fresh stock data fetch after printer assignment...');
      await refresh("stock");
      return res?.data?.stockEntry || res?.stockEntry;
    },
    [refresh]
  );

  const handleBulkAssignPrinter = useCallback(
    async (ids: (string | number)[], printerId: number | null) => {
      const res: any = await stockAPI.bulkAssignPrinter(ids, printerId);
      // Force fresh data fetch to ensure latest data
      console.log('🔄 Forcing fresh stock data fetch after bulk printer assignment...');
      await refresh("stock");
      return res?.data?.stockEntries || res?.stockEntries;
    },
    [refresh]
  );

  const handleWasteFromSpecificEntryOperation = useCallback(
    async (
      data: {
        materialId?: string;
        supplier?: string;
        purchasedQuantity?: number;
        costPerPurchasedUnit?: number;
        totalCost?: number;
        purchasedUnit?: string;
        wasteQuantity?: number;
        purchaseDate?: Date;
        expiryDate?: Date;
        batchNumber?: string;
        notes?: string;
        wasteReason?: string;
      } & { stockEntryId: string }
    ) => {
      try {
        const wasteData = {
          wasteQuantity: data.wasteQuantity || 0,
          unit: data.purchasedUnit || "g",
          wasteDate: new Date(),
          wasteReason: data.wasteReason || "Unknown",
          notes: data.notes
        };

        await stockAPI.wasteFromSpecificEntry(data.stockEntryId, wasteData);

        // Force fresh data fetch to ensure latest data
        console.log('🔄 Forcing fresh stock data fetch after waste from specific entry...');
        await refresh("stock");
        await refresh("materials");
        setShowStockForm(false);

        toast({
          title: "Recorded",
          description: "Waste recorded",
          duration: 1000
        });
      } catch (error) {
        console.error("❌ Error recording waste from specific entry:", error);
        toast({
          title: "Error",
          description: "Failed to record waste",
          variant: "destructive",
          duration: 1000
        });
      }
    },
    [refresh, setShowStockForm]
  );

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col overflow-hidden">
      <Tabs defaultValue="stock" value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          {[
            { value: "material", label: "Materials", icon: Package, short: "Mat", loading: tabLoading.material },
            { value: "stock", label: "Stock Entries", icon: Warehouse, short: "Stock", loading: tabLoading.stock },
            { value: "categories", label: "Categories", icon: Tags, short: "Cat", loading: false }
          ].map(({ value, label, icon: Icon, short, loading }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="
                flex items-center justify-center gap-2 px-3 py-3
                text-sm font-medium text-gray-600 transition-colors
                bg-whites
                data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-700 
                hover:text-gray-800
                border-b
                min-h-[3rem]
              "
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
              {loading && <Loader2 className="w-4 h-4 ml-1 animate-spin flex-shrink-0" />}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="material" className="flex-1 focus-visible:outline-none overflow-hidden ">
          <MaterialTable
            filteredMaterials={materialsWithStock}
            onEditMaterial={handleEditMaterial}
            onAddStock={handleAddStock}
            onDeleteMaterial={handleDeleteMaterial}
          />
        </TabsContent>

        <TabsContent value="stock" className="flex-1 focus-visible:outline-none overflow-hidden ">
          <StockEntriesTable
            stockEntries={stock}
            materials={materials}
            loading={loading.stock}
            onRefresh={handleRefreshAll}
            onDeleteStockEntry={handleDeleteStockEntry}
            onTogglePOSVisibility={handleTogglePOSVisibility}
            onAssign={handleAssignPrinter}
            onBulkAssign={handleBulkAssignPrinter}
          />
        </TabsContent>

        <TabsContent value="categories" className="flex-1 focus-visible:outline-none overflow-hidden">
          <div className="h-full overflow-auto">
            <CategoryManagement
              onCategoryChange={() => {
                refresh("materials");
                refresh("stock");
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      {showMaterialForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
            <MaterialForm
              material={selectedMaterial || undefined}
              onSubmit={handleMaterialSubmit}
              onCancel={() => {
                setShowMaterialForm(false);
                setSelectedMaterial(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Stock Form Dialog */}
      <Dialog open={showStockForm} onOpenChange={setShowStockForm} modal={true}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] sm:w-[95vw] md:w-[65vw] xl:w-[40vw] rounded-lg p-0 py-2" onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>
          <DialogHeader className="px-4 sm:px-6 py">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">{selectedStockEntry ? "Edit Stock Entry" : "Add New Stock Entry"}</span>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(95vh-60px)]">
            <StockForm
              materials={materialsWithStock}
              stockEntry={selectedStockEntry || undefined}
              selectedMaterialId={selectedMaterial?.id?.toString()}
              onSubmit={handleStockSubmit}
              onAddStock={handleAddStockOperation}
              onRecordWaste={handleRecordWasteOperation}
              onAddToSpecificEntry={handleAddToSpecificEntryOperation}
              onWasteFromSpecificEntry={handleWasteFromSpecificEntryOperation}
              onCancel={() => {
                setShowStockForm(false);
                setSelectedStockEntry(null);
                setSelectedMaterial(null);
              }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
