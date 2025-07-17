import { SectionsTable } from "@/components/sections/SectionsTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Material, MenuItem, Section, SectionAssignment, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { calculateMaterialInventory, calculateTotalInventoryValue, findLowStockMaterials } from "@/utils/inventoryCalculations";
import { AlertTriangle, DollarSign, Package, PieChart } from "lucide-react";
import { useMemo, useState } from "react";
import { InventoryManagementPanel } from "./InventoryManagementPanel";

interface InventoryDashboardProps {
  materials: Material[];
  stockEntries: StockEntry[];
  menuItems: MenuItem[];
  sections: Section[];
  sectionAssignments: SectionAssignment[];
  onCreateMaterial: (data: Material) => void;
  onUpdateMaterial: (id: string, data: Material) => void;
  onDeleteMaterial: (id: string) => void;
  onCreateStockEntry: (data: StockEntry) => void;
  onUpdateStockEntry: (id: string, data: StockEntry) => void;
  onDeleteStockEntry: (id: string) => void;
}

export function InventoryDashboard({ materials, stockEntries, menuItems, sections, sectionAssignments, onCreateMaterial, onUpdateMaterial, onDeleteMaterial, onCreateStockEntry, onUpdateStockEntry, onDeleteStockEntry }: InventoryDashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Calculate materials with stock data
  const materialsWithStock = useMemo(() => {
    return materials.map(material => {
      const materialStockEntries = stockEntries.filter(entry => entry.materialId === material.id);
      return calculateMaterialInventory(material, materialStockEntries);
    });
  }, [materials, stockEntries]);

  // Calculate sections with assignments
  const sectionsWithAssignments = useMemo(() => {
    return sections.map(section => {
      const assignments = sectionAssignments
        .filter(assignment => assignment.sectionId === section.id)
        .map(assignment => {
          // Add related data to assignment
          const material = assignment.materialId ? materials.find(m => m.id === assignment.materialId) : undefined;
          const stockEntry = assignment.stockEntryId ? stockEntries.find(s => s.id === assignment.stockEntryId) : undefined;
          const menuItem = assignment.menuItemId ? menuItems.find(mi => mi.id === assignment.menuItemId) : undefined;

          return {
            ...assignment,
            material,
            stockEntry,
            menuItem
          };
        })
        .filter(assignment => (assignment.material && assignment.stockEntry) || assignment.menuItem);

      // Calculate total value for this section
      const totalValue = assignments.reduce((sum, assignment) => {
        if (assignment.menuItem) {
          return sum + (assignment.menuItem.price || 0);
        }
        if (assignment.material && assignment.stockEntry) {
          const quantity = assignment.assignedQuantity || 0;
          const costPerUnit = assignment.stockEntry.costPerPurchasedUnit || 0;
          return sum + quantity * costPerUnit;
        }
        return sum;
      }, 0);

      return {
        ...section,
        assignments,
        totalValue
      };
    });
  }, [sections, sectionAssignments, materials, stockEntries, menuItems]);

  // Calculate dashboard statistics
  const dashboardStats = useMemo(() => {
    const totalInventoryValue = calculateTotalInventoryValue(materialsWithStock);
    const lowStockCount = findLowStockMaterials(materialsWithStock, 10).length;
    const totalMaterials = materialsWithStock.length;
    const totalStockEntries = stockEntries.length;
    const totalMenuItems = menuItems.length;
    const totalSections = sections.length;
    const totalAssignments = sectionAssignments.length;

    const sectionsValue = sectionsWithAssignments.reduce((sum, section) => sum + section.totalValue, 0);
    const menuItemsValue = menuItems.reduce((sum, item) => sum + (item.price || 0), 0);

    return {
      totalInventoryValue,
      lowStockCount,
      totalMaterials,
      totalStockEntries,
      totalMenuItems,
      totalSections,
      totalAssignments,
      sectionsValue,
      menuItemsValue
    };
  }, [materialsWithStock, stockEntries, menuItems, sections, sectionAssignments, sectionsWithAssignments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Enhanced Inventory Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive inventory management with dynamic unit conversions and cost calculations</p>
        </div>
      </div>

      {/* Main Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardStats.totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">From {dashboardStats.totalMaterials} materials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sections Value</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardStats.sectionsValue)}</div>
            <p className="text-xs text-muted-foreground">Across {dashboardStats.totalSections} sections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Entries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalStockEntries}</div>
            <p className="text-xs text-muted-foreground">{dashboardStats.totalAssignments} assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardStats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Dashboard Overview */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Stock Entries */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Stock Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockEntries
                      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
                      .slice(0, 5)
                      .map(entry => {
                        const material = materials.find(m => m.id === entry.materialId);
                        return (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">{material?.name || "Unknown"}</TableCell>
                            <TableCell>
                              {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit}
                            </TableCell>
                            <TableCell>{formatCurrency(entry.totalCost)}</TableCell>
                            <TableCell>{entry.purchaseDate.toLocaleDateString()}</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Low Stock Materials */}
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {findLowStockMaterials(materialsWithStock, 10)
                      .slice(0, 5)
                      .map(material => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell>
                            {formatNumber(material.totalQuantityInBaseUnit)} {material.baseUnit}
                          </TableCell>
                          <TableCell>{formatCurrency(material.totalValue)}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">Low Stock</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Menu Items Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Menu Items Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Ingredients</TableHead>
                    <TableHead>Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.slice(0, 10).map(item => {
                    const totalIngredientCost = item.ingredients?.reduce((sum, ing) => sum + (ing.cost || 0), 0) || 0;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(item.price)}</TableCell>
                        <TableCell>{item.ingredients?.length || 0}</TableCell>
                        <TableCell>{formatCurrency(totalIngredientCost)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Management */}
        <TabsContent value="inventory">
          <InventoryManagementPanel materials={materials} stockEntries={stockEntries} onCreateMaterial={onCreateMaterial} onUpdateMaterial={onUpdateMaterial} onDeleteMaterial={onDeleteMaterial} onCreateStockEntry={onCreateStockEntry} onUpdateStockEntry={onUpdateStockEntry} onDeleteStockEntry={onDeleteStockEntry} />
        </TabsContent>

        {/* Sections */}
        <TabsContent value="sections">
          <SectionsTable sectionsWithAssignments={sectionsWithAssignments} materials={materials} stockEntries={stockEntries} menuItems={menuItems} setSelectedItem={() => {}} />
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventory Value by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Value by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    materialsWithStock.reduce(
                      (acc, material) => {
                        acc[material.category] = (acc[material.category] || 0) + material.totalValue;
                        return acc;
                      },
                      {} as Record<string, number>
                    )
                  )
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, value]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="capitalize">{category}</span>
                        <span className="font-semibold">{formatCurrency(value)}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Materials by Value */}
            <Card>
              <CardHeader>
                <CardTitle>Top Materials by Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materialsWithStock
                    .sort((a, b) => b.totalValue - a.totalValue)
                    .slice(0, 10)
                    .map(material => (
                      <div key={material.id} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{material.name}</span>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(material.totalQuantityInBaseUnit)} {material.baseUnit}
                          </p>
                        </div>
                        <span className="font-semibold">{formatCurrency(material.totalValue)}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Entry Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Entry Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stockEntries.length}</div>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(stockEntries.reduce((sum, entry) => sum + entry.totalCost, 0))}</div>
                  <p className="text-sm text-muted-foreground">Total Purchase Value</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{new Set(stockEntries.map(entry => entry.supplier)).size}</div>
                  <p className="text-sm text-muted-foreground">Unique Suppliers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
