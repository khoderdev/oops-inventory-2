import { MaterialForm } from "@/components/materials/MaterialForm";
import { MaterialTable } from "@/components/materials/MaterialTable";
import { SectionForm } from "@/components/sections/SectionForm";
import { StockEntriesTable } from "@/components/stock/StockEntriesTable";
import { StockForm } from "@/components/stock/StockForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrefetch } from "@/hooks/usePrefetch";
import { inventoryAPIWithPrefetch } from "@/api/inventory.api";
import { InventoryManagementPanelProps, MaterialWithStock, StockEntry, Section, SectionAssignment, MaterialFormData, StockFormData } from "@/types/inventory";
import { Building2, MapPin, Package, Warehouse, Loader2 } from "lucide-react";
import { SectionsManagementPanel } from "../sections/SectionsManagementPanel";
import { useAtom } from "jotai";
import { useState, useCallback, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { activeTabAtom, searchTermAtom, categoryFilterAtom, lowStockFilterAtom, showMaterialFormAtom, showStockFormAtom, showSectionFormAtom, selectedMaterialAtom, selectedStockEntryAtom, selectedSectionAtom } from "@/store/inventoryAtoms";


export function InventoryManagementPanel({ onDeleteMaterial, onDeleteStockEntry, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem, onCreateSection, onUpdateSection, onDeleteSection }: InventoryManagementPanelProps = {}) {
  // Use prefetch system for data
  const { materials, stock, menu, status, refresh, isCacheValid } = usePrefetch({
    autoFetch: true,
    parallel: true,
    onError: error => {
      toast({
        title: "Data Loading Error",
        description: `Failed to load inventory data: ${error.message}`,
        variant: "destructive"
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
  const [showSectionForm, setShowSectionForm] = useAtom(showSectionFormAtom);
  const [selectedMaterial, setSelectedMaterial] = useAtom(selectedMaterialAtom) as [MaterialWithStock | null, (value: MaterialWithStock | null) => void];
  const [selectedStockEntry, setSelectedStockEntry] = useAtom(selectedStockEntryAtom) as [StockEntry | null, (value: StockEntry | null) => void];
  const [selectedSection, setSelectedSection] = useAtom(selectedSectionAtom) as [Section | null, (value: Section | null) => void];

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

  // Mock sections and assignments data (these would come from prefetch system too)
  const sections: Section[] = [];
  const sectionAssignments: SectionAssignment[] = [];
  const menuItems = menu;
  const stockEntries = stock;

  // Tab loading states
  const tabLoading = {
    material: status.individual.materials.loading,
    stock: status.individual.stock.loading,
    sections: false // Would be from sections prefetch
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
        case "sections":
          // Would refresh sections data
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
            title: "Material Updated",
            description: `${data.name} has been updated successfully.`
          });
        } else {
          // Create new material
          await inventoryAPIWithPrefetch.materials.createMaterialWithCache({
            ...data,
            isPOSItem: false
          });
          toast({
            title: "Material Created",
            description: `${data.name} has been created successfully.`
          });
        }
        setShowMaterialForm(false);
        setSelectedMaterial(null);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to ${selectedMaterial ? "update" : "create"} material: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive"
        });
      } finally {
        setOperationLoading(prev => ({ ...prev, material: false }));
      }
    },
    [selectedMaterial, setShowMaterialForm, setSelectedMaterial]
  );

  const handleStockSubmit = useCallback(
    async (data: StockFormData) => {
      setOperationLoading(prev => ({ ...prev, stock: true }));
      try {
        if (selectedStockEntry) {
          // Update existing stock entry
          await inventoryAPIWithPrefetch.stock.updateStockEntryWithCache(selectedStockEntry.id, data);
          toast({
            title: "Stock Entry Updated",
            description: "Stock entry has been updated successfully."
          });
        } else {
          // Create new stock entry
          await inventoryAPIWithPrefetch.stock.createStockEntryWithCache(data);
          toast({
            title: "Stock Entry Created",
            description: "Stock entry has been created successfully."
          });
        }
        setShowStockForm(false);
        setSelectedStockEntry(null);
        setSelectedMaterial(null);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to ${selectedStockEntry ? "update" : "create"} stock entry: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive"
        });
      } finally {
        setOperationLoading(prev => ({ ...prev, stock: false }));
      }
    },
    [selectedStockEntry, setShowStockForm, setSelectedStockEntry, setSelectedMaterial]
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
        toast({
          title: "Material Deleted",
          description: "Material has been deleted successfully."
        });
        if (onDeleteMaterial) {
          onDeleteMaterial(materialId);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete material: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive"
        });
      } finally {
        setOperationLoading(prev => ({ ...prev, [`delete-material-${materialId}`]: false }));
      }
    },
    [onDeleteMaterial]
  );

  const handleAddStockOperation = useCallback(async (data: { materialId?: string; supplier?: string; purchasedQuantity?: number; costPerPurchasedUnit?: number; totalCost?: number; purchasedUnit?: string; wasteQuantity?: number; purchaseDate?: Date; expiryDate?: Date; batchNumber?: string; notes?: string; wasteReason?: string }) => {
    // Would use inventoryAPIWithPrefetch.stock.addToStockWithCache
    console.log("Add stock operation:", data);
  }, []);

  const handleRecordWasteOperation = useCallback(async (data: { materialId?: string; supplier?: string; purchasedQuantity?: number; costPerPurchasedUnit?: number; totalCost?: number; purchasedUnit?: string; wasteQuantity?: number; purchaseDate?: Date; expiryDate?: Date; batchNumber?: string; notes?: string; wasteReason?: string }) => {
    // Would use inventoryAPIWithPrefetch.stock.recordWasteWithCache
    console.log("Record waste operation:", data);
  }, []);

  const handleAddToSpecificEntryOperation = useCallback(async (data: { materialId?: string; supplier?: string; purchasedQuantity?: number; costPerPurchasedUnit?: number; totalCost?: number; purchasedUnit?: string; wasteQuantity?: number; purchaseDate?: Date; expiryDate?: Date; batchNumber?: string; notes?: string; wasteReason?: string }) => {
    // Would use specific stock entry API
    console.log("Add to specific entry:", data);
  }, []);

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
      } & { entryId: string }
    ) => {
      // Would use specific stock entry API
      console.log("Waste from specific entry:", data);
    },
    []
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

  const handleSectionSubmit = async (data: { name: string; description?: string }) => {
    try {
      if (selectedSection) {
        // Edit mode
        if (onUpdateSection) {
          await onUpdateSection(selectedSection.id, data);
        }
      } else {
        // Create mode
        if (onCreateSection) {
          await onCreateSection(data);
        }
      }
      setShowSectionForm(false);
      setSelectedSection(null);
    } catch (error) {
      console.error("Failed to submit section:", error);
    }
  };

  const existingSectionNames = sections.map(section => section.name);

  const handleDataRefresh = async () => {
    try {
      await fetchTabData("sections");
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <TabsList className="sticky top-0 z-10 flex w-full bg-white shadow-sm px-2 py-1 gap-2 rounded-md overflow-x-auto">
          {[
            { value: "material", label: "Materials", icon: Package, color: "blue", short: "Mat", loading: tabLoading.material },
            { value: "stock", label: "Stock Entries", icon: Warehouse, color: "green", short: "Stock", loading: tabLoading.stock },
            { value: "sections", label: "Sections", icon: MapPin, color: "purple", short: "Sec", loading: tabLoading.sections }
          ].map(({ value, label, icon: Icon, color, short, loading }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={`
          flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-md font-medium text-gray-600 transition
          data-[state=active]:bg-${color}-600 data-[state=active]:text-white data-[state=active]:shadow-md
          hover:bg-${color}-100 hover:text-${color}-700
        `}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
              {loading && <Loader2 className="w-3 h-3 ml-1 animate-spin" />}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="material" className="flex-1 focus-visible:outline-none overflow-hidden">
          <div className="h-full bg-white border border-gray-200 shadow-sm rounded-lg p-4 overflow-auto">
            <MaterialTable filteredMaterials={filteredMaterials} onEditMaterial={handleEditMaterial} onAddStock={handleAddStock} onDeleteMaterial={handleDeleteMaterial} />
          </div>
        </TabsContent>

        <TabsContent value="stock" className="flex-1 focus-visible:outline-none overflow-hidden">
          <div className="h-full bg-white border border-gray-200 shadow-sm rounded-lg p-4 overflow-auto">
            <StockEntriesTable />
          </div>
        </TabsContent>

        <TabsContent value="sections" className="flex-1 focus-visible:outline-none overflow-hidden">
          <div className="h-full bg-white border border-gray-200 shadow-sm rounded-lg p-4 overflow-auto">
            <SectionsManagementPanel sections={sections} sectionAssignments={sectionAssignments} materials={materialsWithStock} stockEntries={stockEntries} menuItems={menuItems} onCreateSection={onCreateSection} onUpdateSection={onUpdateSection} onDeleteSection={onDeleteSection} onDataRefresh={handleDataRefresh} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      {showMaterialForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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

      {showStockForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                setSelectedMaterial(null);
                setSelectedStockEntry(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Section Form Dialog */}
      <Dialog open={showSectionForm} onOpenChange={setShowSectionForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              {selectedSection ? "Edit Section" : "Create New Section"}
            </DialogTitle>
            <DialogDescription>{selectedSection ? "Update the section details below" : "Create a new section to organize your inventory items"}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="px-6 py-4">
              <SectionForm
                section={selectedSection || undefined}
                onSubmit={handleSectionSubmit}
                onCancel={() => {
                  setShowSectionForm(false);
                  setSelectedSection(null);
                }}
                existingSectionNames={existingSectionNames}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
