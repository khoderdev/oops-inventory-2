import { DialogClose } from "@/components/ui/dialog";
import { Material, MenuItem, MenuItemCategory, MenuItemIngredient } from "@/types/inventory";
import { formatNumber } from "@/utils/conversionLogic";
import { getAvailableUnits } from "@/utils/getAvailableUnits";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface MenuItemFormProps {
  menuItem?: MenuItem;
  materials: Material[];
  categories: { value: MenuItemCategory; label: string }[];
  onSubmit: (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: Omit<MenuItemIngredient, "cost">[] }) => void;
  onCancel: () => void;
}

export function MenuItemForm({ menuItem, materials, categories, onSubmit, onCancel }: MenuItemFormProps) {
  const [name, setName] = useState(menuItem?.name || "");
  const [description, setDescription] = useState(menuItem?.description || "");
  const [category, setCategory] = useState<MenuItemCategory | "">(menuItem?.category || "");
  const [price, setPrice] = useState(menuItem?.price.toString() || "");
  const [ingredients, setIngredients] = useState<Omit<MenuItemIngredient, "cost">[]>(menuItem?.ingredients.map(i => ({ materialId: i.materialId, quantity: i.quantity, unit: i.unit })) || []);
  const [selectedMaterialId, setSelectedMaterialId] = useState(0);
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    category?: string;
    price?: string;
    ingredients?: string;
    ingredientQuantity?: string;
  }>({});

  const availableMaterials = useMemo(() => {
    const usedMaterialIds = new Set(ingredients.map(i => i.materialId));
    return materials.filter(m => !usedMaterialIds.has(m.id));
  }, [materials, ingredients]);

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!category) newErrors.category = "Category is required";
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) newErrors.price = "Valid price is required";
    if (ingredients.length === 0) newErrors.ingredients = "At least one ingredient is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, category, price, ingredients]);

  useEffect(() => {
    validateForm();
  }, [name, category, price, ingredients, validateForm]);

  const handleAddIngredient = useCallback(() => {
    if (!selectedMaterialId || !ingredientQuantity || !ingredientUnit) {
      setErrors(prev => ({
        ...prev,
        ingredientQuantity: !ingredientQuantity ? "Quantity is required" : undefined
      }));
      return;
    }

    const quantity = parseFloat(ingredientQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setErrors(prev => ({ ...prev, ingredientQuantity: "Valid quantity is required" }));
      return;
    }

    const newIngredient: Omit<MenuItemIngredient, "cost"> = {
      materialId: selectedMaterialId,
      quantity,
      unit: ingredientUnit
    };

    setIngredients(prev => [...prev, newIngredient]);
    setSelectedMaterialId(0);
    setIngredientQuantity("");
    setIngredientUnit("");
    setErrors(prev => ({ ...prev, ingredientQuantity: undefined, ingredients: undefined }));
  }, [selectedMaterialId, ingredientQuantity, ingredientUnit]);

  const handleRemoveIngredient = useCallback((index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    try {
      onSubmit({
        name: name.trim(),
        description: description.trim(),
        category: category as MenuItemCategory,
        price: parseFloat(price),
        ingredients
      });
      // Reset form state
      setName("");
      setDescription("");
      setCategory("");
      setPrice("");
      setIngredients([]);
      setErrors({});
      onCancel();
    } catch (error) {
      console.error("Error submitting form:", error);
      onCancel();
    }
  }, [name, description, category, price, ingredients, onSubmit, onCancel, validateForm]);

  const handleMaterialSelect = (materialId: string) => {
    console.log("Looking for material:", materialId);
    console.log("Available materials:", materials);
    setSelectedMaterialId(materialId);

    const material = materials.find(m => m.id.toString() === materialId.toString());

    if (!material) {
      console.error(`Material ${materialId} not found`);
      return;
    }

    const availableUnits = getAvailableUnits(material.id, materials);
    console.log("Available units:", availableUnits);

    if (availableUnits.length > 0) {
      setIngredientUnit(availableUnits[0]);
    } else {
      setIngredientUnit("");
    }
  };

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  useEffect(() => {
    console.log("Current unit state:", ingredientUnit);
  }, [ingredientUnit]);

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Hamburger" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-500 mt-1">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select id="category" value={category} onChange={e => setCategory(e.target.value as MenuItemCategory | "")} className="w-full px-3 py-2 border border-input bg-background rounded-md" aria-invalid={!!errors.category} aria-describedby={errors.category ? "category-error" : undefined}>
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p id="category-error" className="text-sm text-red-500 mt-1">
              {errors.category}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium mb-1">
          Price <span className="text-red-500">*</span>
        </label>
        <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" min="0" step="0.01" aria-invalid={!!errors.price} aria-describedby={errors.price ? "price-error" : undefined} />
        {errors.price && (
          <p id="price-error" className="text-sm text-red-500 mt-1">
            {errors.price}
          </p>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-4">
          Ingredients <span className="text-red-500">*</span>
        </h3>
        {errors.ingredients && (
          <p id="ingredients-error" className="text-sm text-red-500 mb-2">
            {errors.ingredients}
          </p>
        )}

        {ingredients.length > 0 ? (
          <div className="mb-4 border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ingredient, index) => {
                  const material = materials.find(m => m.id.toString() === ingredient.materialId.toString());
                  return (
                    <TableRow key={index}>
                      <TableCell>{material?.name || "Unknown"}</TableCell>
                      <TableCell>{formatNumber(ingredient.quantity)}</TableCell>
                      <TableCell>{ingredient.unit}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveIngredient(index)} aria-label={`Remove ${material?.name || "ingredient"}`}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">No ingredients added yet</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="material" className="block text-sm font-medium mb-1">
              Material
            </label>
            <select id="material" value={selectedMaterialId} onChange={e => handleMaterialSelect(e.target.value)} className="w-full px-3 py-2 border border-input bg-background rounded-md" disabled={availableMaterials.length === 0} aria-describedby="material-description">
              <option value="">Select material</option>
              {availableMaterials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.baseUnit})
                </option>
              ))}
            </select>
            <p id="material-description" className="text-sm text-muted-foreground mt-1">
              {availableMaterials.length === 0 ? "All materials are already used" : "Select a material to add"}
            </p>
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-1">
              Quantity
            </label>
            <Input id="quantity" type="number" value={ingredientQuantity} onChange={e => setIngredientQuantity(e.target.value)} placeholder="0" min="0" step="0.01" disabled={!selectedMaterialId} aria-invalid={!!errors.ingredientQuantity} aria-describedby={errors.ingredientQuantity ? "quantity-error" : undefined} />
            {errors.ingredientQuantity && (
              <p id="quantity-error" className="text-sm text-red-500 mt-1">
                {errors.ingredientQuantity}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="unit" className="block text-sm font-medium mb-1">
              Unit
            </label>
            <select key={`unit-select-${selectedMaterialId}`} id="unit" value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} disabled={!selectedMaterialId} className="w-full px-3 py-2 border border-input bg-background rounded-md">
              {selectedMaterialId ? (
                getAvailableUnits(Number(selectedMaterialId), materials).map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))
              ) : (
                <option value="">Select material first</option>
              )}
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={handleAddIngredient} disabled={!selectedMaterialId || !ingredientQuantity || !ingredientUnit} aria-label="Add ingredient">
            <Plus className="h-4 w-4 mr-2" />
            Add Ingredient
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <DialogClose asChild>
          <Button variant="outline" onClick={handleCancel} aria-label="Cancel form">
            Cancel
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button onClick={handleSubmit} disabled={!!Object.keys(errors).length || !name.trim() || !category || !price || parseFloat(price) <= 0 || ingredients.length === 0} aria-label={menuItem ? "Update menu item" : "Create menu item"}>
            {menuItem ? "Update" : "Create"} Menu Item
          </Button>
        </DialogClose>
      </div>
    </div>
  );
}
