import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { CategoryFormProps, CategoryFormData } from "@/types/categories";
import { Loader2, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export function CategoryForm({ category, onSubmit, onCancel, loading = false }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    value: "",
    type: "materials",
    isActive: true,
    sortOrder: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        value: category.value,
        type: category.type,
        isActive: category.isActive,
        sortOrder: category.sortOrder
      });
    }
  }, [category]);

  const handleNameChange = (name: string) => {
    // Auto-generate value from name
    const generatedValue = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    
    setFormData(prev => ({
      ...prev,
      name,
      value: category ? prev.value : generatedValue
    }));
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: "" }));
    }
  };

  const handleValueChange = (value: string) => {
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setFormData(prev => ({ ...prev, value: cleanValue }));
    if (errors.value) {
      setErrors(prev => ({ ...prev, value: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CategoryFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.value.trim()) {
      newErrors.value = "Value is required";
    }

    if (!formData.type) {
      newErrors.type = "Type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive"
      });
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" value={formData.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g., Meat & Poultry" className={errors.name ? "border-red-500" : ""} />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>


      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select value={formData.type} onValueChange={(value: "materials" | "menu_items") => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger className={errors.type ? "border-red-500" : ""}>
              <SelectValue placeholder="Select category type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="materials">Materials</SelectItem>
              <SelectItem value="menu_items">Menu Items</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            type="number"
            min="0"
            value={formData.sortOrder}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                sortOrder: parseInt(e.target.value) || 0
              }))
            }
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">Lower numbers appear first in lists.</p>
        </div>
      </div>



      {/* Active Status */}
      <div className="flex items-center space-x-2">
        <Switch id="isActive" checked={formData.isActive} onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))} />
        <Label htmlFor="isActive">Active</Label>
        <p className="text-sm text-muted-foreground">Inactive categories won't appear in dropdowns</p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {category ? "Update" : "Create"} Category
        </Button>
      </div>
    </form>
  );
}
