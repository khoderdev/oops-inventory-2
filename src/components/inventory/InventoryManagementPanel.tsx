import { MaterialForm } from "@/components/materials/MaterialForm";
import { MaterialTable } from "@/components/materials/MaterialTable";
import { StockEntriesTable } from "@/components/stock/StockEntriesTable";
import { StockForm } from "@/components/stock/StockForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrefetch } from "@/hooks/usePrefetch";
import { inventoryAPIWithPrefetch } from "@/api/inventory.api";
import { InventoryManagementPanelProps, MaterialWithStock, StockEntry, MaterialFormData, StockFormData, RecordWasteData, CreateStockEntryData } from "@/types/inventory";
import { Package, Warehouse, Loader2 } from "lucide-react";
import { useAtom } from "jotai";
import { useState, useCallback, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { activeTabAtom, searchTermAtom, categoryFilterAtom, lowStockFilterAtom, showMaterialFormAtom, showStockFormAtom, selectedMaterialAtom, selectedStockEntryAtom } from "@/store/inventoryAtoms";

export function InventoryManagementPanel({ onDeleteMaterial }: InventoryManagementPanelProps = {}) {
  // Use prefetch system for data
  const { materials, stock, menu, status, refresh, isCacheValid } = usePrefetch({
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

  // Local UI state
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [searchTerm] = useAtom(searchTermAtom);
  const [categoryFilter] = useAtom(categoryFilterAtom);
  const [lowStockFilter] = useAtom(lowStockFilterAtom);
  const [showMaterialForm, setShowMaterialForm] = useAtom(showMaterialFormAtom);
  const [showStockForm, setShowStockForm] = useAtom(showStockFormAtom);
  const [selectedMaterial, setSelectedMaterial] = useAtom(selectedMaterialAtom) as [MaterialWithStock | null, (value: MaterialWithStock | null) => void];
  const [selectedStockEntry, setSelectedStockEntry] = useAtom(selectedStockEntryAtom) as [StockEntry | null, (value: StockEntry | null) => void];

  // Loading states for individual operations
  const [, setOperationLoading] = useState<Record<string, boolean>>({});

  // Transform materials to include stock information (similar to materialsWithStock)
  const materialsWithStock = useMemo(() => {
    return materials.map(material => {
      const materialStockEntries = stock.filter(entry => entry.materialId === material.id);

      // Calculate totals
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
  }, [materials, stock]);

  // Filter materials based on search and filters
  const filteredMaterials = useMemo(() => {
    return materialsWithStock.filter(material => {
      const matchesSearch = searchTerm === "" || material.name.toLowerCase().includes(searchTerm.toLowerCase()) || material.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === "all" || material.category === categoryFilter;

      const matchesLowStock = !lowStockFilter || material.availableQuantity < 10; // Configurable threshold

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [materialsWithStock, searchTerm, categoryFilter, lowStockFilter]);

  const stockEntries = stock;

  // Tab loading states - only show loading on initial load, not on child component operations
  const tabLoading = {
    material: status.individual.materials.loading && materials.length === 0,
    stock: status.individual.stock.loading && stock.length === 0
  };

  // Handler functions
  const handleTabChange = useCallback(
    async (value: string) => {
      setActiveTab(value);

      // Refresh data if cache is stale
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
          // Update existing material
          await inventoryAPIWithPrefetch.materials.updateMaterialWithCache(selectedMaterial.id, {
            ...data,
            isPOSItem: selectedMaterial.isPOSItem
          });
          toast({
            title: "Updated",
            description: `${data.name} updated`,
            duration: 1500
          });
        } else {
          // Create new material
          await inventoryAPIWithPrefetch.materials.createMaterialWithCache({
            ...data,
            isPOSItem: false
          });
          toast({
            title: "Created",
            description: `${data.name} created`,
            duration: 1500
          });
        }

        // Force immediate refresh to ensure UI updates
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
    (materialId: string) => {
      const material = materialsWithStock.find(m => m.id === materialId);
      if (material) {
        setSelectedMaterial(material);
      }
      setShowStockForm(true);
    },
    [materialsWithStock, setSelectedMaterial, setShowStockForm]
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
          duration: 2000
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
          duration: 2000
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
        <TabsList className="grid w-full grid-cols-2">
          {[
            { value: "material", label: "Materials", icon: Package, short: "Mat", loading: tabLoading.material },
            { value: "stock", label: "Stock Entries", icon: Warehouse, short: "Stock", loading: tabLoading.stock }
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
        <DialogContent className="w-[95vw] max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[95vh] sm:max-h-[90vh] p-0 m-2 sm:m-4" onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">{selectedStockEntry ? "Edit Stock Entry" : "Add New Stock Entry"}</span>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-120px)]">
            <div className="px-4 sm:px-6 py-3 sm:py-4 !pt-0">
              <StockForm
                materials={materialsWithStock}
                stockEntry={selectedStockEntry || undefined}
                selectedMaterialId={selectedMaterial?.id}
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
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
