import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryForm } from "./CategoryForm";
import { CategoryTable } from "./CategoryTable";
import { Category, CategoryFormData, CategoryFilters, CategoryManagementProps } from "@/types/categories";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { getCategories, createCategory, updateCategory, deleteCategory, updateSortOrders } from "@/api/categories.api";

export function CategoryManagement({ onCategoryChange }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState<CategoryFilters>({
    search: "",
    type: undefined,
    isActive: undefined,
    sortBy: "sortOrder",
    sortOrder: "ASC"
  });

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCategories(filters);
      setCategories(response.totalItems);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);



  // Handle form submission
  const handleFormSubmit = async (formData: CategoryFormData) => {
    try {
      setFormLoading(true);

      if (selectedCategory) {
        await updateCategory(selectedCategory.id, formData);
        toast({
          title: "Success",
          description: "Category updated successfully"
        });
      } else {
        await createCategory(formData);
        toast({
          title: "Success",
          description: "Category created successfully"
        });
      }

      setShowForm(false);
      setSelectedCategory(undefined);
      await loadCategories();
      onCategoryChange?.();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save category",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle category deletion
  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      toast({
        title: "Success",
        description: "Category deleted successfully"
      });
      await loadCategories();
      onCategoryChange?.();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  // Handle active status toggle
  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await updateCategory(id, { isActive });
      toast({
        title: "Success",
        description: `Category ${isActive ? "activated" : "deactivated"} successfully`
      });
      await loadCategories();
      onCategoryChange?.();
    } catch (error: any) {
      console.error("Error updating category status:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update category status",
        variant: "destructive"
      });
    }
  };

  // Handle sort order update
  const handleUpdateSortOrder = async (sortOrderUpdates: { id: number; sortOrder: number }[]) => {
    try {
      await updateSortOrders(sortOrderUpdates);
      // Update local state to reflect changes immediately
      setCategories(prev => {
        const updated = [...prev];
        sortOrderUpdates.forEach(update => {
          const index = updated.findIndex(cat => cat.id === update.id);
          if (index !== -1) {
            updated[index] = { ...updated[index], sortOrder: update.sortOrder };
          }
        });
        return updated.sort((a, b) => a.sortOrder - b.sortOrder);
      });
      onCategoryChange?.();
    } catch (error: any) {
      console.error("Error updating sort order:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update category order",
        variant: "destructive"
      });
    }
  };

  // Handle edit
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setShowForm(true);
  };

  // Handle create new
  const handleCreateNew = () => {
    setSelectedCategory(undefined);
    setShowForm(true);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedCategory(undefined);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof CategoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: "",
      type: undefined,
      isActive: undefined,
      sortBy: "sortOrder",
      sortOrder: "ASC"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Category Management</h2>
          <p className="text-muted-foreground">Manage categories for materials and menu items</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
          <CardDescription>Filter and search categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search categories..." value={filters.search || ""} onChange={e => handleFilterChange("search", e.target.value)} className="pl-9" />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filters.type || "all"} onValueChange={value => handleFilterChange("type", value === "all" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="menu_items">Menu Items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.isActive === undefined ? "all" : filters.isActive.toString()} onValueChange={value => handleFilterChange("isActive", value === "all" ? undefined : value === "true")}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
                <Button variant="outline" size="sm" onClick={loadCategories}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <CategoryTable categories={categories} onEdit={handleEdit} onDelete={handleDelete} onToggleActive={handleToggleActive} onUpdateSortOrder={handleUpdateSortOrder} loading={loading} />

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
          </DialogHeader>
          <CategoryForm category={selectedCategory} onSubmit={handleFormSubmit} onCancel={handleFormCancel} loading={formLoading} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
