import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CategoryFormProps, CategoryFormData, CategoryTypeEntity, TypeMultiSelectProps } from "@/types/categories";
import { Loader2, Save, X, Check, ChevronsUpDown } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { getCategoryTypes } from "@/api/categories.api";
import { getTypeLabel } from "./constants";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function TypeMultiSelect({ selectedTypeIds, availableTypes, onSelectionChange, loading, error }: TypeMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const safeSelectedTypeIds = selectedTypeIds || [];
  const safeAvailableTypes = availableTypes || [];

  const handleSelect = (typeId: number) => {
    if (safeSelectedTypeIds.includes(typeId)) {
      onSelectionChange(safeSelectedTypeIds.filter(id => id !== typeId));
    } else {
      onSelectionChange([...safeSelectedTypeIds, typeId]);
    }
  };

  const removeType = (typeIdToRemove: number) => {
    onSelectionChange(safeSelectedTypeIds.filter(id => id !== typeIdToRemove));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className={cn("w-full justify-between", error ? "border-red-500" : "", safeSelectedTypeIds.length === 0 ? "text-muted-foreground" : "")} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading types...
              </>
            ) : safeSelectedTypeIds.length === 0 ? (
              "Select category types..."
            ) : (
              `${safeSelectedTypeIds.length} type${safeSelectedTypeIds.length > 1 ? "s" : ""} selected`
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" side="top">
          <Command>
            <CommandInput placeholder="Search types..." />
            <CommandEmpty>No types found.</CommandEmpty>
            <CommandGroup>
              {safeAvailableTypes
                .filter(typeEntity => typeEntity && typeEntity.type && typeEntity.type.trim() !== "")
                .map(typeEntity => (
                  <CommandItem key={typeEntity.id} value={typeEntity.type} onSelect={() => handleSelect(typeEntity.id)}>
                    <Check className={cn("mr-2 h-4 w-4", safeSelectedTypeIds.includes(typeEntity.id) ? "opacity-100" : "opacity-0")} />
                    {getTypeLabel(typeEntity.type)}
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Types Display */}
      {safeSelectedTypeIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {safeSelectedTypeIds.map(typeId => {
            const typeEntity = safeAvailableTypes.find(t => t.id === typeId);
            return typeEntity ? (
              <Badge key={typeId} variant="secondary" className="flex items-center gap-1">
                {getTypeLabel(typeEntity.type)}
                <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeType(typeId)} />
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

export function CategoryForm({ category, onSubmit, onCancel, loading = false }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    value: "",
    categoryTypeIds: [],
    description: "",
    isActive: true,
    sortOrder: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableTypes, setAvailableTypes] = useState<CategoryTypeEntity[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);

  // Load available category types from backend
  useEffect(() => {
    const loadCategoryTypes = async () => {
      try {
        setTypesLoading(true);
        const response = await getCategoryTypes();
        // Use the full CategoryTypeEntity objects from the response
        setAvailableTypes(response.totalItems as CategoryTypeEntity[]);
      } catch (error) {
        console.error("Error loading category types:", error);
        // Fallback to hardcoded types if API fails
        const fallbackTypes: CategoryTypeEntity[] = [
          { id: 1, type: "materials", categoryId: 1, createdAt: "", updatedAt: "" },
          { id: 2, type: "menu_items", categoryId: 2, createdAt: "", updatedAt: "" },
          { id: 3, type: "beverages", categoryId: 3, createdAt: "", updatedAt: "" }
        ];
        setAvailableTypes(fallbackTypes);
        toast({
          title: "Warning",
          description: "Failed to load category types from server. Using default types.",
          variant: "destructive",
          duration: 2000
        });
      } finally {
        setTypesLoading(false);
      }
    };

    loadCategoryTypes();
  }, []);

  useEffect(() => {
    if (category) {
      // Use categoryTypeIds directly from the category
      setFormData({
        name: category.name,
        value: category.value,
        categoryTypeIds: category.categoryTypeIds || [],
        description: category.description || "",
        isActive: category.isActive,
        sortOrder: category.sortOrder
      });
    }
  }, [category]);

  const handleNameChange = (name: string) => {
    if (name === undefined || name === null) return;

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.value?.trim()) {
      newErrors.value = "Value is required";
    }
    if (!formData.categoryTypeIds || formData.categoryTypeIds.length === 0) {
      newErrors.categoryTypeIds = "At least one type is required";
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
        variant: "destructive",
        duration: 1000
      });
      return;
    }

    // For updates, don't send value if name changed - let backend auto-generate
    const submitData = { ...formData };
    if (category && category.name !== formData.name) {
      // Name changed during edit, remove value to trigger auto-generation
      delete (submitData as any).value;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" value={formData.name || ""} onChange={e => handleNameChange(e.target.value)} placeholder="e.g., Meat, Dairy, Cold, Alcohol, Burgers.." className={errors.name ? "border-red-500" : ""} />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Types - Multi Select */}
        <div className="space-y-2">
          <Label htmlFor="categoryTypeIds">Types *</Label>
          <TypeMultiSelect selectedTypeIds={formData.categoryTypeIds || []} availableTypes={availableTypes || []} onSelectionChange={typeIds => setFormData(prev => ({ ...prev, categoryTypeIds: typeIds || [] }))} loading={typesLoading} error={errors.categoryTypeIds} />
          {errors.categoryTypeIds && <p className="text-sm text-red-500">{errors.categoryTypeIds}</p>}
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            type="number"
            min="0"
            value={formData.sortOrder || 0}
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
        <Switch id="isActive" checked={formData.isActive ?? true} onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))} />
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
