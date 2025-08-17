import { Category, CategoryFormData } from "@/types/categories";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryForm } from "./CategoryForm";

interface CategoryModalProps {
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  selectedCategory?: Category;
  handleFormSubmit: (formData: CategoryFormData) => void;
  handleFormCancel: () => void;
  formLoading: boolean;
}

export const CategoryModal = ({ showForm, setShowForm, selectedCategory, handleFormSubmit, handleFormCancel, formLoading }: CategoryModalProps) => {
  return (
    <Dialog open={showForm} onOpenChange={setShowForm}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
        </DialogHeader>
        <CategoryForm category={selectedCategory} onSubmit={handleFormSubmit} onCancel={handleFormCancel} loading={formLoading} />
      </DialogContent>
    </Dialog>
  );
};
