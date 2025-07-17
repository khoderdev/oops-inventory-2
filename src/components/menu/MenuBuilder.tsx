import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MaterialWithStock, MenuItem, MenuItemCategory, MenuItemIngredient, Section, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { Edit, Package, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { MenuItemForm } from "./MenuItemForm";

interface MenuItemBuilderProps {
  materials: MaterialWithStock[];
  stockEntries: StockEntry[];
  sections: Section[];
  menuItems: MenuItem[];
  onCreateMenuItem?: (data: MenuItem) => void;
  onUpdateMenuItem?: (id: string, data: MenuItem) => void;
  onDeleteMenuItem?: (id: string) => void;
}

export const MenuItemBuilder: React.FC<MenuItemBuilderProps> = ({
  materials,
  stockEntries,
  sections,
  menuItems,
  onCreateMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showMenuItemForm, setShowMenuItemForm] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MenuItemCategory | "all">("all");

  const MENU_CATEGORIES = useMemo<{ value: MenuItemCategory; label: string }[]>(
    () => [
      { value: "appetizers", label: "Appetizers" },
      { value: "mains", label: "Main Courses" },
      { value: "sides", label: "Sides" },
      { value: "desserts", label: "Desserts" },
      { value: "beverages", label: "Beverages" },
      { value: "other", label: "Other" }
    ],
    []
  );

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const calculateMenuItemCost = useCallback((ingredients: MenuItemIngredient[]) => {
    return ingredients.reduce((sum, ingredient) => sum + (ingredient.cost || 0), 0);
  }, []);

  const handleAddMenuItem = useCallback(
    (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: Omit<MenuItemIngredient, "cost">[] }) => {
      if (!onCreateMenuItem) {
        console.error("onCreateMenuItem handler not provided");
        return;
      }

      try {
        const ingredientsWithCosts = data.ingredients.map(ingredient => {
          const material = materials.find(m => m.id === String(ingredient.materialId));
          if (!material) throw new Error(`Material not found: ${ingredient.materialId}`);
          const costPerUnit = material.averageCostPerBaseUnit || 0;
          const conversionFactor = getConversionFactor(ingredient.unit, material.baseUnit, material.unitType || "piece");
          return {
            ...ingredient,
            cost: ingredient.quantity * conversionFactor * costPerUnit
          };
        });

        const newMenuItem: MenuItem = {
          id: crypto.randomUUID(),
          ...data,
          ingredients: ingredientsWithCosts,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        onCreateMenuItem(newMenuItem);
        setShowMenuItemForm(false);
        setEditingMenuItem(null);
      } catch (error) {
        console.error("Error adding menu item:", error);
        setShowMenuItemForm(false);
        setEditingMenuItem(null);
      }
    },
    [materials, onCreateMenuItem]
  );

  const handleUpdateMenuItem = useCallback(
    (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: Omit<MenuItemIngredient, "cost">[] }) => {
      if (!editingMenuItem || !onUpdateMenuItem) {
        console.error("editingMenuItem or onUpdateMenuItem handler not provided");
        return;
      }

      try {
        const ingredientsWithCosts = data.ingredients.map(ingredient => {
          const material = materials.find(m => m.id === String(ingredient.materialId));
          if (!material) throw new Error(`Material not found: ${ingredient.materialId}`);
          const costPerUnit = material.averageCostPerBaseUnit || 0;
          const conversionFactor = getConversionFactor(ingredient.unit, material.baseUnit, material.unitType || "piece");
          return {
            ...ingredient,
            cost: ingredient.quantity * conversionFactor * costPerUnit
          };
        });

        const updatedMenuItem: MenuItem = {
          ...editingMenuItem,
          ...data,
          ingredients: ingredientsWithCosts,
          updatedAt: new Date()
        };
        
        onUpdateMenuItem(editingMenuItem.id, updatedMenuItem);
        setShowMenuItemForm(false);
        setEditingMenuItem(null);
      } catch (error) {
        console.error("Error updating menu item:", error);
        setShowMenuItemForm(false);
        setEditingMenuItem(null);
      }
    },
    [editingMenuItem, materials, onUpdateMenuItem]
  );

  const handleDeleteMenuItem = useCallback((id: string) => {
    if (!onDeleteMenuItem) {
      console.error("onDeleteMenuItem handler not provided");
      return;
    }
    onDeleteMenuItem(id);
  }, [onDeleteMenuItem]);

  const getMaterialName = useCallback((id: string | number) => {
    const material = materials.find(m => m.id === String(id));
    return material?.name || "Unknown";
  }, [materials]);

  const handleCloseModal = useCallback(() => {
    setShowMenuItemForm(false);
    setEditingMenuItem(null);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Menu Item Builder</h1>
          <p className="text-muted-foreground">Create and manage menu items with ingredients from inventory</p>
        </div>

        <Dialog open={showMenuItemForm} onOpenChange={handleCloseModal}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingMenuItem(null)} aria-label="Add new menu item">
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="menu-item-form-description">
            <DialogHeader>
              <DialogTitle>{editingMenuItem ? "Edit Menu Item" : "Create New Menu Item"}</DialogTitle>
            </DialogHeader>
            <MenuItemForm menuItem={editingMenuItem} materials={materials} categories={MENU_CATEGORIES} onSubmit={editingMenuItem ? handleUpdateMenuItem : handleAddMenuItem} onCancel={handleCloseModal} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search menu items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" aria-label="Search menu items" />
        </div>

        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value as MenuItemCategory | "all")} className="px-3 py-2 border border-input bg-background rounded-md" aria-label="Filter by category">
          <option value="all">All Categories</option>
          {MENU_CATEGORIES.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMenuItems.length > 0 ? (
                filteredMenuItems.map(item => {
                  const totalCost = calculateMenuItemCost(item.ingredients);
                  const profit = item.price - totalCost;
                  const profitMargin = item.price ? (profit / item.price) * 100 : 0;

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
                              {formatNumber(ingredient.quantity)} {ingredient.unit} {getMaterialName(ingredient.materialId)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(totalCost)}</TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(profit)} ({formatNumber(profitMargin)}%)
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingMenuItem(item);
                              setShowMenuItemForm(true);
                            }}
                            aria-label={`Edit ${item.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" aria-label={`Delete ${item.name}`}>
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
                      <p className="text-sm text-muted-foreground">{searchTerm ? "Try a different search term" : "Create your first menu item"}</p>
                      <Button className="mt-4" onClick={() => setShowMenuItemForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Menu Item
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
