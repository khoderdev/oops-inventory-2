import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CategoriesTableProps } from "@/types/categories";
import { Edit, Trash2, GripVertical, Package, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { getTypeBadge, getTypeIcon } from "./constants";

export function CategoryTable({ categories, onEdit, onDelete, onToggleActive, onUpdateSortOrder, loading = false }: CategoriesTableProps) {
  const [draggedCategories, setDraggedCategories] = useState(categories);

  useEffect(() => {
    setDraggedCategories(categories);
  }, [categories]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(draggedCategories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const updatedItems = items.map((item, index) => ({
      ...item,
      sortOrder: index
    }));
    setDraggedCategories(updatedItems);
    const sortOrderUpdates = updatedItems.map((item, index) => ({
      id: item.id,
      sortOrder: index
    }));
    onUpdateSortOrder(sortOrderUpdates);
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
    <Card className="bg-background">
      <CardHeader>
        <h1 className="text-xl sm:text-2xl lg:text-3xl text-center font-bold text-gray-900">Categories ({draggedCategories.length})</h1>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="h-[calc(100vh-220px)] md:w-[calc(100vw-250px)] flex flex-col overflow-y-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {provided => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col h-full">
                  <div className="rounded-md border flex flex-col h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 border-b bg-gray-100 z-10">
                          <TableRow>
                            <TableHead className="w-[60px]"></TableHead>
                            <TableHead className="w-[30%]">Name</TableHead>
                            <TableHead className="w-[20%]">Type</TableHead>
                            <TableHead className="w-[15%]">Sort Order</TableHead>
                            <TableHead className="w-[35%]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {draggedCategories.map((category, index) => (
                            <Draggable key={category.id} draggableId={category.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <TableRow ref={provided.innerRef} {...provided.draggableProps} className={snapshot.isDragging ? "bg-muted/50" : ""}>
                                  <TableCell {...provided.dragHandleProps} className="w-[60px]">
                                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                                  </TableCell>
                                  <TableCell className="font-medium w-[30%]">
                                    <div className="flex items-center gap-2">
                                      {getTypeIcon(category.type)}
                                      {category.name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="w-[20%]">{getTypeBadge(category.type)}</TableCell>
                                  <TableCell className="w-[15%]">
                                    <Badge variant="outline">{category.sortOrder}</Badge>
                                  </TableCell>
                                  <TableCell className="w-[35%]">
                                    <div className="flex items-center gap-2">
                                      <Switch checked={category.isActive} onCheckedChange={checked => onToggleActive(category.id, checked)} />
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
                  </div>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </CardContent>
    </Card>
  );
}
