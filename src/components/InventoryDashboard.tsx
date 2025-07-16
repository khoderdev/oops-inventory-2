import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MENU_CATEGORIES, mockAssignments, mockMaterials, mockSections, mockStockEntries } from "@/mockData/InventoryDashboard";
import { Material, MATERIAL_CATEGORIES, MenuItem, MenuItemIngredient, Section, SectionAssignment, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getCategoryLabel } from "@/utils/getCategoryLabel";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { calculateMaterialInventory, calculateTotalInventoryValue, findLowStockMaterials } from "@/utils/inventoryCalculations";
import { AlertTriangle, DollarSign, Edit, Package, Plus, Search, Trash2, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { AssignmentForm } from "./AssignmentForm";
import { MaterialForm } from "./MaterialForm";
import { MenuItemForm } from "./MenuItemForm";
import { SectionForm } from "./SectionForm";
import { StockForm } from "./StockForm";
import { DetailModal } from "./ui/DetailModal";

export function InventoryDashboard() {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>(mockStockEntries);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>();
  const [editingStock, setEditingStock] = useState<StockEntry | undefined>();
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [sections, setSections] = useState<Section[]>(mockSections);
  const [assignments, setAssignments] = useState<SectionAssignment[]>(mockAssignments);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | undefined>();
  const [editingAssignment, setEditingAssignment] = useState<SectionAssignment | undefined>();
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: "material" | "stock" | "section" | "assignment"; data: Material | StockEntry | Section | SectionAssignment } | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | undefined>();

  // Calculate inventory data
  const materialsWithStock = useMemo(() => {
    if (!materials || !stockEntries) return [];
    return materials.map(material => {
      const materialStockEntries = stockEntries.filter(entry => entry.materialId === material.id);
      return calculateMaterialInventory(material, materialStockEntries);
    });
  }, [materials, stockEntries]);

  const sectionsWithAssignments = useMemo(() => {
    if (!sections || !assignments || !stockEntries || !materials) return [];
    return sections.map(section => {
      const sectionAssignments = assignments
        .filter(a => a.sectionId === section.id)
        .map(a => {
          const stockEntry = stockEntries.find(se => se.id === a.stockEntryId);
          const material = materials.find(m => stockEntry && m.id === stockEntry.materialId);
          return {
            ...a,
            stockEntry,
            material
          };
        })
        .filter(a => a.stockEntry && a.material); // Filter out invalid assignments

      const totalValue = sectionAssignments.reduce((sum, a) => {
        if (!a.stockEntry || !a.material) return sum;
        const costPerUnit = a.stockEntry.costPerPurchasedUnit;
        const conversionFactor = getConversionFactor(a.assignedUnit, a.stockEntry.purchasedUnit, a.material.unitType);
        const assignedValue = a.assignedQuantity * conversionFactor * costPerUnit;
        return sum + assignedValue;
      }, 0);

      return {
        ...section,
        assignments: sectionAssignments,
        totalValue
      };
    });
  }, [sections, assignments, stockEntries, materials]);

  const materialsWithSectionAssignments = useMemo(() => {
    if (!materialsWithStock || !assignments || !stockEntries || !sections) return [];
    return materialsWithStock.map(material => {
      const materialAssignments = assignments
        .filter(a => {
          const stockEntry = stockEntries.find(se => se.id === a.stockEntryId);
          return stockEntry && stockEntry.materialId === material.id;
        })
        .map(a => {
          const section = sections.find(s => s.id === a.sectionId);
          return {
            sectionId: a.sectionId,
            sectionName: section?.name || "Unknown",
            assignedQuantity: a.assignedQuantity,
            assignedUnit: a.assignedUnit
          };
        });

      const totalAssigned = materialAssignments.reduce((sum, a) => {
        const conversionFactor = getConversionFactor(a.assignedUnit, material.baseUnit, material.unitType);
        return sum + a.assignedQuantity * conversionFactor;
      }, 0);

      return {
        ...material,
        sectionAssignments: materialAssignments,
        availableQuantity: Math.max(0, material.totalQuantityInBaseUnit - totalAssigned)
      };
    });
  }, [materialsWithStock, assignments, stockEntries, sections]);

  // Filter materials
  const filteredMaterials = useMemo(() => {
    if (!materialsWithStock) return [];
    return materialsWithStock.filter(material => {
      const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) || material.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || material.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [materialsWithStock, searchTerm, selectedCategory]);

  // Calculate dashboard metrics
  const totalInventoryValue = useMemo(() => calculateTotalInventoryValue(materialsWithStock || []), [materialsWithStock]);
  const lowStockMaterials = useMemo(() => findLowStockMaterials(materialsWithStock || [], 5), [materialsWithStock]);
  const totalMaterials = materials?.length || 0;
  const totalStockEntries = stockEntries?.length || 0;

  // Handler functions
  const handleAddMaterial = (data: Material) => {
    const newMaterial: Material = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setMaterials([...materials, newMaterial]);
    setShowMaterialForm(false);
  };

  const handleEditMaterial = (data: Material) => {
    if (editingMaterial) {
      const updatedMaterials = materials.map(material => (material.id === editingMaterial.id ? { ...material, ...data, updatedAt: new Date() } : material));
      setMaterials(updatedMaterials);
      setEditingMaterial(undefined);
      setShowMaterialForm(false);
    }
  };

  const handleDeleteMaterial = (materialId: string) => {
    setMaterials(materials.filter(m => m.id !== materialId));
    setStockEntries(stockEntries.filter(s => s.materialId !== materialId));
  };

  const handleAddStock = (data: StockEntry) => {
    const newStockEntry: StockEntry = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setStockEntries([...stockEntries, newStockEntry]);
    setShowStockForm(false);
    setSelectedMaterialId("");
  };

  const handleEditStock = (data: StockEntry) => {
    if (editingStock) {
      const updatedStock = stockEntries.map(entry => (entry.id === editingStock.id ? { ...entry, ...data, updatedAt: new Date() } : entry));
      setStockEntries(updatedStock);
      setEditingStock(undefined);
      setShowStockForm(false);
    }
  };

  const handleDeleteStock = (stockId: string) => {
    setStockEntries(stockEntries.filter(s => s.id !== stockId));
  };

  const handleAddSection = (data: Section) => {
    const newSection: Section = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSections([...sections, newSection]);
    setShowSectionForm(false);
  };

  const handleEditSection = (data: Section) => {
    if (editingSection) {
      const updatedSections = sections.map(section => (section.id === editingSection.id ? { ...section, ...data, updatedAt: new Date() } : section));
      setSections(updatedSections);
      setEditingSection(undefined);
      setShowSectionForm(false);
    }
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
    setAssignments(assignments.filter(a => a.sectionId !== sectionId));
  };

  const handleAddAssignment = (data: SectionAssignment) => {
    const newAssignment: SectionAssignment = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setAssignments([...assignments, newAssignment]);
    setShowAssignmentForm(false);
  };

  const handleEditAssignment = (data: SectionAssignment) => {
    if (editingAssignment) {
      const updatedAssignments = assignments.map(assignment => (assignment.id === editingAssignment.id ? { ...assignment, ...data, updatedAt: new Date() } : assignment));
      setAssignments(updatedAssignments);
      setEditingAssignment(undefined);
      setShowAssignmentForm(false);
    }
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
  };

  // Add menu item handlers
  const handleAddMenuItem = (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: Omit<MenuItemIngredient, "cost">[] }) => {
    const ingredientsWithCosts = data.ingredients.map(ingredient => {
      const material = materialsWithStock.find(m => m.id === ingredient.materialId);
      const costPerUnit = material?.averageCostPerBaseUnit || 0;
      const conversionFactor = getConversionFactor(ingredient.unit, material?.baseUnit || ingredient.unit, material?.unitType || "piece");
      return {
        ...ingredient,
        cost: ingredient.quantity * conversionFactor * costPerUnit
      };
    });

    const newMenuItem: MenuItem = {
      id: Date.now().toString(),
      ...data,
      ingredients: ingredientsWithCosts,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setMenuItems([...menuItems, newMenuItem]);
  };

  const handleUpdateMenuItem = (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: Omit<MenuItemIngredient, "cost">[] }) => {
    const ingredientsWithCosts = data.ingredients.map(ingredient => {
      const material = materialsWithStock.find(m => m.id === ingredient.materialId);
      const costPerUnit = material?.averageCostPerBaseUnit || 0;
      const conversionFactor = getConversionFactor(ingredient.unit, material?.baseUnit || ingredient.unit, material?.unitType || "piece");
      return {
        ...ingredient,
        cost: ingredient.quantity * conversionFactor * costPerUnit
      };
    });

    const updatedMenuItems = menuItems.map(item =>
      item.id === editingMenuItem?.id
        ? {
            ...item,
            ...data,
            ingredients: ingredientsWithCosts,
            updatedAt: new Date()
          }
        : item
    );
    setMenuItems(updatedMenuItems);
    setEditingMenuItem(undefined);
  };

  const handleDeleteMenuItem = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage materials and stock with automatic conversions and cost calculations</p>
        </div>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Materials</p>
                <p className="text-2xl font-bold">{totalMaterials}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Entries</p>
                <p className="text-2xl font-bold">{totalStockEntries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold">{lowStockMaterials.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search materials..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Dialog open={showMaterialForm} onOpenChange={setShowMaterialForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingMaterial ? "Edit Material" : "Add New Material"}</DialogTitle>
              </DialogHeader>
              <MaterialForm
                material={editingMaterial}
                onSubmit={editingMaterial ? handleEditMaterial : handleAddMaterial}
                onCancel={() => {
                  setShowMaterialForm(false);
                  setEditingMaterial(undefined);
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showStockForm} onOpenChange={setShowStockForm}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStock ? "Edit Stock Entry" : "Add New Stock Entry"}</DialogTitle>
              </DialogHeader>
              <StockForm
                materials={materials}
                stockEntry={editingStock}
                selectedMaterialId={selectedMaterialId}
                onSubmit={editingStock ? handleEditStock : handleAddStock}
                onCancel={() => {
                  setShowStockForm(false);
                  setEditingStock(undefined);
                  setSelectedMaterialId("");
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="stock">Stock Entries</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="menu">Menu Builder</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materials Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock Quantity</TableHead>
                      <TableHead>Avg. Cost/Unit</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map(material => {
                      const materialWithAssignments = materialsWithSectionAssignments.find(m => m.id === material.id);
                      const sectionAssignments = materialWithAssignments?.sectionAssignments || [];
                      return (
                        <TableRow
                          key={material.id}
                          onClick={() => {
                            setSelectedItem({
                              type: "material",
                              data: material
                            });
                            setIsDetailModalOpen(true);
                          }}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{material.name}</div>
                              <div className="text-sm text-muted-foreground">{material.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{getCategoryLabel(material.category)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>
                                Total: {formatNumber(material.totalQuantityInBaseUnit)} {material.baseUnit}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Available: {formatNumber(materialWithAssignments?.availableQuantity || material.totalQuantityInBaseUnit)} {material.baseUnit}
                              </div>
                              {sectionAssignments.length > 0 && <div className="text-sm text-muted-foreground mt-1">Assigned to: {sectionAssignments.map(a => `${a.sectionName} (${formatNumber(a.assignedQuantity)} ${a.assignedUnit})`).join(", ")}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(material.averageCostPerBaseUnit)}/{material.baseUnit}
                          </TableCell>
                          <TableCell>{formatCurrency(material.totalValue)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedMaterialId(material.id);
                                  setShowStockForm(true);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingMaterial(material);
                                  setShowMaterialForm(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Material</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete "{material.name}" and all associated stock entries.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteMaterial(material.id)}>Delete</AlertDialogAction>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Section Inventory</CardTitle>
                <Dialog open={showSectionForm} onOpenChange={setShowSectionForm}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingSection ? "Edit Section" : "Add New Section"}</DialogTitle>
                    </DialogHeader>
                    <SectionForm
                      section={editingSection}
                      onSubmit={editingSection ? handleEditSection : handleAddSection}
                      onCancel={() => {
                        setShowSectionForm(false);
                        setEditingSection(undefined);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Assigned Items</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectionsWithAssignments.map(section => (
                      <TableRow
                        key={section.id}
                        onClick={() => {
                          setSelectedItem({
                            type: "section",
                            data: section
                          });
                          setIsDetailModalOpen(true);
                        }}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">{section.name}</TableCell>
                        <TableCell>{section.description}</TableCell>
                        <TableCell>{section.assignments.length}</TableCell>
                        <TableCell>{formatCurrency(section.totalValue)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={e => {
                                e.stopPropagation();
                                setEditingSection(section);
                                setShowSectionForm(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Section</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete the "{section.name}" section and all its assignments.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSection(section.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedSectionId(section.id);
                                setShowAssignmentForm(true);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Section Details */}
          {selectedSectionId && (
            <Card>
              <CardHeader>
                <CardTitle>{sections.find(s => s.id === selectedSectionId)?.name} Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Assigned Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectionsWithAssignments
                      .find(s => s.id === selectedSectionId)
                      ?.assignments.map(assignment => (
                        <TableRow
                          key={assignment.id}
                          onClick={() => {
                            setSelectedItem({
                              type: "assignment",
                              data: assignment
                            });
                            setIsDetailModalOpen(true);
                          }}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="font-medium">{assignment.material?.name}</div>
                            <div className="text-sm text-muted-foreground">{assignment.notes}</div>
                          </TableCell>
                          <TableCell>{formatNumber(assignment.assignedQuantity)}</TableCell>
                          <TableCell>{assignment.assignedUnit}</TableCell>
                          <TableCell>{formatCurrency(assignment.assignedQuantity * (assignment.stockEntry?.costPerPurchasedUnit || 0) * getConversionFactor(assignment.assignedUnit, assignment.stockEntry?.purchasedUnit || assignment.assignedUnit, assignment.material?.unitType || "piece"))}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingAssignment(assignment);
                                  setShowAssignmentForm(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Assignment</AlertDialogTitle>
                                    <AlertDialogDescription>This will remove this item from the section but won't delete the stock entry.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteAssignment(assignment.id)}>Remove</AlertDialogAction>
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
          )}

          {/* Assignment Form Dialog */}
          <Dialog open={showAssignmentForm} onOpenChange={setShowAssignmentForm}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAssignment ? "Edit Assignment" : "Assign Stock to Section"}</DialogTitle>
              </DialogHeader>
              <AssignmentForm
                sections={sections}
                stockEntries={stockEntries}
                materials={materials}
                assignment={editingAssignment}
                onSubmit={editingAssignment ? handleEditAssignment : handleAddAssignment}
                onCancel={() => {
                  setShowAssignmentForm(false);
                  setEditingAssignment(undefined);
                  setSelectedSectionId("");
                }}
              />
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockEntries.map(entry => {
                      const material = materials.find(m => m.id === entry.materialId);
                      return (
                        <TableRow
                          key={entry.id}
                          onClick={() => {
                            setSelectedItem({
                              type: "stock",
                              data: entry
                            });
                            setIsDetailModalOpen(true);
                          }}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="font-medium">{material?.name}</div>
                          </TableCell>
                          <TableCell>{entry.supplier}</TableCell>
                          <TableCell>
                            {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(entry.costPerPurchasedUnit)}/{entry.purchasedUnit}
                          </TableCell>
                          <TableCell>{formatCurrency(entry.totalCost)}</TableCell>
                          <TableCell>{entry.purchaseDate.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingStock(entry);
                                  setShowStockForm(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Stock Entry</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete this stock entry.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteStock(entry.id)}>Delete</AlertDialogAction>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Menu Builder Tab */}
        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Menu Builder</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setEditingMenuItem(undefined)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Menu Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingMenuItem ? "Edit Menu Item" : "Create New Menu Item"}</DialogTitle>
                    </DialogHeader>
                    <MenuItemForm menuItem={editingMenuItem} materials={materialsWithStock} categories={MENU_CATEGORIES} onSubmit={editingMenuItem ? handleUpdateMenuItem : handleAddMenuItem} onCancel={() => setEditingMenuItem(undefined)} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Ingredients</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.length > 0 ? (
                    menuItems.map(item => {
                      const totalCost = item.ingredients.reduce((sum, i) => sum + i.cost, 0);
                      const profit = item.price - totalCost;
                      const profitMargin = (profit / item.price) * 100;

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div>{item.name}</div>
                            {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                          </TableCell>
                          <TableCell>{MENU_CATEGORIES.find(c => c.value === item.category)?.label || item.category}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {item.ingredients.map((ingredient, idx) => (
                                <div key={idx} className="text-sm">
                                  {formatNumber(ingredient.quantity)} {ingredient.unit} {materialsWithStock.find(m => m.id === ingredient.materialId)?.name || "Unknown"}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(totalCost)}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(profit)} ({formatNumber(profitMargin)}%)
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingMenuItem(item);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete "{item.name}" and cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteMenuItem(item.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Package className="h-12 w-12 text-muted-foreground" />
                          <p className="text-lg font-medium">No menu items found</p>
                          <p className="text-sm text-muted-foreground">Create your first menu item</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alert</CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockMaterials.length === 0 ? (
                  <p className="text-muted-foreground">All materials are well-stocked.</p>
                ) : (
                  <div className="space-y-2">
                    {lowStockMaterials.map(material => (
                      <div key={material.id} className="flex justify-between items-center">
                        <span>{material.name}</span>
                        <Badge variant="destructive">
                          {formatNumber(material.totalQuantityInBaseUnit)} {material.baseUnit}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {MATERIAL_CATEGORIES.map(category => {
                    const categoryMaterials = materialsWithStock.filter(m => m.category === category.value);
                    const categoryValue = categoryMaterials.reduce((sum, m) => sum + m.totalValue, 0);

                    if (categoryValue === 0) return null;

                    return (
                      <div key={category.value} className="flex justify-between items-center">
                        <span>{category.label}</span>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(categoryValue)}</div>
                          <div className="text-sm text-muted-foreground">{categoryMaterials.length} items</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <DetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} selectedItem={selectedItem} materialsWithSectionAssignments={materialsWithSectionAssignments} sectionsWithAssignments={sectionsWithAssignments} />
    </div>
  );
}
