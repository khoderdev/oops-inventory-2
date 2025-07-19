import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Material, MenuItem, MenuItemCategory, MenuItemIngredient, Section, StockEntryWithMaterial } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { Edit, Package, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { MenuItemForm } from "./MenuItemForm";

interface MenuItemBuilderProps {
  stockEntries: StockEntryWithMaterial[];
  materials?: Material[];
  sections: Section[];
  menuItems: MenuItem[];
  onCreateMenuItem?: (data: MenuItem) => void;
  onUpdateMenuItem?: (id: string, data: MenuItem) => void;
  onDeleteMenuItem?: (id: string) => void;
}

export const MenuItemBuilder: React.FC<MenuItemBuilderProps> = ({ stockEntries, materials, menuItems, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  // Use materials prop if available, otherwise derive from stock entries
  const availableMaterials = useMemo(() => {
    if (materials && materials.length > 0) {
      return materials;
    }

    // Fallback: derive from stock entries
    const materialMap = new Map<string, Material>();
    stockEntries.forEach(entry => {
      if (entry.material && entry.purchasedIndividualQuantity && entry.purchasedIndividualQuantity > 0) {
        materialMap.set(entry.material.id.toString(), entry.material);
      }
    });
    return Array.from(materialMap.values());
  }, [materials, stockEntries]);

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
          const material = availableMaterials.find(m => m.id === String(ingredient.materialId) || String(m.id) === String(ingredient.materialId));
          if (!material) throw new Error(`Material not found: ${ingredient.materialId}`);
          const costPerUnit = material.costPerBaseUnit || 0;
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
    [availableMaterials, onCreateMenuItem]
  );

  const handleUpdateMenuItem = useCallback(
    (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: Omit<MenuItemIngredient, "cost">[] }) => {
      if (!editingMenuItem || !onUpdateMenuItem) {
        console.error("editingMenuItem or onUpdateMenuItem handler not provided");
        return;
      }

      try {
        const ingredientsWithCosts = data.ingredients.map(ingredient => {
          const material = availableMaterials.find(m => m.id === String(ingredient.materialId) || String(m.id) === String(ingredient.materialId));
          if (!material) throw new Error(`Material not found: ${ingredient.materialId}`);
          const costPerUnit = material.costPerBaseUnit || 0;
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
    [editingMenuItem, availableMaterials, onUpdateMenuItem]
  );

  const handleDeleteMenuItem = useCallback(
    (id: string) => {
      if (!onDeleteMenuItem) {
        console.error("onDeleteMenuItem handler not provided");
        return;
      }
      onDeleteMenuItem(id);
    },
    [onDeleteMenuItem]
  );

  const getMaterialName = useCallback(
    (id: string | number) => {
      const material = availableMaterials.find(m => m.id === String(id) || String(m.id) === String(id));
      return material?.name || "Unknown";
    },
    [availableMaterials]
  );

  const handleCloseModal = useCallback((open: boolean) => {
    if (!open) {
      setShowMenuItemForm(false);
      setEditingMenuItem(null);
    }
  }, []);

  const handleCancel = useCallback(() => {
    setShowMenuItemForm(false);
    setEditingMenuItem(null);
  }, []);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Menu Items</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditingMenuItem(null);
                setShowMenuItemForm(true);
              }}
              aria-label="Add new menu item"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>

            <Dialog open={showMenuItemForm} onOpenChange={handleCloseModal}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="menu-item-form-description">
                <DialogHeader>
                  <DialogTitle>{editingMenuItem ? "Edit Menu Item" : "Create New Menu Item"}</DialogTitle>
                </DialogHeader>
                <MenuItemForm menuItem={editingMenuItem} materials={availableMaterials} categories={MENU_CATEGORIES} onSubmit={editingMenuItem ? handleUpdateMenuItem : handleAddMenuItem} onCancel={handleCancel} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[calc(100vh-240px)] overflow-auto border rounded-md">
            <Table className="min-w-full">
              <TableHeader className="sticky top-0 bg-background z-10 border-b">
                <TableRow>
                  <TableHead className="min-w-[200px]">Name</TableHead>
                  <TableHead className="min-w-[150px]">Category</TableHead>
                  <TableHead className="min-w-[200px]">Ingredients</TableHead>
                  <TableHead className="min-w-[120px]">Cost</TableHead>
                  <TableHead className="min-w-[120px]">Price</TableHead>
                  <TableHead className="min-w-[120px]">Profit</TableHead>
                  <TableHead className="text-right min-w-[160px]">Actions</TableHead>
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
                        <TableCell className="font-medium min-w-[200px]">
                          <div>{item.name}</div>
                          {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                        </TableCell>
                        <TableCell className="min-w-[150px]">{MENU_CATEGORIES.find(c => c.value === item.category)?.label || item.category}</TableCell>
                        <TableCell className="min-w-[200px]">
                          <div className="space-y-1">
                            {item.ingredients.map((ingredient, idx) => (
                              <div key={idx} className="text-sm">
                                {formatNumber(ingredient.quantity)} {ingredient.unit} {getMaterialName(ingredient.materialId)}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[120px]">{formatCurrency(totalCost)}</TableCell>
                        <TableCell className="min-w-[120px]">{formatCurrency(item.price)}</TableCell>
                        <TableCell className={`min-w-[120px] ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(profit)} ({formatNumber(profitMargin)}%)
                        </TableCell>
                        <TableCell className="text-right min-w-[160px]">
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
          </div>
        </CardContent>
      </Card>
    </>
  );
};
