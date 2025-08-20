import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { CategoryTypeEntity, CategoryTypeFormData, CategoryTypeFormProps, CategoryTypeProps } from "@/types/categories";
import { getCategoryTypes, createCategoryType, updateCategoryType, deleteCategoryType, bulkDeleteCategoryTypes } from "@/api/categories.api";
import { Edit, Trash2, Plus, Search, Package2 } from "lucide-react";

// CategoryType Form Component
const CategoryTypeForm: React.FC<CategoryTypeFormProps> = ({ categoryType, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<CategoryTypeFormData>({
    type: categoryType?.type || "",
    ...(categoryType?.categoryId && { categoryId: categoryType.categoryId })
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (categoryType) {
      setFormData({
        type: categoryType.type,
        ...(categoryType.categoryId && { categoryId: categoryType.categoryId })
      });
    }
  }, [categoryType]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.type.trim()) {
      newErrors.type = "Type is required";
    } else if (formData.type.length < 2) {
      newErrors.type = "Type must be at least 2 characters";
    } else if (formData.type.length > 50) {
      newErrors.type = "Type must be less than 50 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      const cleanFormData: CategoryTypeFormData = {
        type: formData.type,
        ...(formData.categoryId && { categoryId: formData.categoryId })
      };
      await onSave(cleanFormData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleInputChange = (field: keyof CategoryTypeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <Input id="type" value={formData.type} onChange={e => handleInputChange("type", e.target.value)} placeholder="e.g., materials, menu_items, beverages" className={errors.type ? "border-red-500" : ""} disabled={isLoading} />
        {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
        <p className="text-sm text-muted-foreground">Enter a unique type identifier (lowercase, underscores allowed)</p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : categoryType ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// Main CategoryType Component
export const CategoryType: React.FC<CategoryTypeProps> = ({ onCategoryTypeChange }) => {
  const [categoryTypes, setCategoryTypes] = useState<CategoryTypeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategoryType, setEditingCategoryType] = useState<CategoryTypeEntity | undefined>();
  const { toast } = useToast();

  // Load category types
  const loadCategoryTypes = async () => {
    try {
      setLoading(true);
      // Fetch all category types without search filters for client-side filtering
      const response = await getCategoryTypes({});
      setCategoryTypes(response.totalItems);
    } catch (error: any) {
      console.error("Error loading category types:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load category types",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoryTypes();
  }, []); // Remove searchTerm dependency for client-side search

  // Handle category type creation/update
  const handleSave = async (formData: CategoryTypeFormData) => {
    try {
      setFormLoading(true);
      if (editingCategoryType) {
        await updateCategoryType(editingCategoryType.id, formData);
        toast({
          title: "Success",
          description: "Category type updated successfully",
          duration: 2000
        });
      } else {
        await createCategoryType(formData);
        toast({
          title: "Success",
          description: "Category type created successfully",
          duration: 2000
        });
      }
      setIsFormOpen(false);
      setEditingCategoryType(undefined);
      await loadCategoryTypes();
      onCategoryTypeChange?.();
    } catch (error: any) {
      console.error("Error saving category type:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save category type",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle category type deletion
  const handleDelete = async (id: number) => {
    try {
      await deleteCategoryType(id);
      toast({
        title: "Success",
        description: "Category type deleted successfully",
        duration: 2000
      });
      await loadCategoryTypes();
      onCategoryTypeChange?.();
    } catch (error: any) {
      console.error("Error deleting category type:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete category type",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    try {
      await bulkDeleteCategoryTypes({ ids: Array.from(selectedItems) });
      toast({
        title: "Success",
        description: `${selectedItems.size} category type(s) deleted successfully`,
        duration: 2000
      });
      setSelectedItems(new Set());
      await loadCategoryTypes();
      onCategoryTypeChange?.();
    } catch (error: any) {
      console.error("Error bulk deleting category types:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete category types",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  // Handle edit
  const handleEdit = (categoryType: CategoryTypeEntity) => {
    setEditingCategoryType(categoryType);
    setIsFormOpen(true);
  };

  // Handle create new
  const handleCreateNew = () => {
    setEditingCategoryType(undefined);
    setIsFormOpen(true);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingCategoryType(undefined);
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
      setSelectedItems(new Set(filteredCategoryTypes.map(ct => ct.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const filteredCategoryTypes = categoryTypes.filter(ct => ct.type.toLowerCase().includes(searchTerm.toLowerCase()));

  const allSelected = filteredCategoryTypes.length > 0 && selectedItems.size === filteredCategoryTypes.length;
  const someSelected = selectedItems.size > 0 && selectedItems.size < filteredCategoryTypes.length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="text-muted-foreground">Loading category types...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col">
      <Card className="h-full flex flex-col">
        <CardHeader className="sticky top-0 z-10 bg-background border-b p-2 px-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Category Types ({filteredCategoryTypes.length})</h1>

              <div className="flex flex-row gap-2 w-full sm:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input placeholder="Search types..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 w-full sm:w-64" />
                </div>

                {selectedItems.size > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete ({selectedItems.size})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category Types</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete {selectedItems.size} category type(s)? This action cannot be undone and may affect existing categories.</AlertDialogDescription>
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

                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleCreateNew}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCategoryType ? "Edit Category Type" : "Create Category Type"}</DialogTitle>
                      <DialogDescription>{editingCategoryType ? "Update the category type information below." : "Create a new category type to organize your categories."}</DialogDescription>
                    </DialogHeader>
                    <CategoryTypeForm categoryType={editingCategoryType} onSave={handleSave} onCancel={handleFormCancel} isLoading={formLoading} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Select All Checkbox - Below search and buttons */}
            {filteredCategoryTypes.length > 0 && (
              <div className="flex items-center gap-2 px-2 py-2 border-t">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">{selectedItems.size > 0 ? `${selectedItems.size} selected` : "Select all"}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4">
          {filteredCategoryTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{searchTerm ? "No category types found matching your search." : "No category types available. Create your first category type to get started."}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Types List */}
              <div className="grid gap-3">
                {filteredCategoryTypes.map(categoryType => (
                  <div
                    key={categoryType.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={e => {
                      // Don't trigger selection if clicking on action buttons
                      if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest('[role="dialog"]')) {
                        return;
                      }
                      handleItemSelect(categoryType.id, !selectedItems.has(categoryType.id));
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedItems.has(categoryType.id)} onChange={e => handleItemSelect(categoryType.id, e.target.checked)} className="w-4 h-4" />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-bold text-md">
                            {categoryType.type}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground ml-1 mt-1">Created: {new Date(categoryType.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(categoryType)}>
                        <Edit className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category Type</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete the category type "{categoryType.type}"? This action cannot be undone and may affect existing categories using this type.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(categoryType.id)} className="bg-red-600 hover:bg-red-700">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
