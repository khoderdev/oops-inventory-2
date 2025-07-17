import { MaterialForm } from "@/components/materials/MaterialForm";
import { StockForm } from "@/components/stock/StockForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversionResult } from "@/types/conversion";
import { Material, MATERIAL_CATEGORIES, MaterialWithStock, MenuItem, Section, SectionAssignment, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { calculateCostForQuantity, calculateMaterialInventory, calculateTotalInventoryValue, findLowStockMaterials, getSuggestedUnits } from "@/utils/inventoryCalculations";
import { AlertTriangle, DollarSign, Edit, Filter, Package, Plus, Search, Trash2, TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";
import { SectionsManagementPanel } from "./SectionsManagementPanel";

interface InventoryManagementPanelProps {
  materials: Material[];
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
}

export function InventoryManagementPanel({ materials, stockEntries, sections = [], sectionAssignments = [], menuItems = [], onCreateMaterial, onUpdateMaterial, onDeleteMaterial, onCreateStockEntry, onUpdateStockEntry, onDeleteStockEntry }: InventoryManagementPanelProps) {
  const [activeTab, setActiveTab] = useState("material");
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedStockEntry, setSelectedStockEntry] = useState<StockEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Calculate materials with stock data
  const materialsWithStock = useMemo(() => {
    return materials.map(material => {
      const materialStockEntries = stockEntries.filter(entry => entry.materialId === material.id);
      return calculateMaterialInventory(material, materialStockEntries);
    });
  }, [materials, stockEntries]);

  // Filter materials based on search and filters
  const filteredMaterials = useMemo(() => {
    let filtered = materialsWithStock;

    if (searchTerm) {
      filtered = filtered.filter(material => material.name.toLowerCase().includes(searchTerm.toLowerCase()) || material.category.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(material => material.category === categoryFilter);
    }

    if (lowStockFilter) {
      filtered = findLowStockMaterials(filtered, 10);
    }

    return filtered;
  }, [materialsWithStock, searchTerm, categoryFilter, lowStockFilter]);

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

  const handleMaterialSubmit = (data: Material) => {
    if (selectedMaterial) {
      onUpdateMaterial(selectedMaterial.id, data);
    } else {
      onCreateMaterial(data);
    }
    setShowMaterialForm(false);
    setSelectedMaterial(null);
  };

  const handleStockSubmit = (data: StockEntry) => {
    if (selectedStockEntry) {
      onUpdateStockEntry(selectedStockEntry.id, data);
    } else {
      onCreateStockEntry(data);
    }
    setShowStockForm(false);
    setSelectedStockEntry(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-muted-foreground">Manage materials, stock entries, and track inventory with dynamic unit conversions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalMaterials}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Entries</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalStockEntries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summaryStats.lowStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                    <TableHead>Available Quantity</TableHead>
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
                        {formatNumber(material.totalQuantityInBaseUnit)} {material.baseUnit}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(material.averageCostPerBaseUnit)}/{material.baseUnit}
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
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Cost/Unit</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockEntries
                    .filter(entry => {
                      const material = materials.find(m => m.id === entry.materialId);
                      return !searchTerm || material?.name.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .map(entry => {
                      const material = materials.find(m => m.id === entry.materialId);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{material?.name || "Unknown Material"}</TableCell>
                          <TableCell>{entry.supplier}</TableCell>
                          <TableCell>{formatNumber(entry.purchasedQuantity)}</TableCell>
                          <TableCell>{entry.purchasedUnit}</TableCell>
                          <TableCell>{formatCurrency(entry.costPerPurchasedUnit)}</TableCell>
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
          <SectionsManagementPanel sections={sections} sectionAssignments={sectionAssignments} materials={materials} stockEntries={stockEntries} menuItems={menuItems} />
        </TabsContent>
        {/* 
        <TabsContent value="menu" className="space-y-4">
          <MenuBuilder materials={materialsWithStock} stockEntries={stockEntries} sections={sections} />
        </TabsContent> */}

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
    </div>
  );
}

// Unit Conversion Calculator Component
function UnitConversionCalculator({ materials }: { materials: MaterialWithStock[] }) {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialWithStock | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>("");
  const [toUnit, setToUnit] = useState<string>("");
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  const handleCalculate = () => {
    if (!selectedMaterial || !quantity || !fromUnit || !toUnit) return;

    try {
      const result = calculateCostForQuantity(selectedMaterial, quantity, fromUnit, selectedMaterial.averageCostPerBaseUnit);
      setConversionResult(result);
    } catch (error) {
      console.error("Conversion error:", error);
      setConversionResult({ error: "Conversion failed" });
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
