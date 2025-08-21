import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoriesTableProps, CategoryTypeEntity, CategoryFormData } from "@/types/categories";
import { Edit, Trash2, GripVertical, Package, ArrowUpDown, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getCategoryTypes } from "@/api/categories.api";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { getTypeBadge, getTypeIcon } from "./constants";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/use-media-query";

if (typeof window !== "undefined" && !window.matchMedia) {
  console.warn("matchMedia is not supported by your browser. Mobile view will not work properly.");
}

export function CategoryTable({ categories, onEdit, onDelete, onToggleActive, onUpdateSortOrder, onBulkDelete, onBulkEdit }: CategoriesTableProps) {
  const [draggedCategories, setDraggedCategories] = useState(categories);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [availableTypes, setAvailableTypes] = useState<CategoryTypeEntity[]>([]);
  const [bulkEditData, setBulkEditData] = useState<Partial<CategoryFormData>>({});
  const isMobile = useMediaQuery("(max-width: 600px)");
  const { toast } = useToast();

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
    // Clear selection when categories change
    setSelectedItems(new Set());
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

  // Handle item selection
  const handleItemSelect = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(draggedCategories.map(cat => cat.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0 || !onBulkDelete) return;
    await onBulkDelete(Array.from(selectedItems));
    setSelectedItems(new Set());
  };

  // Handle bulk edit dialog open
  const handleBulkEditOpen = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      // Load available category types
      const response = await getCategoryTypes({});
      setAvailableTypes(response.totalItems || []);
      
      // Initialize form with common values from selected categories
      const selectedCategories = draggedCategories.filter(cat => selectedItems.has(cat.id));
      const commonData: Partial<CategoryFormData> = {};
      
      // Find common category types
      if (selectedCategories.length > 0) {
        const firstCategory = selectedCategories[0];
        const commonTypeIds = firstCategory.categoryTypeIds?.filter(typeId => 
          selectedCategories.every(cat => cat.categoryTypeIds?.includes(typeId))
        ) || [];
        
        if (commonTypeIds.length > 0) {
          commonData.categoryTypeIds = commonTypeIds;
        }
      }
      
      setBulkEditData(commonData);
      setShowBulkEditDialog(true);
    } catch (error) {
      console.error('Error loading category types:', error);
      toast({
        title: "Error",
        description: "Failed to load category types",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  // Handle bulk edit submit
  const handleBulkEditSubmit = async () => {
    if (selectedItems.size === 0 || !onBulkEdit) return;
    
    try {
      setBulkEditLoading(true);
      await onBulkEdit(Array.from(selectedItems), bulkEditData);
      
      toast({
        title: "Success",
        description: `Updated ${selectedItems.size} categor${selectedItems.size === 1 ? 'y' : 'ies'} successfully`,
        duration: 2000
      });
      
      setShowBulkEditDialog(false);
      setSelectedItems(new Set());
      setBulkEditData({});
    } catch (error: any) {
      console.error('Error bulk editing categories:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update categories",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setBulkEditLoading(false);
    }
  };

  // Handle category type selection
  const handleCategoryTypeChange = (typeId: number, checked: boolean) => {
    const currentTypeIds = bulkEditData.categoryTypeIds || [];
    let newTypeIds;
    
    if (checked) {
      newTypeIds = [...currentTypeIds, typeId];
    } else {
      newTypeIds = currentTypeIds.filter(id => id !== typeId);
    }
    
    setBulkEditData(prev => ({
      ...prev,
      categoryTypeIds: newTypeIds
    }));
  };

  const allSelected = draggedCategories.length > 0 && selectedItems.size === draggedCategories.length;
  const someSelected = selectedItems.size > 0 && selectedItems.size < draggedCategories.length;

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
        {/* Select All Checkbox for Mobile */}
        {draggedCategories.length > 0 && (
          <div className="flex items-center justify-between gap-2 px-2 py-2 mb-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={e => handleSelectAll(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">
                {selectedItems.size > 0 ? `${selectedItems.size} selected` : "Select all"}
              </span>
            </div>
            {selectedItems.size > 0 && (
              <div className="flex gap-2">
                {onBulkEdit && (
                  <Button variant="outline" size="sm" onClick={handleBulkEditOpen}>
                    <Settings className="h-4 w-4 mr-1" />
                    Edit ({selectedItems.size})
                  </Button>
                )}
                {onBulkDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete ({selectedItems.size})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Categories</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedItems.size} categor{selectedItems.size === 1 ? 'y' : 'ies'}? This action cannot be undone and may affect existing materials or menu items.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        )}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories-mobile" direction="vertical">
            {provided => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 pb-4 h-full overflow-y-auto">
                {draggedCategories.map((category, index) => (
                  <Draggable key={category.id} draggableId={category.id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.draggableProps} 
                        className={`rounded-lg border shadow-sm ${snapshot.isDragging ? "bg-muted/50 shadow-md" : ""}`}
                      >
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={selectedItems.has(category.id)} 
                                  onChange={e => handleItemSelect(category.id, e.target.checked)} 
                                  className="w-4 h-4"
                                />
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
                            <th className="w-fit pl-2 py-3 text-left font-semibold">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={el => {
                                  if (el) el.indeterminate = someSelected;
                                }}
                                onChange={e => handleSelectAll(e.target.checked)}
                                className="w-4 h-4"
                              />
                            </th>
                            <th className="w-fit py-3 text-left font-semibold"></th>
                            <th className="w-[15%] px-4 py-3 text-left font-bold">Name</th>
                            <th className="w-[25%] px-4 py-3 text-center font-bold">Type</th>
                            <th className="w-[15%] px-4 py-3 text-left font-bold">Sort Order</th>
                            <th className="w-[30%] px-4 py-3 text-left font-bold">Actions</th>
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
                                <tr 
                                  ref={provided.innerRef} 
                                  {...provided.draggableProps} 
                                  className={`border-b hover:bg-gray-50 ${snapshot.isDragging ? "bg-muted/50 shadow-md" : ""}`}
                                >
                                  <td className="w-fit pl-2 py-3">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedItems.has(category.id)} 
                                      onChange={e => handleItemSelect(category.id, e.target.checked)} 
                                      className="w-4 h-4" 
                                    />
                                  </td>
                                  <td className="w-fit py-3" {...provided.dragHandleProps}>
                                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                                  </td>
                                  <td className="w-[15%] px-4 py-3 font-medium">
                                    <div className="flex items-center gap-2">
                                      {getPrimaryTypeIcon(category)}
                                      {category.name}
                                    </div>
                                  </td>
                                  <td className="w-[25%] px-4 py-3">{renderCategoryTypes(category)}</td>
                                  <td className="w-[15%] px-4 py-3">
                                    <Badge variant="outline">{category.sortOrder}</Badge>
                                  </td>
                                  <td className="w-[30%] px-4 py-3">
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Categories ({draggedCategories.length})
            {selectedItems.size > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({selectedItems.size} selected)
              </span>
            )}
          </h1>
          
          {selectedItems.size > 0 && !isMobile && (
            <div className="flex gap-2">
              {onBulkEdit && (
                <Button variant="outline" size="sm" onClick={handleBulkEditOpen}>
                  <Settings className="h-4 w-4 mr-1" />
                  Edit ({selectedItems.size})
                </Button>
              )}
              {onBulkDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete ({selectedItems.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Categories</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedItems.size} categor{selectedItems.size === 1 ? 'y' : 'ies'}? This action cannot be undone and may affect existing materials or menu items.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex justify-center w-full">{isMobile ? renderMobileCardView() : renderDesktopTableView()}</CardContent>
      
      {/* Bulk Edit Dialog */}
      <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit Categories</DialogTitle>
            <DialogDescription>
              Edit {selectedItems.size} selected categor{selectedItems.size === 1 ? 'y' : 'ies'}. Only the fields you modify will be updated.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category Types</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {availableTypes.map(type => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`type-${type.id}`}
                      checked={bulkEditData.categoryTypeIds?.includes(type.id) || false}
                      onChange={e => handleCategoryTypeChange(type.id, e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor={`type-${type.id}`} className="text-sm font-normal">
                      {type.type}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select category types to apply to all selected categories
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="bulk-active"
                checked={bulkEditData.isActive ?? false}
                onChange={e => setBulkEditData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="bulk-active">Set as Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowBulkEditDialog(false)}
              disabled={bulkEditLoading}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleBulkEditSubmit}
              disabled={bulkEditLoading}
            >
              {bulkEditLoading ? "Updating..." : "Update Categories"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
