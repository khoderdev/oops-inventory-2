import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MENU_CATEGORIES } from "@/mockData/InventoryDashboard";
import { Material, MATERIAL_CATEGORIES, MenuItem, MenuItemIngredient, Section, SectionAssignment, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getCategoryLabel } from "@/utils/getCategoryLabel";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { calculateMaterialInventory, calculateTotalInventoryValue, findLowStockMaterials } from "@/utils/inventoryCalculations";
import { AlertTriangle, DollarSign, Edit, Package, Plus, Search, Trash2, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AssignmentForm } from "./AssignmentForm";
import { MaterialForm } from "./MaterialForm";
import { MenuItemForm } from "./MenuItemForm";
import { SectionForm } from "./SectionForm";
import { StockForm } from "./StockForm";
import { DetailModal } from "./ui/DetailModal";

export function InventoryDashboard() {
  // State for all data
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<SectionAssignment[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>();
  const [editingStock, setEditingStock] = useState<StockEntry | undefined>();
  const [editingSection, setEditingSection] = useState<Section | undefined>();
  const [editingAssignment, setEditingAssignment] = useState<SectionAssignment | undefined>();
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | undefined>();
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: "material" | "stock" | "section" | "assignment"; data: Material | StockEntry | Section | SectionAssignment } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from JSON Server
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [materialsRes, stockRes, sectionsRes, assignmentsRes, menuItemsRes] = await Promise.all([fetch("http://localhost:3000/materials"), fetch("http://localhost:3000/stockEntries"), fetch("http://localhost:3000/sections"), fetch("http://localhost:3000/assignments"), fetch("http://localhost:3000/menuItems")]);

        const [materialsData, stockData, sectionsData, assignmentsData, menuItemsData] = await Promise.all([materialsRes.json(), stockRes.json(), sectionsRes.json(), assignmentsRes.json(), menuItemsRes.json()]);

        // Convert string dates to Date objects
        const parseDates = (items: any[]) =>
          items.map(item => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            ...(item.purchaseDate && { purchaseDate: new Date(item.purchaseDate) }),
            ...(item.expiryDate && { expiryDate: new Date(item.expiryDate) })
          }));

        setMaterials(parseDates(materialsData));
        setStockEntries(parseDates(stockData));
        setSections(parseDates(sectionsData));
        setAssignments(parseDates(assignmentsData));
        setMenuItems(parseDates(menuItemsData));
      } catch (err) {
        setError("Failed to fetch data from server");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // API call functions
  const apiRequest = async (url: string, method: string, data?: any) => {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  };

  // Handler functions with API integration
  const handleAddMaterial = async (data: Material) => {
    try {
      const { id, ...materialData } = data; // 🚨 Remove any accidental `id`
      const newMaterial = await apiRequest("http://localhost:3000/materials", "POST", materialData);
      setMaterials([...materials, newMaterial]);
      setShowMaterialForm(false);
    } catch (error) {
      setError("Failed to add material");
    }
  };

  // const handleAddMaterial = async (data: Material) => {
  //   try {
  //     const newMaterial = await apiRequest("http://localhost:3000/materials", "POST", data);
  //     setMaterials([...materials, newMaterial]);
  //     setShowMaterialForm(false);
  //   } catch (error) {
  //     setError("Failed to add material");
  //   }
  // };

  const handleEditMaterial = async (data: Material) => {
    if (editingMaterial) {
      try {
        const updatedMaterial = await apiRequest(`http://localhost:3000/materials/${editingMaterial.id}`, "PUT", data);
        setMaterials(materials.map(m => (m.id === editingMaterial.id ? updatedMaterial : m)));
        setEditingMaterial(undefined);
        setShowMaterialForm(false);
      } catch (error) {
        setError("Failed to update material");
      }
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await apiRequest(`http://localhost:3000/materials/${materialId}`, "DELETE");
      setMaterials(materials.filter(m => m.id !== materialId));
      // Also delete associated stock entries
      const stockToDelete = stockEntries.filter(s => s.materialId === materialId);
      await Promise.all(stockToDelete.map(s => apiRequest(`http://localhost:3000/stockEntries/${s.id}`, "DELETE")));
      setStockEntries(stockEntries.filter(s => s.materialId !== materialId));
    } catch (error) {
      setError("Failed to delete material");
    }
  };

  const handleAddStock = async (data: StockEntry) => {
    try {
      const newStockEntry = await apiRequest("http://localhost:3000/stockEntries", "POST", data);
      setStockEntries([...stockEntries, newStockEntry]);
      setShowStockForm(false);
      setSelectedMaterialId("");
    } catch (error) {
      setError("Failed to add stock entry");
    }
  };

  const handleEditStock = async (data: StockEntry) => {
    if (editingStock) {
      try {
        const updatedStock = await apiRequest(`http://localhost:3000/stockEntries/${editingStock.id}`, "PUT", data);
        setStockEntries(stockEntries.map(entry => (entry.id === editingStock.id ? updatedStock : entry)));
        setEditingStock(undefined);
        setShowStockForm(false);
      } catch (error) {
        setError("Failed to update stock entry");
      }
    }
  };

  const handleDeleteStock = async (stockId: string) => {
    try {
      await apiRequest(`http://localhost:3000/stockEntries/${stockId}`, "DELETE");
      setStockEntries(stockEntries.filter(s => s.id !== stockId));
    } catch (error) {
      setError("Failed to delete stock entry");
    }
  };

  const handleAddSection = async (data: Section) => {
    try {
      const newSection = await apiRequest("http://localhost:3000/sections", "POST", data);
      setSections([...sections, newSection]);
      setShowSectionForm(false);
    } catch (error) {
      setError("Failed to add section");
    }
  };

  const handleEditSection = async (data: Section) => {
    if (editingSection) {
      try {
        const updatedSection = await apiRequest(`http://localhost:3000/sections/${editingSection.id}`, "PUT", data);
        setSections(sections.map(section => (section.id === editingSection.id ? updatedSection : section)));
        setEditingSection(undefined);
        setShowSectionForm(false);
      } catch (error) {
        setError("Failed to update section");
      }
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await apiRequest(`http://localhost:3000/sections/${sectionId}`, "DELETE");
      setSections(sections.filter(s => s.id !== sectionId));
      // Also delete associated assignments
      const assignmentsToDelete = assignments.filter(a => a.sectionId === sectionId);
      await Promise.all(assignmentsToDelete.map(a => apiRequest(`http://localhost:3000/assignments/${a.id}`, "DELETE")));
      setAssignments(assignments.filter(a => a.sectionId !== sectionId));
    } catch (error) {
      setError("Failed to delete section");
    }
  };

  const handleAddAssignment = async (data: SectionAssignment) => {
    try {
      const newAssignment = await apiRequest("http://localhost:3000/assignments", "POST", data);
      setAssignments([...assignments, newAssignment]);
      setShowAssignmentForm(false);
    } catch (error) {
      setError("Failed to add assignment");
    }
  };

  const handleEditAssignment = async (data: SectionAssignment) => {
    if (editingAssignment) {
      try {
        const updatedAssignment = await apiRequest(`http://localhost:3000/assignments/${editingAssignment.id}`, "PUT", data);
        setAssignments(assignments.map(assignment => (assignment.id === editingAssignment.id ? updatedAssignment : assignment)));
        setEditingAssignment(undefined);
        setShowAssignmentForm(false);
      } catch (error) {
        setError("Failed to update assignment");
      }
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await apiRequest(`http://localhost:3000/assignments/${assignmentId}`, "DELETE");
      setAssignments(assignments.filter(a => a.id !== assignmentId));
    } catch (error) {
      setError("Failed to delete assignment");
    }
  };

  const handleAddMenuItem = async (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: Omit<MenuItemIngredient, "cost">[] }) => {
    const ingredientsWithCosts = data.ingredients.map(ingredient => {
      const material = materialsWithStock.find(m => m.id === ingredient.materialId);
      const costPerUnit = material?.averageCostPerBaseUnit || 0;
      const conversionFactor = getConversionFactor(ingredient.unit, material?.baseUnit || ingredient.unit, material?.unitType || "piece");
      return {
        ...ingredient,
        cost: ingredient.quantity * conversionFactor * costPerUnit
      };
    });

    try {
      const newMenuItem = await apiRequest("http://localhost:3000/menuItems", "POST", {
        ...data,
        ingredients: ingredientsWithCosts
      });
      setMenuItems([...menuItems, newMenuItem]);
    } catch (error) {
      setError("Failed to add menu item");
    }
  };

  const handleUpdateMenuItem = async (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: Omit<MenuItemIngredient, "cost">[] }) => {
    const ingredientsWithCosts = data.ingredients.map(ingredient => {
      const material = materialsWithStock.find(m => m.id === ingredient.materialId);
      const costPerUnit = material?.averageCostPerBaseUnit || 0;
      const conversionFactor = getConversionFactor(ingredient.unit, material?.baseUnit || ingredient.unit, material?.unitType || "piece");
      return {
        ...ingredient,
        cost: ingredient.quantity * conversionFactor * costPerUnit
      };
    });

    try {
      const updatedMenuItem = await apiRequest(`http://localhost:3000/menuItems/${editingMenuItem?.id}`, "PUT", {
        ...data,
        ingredients: ingredientsWithCosts
      });
      setMenuItems(menuItems.map(item => (item.id === editingMenuItem?.id ? updatedMenuItem : item)));
      setEditingMenuItem(undefined);
    } catch (error) {
      setError("Failed to update menu item");
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      await apiRequest(`http://localhost:3000/menuItems/${id}`, "DELETE");
      setMenuItems(menuItems.filter(item => item.id !== id));
    } catch (error) {
      setError("Failed to delete menu item");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <div className="text-center">
          <p>Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">{error}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
            </svg>
          </span>
        </div>
      )}

      {/* Rest of the component remains the same as before */}
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
