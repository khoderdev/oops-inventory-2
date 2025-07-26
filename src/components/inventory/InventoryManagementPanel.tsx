import { MaterialForm } from "@/components/materials/MaterialForm";
import { MaterialTable } from "@/components/materials/MaterialTable";
import { SectionForm } from "@/components/sections/SectionForm";
import { StockEntriesTable } from "@/components/stock/StockEntriesTable";
import { StockForm } from "@/components/stock/StockForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { InventoryManagementPanelProps } from "@/types/inventory";
import { Building2, MapPin, Package, Warehouse } from "lucide-react";
import { SectionsManagementPanel } from "../sections/SectionsManagementPanel";

export function InventoryManagementPanel({ onDeleteMaterial, onDeleteStockEntry, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem, onCreateSection, onUpdateSection, onDeleteSection }: InventoryManagementPanelProps = {}) {
  const {
    materialsWithStock,
    filteredMaterials,
    stockEntries,
    sections,
    sectionAssignments,
    menuItems,
    activeTab,
    searchTerm,
    categoryFilter,
    lowStockFilter,
    setSearchTerm,
    setCategoryFilter,
    setLowStockFilter,
    showMaterialForm,
    showStockForm,
    showSectionForm,
    selectedMaterial,
    selectedStockEntry,
    selectedSection,
    setShowMaterialForm,
    setShowStockForm,
    setShowSectionForm,
    setSelectedMaterial,
    setSelectedStockEntry,
    setSelectedSection,
    tabLoading,
    handleTabChange,
    handleMaterialSubmit,
    handleStockSubmit,
    handleEditMaterial,
    handleAddStock,
    handleDeleteMaterial,
    handleCreateMenuItem,
    handleUpdateMenuItem,
    handleDeleteMenuItem,
    handleAddStockOperation,
    handleRecordWasteOperation,
    handleAddToSpecificEntryOperation,
    handleWasteFromSpecificEntryOperation,
    fetchTabData
  } = useInventoryStore();

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
    <div className="space-y-6">
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-xl p-2 shadow-sm">
          <TabsTrigger
            value="material"
            className="relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ease-in-out transform
                       data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 
                       data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200/50 
                       data-[state=active]:text-white data-[state=active]:font-semibold 
                       data-[state=active]:border-2 data-[state=active]:border-blue-300
                       data-[state=active]:scale-105 data-[state=active]:-translate-y-0.5
                       hover:bg-white/70 hover:shadow-md hover:scale-102 hover:-translate-y-px
                       active:scale-95 active:translate-y-0
                       text-gray-600 hover:text-gray-800
                       before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-blue-400 before:to-blue-500 before:opacity-0 before:transition-opacity before:duration-300
                       data-[state=active]:before:opacity-100"
          >
            <Package className="h-4 w-4 relative z-10 transition-transform duration-300 data-[state=active]:scale-110" />
            <span className="hidden sm:inline relative z-10">Materials</span>
            <span className="sm:hidden relative z-10">Mat</span>
            <div className="relative z-10">{tabLoading.material}</div>
          </TabsTrigger>
          <TabsTrigger
            value="stock"
            className="relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ease-in-out transform
                       data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 
                       data-[state=active]:shadow-lg data-[state=active]:shadow-green-200/50 
                       data-[state=active]:text-white data-[state=active]:font-semibold 
                       data-[state=active]:border-2 data-[state=active]:border-green-300
                       data-[state=active]:scale-105 data-[state=active]:-translate-y-0.5
                       hover:bg-white/70 hover:shadow-md hover:scale-102 hover:-translate-y-px
                       active:scale-95 active:translate-y-0
                       text-gray-600 hover:text-gray-800
                       before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-green-400 before:to-green-500 before:opacity-0 before:transition-opacity before:duration-300
                       data-[state=active]:before:opacity-100"
          >
            <Warehouse className="h-4 w-4 relative z-10 transition-transform duration-300 data-[state=active]:scale-110" />
            <span className="hidden sm:inline relative z-10">Stock Entries</span>
            <span className="sm:hidden relative z-10">Stock</span>
            <div className="relative z-10">{tabLoading.stock}</div>
          </TabsTrigger>
          <TabsTrigger
            value="sections"
            className="relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ease-in-out transform
                       data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 
                       data-[state=active]:shadow-lg data-[state=active]:shadow-purple-200/50 
                       data-[state=active]:text-white data-[state=active]:font-semibold 
                       data-[state=active]:border-2 data-[state=active]:border-purple-300
                       data-[state=active]:scale-105 data-[state=active]:-translate-y-0.5
                       hover:bg-white/70 hover:shadow-md hover:scale-102 hover:-translate-y-px
                       active:scale-95 active:translate-y-0
                       text-gray-600 hover:text-gray-800
                       before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-purple-400 before:to-purple-500 before:opacity-0 before:transition-opacity before:duration-300
                       data-[state=active]:before:opacity-100"
          >
            <MapPin className="h-4 w-4 relative z-10 transition-transform duration-300 data-[state=active]:scale-110" />
            <span className="hidden sm:inline relative z-10">Sections</span>
            <span className="sm:hidden relative z-10">Sec</span>
            <div className="relative z-10">{tabLoading.sections}</div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="material" className="mt-6 space-y-4 focus-visible:outline-none">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-blue-900">Materials Management</h2>
              </div>
              <p className="text-sm text-blue-700 mt-1">Manage your inventory materials and their properties</p>
            </div>
            <div className="p-6">
              <MaterialTable filteredMaterials={filteredMaterials} onEditMaterial={handleEditMaterial} onAddStock={handleAddStock} onDeleteMaterial={handleDeleteMaterial} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="mt-6 space-y-4 focus-visible:outline-none">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
              <div className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold text-green-900">Stock Entries</h2>
              </div>
              <p className="text-sm text-green-700 mt-1">Track and manage your inventory stock levels</p>
            </div>
            <div className="p-6">
              <StockEntriesTable />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sections" className="mt-6 space-y-4 focus-visible:outline-none">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-purple-900">Sections Management</h2>
              </div>
              <p className="text-sm text-purple-700 mt-1">Organize your inventory into sections and manage assignments</p>
            </div>
            <div className="">
              <SectionsManagementPanel sections={sections} sectionAssignments={sectionAssignments} materials={materialsWithStock} stockEntries={stockEntries} menuItems={menuItems} onCreateSection={onCreateSection} onUpdateSection={onUpdateSection} onDeleteSection={onDeleteSection} onDataRefresh={handleDataRefresh} />
            </div>
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
