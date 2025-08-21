import { Button } from "@/components/ui/button";
import { CategoryTable } from "./CategoryTable";
import { CategoryType } from "./CategoryType";
import { Category, CategoryFormData, CategoryManagementProps } from "@/types/categories";
import { Plus } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { getCategories, createCategory, updateCategory, deleteCategory, updateSortOrders } from "@/api/categories.api";
import { CategoryModal } from "./CategoryModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CategoryManagement({ onCategoryChange }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState("categories");

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;
      const currentScrollY = scrollContainer.scrollTop;
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setShowFloatingButton(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowFloatingButton(false);
      }
      setLastScrollY(currentScrollY);
    };
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [lastScrollY]);

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
      // Clear any previous errors
      setFormError(undefined);
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
      
      // Check for duplicate category error
      const errorMessage = error.response?.data?.error || "Failed to save category";
      
      // Set the form error for display in the modal
      setFormError(errorMessage);
      
      // Only show toast for non-duplicate errors or if preferred
      if (!errorMessage.includes("already exists")) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
          duration: 1000
        });
      }
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
    setFormError(undefined);
  };

  return (
    <div className="space-y-6 relative">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="category-types">Category Types</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="space-y-6">
          {/* Categories Table */}
          <CategoryTable 
            categories={categories} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            onToggleActive={handleToggleActive} 
            onUpdateSortOrder={handleUpdateSortOrder} 
            loading={loading} 
          />
        </TabsContent>
        
        <TabsContent value="category-types" className="space-y-6">
          {/* Category Types */}
          <CategoryType onCategoryTypeChange={onCategoryChange} />
        </TabsContent>
      </Tabs>

      {/* Floating Button - Only show for Categories tab */}
      {activeTab === "categories" && (
        <div className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ease-in-out transform ${showFloatingButton ? "translate-y-0 opacity-100 scale-100" : "translate-y-16 opacity-0 scale-95 pointer-events-none"}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full h-14 w-14 p-0 group" size="lg">
                <Plus className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new category</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Category Form Modal */}
      <CategoryModal
        showForm={showForm}
        setShowForm={setShowForm}
        selectedCategory={selectedCategory}
        handleFormSubmit={handleFormSubmit}
        handleFormCancel={handleFormCancel}
        formLoading={formLoading}
        error={formError}
      />
    </div>
  );
}
