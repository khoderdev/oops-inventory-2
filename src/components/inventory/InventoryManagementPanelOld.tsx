import { MaterialForm } from "@/components/materials/MaterialForm";
import { SectionForm } from "@/components/sections/SectionForm";
import { StockForm } from "@/components/stock/StockForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { Material, MATERIAL_CATEGORIES, MaterialWithStock, MenuItem, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { calculateCostForQuantity, getDisplayQuantity, getSuggestedUnits } from "@/utils/inventoryCalculations";
import { Building2, Edit, Filter, Package, Plus, Search, Trash2 } from "lucide-react";
import { MenuItemBuilder } from "../menu/MenuBuilder";
import { SectionsManagementPanel } from "./SectionsManagementPanel";

interface InventoryManagementPanelProps {
  // Optional props for backward compatibility - Jotai store will be primary data source
  onCreateMaterial?: (data: Material) => void;
  onUpdateMaterial?: (id: string, data: Material) => void;
  onDeleteMaterial?: (id: string) => void;
  onCreateStockEntry?: (data: StockEntry) => void;
  onUpdateStockEntry?: (id: string, data: StockEntry) => void;
  onDeleteStockEntry?: (id: string) => void;
  onCreateMenuItem?: (data: MenuItem) => void;
  onUpdateMenuItem?: (id: string, data: MenuItem) => void;
  onDeleteMenuItem?: (id: string) => void;
  onCreateSection?: (data: { name: string; description?: string }) => void;
  onUpdateSection?: (id: string, data: { name: string; description?: string }) => void;
  onDeleteSection?: (id: string) => void;
}

