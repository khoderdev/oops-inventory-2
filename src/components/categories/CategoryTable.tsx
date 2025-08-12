import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CategoriesTableProps } from "@/types/categories";
import { Edit, Trash2, GripVertical, Package, UtensilsCrossed } from "lucide-react";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export function CategoryTable({ categories, onEdit, onDelete, onToggleActive, onUpdateSortOrder, loading = false }: CategoriesTableProps) {
  const [draggedCategories, setDraggedCategories] = useState(categories);

  // Update local state when categories prop changes
  useEffect(() => {
    setDraggedCategories(categories);
  }, [categories]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(draggedCategories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort orders
    const updatedItems = items.map((item, index) => ({
      ...item,
      sortOrder: index
    }));

    setDraggedCategories(updatedItems);

    // Send update to parent
    const sortOrderUpdates = updatedItems.map((item, index) => ({
      id: item.id,
      sortOrder: index
    }));
    onUpdateSortOrder(sortOrderUpdates);
  };

  const getTypeIcon = (type: string) => {
    return type === "materials" ? <Package className="w-4 h-4" /> : <UtensilsCrossed className="w-4 h-4" />;
  };

  const getTypeBadge = (type: string) => {
    return type === "materials" ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <Package className="w-3 h-3 mr-1" />
        Materials
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <UtensilsCrossed className="w-3 h-3 mr-1" />
        Menu Items
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Loading categories...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (draggedCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>No categories found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No categories available. Create your first category to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories ({draggedCategories.length})</CardTitle>
        <CardDescription>Manage categories for materials and menu items. Drag to reorder.</CardDescription>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories">
            {provided => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draggedCategories.map((category, index) => (
                      <Draggable key={category.id} draggableId={category.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <TableRow ref={provided.innerRef} {...provided.draggableProps} className={snapshot.isDragging ? "bg-muted/50" : ""}>
                            <TableCell {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(category.type)}
                                {category.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-sm bg-muted px-2 py-1 rounded">{category.value}</code>
                            </TableCell>
                            <TableCell>{getTypeBadge(category.type)}</TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={category.description}>
                                {category.description || <span className="text-muted-foreground italic">No description</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch checked={category.isActive} onCheckedChange={checked => onToggleActive(category.id, checked)} />
                                <Badge variant={category.isActive ? "default" : "secondary"}>{category.isActive ? "Active" : "Inactive"}</Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{category.sortOrder}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                      <AlertDialogDescription>Are you sure you want to delete the category "{category.name}"? This action cannot be undone and may affect existing materials or menu items.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => onDelete(category.id)} className="bg-red-600 hover:bg-red-700">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TableBody>
                </Table>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}
