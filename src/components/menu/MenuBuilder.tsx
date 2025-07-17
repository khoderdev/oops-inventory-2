import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Material, MenuItem, MenuItemIngredient } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { Edit, Package, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { MENU_CATEGORIES } from "../../types/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MenuItemForm } from "./MenuItemForm";

interface MenuBuilderProps {
  menuItems: MenuItem[];
  materialsWithStock: Material[];
  setEditingMenuItem: (menuItem: MenuItem | undefined) => void;
  handleDeleteMenuItem: (id: string) => void;
  handleAddMenuItem: (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: Omit<MenuItemIngredient, "cost">[] }) => void;
  handleUpdateMenuItem: (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: Omit<MenuItemIngredient, "cost">[] }) => void;
  editingMenuItem: MenuItem | undefined;
}

export function MenuBuilder({ menuItems, materialsWithStock, setEditingMenuItem, handleDeleteMenuItem, handleAddMenuItem, handleUpdateMenuItem, editingMenuItem }: MenuBuilderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Menu Builder</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                            setDialogOpen(true);
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
  );
}
