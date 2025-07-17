import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/http.ts";
import { Material, MenuItem, MenuItemIngredient, Section, SectionAssignment, StockEntry } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { getConversionFactor } from "@/utils/getConversionFactor.ts";
import { calculateMaterialInventory, calculateTotalInventoryValue, findLowStockMaterials } from "@/utils/inventoryCalculations";
import { AlertTriangle, DollarSign, Package, Plus, Search, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { materialsAPI } from "../api/matierials.api.ts";
import { sectionAPI } from "../api/sections.api.ts";
import { AnalyticsPanel } from "./analytics/AnalyticsPanel";
import { MaterialForm } from "./materials/MaterialForm.tsx";
import { MaterialsTable } from "./materials/MaterialsTable";
import { MenuBuilder } from "./menu/MenuBuilder.tsx";
import { AssignmentForm } from "./sections/AssignmentForm.tsx";
import { SectionForm } from "./sections/SectionForm.tsx";
import { SectionsTable } from "./sections/SectionsTable";
import { StockEntriesTable } from "./stock/StockEntriesTable";
import { StockForm } from "./stock/StockForm.tsx";
import { DetailModal } from "./ui/DetailModal";

export function InventoryDashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<SectionAssignment[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [materialsRes, stockRes, sectionsRes, assignmentsRes, menuItemsRes] = await Promise.all([materialsAPI.getMaterials(), api.get("/stock-entries").then(res => res.data), sectionAPI.getSections(), api.get("/assignments").then(res => res.data), api.get("/menu-items").then(res => res.data)]);

        const parsedMaterials = Array.isArray(materialsRes.data)
          ? materialsRes.data.map(m => ({
              ...m,
              costPerBaseUnit: Number(m.costPerBaseUnit)
            }))
          : [];

        setMaterials(parsedMaterials);
        setStockEntries(Array.isArray(stockRes) ? stockRes : []);
        setSections(Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
        setAssignments(Array.isArray(assignmentsRes) ? assignmentsRes : []);
        setMenuItems(Array.isArray(menuItemsRes) ? menuItemsRes : []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data from server");
        setMaterials([]);
        setStockEntries([]);
        setSections([]);
        setAssignments([]);
        setMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate inventory data
  const materialsWithStock = useMemo(() => {
    if (!Array.isArray(materials) || !Array.isArray(stockEntries)) return [];
    return materials.map(material => {
      const materialStockEntries = stockEntries.filter(entry => entry.materialId === material.id);
      return calculateMaterialInventory(material, materialStockEntries);
    });
  }, [materials, stockEntries]);

  const sectionsWithAssignments = useMemo(() => {
    if (!Array.isArray(sections) || !Array.isArray(assignments) || !Array.isArray(stockEntries) || !Array.isArray(materials)) return [];
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
        .filter(a => a.stockEntry && a.material);

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
    if (!Array.isArray(materialsWithStock) || !Array.isArray(assignments) || !Array.isArray(stockEntries) || !Array.isArray(sections)) return [];
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
    if (!Array.isArray(materialsWithStock)) return [];
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
  const handleAddMaterial = async (data: Material) => {
    try {
      const newMaterial = await materialsAPI.createMaterial(data);
      setMaterials(prev => [...prev, newMaterial.data]);
      setShowMaterialForm(false);
    } catch (error: any) {
      setError(error.message || "Failed to add material");
    }
  };

  const handleMaterialSelect = (materialId: number | string) => {
    setSelectedMaterialId(String(materialId));
  };

  const handleEditMaterial = async (data: Material) => {
    if (editingMaterial) {
      try {
        const updatedMaterial = await materialsAPI.updateMaterial(editingMaterial.id, data);
        setMaterials(prev => prev.map(m => (m.id === editingMaterial.id ? updatedMaterial.data : m)));
        setEditingMaterial(undefined);
        setShowMaterialForm(false);
      } catch (error: any) {
        setError(error.message || "Failed to update material");
      }
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await materialsAPI.deleteMaterial(materialId);
      setMaterials(prev => prev.filter(m => m.id !== materialId));
      const stockToDelete = stockEntries.filter(s => s.materialId === materialId);
      await Promise.all(stockToDelete.map(s => api.delete(`/stock-entries/${s.id}`)));
      setStockEntries(prev => prev.filter(s => s.materialId !== materialId));
    } catch (error: any) {
      setError(error.message || "Failed to delete material");
    }
  };

  const handleAddStock = async (data: StockEntry) => {
    try {
      const newStockEntry = await api.post("/stock-entries", data).then(res => res.data);
      setStockEntries(prev => [...prev, newStockEntry]);
      setShowStockForm(false);
      setSelectedMaterialId("");
    } catch (error: any) {
      setError(error.message || "Failed to add stock entry");
    }
  };

  const handleEditStock = async (data: StockEntry) => {
    if (editingStock) {
      try {
        const updatedStock = await api.put(`/stock-entries/${editingStock.id}`, data).then(res => res.data);
        setStockEntries(prev => prev.map(entry => (entry.id === editingStock.id ? updatedStock : entry)));
        setEditingStock(undefined);
        setShowStockForm(false);
      } catch (error: any) {
        setError(error.message || "Failed to update stock entry");
      }
    }
  };

  const handleDeleteStock = async (stockId: string) => {
    try {
      await api.delete(`/stock-entries/${stockId}`);
      setStockEntries(prev => prev.filter(s => s.id !== stockId));
    } catch (error: any) {
      setError(error.message || "Failed to delete stock entry");
    }
  };

  const handleAddSection = async (data: Section) => {
    try {
      const newSection = await sectionAPI.createSection(data);
      setSections(prev => [...prev, newSection.data]);
      setShowSectionForm(false);
    } catch (error: any) {
      setError(error.message || "Failed to add section");
    }
  };

  const handleEditSection = async (data: Section) => {
    if (editingSection) {
      try {
        const updatedSection = await sectionAPI.updateSection(editingSection.id, data);
        setSections(prev => prev.map(section => (section.id === editingSection.id ? updatedSection.data : section)));
        setEditingSection(undefined);
        setShowSectionForm(false);
      } catch (error: any) {
        setError(error.message || "Failed to update section");
      }
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await sectionAPI.deleteSection(sectionId);
      setSections(prev => prev.filter(s => s.id !== sectionId));
      const assignmentsToDelete = assignments.filter(a => a.sectionId === sectionId);
      await Promise.all(assignmentsToDelete.map(a => api.delete(`/assignments/${a.id}`)));
      setAssignments(prev => prev.filter(a => a.sectionId !== sectionId));
    } catch (error: any) {
      setError(error.message || "Failed to delete section");
    }
  };

  const handleAddAssignment = async (data: SectionAssignment) => {
    try {
      console.log("Sending assignment data:", data);
      const newAssignment = await api.post("/assignments", data).then(res => res.data);
      setAssignments(prev => [...prev, newAssignment]);
      setShowAssignmentForm(false);
    } catch (error: any) {
      console.error("Failed to add assignment:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.error || "Failed to add assignment");
    }
  };

  const handleEditAssignment = async (data: SectionAssignment) => {
    if (editingAssignment) {
      try {
        const updatedAssignment = await api.put(`/assignments/${editingAssignment.id}`, data).then(res => res.data);
        setAssignments(prev => prev.map(assignment => (assignment.id === editingAssignment.id ? updatedAssignment : assignment)));
        setEditingAssignment(undefined);
        setShowAssignmentForm(false);
      } catch (error: any) {
        setError(error.message || "Failed to update assignment");
      }
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await api.delete(`/assignments/${assignmentId}`);
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    } catch (error: any) {
      setError(error.message || "Failed to delete assignment");
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
      const newMenuItem = await api.post("/menu-items", { ...data, ingredients: ingredientsWithCosts }).then(res => res.data);
      setMenuItems(prev => [...prev, newMenuItem]);
    } catch (error: any) {
      setError(error.message || "Failed to add menu item");
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
      const updatedMenuItem = await api.put(`/menu-items/${editingMenuItem?.id}`, { ...data, ingredients: ingredientsWithCosts }).then(res => res.data);
      setMenuItems(prev => prev.map(item => (item.id === editingMenuItem?.id ? updatedMenuItem : item)));
      setEditingMenuItem(undefined);
    } catch (error: any) {
      setError(error.message || "Failed to update menu item");
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      await api.delete(`/menu-items/${id}`);
      setMenuItems(prev => prev.filter(item => item.id !== id));
    } catch (error: any) {
      setError(error.message || "Failed to delete menu item");
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

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage materials and stock with automatic conversions and cost calculations</p>
        </div>
      </div>

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

      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="stock">Stock Entries</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="menu">Menu Builder</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <MaterialsTable filteredMaterials={filteredMaterials} materialsWithSectionAssignments={materialsWithSectionAssignments} setSelectedItem={setSelectedItem} setIsDetailModalOpen={setIsDetailModalOpen} handleMaterialSelect={handleMaterialSelect} setShowStockForm={setShowStockForm} setEditingMaterial={setEditingMaterial} setShowMaterialForm={setShowMaterialForm} handleDeleteMaterial={handleDeleteMaterial} />
        </TabsContent>

        <TabsContent value="sections">
          <SectionsTable
            sectionsWithAssignments={sectionsWithAssignments}
            selectedSectionId={selectedSectionId}
            sections={sections}
            setSelectedItem={setSelectedItem}
            setIsDetailModalOpen={setIsDetailModalOpen}
            setEditingSection={setEditingSection}
            setShowSectionForm={setShowSectionForm}
            handleDeleteSection={handleDeleteSection}
            setSelectedSectionId={setSelectedSectionId}
            setShowAssignmentForm={setShowAssignmentForm}
            setEditingAssignment={setEditingAssignment}
            handleDeleteAssignment={handleDeleteAssignment}
          />
          <Dialog open={showSectionForm} onOpenChange={setShowSectionForm}>
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

        <TabsContent value="stock">
          <StockEntriesTable stockEntries={stockEntries} materials={materials} setSelectedItem={setSelectedItem} setIsDetailModalOpen={setIsDetailModalOpen} setEditingStock={setEditingStock} setShowStockForm={setShowStockForm} handleDeleteStock={handleDeleteStock} />
        </TabsContent>

        <TabsContent value="menu">
          <MenuBuilder menuItems={menuItems} materialsWithStock={materialsWithStock} setEditingMenuItem={setEditingMenuItem} handleDeleteMenuItem={handleDeleteMenuItem} handleAddMenuItem={handleAddMenuItem} handleUpdateMenuItem={handleUpdateMenuItem} editingMenuItem={editingMenuItem} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsPanel lowStockMaterials={lowStockMaterials} materialsWithStock={materialsWithStock} />
        </TabsContent>
      </Tabs>

      <DetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} selectedItem={selectedItem} materialsWithSectionAssignments={materialsWithSectionAssignments} sectionsWithAssignments={sectionsWithAssignments} />
    </div>
  );
}
