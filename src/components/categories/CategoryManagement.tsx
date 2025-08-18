import { Button } from "@/components/ui/button";
import { CategoryTable } from "./CategoryTable";
import { Category, CategoryFormData, CategoryManagementProps } from "@/types/categories";
import { Plus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { getCategories, createCategory, updateCategory, deleteCategory, updateSortOrders } from "@/api/categories.api";
import { CategoryModal } from "./CategoryModal";

export function CategoryManagement({ onCategoryChange }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  // Load categorieshandleFormSubmit
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCategories();
      setCategories(response.totalItems);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
        duration: 1000
      });
    } finally {
      setLoading(false);
    }
  }, []);

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
          description: "Category updated successfully",
          duration: 1000
        });
      } else {
        await createCategory(formData);
        toast({
          title: "Success",
          description: "Category created successfully",
          duration: 1000
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
        variant: "destructive",
        duration: 1000
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
        description: "Category deleted successfully",
        duration: 1000
      });
      await loadCategories();
      onCategoryChange?.();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete category",
        variant: "destructive",
        duration: 1000
      });
    }
  };

  // Handle active status toggle
  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await updateCategory(id, { isActive });
      toast({
        title: "Success",
        description: `Category ${isActive ? "activated" : "deactivated"} successfully`,
        duration: 1000
      });
      await loadCategories();
      onCategoryChange?.();
    } catch (error: any) {
      console.error("Error updating category status:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update category status",
        variant: "destructive",
        duration: 1000
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
        variant: "destructive",
        duration: 1000
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

  return (
    <div className="space-y-6 relative">
      {/* Categories Table */}
      <CategoryTable categories={categories} onEdit={handleEdit} onDelete={handleDelete} onToggleActive={handleToggleActive} onUpdateSortOrder={handleUpdateSortOrder} loading={loading} />

      {/* Floating Action Button */}
      <Button onClick={handleCreateNew} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 md:h-16 md:w-16" size="lg">
        <Plus className="h-6 w-6 md:h-7 md:w-7" />
        <span className="sr-only">Add Category</span>
      </Button>

      {/* Form Dialog */}
      <CategoryModal showForm={showForm} setShowForm={setShowForm} selectedCategory={selectedCategory} handleFormSubmit={handleFormSubmit} handleFormCancel={handleFormCancel} formLoading={formLoading} />
    </div>
  );
}
