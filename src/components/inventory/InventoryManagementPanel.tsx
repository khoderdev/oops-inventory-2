import { MaterialForm } from "@/components/materials/MaterialForm";
import { StockForm } from "@/components/stock/StockForm";
import { SectionForm } from "@/components/sections/SectionForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Material, MATERIAL_CATEGORIES, MaterialWithStock, MenuItem, Section, SectionAssignment, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { calculateCostForQuantity, calculateMaterialInventory, calculateTotalInventoryValue, findLowStockMaterials, getDisplayQuantity, getSuggestedUnits } from "@/utils/inventoryCalculations";
import { AlertCircle, Check, Edit, Filter, Package, Plus, RefreshCw, Search, Trash2, Building2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MenuItemBuilder } from "../menu/MenuBuilder";
import { SectionsManagementPanel } from "./SectionsManagementPanel";

interface InventoryManagementPanelProps {
  materials: MaterialWithStock[];
  stockEntries: StockEntry[];
  sections?: Section[];
  sectionAssignments?: SectionAssignment[];
  menuItems?: MenuItem[];
  onCreateMaterial: (data: Material) => void;
  onUpdateMaterial: (id: string, data: Material) => void;
  onDeleteMaterial: (id: string) => void;
  onCreateStockEntry: (data: StockEntry) => void;
  onUpdateStockEntry: (id: string, data: StockEntry) => void;
  onDeleteStockEntry: (id: string) => void;
  onCreateMenuItem?: (data: MenuItem) => void;
  onUpdateMenuItem?: (id: string, data: MenuItem) => void;
  onDeleteMenuItem?: (id: string) => void;
  onCreateSection?: (data: { name: string; description?: string }) => void;
  onUpdateSection?: (id: string, data: { name: string; description?: string }) => void;
  onDeleteSection?: (id: string) => void;
}