export function InventoryManagementPanel({ onCreateMaterial, onUpdateMaterial, onDeleteMaterial, onCreateStockEntry, onUpdateStockEntry, onDeleteStockEntry, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem, onCreateSection, onUpdateSection, onDeleteSection }: InventoryManagementPanelProps) {
  // Use Jotai store for all state management
  const {
    // Data
    materialsWithStock,
    filteredMaterials,
    stockEntries,
    sections,
    sectionAssignments,
    menuItems,

    // UI state
    activeTab,
    searchTerm,
    categoryFilter,
    lowStockFilter,
    setSearchTerm,
    setCategoryFilter,
    setLowStockFilter,

    // Form state
    showMaterialForm,
    showStockForm,
    showSectionForm,
    selectedMaterial,
    selectedStockEntry,
    selectedSection,
    setShowMaterialForm,
    setShowStockForm,
    setShowSectionForm,

    // Messages
    successMessage,
    errorMessage,

    // Loading states
    tabLoading,
    tabError,

    // Handlers
    handleTabChange,
    handleMaterialSubmit,
    handleStockSubmit,
    handleEditMaterial,
    handleEditStockEntry,
    handleAddStock,

    // Actions
    fetchTabData
  } = useInventoryStore();

  // Section form handlers
  const handleSectionSubmit = (data: { name: string; description?: string }) => {
    if (selectedSection && onUpdateSection) {
      onUpdateSection(selectedSection.id, data);
    } else if (onCreateSection) {
      onCreateSection(data);
    }
    setShowSectionForm(false);
  };

  const existingSectionNames = sections.map(section => section.name);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  // Function to get the current data to display (fetched data takes precedence over props)
  const getCurrentData = useCallback(() => {
    return {
      materials: fetchedMaterials.length > 0 ? fetchedMaterials : materials,
      stockEntries: fetchedStockEntries.length > 0 ? fetchedStockEntries : stockEntries,
      sections: fetchedSections.length > 0 ? fetchedSections : sections,
      sectionAssignments: fetchedSectionAssignments.length > 0 ? fetchedSectionAssignments : sectionAssignments,
      menuItems: fetchedMenuItems.length > 0 ? fetchedMenuItems : menuItems
    };
  }, [fetchedMaterials, materials, fetchedStockEntries, stockEntries, fetchedSections, sections, fetchedSectionAssignments, sectionAssignments, fetchedMenuItems, menuItems]);

  // Get current data to use in the component
  const currentData = getCurrentData();

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
            {tabDataLoading.material}
          </TabsTrigger>
          <TabsTrigger value="stock" className="relative">
            Stock Entries
            {tabDataLoading.stock}
          </TabsTrigger>
          <TabsTrigger value="sections" className="relative">
            Sections
            {tabDataLoading.sections}
          </TabsTrigger>
          <TabsTrigger value="menu" className="relative">
            Menu Builder
            {tabDataLoading.menu}
          </TabsTrigger>
          <TabsTrigger value="conversions" className="relative">
            Unit Conversions
            {tabDataLoading.conversions}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="material" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Average Cost/Unit</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Stock Entries</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map(material => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{MATERIAL_CATEGORIES.find(c => c.value === material.category)?.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const cost = material.averageCostPerBaseUnit;
                          // For very small numbers (less than 0.01), show more decimal places
                          const formattedCost = cost < 0.01 && cost > 0 ? `$${cost.toFixed(6).replace(/\.?0+$/, "")}` : formatCurrency(cost);
                          return `${formattedCost}/${material.baseUnit}`;
                        })()}
                        {material.unitType === "package" && <span className="text-xs text-muted-foreground ml-1">(per {material.baseUnit})</span>}
                      </TableCell>
                      <TableCell>{formatCurrency(material.totalValue)}</TableCell>
                      <TableCell>{material.stockEntries.length}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditMaterial(material)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleAddStock(material.id)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Material</AlertDialogTitle>
                                <AlertDialogDescription>Are you sure you want to delete "{material.name}"? This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteMaterial(material.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Remaining Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Cost/Unit</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optimisticStockEntries
                    .filter(entry => {
                      const material = optimisticMaterials.find(m => m.id === entry.materialId);
                      return !searchTerm || material?.name.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .map(entry => {
                      const material = optimisticMaterials.find(m => m.id === entry.materialId);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{material?.name || "Unknown Material"}</TableCell>
                          <TableCell>{entry.supplier}</TableCell>
                          <TableCell>
                            {(() => {
                              const displayQty = getDisplayQuantity(entry, material!);
                              return formatNumber(displayQty.quantity);
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const displayQty = getDisplayQuantity(entry, material!);
                              return (
                                <div className="flex items-center gap-2">
                                  <span>{displayQty.unit}</span>
                                  {displayQty.isConverted && (
                                    <Badge variant="outline" className="text-xs">
                                      Package
                                    </Badge>
                                  )}
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(entry.costPerPurchasedUnit)}
                            {material?.unitType === "package" && <span className="text-xs text-muted-foreground ml-1">(per {entry.purchasedUnit})</span>}
                          </TableCell>
                          <TableCell>{formatCurrency(entry.totalCost)}</TableCell>
                          <TableCell>{entry.purchaseDate.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditStockEntry(entry)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Stock Entry</AlertDialogTitle>
                                    <AlertDialogDescription>Are you sure you want to delete this stock entry? This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDeleteStockEntry(entry.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <SectionsManagementPanel sections={currentData.sections} sectionAssignments={currentData.sectionAssignments} materials={currentData.materials} stockEntries={currentData.stockEntries} menuItems={currentData.menuItems} onCreateSection={onCreateSection} onUpdateSection={onUpdateSection} onDeleteSection={onDeleteSection} />
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <MenuItemBuilder materials={currentData.materials} stockEntries={currentData.stockEntries} sections={currentData.sections} menuItems={currentData.menuItems} onCreateMenuItem={onCreateMenuItem} onUpdateMenuItem={onUpdateMenuItem} onDeleteMenuItem={onDeleteMenuItem} />
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
              materials={materials}
              stockEntry={selectedStockEntry || undefined}
              selectedMaterialId={selectedMaterial?.id}
              onSubmit={handleStockSubmit}
              onCancel={() => {
                setShowStockForm(false);
                setSelectedStockEntry(null);
                setSelectedMaterial(null);
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
      // Convert ConversionResult to CalculatorConversionResult
      setConversionResult({
        cost: result.cost,
        steps: result.steps,
        warning: undefined // Add warning logic if needed
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
