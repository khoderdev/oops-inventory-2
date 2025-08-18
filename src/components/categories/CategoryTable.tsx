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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function CategoryTable({ categories, onEdit, onDelete, onToggleActive, onUpdateSortOrder, loading = false }: CategoriesTableProps) {
  const [draggedCategories, setDraggedCategories] = useState(categories);

  useEffect(() => {
    setDraggedCategories(categories);
  }, [categories]);

  // Wrapper functions to prevent scroll jumps
  const handleToggleActive = (e: React.MouseEvent | React.SyntheticEvent | null, id: number, checked: boolean) => {
    if (e) e.preventDefault();
    onToggleActive(id, checked);
  };

  const handleEdit = (e: React.MouseEvent, category: any) => {
    e.preventDefault();
    onEdit(category);
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    onDelete(id);
  };

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
    <Card>
      <CardHeader>
        <CardTitle>Categories ({draggedCategories.length})</CardTitle>
        <CardDescription>Manage categories for materials and menu items. Drag to reorder.</CardDescription>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* Desktop View - Traditional Table */}
          <div className="hidden md:block">
            <Droppable droppableId="categories-desktop">
              {provided => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="hidden lg:table-cell">Sort Order</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {draggedCategories.map((category, index) => (
                          <Draggable key={category.id} draggableId={category.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <TableRow 
                                ref={provided.innerRef} 
                                {...provided.draggableProps} 
                                className={`${
                                  snapshot.isDragging 
                                    ? "bg-primary/10 shadow-lg ring-2 ring-primary/30 z-50 rounded-md border-primary/20 relative" 
                                    : "hover:bg-muted/30 transition-colors duration-200"
                                }`}
                                style={provided.draggableProps.style}
                              >
                                <TableCell 
                                  {...provided.dragHandleProps} 
                                  className={`w-10 transition-colors duration-200 ${
                                    snapshot.isDragging ? "bg-primary/20" : ""
                                  }`}
                                >
                                  <GripVertical 
                                    className={`w-4 h-4 transition-all duration-200 ${
                                      snapshot.isDragging 
                                        ? "text-primary cursor-grabbing scale-110" 
                                        : "text-muted-foreground cursor-grab hover:text-primary"
                                    }`} 
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {getTypeIcon(category.type)}
                                    {category.name}
                                  </div>
                                </TableCell>
                                <TableCell>{getTypeBadge(category.type)}</TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <Badge variant="outline">{category.sortOrder}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Switch 
                                    checked={category.isActive} 
                                    onCheckedChange={(checked) => {
                                      handleToggleActive(null, category.id, checked);
                                    }} 
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={(e) => handleEdit(e, category)}>
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
                                          <AlertDialogAction onClick={(e) => handleDelete(e, category.id)} className="bg-red-600 hover:bg-red-700">
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
              )}
            </Droppable>
          </div>

          {/* Mobile View - Card Layout */}
          <div className="md:hidden space-y-4">
            <Droppable droppableId="categories-mobile">
              {provided => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {draggedCategories.map((category, index) => (
                    <Draggable key={category.id} draggableId={category.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.draggableProps} 
                          className={`border rounded-lg bg-card ${
                            snapshot.isDragging 
                              ? "shadow-2xl ring-2 ring-primary/40 bg-primary/5 border-primary/30 z-50" 
                              : "hover:shadow-md hover:border-primary/20 transition-all duration-200"
                          }`}
                          style={provided.draggableProps.style}
                        >
                          <Collapsible>
                            <div className={`p-4 transition-colors duration-200 ${
                              snapshot.isDragging ? "bg-primary/5" : ""
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div 
                                    {...provided.dragHandleProps} 
                                    className={`touch-none p-1 rounded transition-all duration-200 ${
                                      snapshot.isDragging 
                                        ? "bg-primary/20 scale-110" 
                                        : "hover:bg-muted/50"
                                    }`}
                                  >
                                    <GripVertical 
                                      className={`w-5 h-5 transition-all duration-200 ${
                                        snapshot.isDragging 
                                          ? "text-primary cursor-grabbing" 
                                          : "text-muted-foreground cursor-grab hover:text-primary"
                                      }`} 
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      {getTypeIcon(category.type)}
                                      <span className="font-medium">{category.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      {getTypeBadge(category.type)}
                                      <Badge variant="outline" className="text-xs">
                                        {category.sortOrder}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch 
                                    checked={category.isActive} 
                                    onCheckedChange={(checked) => {
                                      handleToggleActive(null, category.id, checked);
                                    }} 
                                    onClick={(e) => e.stopPropagation()}
                                    className="scale-75" 
                                  />
                                  <CollapsibleTrigger className="rounded-full h-8 w-8 inline-flex items-center justify-center hover:bg-muted">
                                    <ChevronDown className="h-4 w-4" />
                                    <span className="sr-only">Toggle details</span>
                                  </CollapsibleTrigger>
                                </div>
                              </div>
                            </div>
                            <CollapsibleContent>
                              <div className="px-4 pb-4 pt-1 border-t border-border/40 flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={(e) => handleEdit(e, category)} className="h-9">
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-9">
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                      <AlertDialogDescription>Are you sure you want to delete the category "{category.name}"? This action cannot be undone and may affect existing materials or menu items.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={(e) => handleDelete(e, category.id)} className="bg-red-600 hover:bg-red-700">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}
