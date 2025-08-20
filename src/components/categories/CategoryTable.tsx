import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CategoriesTableProps, CategoryTypeEntity } from "@/types/categories";
import { Edit, Trash2, GripVertical, Package, ArrowUpDown } from "lucide-react";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { getTypeBadge, getTypeIcon } from "./constants";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/use-media-query";

if (typeof window !== "undefined" && !window.matchMedia) {
  console.warn("matchMedia is not supported by your browser. Mobile view will not work properly.");
}

export function CategoryTable({ categories, onEdit, onDelete, onToggleActive, onUpdateSortOrder }: CategoriesTableProps) {
  const [draggedCategories, setDraggedCategories] = useState(categories);
  const isMobile = useMediaQuery("(max-width: 600px)");

  // Helper function to render category types
  const renderCategoryTypes = (category: any) => {
    if (!category.categoryTypes || category.categoryTypes.length === 0) {
      return <Badge variant="outline">No types</Badge>;
    }

    return <div className="flex flex-wrap gap-1">{category.categoryTypes.map((categoryType: CategoryTypeEntity) => getTypeBadge(categoryType.type))}</div>;
  };

  // Helper function to get the primary type icon (first type)
  const getPrimaryTypeIcon = (category: any) => {
    if (!category.categoryTypes || category.categoryTypes.length === 0) {
      return getTypeIcon("unknown");
    }
    return getTypeIcon(category.categoryTypes[0].type);
  };

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

  // Render card view for mobile devices
  const renderMobileCardView = () => {
    return (
      <div className="h-[calc(100vh-220px)] px-1 w-full bg-gray-100">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories-mobile" direction="vertical">
            {provided => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 pb-4 h-full overflow-y-auto">
                {draggedCategories.map((category, index) => (
                  <Draggable key={category.id} draggableId={category.id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} className={`rounded-lg border shadow-sm ${snapshot.isDragging ? "bg-muted/50 shadow-md" : ""}`}>
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getPrimaryTypeIcon(category)}
                                <CardTitle className="text-lg">{category.name}</CardTitle>
                              </div>
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {renderCategoryTypes(category)}
                              <Badge variant="outline" className="ml-2">
                                Order: {category.sortOrder}
                              </Badge>
                            </div>
                          </CardHeader>
                          <Separator />
                          <CardFooter className="pt-4 pb-2 flex justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground mr-1">Active</span>
                              <Switch checked={category.isActive} onCheckedChange={checked => onToggleActive(category.id, checked)} />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => onEdit(category)}>
                                <Edit className="w-4 h-4 mr-1" /> Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                                    <Trash2 className="w-4 h-4 mr-1" /> Delete
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
                          </CardFooter>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  };

  // Render table view for desktop
  const renderDesktopTableView = () => {
    return (
      <div className="h-[calc(100vh-270px)] w-full flex flex-col overflow-y-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories">
            {provided => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col h-full">
                <div className="rounded-md border flex flex-col h-full overflow-hidden">
                  <div className="flex-1 overflow-y-auto">
                    {/* Header row */}
                    <div className="sticky top-0 border-b bg-gray-100 z-10">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="w-[60px] px-4 py-3 text-left font-semibold"></th>
                            <th className="w-[30%] px-4 py-3 text-left font-semibold">Name</th>
                            <th className="w-[20%] px-4 py-3 text-left font-semibold">Type</th>
                            <th className="w-[15%] px-4 py-3 text-left font-semibold">Sort Order</th>
                            <th className="w-[35%] px-4 py-3 text-left font-semibold">Actions</th>
                          </tr>
                        </thead>
                      </table>
                    </div>

                    {/* Table body with draggable rows */}
                    <div className="w-full">
                      <table className="w-full">
                        <tbody>
                          {draggedCategories.map((category, index) => (
                            <Draggable key={category.id} draggableId={category.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <tr ref={provided.innerRef} {...provided.draggableProps} className={`border-b hover:bg-gray-50 ${snapshot.isDragging ? "bg-muted/50 shadow-md" : ""}`}>
                                  <td className="w-[60px] px-4 py-3" {...provided.dragHandleProps}>
                                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                                  </td>
                                  <td className="w-[30%] px-4 py-3 font-medium">
                                    <div className="flex items-center gap-2">
                                      {getPrimaryTypeIcon(category)}
                                      {category.name}
                                    </div>
                                  </td>
                                  <td className="w-[20%] px-4 py-3">{renderCategoryTypes(category)}</td>
                                  <td className="w-[15%] px-4 py-3">
                                    <Badge variant="outline">{category.sortOrder}</Badge>
                                  </td>
                                  <td className="w-[35%] px-4 py-3">
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
                                  </td>
                                </tr>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  };

  return (
    <Card className="bg-background">
      <CardHeader>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Categories ({draggedCategories.length})</h1>
      </CardHeader>
      <CardContent className="flex justify-center w-full">{isMobile ? renderMobileCardView() : renderDesktopTableView()}</CardContent>
    </Card>
  );
}