export function InventoryManagementPanel({ materials, stockEntries, sections = [], sectionAssignments = [], menuItems = [], onCreateMaterial, onUpdateMaterial, onDeleteMaterial, onCreateStockEntry, onUpdateStockEntry, onDeleteStockEntry, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem, onCreateSection, onUpdateSection, onDeleteSection }: InventoryManagementPanelProps) {
  const [activeTab, setActiveTab] = useState(() => {
    // Try to get the last active tab from localStorage, default to 'sections'
    if (typeof window !== 'undefined') {
      return localStorage.getItem('inventoryManagementActiveTab') || 'sections';
    }
    return 'sections';
  });
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedStockEntry, setSelectedStockEntry] = useState<StockEntry | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  
  // Optimistic state management
  const [optimisticMaterials, setOptimisticMaterials] = useState<MaterialWithStock[]>(materials);
  const [optimisticStockEntries, setOptimisticStockEntries] = useState<StockEntry[]>(stockEntries);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced message handling with auto-clear
  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Update optimistic state when props change
  useEffect(() => {
    setOptimisticMaterials(materials);
    setOptimisticStockEntries(stockEntries);
  }, [materials, stockEntries]);

  // Persist active tab to prevent unwanted resets
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    // Save to localStorage for persistence across re-renders
    if (typeof window !== 'undefined') {
      localStorage.setItem('inventoryManagementActiveTab', value);
    }
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  // Refresh data function
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Reset optimistic state to actual props
      setOptimisticMaterials(materials);
      setOptimisticStockEntries(stockEntries);
      showSuccess("Data refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      showError("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  }, [materials, stockEntries, showError, showSuccess]);

  // Calculate materials with stock data using optimistic state
  const materialsWithStock = useMemo(() => {
    return optimisticMaterials.map(material => {
      const materialStockEntries = optimisticStockEntries.filter(entry => entry.materialId === material.id);
      const materialInventory = calculateMaterialInventory(material, materialStockEntries);

      // Calculate assigned individual quantities for this material
      const materialAssignments = sectionAssignments.filter(assignment => assignment.materialId === material.id && assignment.itemType === "stockEntry");

      const totalAssignedIndividualQuantity = materialAssignments.reduce((sum, assignment) => {
        // Use assignedIndividualQuantity if available, otherwise calculate from assignedQuantity
        const individualQty = assignment.assignedIndividualQuantity || (assignment.assignedQuantity || 0) * (material.packageQuantity || 1);
        return sum + individualQty;
      }, 0);

      // Calculate available quantity (total - assigned)
      const availableQuantity = Math.max(0, materialInventory.totalQuantityInBaseUnit - totalAssignedIndividualQuantity);

      return {
        ...materialInventory,
        availableQuantity
      };
    });
  }, [optimisticMaterials, optimisticStockEntries, sectionAssignments]);

  // Filter materials based on search term, category, and low stock
  const filteredMaterials = useMemo(() => {
    return optimisticMaterials.filter(material => {
      const matchesSearch = !searchTerm || material.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || material.category === categoryFilter;
      const matchesLowStock = !lowStockFilter || material.availableQuantity < 10;
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [optimisticMaterials, searchTerm, categoryFilter, lowStockFilter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalValue = calculateTotalInventoryValue(materialsWithStock);
    const lowStockCount = findLowStockMaterials(materialsWithStock, 10).length;
    const totalMaterials = materialsWithStock.length;
    const totalStockEntries = stockEntries.length;

    return {
      totalValue,
      lowStockCount,
      totalMaterials,
      totalStockEntries
    };
  }, [materialsWithStock, stockEntries]);

  const handleMaterialSubmit = async (data: Material) => {
    try {
      if (selectedMaterial) {
        // Optimistic update for editing
        setOptimisticMaterials(prev => 
          prev.map(material => 
            material.id === selectedMaterial.id 
              ? { ...material, ...data, updatedAt: new Date() }
              : material
          )
        );
        await onUpdateMaterial(selectedMaterial.id, data);
        showSuccess(`Material "${data.name}" updated successfully`);
      } else {
        // Optimistic update for creating
        const tempMaterial: MaterialWithStock = {
          ...data,
          id: `temp-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          stockEntries: [],
          totalQuantityInBaseUnit: 0,
          totalValue: 0,
          averageCostPerBaseUnit: 0,
          availableQuantity: 0
        };
        setOptimisticMaterials(prev => [...prev, tempMaterial]);
        await onCreateMaterial(data);
        showSuccess(`Material "${data.name}" created successfully`);
      }
      setShowMaterialForm(false);
      setSelectedMaterial(null);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticMaterials(materials);
      showError(selectedMaterial ? 'Failed to update material' : 'Failed to create material');
      console.error('Material operation failed:', error);
    }
  };

  const handleStockSubmit = async (data: StockEntry) => {
    try {
      if (selectedStockEntry) {
        // Optimistic update for editing
        setOptimisticStockEntries(prev => 
          prev.map(entry => 
            entry.id === selectedStockEntry.id 
              ? { ...entry, ...data, updatedAt: new Date() }
              : entry
          )
        );
        await onUpdateStockEntry(selectedStockEntry.id, data);
        showSuccess('Stock entry updated successfully');
      } else {
        // Optimistic update for creating
        const tempStockEntry: StockEntry = {
          ...data,
          id: `temp-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setOptimisticStockEntries(prev => [...prev, tempStockEntry]);
        await onCreateStockEntry(data);
        showSuccess('Stock entry created successfully');
      }
      setShowStockForm(false);
      setSelectedStockEntry(null);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticStockEntries(stockEntries);
      showError(selectedStockEntry ? 'Failed to update stock entry' : 'Failed to create stock entry');
      console.error('Stock entry operation failed:', error);
    }
  };

  const handleEditMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setShowMaterialForm(true);
  };

  const handleEditStockEntry = (stockEntry: StockEntry) => {
    setSelectedStockEntry(stockEntry);
    setShowStockForm(true);
  };

  const handleAddStock = (materialId: string) => {
    setSelectedMaterial(materials.find(m => m.id === materialId) || null);
    setShowStockForm(true);
  };

  const handleSectionSubmit = (data: { name: string; description?: string }) => {
    if (selectedSection && onUpdateSection) {
      onUpdateSection(selectedSection.id, data);
    } else if (onCreateSection) {
      onCreateSection(data);
    }
    setShowSectionForm(false);
    setSelectedSection(null);
  };

  const handleEditSection = (section: Section) => {
    setSelectedSection(section);
    setShowSectionForm(true);
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
          <TabsTrigger value="material">Material</TabsTrigger>
          <TabsTrigger value="stock">Stock Entries</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="menu">Menu Builder</TabsTrigger>
          <TabsTrigger value="conversions">Unit Conversions</TabsTrigger>
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
                          const formattedCost = cost < 0.01 && cost > 0 
                            ? `$${cost.toFixed(6).replace(/\.?0+$/, '')}` 
                            : formatCurrency(cost);
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
          <SectionsManagementPanel 
            sections={sections} 
            sectionAssignments={sectionAssignments} 
            materials={materials} 
            stockEntries={stockEntries} 
            menuItems={menuItems}
            onCreateSection={onCreateSection}
            onUpdateSection={onUpdateSection}
            onDeleteSection={onDeleteSection}
          />
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <MenuItemBuilder materials={materials} stockEntries={stockEntries} sections={sections} menuItems={menuItems} onCreateMenuItem={onCreateMenuItem} onUpdateMenuItem={onUpdateMenuItem} onDeleteMenuItem={onDeleteMenuItem} />
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
            <DialogDescription>
              {selectedSection 
                ? "Update the section details below" 
                : "Create a new section to organize your inventory items"
              }
            </DialogDescription>
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
