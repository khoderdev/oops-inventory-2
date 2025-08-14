import { MaterialForm } from "@/components/materials/MaterialForm";
import { MaterialTable } from "@/components/materials/MaterialTable";
import { StockEntriesTable } from "@/components/stock/StockEntriesTable";
import { StockForm } from "@/components/stock/StockForm";
import { CategoryManagement } from "@/components/categories/CategoryManagement";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrefetch } from "@/hooks/usePrefetch";
import { inventoryAPIWithPrefetch } from "@/api/inventory.api";
import { materialsAPI } from "@/api/matierials.api.ts.tsx";
import { InventoryManagementPanelProps, MaterialWithStock, StockEntry, MaterialFormData, StockFormData, RecordWasteData, CreateStockEntryData, MaterialCategory } from "@/types/inventory";
import { Package, Warehouse, Loader2, Tags } from "lucide-react";
import { useAtom } from "jotai";
import { useState, useCallback, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { activeTabAtom, searchTermAtom, categoryFilterAtom, lowStockFilterAtom, showMaterialFormAtom, showStockFormAtom, selectedMaterialAtom, selectedStockEntryAtom } from "@/store/inventoryAtoms";

export function InventoryManagementPanel({ onDeleteMaterial }: InventoryManagementPanelProps = {}) {
  const { materials, stock, status, refresh, isCacheValid } = usePrefetch({
    autoFetch: true,
    parallel: true,
    onError: error => {
      toast({
        title: "Loading Error",
        description: "Failed to load data",
        variant: "destructive",
        duration: 1500
      });
    }
  });

  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [searchTerm] = useAtom(searchTermAtom);
  const [categoryFilter] = useAtom(categoryFilterAtom);
  const [lowStockFilter] = useAtom(lowStockFilterAtom);
  const [showMaterialForm, setShowMaterialForm] = useAtom(showMaterialFormAtom);
  const [showStockForm, setShowStockForm] = useAtom(showStockFormAtom);
  const [selectedMaterial, setSelectedMaterial] = useAtom(selectedMaterialAtom) as [MaterialWithStock | null, (value: MaterialWithStock | null) => void];
  const [selectedStockEntry, setSelectedStockEntry] = useAtom(selectedStockEntryAtom) as [StockEntry | null, (value: StockEntry | null) => void];
  const [, setOperationLoading] = useState<Record<string, boolean>>({});

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

  const filteredMaterials = useMemo(() => {
    return materialsWithStock.filter(material => {
      const matchesSearch = searchTerm === "" || material.name.toLowerCase().includes(searchTerm.toLowerCase()) || material.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === "all" || material.category === categoryFilter;

      const matchesLowStock = !lowStockFilter || material.availableQuantity < 10; // Configurable threshold

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [materialsWithStock, searchTerm, categoryFilter, lowStockFilter]);

  const stockEntries = stock;

  const tabLoading = {
    material: status.individual.materials.loading && materials.length === 0,
    stock: status.individual.stock.loading && stock.length === 0
  };
  const handleTabChange = useCallback(
    async (value: string) => {
      setActiveTab(value);
      switch (value) {
        case "material":
          if (!isCacheValid("materials")) {
            await refresh("materials");
          }
          break;
        case "stock":
          if (!isCacheValid("stock")) {
            await refresh("stock");
          }
          break;
      }
    },
    [setActiveTab, isCacheValid, refresh]
  );

  const handleMaterialSubmit = useCallback(
    async (data: MaterialFormData) => {
      setOperationLoading(prev => ({ ...prev, material: true }));
      try {
        if (selectedMaterial) {
          await inventoryAPIWithPrefetch.materials.updateMaterialWithCache(selectedMaterial.id, {
            ...data,
            category: selectedMaterial.category,
            isPOSItem: selectedMaterial.isPOSItem
          });
          toast({
            title: "Updated",
            description: `${data.name} updated`,
            duration: 1500
          });
        } else {
          await inventoryAPIWithPrefetch.materials.createMaterialWithCache({
            ...data,
            category: data.category as MaterialCategory,
            isPOSItem: false
          });
          toast({
            title: "Created",
            description: `${data.name} created`,
            duration: 1500
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
          duration: 1500
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
          // Update existing stock entry
          await inventoryAPIWithPrefetch.stock.updateStockEntryWithCache(selectedStockEntry.id, data);
          toast({
            title: "Updated",
            description: "Stock entry updated",
            duration: 1500
          });
        } else {
          // Create new stock entry
          await inventoryAPIWithPrefetch.stock.createStockEntryWithCache(data);
          toast({
            title: "Created",
            description: "Stock entry created",
            duration: 1500
          });
        }

        // Force immediate refresh to ensure UI updates
        await refresh("stock");
        // Also refresh materials since stock affects material calculations
        await refresh("materials");

        setShowStockForm(false);
        setSelectedStockEntry(null);
        setSelectedMaterial(null);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to ${selectedStockEntry ? "update" : "create"} stock entry`,
          variant: "destructive",
          duration: 1500
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
      // Handle both string and number IDs by converting to string for comparison
      const idToFind = materialId.toString();
      let material = materialsWithStock.find(m => m.id.toString() === idToFind);
      
      // If material not found in current data, try to fetch it directly from MaterialTable API
      if (!material) {
        console.log('🔄 Material not in current data, fetching directly from MaterialTable API...', materialId);
        try {
          // First try refreshing our current data
          await refresh("materials");
          material = materialsWithStock.find(m => m.id.toString() === idToFind);
          
          // If still not found, fetch directly from the MaterialTable API
          if (!material) {
            console.log('🔍 Fetching material directly from materialsAPI...', materialId);
            const materialResponse = await materialsAPI.getMaterial(idToFind);
            
            if (materialResponse && materialResponse.data) {
              const fetchedMaterial = materialResponse.data;
              // Convert to MaterialWithStock format
              material = {
                ...fetchedMaterial,
                stockEntries: [],
                totalQuantityInBaseUnit: 0,
                totalValue: 0,
                averageCostPerBaseUnit: 0,
                availableQuantity: 0
              };
              console.log('✅ Successfully fetched material from API:', material.name);
              
              // CRITICAL: Add the fetched material to the materials cache so it's available in StockForm
              // This ensures the dropdown includes the newly fetched material
              console.log('🔄 Adding fetched material to cache for StockForm availability...');
              await refresh("materials");
            }
          }
        } catch (error) {
          console.error('❌ Failed to fetch material from API:', error);
          
          // If it's a 404 error, this material doesn't exist in the database
          if (error.status === 404) {
            console.warn('🗑️ Material ID', materialId, 'does not exist in database. This is a data inconsistency issue.');
            
            // Show specific error message for non-existent materials
            toast({
              title: "Material Not Found",
              description: `Material ID ${materialId} does not exist in the database. Please refresh the materials list.`,
              variant: "destructive",
              duration: 5000
            });
            
            // Force refresh materials to sync with backend
            console.log('🔄 Forcing materials refresh to sync with backend...');
            await refresh("materials");
            return; // Exit early since material doesn't exist
          }
        }
      }
      
      if (material) {
        console.log('🎯 Loading material for stock entry:', material.name, 'ID:', materialId);
        setSelectedMaterial(material);
        setSelectedStockEntry(null); // Clear any existing stock entry selection
        setShowStockForm(true);
        
        // Switch to stock tab to show the form
        setActiveTab("stock");
        
        toast({
          title: "Material Selected",
          description: `Ready to add stock for ${material.name}`,
          duration: 1500
        });
      } else {
        console.error('❌ Material not found with ID:', materialId, 'Even after direct API fetch. This material may not exist.');
        
        // Force a complete data refresh to sync MaterialTable with backend
        console.log('🔄 Forcing complete data refresh due to material not found...');
        await refresh("materials");
        
        toast({
          title: "Material Not Found",
          description: `Material ID ${materialId} could not be found. The materials list has been refreshed to sync with the database.`,
          variant: "destructive",
          duration: 1500
        });
      }
    },
    [materialsWithStock, materials, stock, setSelectedMaterial, setSelectedStockEntry, setShowStockForm, setActiveTab, refresh]
  );

  const handleDeleteMaterial = useCallback(
    async (materialId: string) => {
      setOperationLoading(prev => ({ ...prev, [`delete-material-${materialId}`]: true }));
      try {
        await inventoryAPIWithPrefetch.materials.deleteMaterialWithCache(materialId);

        // Force immediate refresh to ensure UI updates
        await refresh("materials");
        // Also refresh stock since deleting material affects stock entries
        await refresh("stock");

        toast({
          title: "Deleted",
          description: "Material deleted",
          duration: 1500
        });
        if (onDeleteMaterial) {
          onDeleteMaterial(materialId);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete material",
          variant: "destructive",
          duration: 1500
        });
      } finally {
        setOperationLoading(prev => ({ ...prev, [`delete-material-${materialId}`]: false }));
      }
    },
    [onDeleteMaterial, refresh]
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
        await inventoryAPIWithPrefetch.stock.createStockEntryWithCache(stockEntryData);
        // Force immediate refresh to ensure UI updates
        await refresh("stock");
        await refresh("materials");
        toast({
          title: "Added",
          description: "Stock added",
          duration: 1500
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add stock",
          variant: "destructive",
          duration: 1500
        });
      }
    },
    [refresh]
  );

  const handleRecordWasteOperation = useCallback(
    async (data: RecordWasteData) => {
      try {
        await inventoryAPIWithPrefetch.stock.recordWasteWithCache(data);
        // Force immediate refresh to ensure UI updates
        await refresh("stock");
        await refresh("materials");
        toast({
          title: "Recorded",
          description: "Waste recorded",
          duration: 1500
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to record waste",
          variant: "destructive",
          duration: 1500
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

        await inventoryAPIWithPrefetch.stock.addToSpecificEntryWithCache(data.stockEntryId, addData);

        await refresh("stock");
        await refresh("materials");
        setShowStockForm(false);

        toast({
          title: "Added",
          description: "Stock added",
          duration: 1500
        });
      } catch (error) {
        console.error("❌ Error adding to specific entry:", error);
        toast({
          title: "Error",
          description: "Failed to add stock",
          variant: "destructive",
          duration: 1500
        });
      }
    },
    [refresh, setShowStockForm]
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

        await inventoryAPIWithPrefetch.stock.wasteFromSpecificEntryWithCache(data.stockEntryId, wasteData);

        await refresh("stock");
        await refresh("materials");
        setShowStockForm(false);

        toast({
          title: "Recorded",
          description: "Waste recorded",
          duration: 1500
        });
      } catch (error) {
        console.error("❌ Error recording waste from specific entry:", error);
        toast({
          title: "Error",
          description: "Failed to record waste",
          variant: "destructive",
          duration: 1500
        });
      }
    },
    [refresh, setShowStockForm]
  );

  const fetchTabData = useCallback(
    async (tabName: string) => {
      switch (tabName) {
        case "material":
        case "materials":
          await refresh("materials");
          break;
        case "stock":
          await refresh("stock");
          break;
        case "menu":
          await refresh("menu");
          break;
        case "categories":
          // Categories are managed independently
          break;
        case "sections":
          // Would refresh sections
          break;
        default:
          await refresh("all");
      }
    },
    [refresh]
  );

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
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
          <MaterialTable onEditMaterial={handleEditMaterial} onAddStock={handleAddStock} onDeleteMaterial={handleDeleteMaterial} />
        </TabsContent>

        <TabsContent value="stock" className="flex-1 focus-visible:outline-none overflow-hidden ">
          <StockEntriesTable />
        </TabsContent>

        <TabsContent value="categories" className="flex-1 focus-visible:outline-none overflow-hidden">
          <div className="h-full overflow-auto">
            <CategoryManagement 
              onCategoryChange={() => {
                // Refresh materials and stock when categories change
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
