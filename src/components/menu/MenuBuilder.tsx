import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Material, MenuItem, MenuItemBuilderProps, MenuItemCategory, MenuItemIngredient } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { highlightText } from "@/utils/highlightText";
import { Edit, Package, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { MenuItemForm } from "./MenuItemForm";

export const MenuItemBuilder: React.FC<MenuItemBuilderProps> = ({ stockEntries, materials, menuItems, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  const availableMaterials = useMemo(() => {
    if (materials && materials.length > 0) {
      return materials;
    }
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

  const getMaterialName = useCallback(
    (id: string | number) => {
      const material = availableMaterials.find(m => m.id === String(id) || String(m.id) === String(id));
      return material?.name || "Unknown";
    },
    [availableMaterials]
  );

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchesNameOrDescription = item.name.toLowerCase().includes(searchLower) || (item.description?.toLowerCase() || "").includes(searchLower);
      const matchesIngredients = item.ingredients.some(ingredient => {
        const materialName = getMaterialName(ingredient.materialId);
        return materialName.toLowerCase().includes(searchLower);
      });
      const matchesSearch = matchesNameOrDescription || matchesIngredients;
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, selectedCategory, getMaterialName]);

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
          </div>

          {/* Search and Filter Controls */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, description, or ingredients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={selectedCategory} onValueChange={value => setSelectedCategory(value as MenuItemCategory | "all")}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {MENU_CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Counter */}
          {(searchTerm || selectedCategory !== "all") && (
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {filteredMenuItems.length} of {menuItems.length} menu items
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedCategory !== "all" && ` in ${MENU_CATEGORIES.find(c => c.value === selectedCategory)?.label}`}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Dialog open={showMenuItemForm} onOpenChange={handleCloseModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="menu-item-form-description">
              <DialogHeader>
                <DialogTitle>{editingMenuItem ? "Edit Menu Item" : "Create New Menu Item"}</DialogTitle>
              </DialogHeader>
              <MenuItemForm menuItem={editingMenuItem} materials={availableMaterials} categories={MENU_CATEGORIES} onSubmit={editingMenuItem ? handleUpdateMenuItem : handleAddMenuItem} onCancel={handleCancel} />
            </DialogContent>
          </Dialog>

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
                          <div>{highlightText(item.name, searchTerm)}</div>
                          {item.description && <div className="text-sm text-muted-foreground">{highlightText(item.description, searchTerm)}</div>}
                        </TableCell>
                        <TableCell className="min-w-[150px]">{MENU_CATEGORIES.find(c => c.value === item.category)?.label || item.category}</TableCell>
                        <TableCell className="min-w-[200px]">
                          <div className="space-y-1">
                            {item.ingredients.map((ingredient, idx) => {
                              const materialName = getMaterialName(ingredient.materialId);
                              return (
                                <div key={idx} className="text-sm">
                                  {formatNumber(ingredient.quantity)} {ingredient.unit} {highlightText(materialName, searchTerm)}
                                </div>
                              );
                            })}
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
