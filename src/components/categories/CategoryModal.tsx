import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryForm } from "./CategoryForm";
import { CategoryModalProps } from "@/types/categories";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const CategoryModal = ({ 
  showForm, 
  setShowForm, 
  selectedCategory, 
  handleFormSubmit, 
  handleFormCancel, 
  formLoading,
  error 
}: CategoryModalProps) => {
  return (
    <Dialog open={showForm} onOpenChange={setShowForm}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <CategoryForm 
          category={selectedCategory} 
          onSubmit={handleFormSubmit} 
          onCancel={handleFormCancel} 
          loading={formLoading} 
        />
      </DialogContent>
    </Dialog>
  );
};