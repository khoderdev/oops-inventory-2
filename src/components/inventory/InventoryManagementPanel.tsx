import { MaterialForm } from "@/components/materials/MaterialForm";
import { MaterialTable } from "@/components/materials/MaterialTable";
import { SectionForm } from "@/components/sections/SectionForm";
import { StockEntriesTable } from "@/components/stock/StockEntriesTable";
import { StockForm } from "@/components/stock/StockForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { MATERIAL_CATEGORIES, MaterialWithStock } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { calculateCostForQuantity, getSuggestedUnits } from "@/utils/inventoryCalculations";
import { Building2, Filter, Package, Plus, Search } from "lucide-react";
import { useState } from "react";
import { MenuItemBuilder } from "../menu/MenuBuilder";
import { SectionsManagementPanel } from "../sections/SectionsManagementPanel";

export function InventoryManagementPanel() {
  // Use Jotai store for all state management
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
    tabLoading,
    handleTabChange,
    handleMaterialSubmit,
    handleStockSubmit,
    handleEditMaterial,
    handleEditStockEntry,
    handleAddStock,
    handleDeleteMaterial,
    fetchTabData
  } = useInventoryStore();

  // Section form handlers
  const handleSectionSubmit = (data: { name: string; description?: string }) => {
    // Section creation/update will be handled by the Jotai store
    // This is just a placeholder for now
    console.log("Section submit:", data);
    setShowSectionForm(false);
  };

  const existingSectionNames = sections.map(section => section.name);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="pt-6">
        <CardContent>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
              {/* Search Input */}
              <div className="flex items-center space-x-2 min-w-0 flex-1 sm:flex-initial">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input placeholder="Search materials..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-64 min-w-0" />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {MATERIAL_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Low Stock Filter */}
              <Button variant={lowStockFilter ? "default" : "outline"} onClick={() => setLowStockFilter(!lowStockFilter)} className="w-full sm:w-auto whitespace-nowrap">
                <Filter className="h-4 w-4 mr-2" />
                Low Stock Only
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <Button onClick={() => setShowMaterialForm(true)} className="w-full sm:w-auto whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
              <Button variant="outline" onClick={() => setShowStockForm(true)} className="w-full sm:w-auto whitespace-nowrap">
                <Package className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="material" className="relative">
            Material
            {tabLoading.material}
          </TabsTrigger>
          <TabsTrigger value="stock" className="relative">
            Stock Entries
            {tabLoading.stock}
          </TabsTrigger>
          <TabsTrigger value="sections" className="relative">
            Sections
            {tabLoading.sections}
          </TabsTrigger>
          <TabsTrigger value="menu" className="relative">
            Menu Builder
            {tabLoading.menu}
          </TabsTrigger>
          <TabsTrigger value="conversions" className="relative">
            Unit Conversions
            {tabLoading.conversions}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="material" className="space-y-4">
          <MaterialTable filteredMaterials={filteredMaterials} onEditMaterial={handleEditMaterial} onAddStock={handleAddStock} onDeleteMaterial={handleDeleteMaterial} />
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <StockEntriesTable stockEntries={stockEntries} materialsWithStock={materialsWithStock} searchTerm={searchTerm} onEditStockEntry={handleEditStockEntry} onDeleteStockEntry={id => console.log("Delete stock entry:", id)} />
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <SectionsManagementPanel sections={sections} sectionAssignments={sectionAssignments} materials={materialsWithStock} stockEntries={stockEntries} menuItems={menuItems} onCreateSection={data => console.log("Create section:", data)} onUpdateSection={(id, data) => console.log("Update section:", id, data)} onDeleteSection={id => console.log("Delete section:", id)} />
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <MenuItemBuilder materials={materialsWithStock} stockEntries={stockEntries} sections={sections} menuItems={menuItems} onCreateMenuItem={data => console.log("Create menu item:", data)} onUpdateMenuItem={(id, data) => console.log("Update menu item:", id, data)} onDeleteMenuItem={id => console.log("Delete menu item:", id)} />
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <UnitConversionCalculator materials={materialsWithStock} />
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
              onCancel={() => {
                setShowStockForm(false);
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

// Extended ConversionResult for the calculator
interface CalculatorConversionResult {
  cost: number;
  steps?: string[];
  warning?: string;
  error?: string;
}

// Unit Conversion Calculator Component
function UnitConversionCalculator({ materials }: { materials: MaterialWithStock[] }) {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialWithStock | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>("");
  const [toUnit, setToUnit] = useState<string>("");
  const [conversionResult, setConversionResult] = useState<CalculatorConversionResult | null>(null);

  const handleCalculate = () => {
    if (!selectedMaterial || !quantity || !fromUnit || !toUnit) return;

    try {
      const result = calculateCostForQuantity(selectedMaterial, quantity, fromUnit, selectedMaterial.averageCostPerBaseUnit);
      setConversionResult({
        cost: result.cost,
        steps: result.steps,
        warning: undefined
      });
    } catch (error) {
      console.error("Conversion error:", error);
      setConversionResult({
        cost: 0,
        error: "Conversion failed"
      });
    }
  };

  const suggestedUnits = selectedMaterial ? getSuggestedUnits(selectedMaterial.unitType) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Conversion Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Material</label>
            <Select
              value={selectedMaterial?.id || ""}
              onValueChange={value => {
                const material = materials.find(m => m.id === value);
                setSelectedMaterial(material || null);
                setFromUnit("");
                setToUnit("");
                setConversionResult(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {materials.map(material => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name} ({material.baseUnit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} placeholder="Enter quantity" min="0" step="0.01" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">From Unit</label>
            <Select value={fromUnit} onValueChange={setFromUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select from unit" />
              </SelectTrigger>
              <SelectContent>
                {suggestedUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">To Unit</label>
            <Select value={toUnit} onValueChange={setToUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select to unit" />
              </SelectTrigger>
              <SelectContent>
                {suggestedUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleCalculate} className="w-full">
          Calculate Conversion & Cost
        </Button>

        {conversionResult && (
          <Card>
            <CardHeader>
              <CardTitle>Conversion Result</CardTitle>
            </CardHeader>
            <CardContent>
              {conversionResult.error ? (
                <p className="text-red-600">{conversionResult.error}</p>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>Total Cost:</strong> {formatCurrency(conversionResult.cost)}
                  </p>
                  {conversionResult.warning && (
                    <p className="text-yellow-600">
                      <strong>Warning:</strong> {conversionResult.warning}
                    </p>
                  )}
                  <div>
                    <strong>Calculation Steps:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {conversionResult.steps?.map((step: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
