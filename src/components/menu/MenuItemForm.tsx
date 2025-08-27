import { MenuItemCategory, MenuItemIngredient } from "@/types/inventory";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { ImageUpload } from "../ui/image-upload";
import { toast } from "../ui/use-toast";
import { Ingredients } from "./components/Ingredients";
import { MenuItemFormProps, MenuItemSauce } from "@/types/menuItems";

export function MenuItemForm({ menuItem, stockEntries, categories, sauces, onSubmit, onCancel }: MenuItemFormProps) {
  const [name, setName] = useState(menuItem?.name || "");
  const [category, setCategory] = useState<MenuItemCategory | "">("");
  const [price, setPrice] = useState(menuItem?.price.toString() || "");
  const [isPOSItem, setIsPOSItem] = useState(menuItem?.isPOSItem ?? true);
  const [image, setImage] = useState<string | undefined>(menuItem?.image);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [ingredients, setIngredients] = useState<MenuItemIngredient[]>(menuItem && menuItem.ingredients && Array.isArray(menuItem.ingredients) ? menuItem.ingredients.map(i => ({ type: "material", materialId: i.materialId, quantity: i.quantity, unit: i.unit, cost: i.cost })) : menuItem && menuItem.menuItemIngredients && Array.isArray(menuItem.menuItemIngredients) ? menuItem.menuItemIngredients.map(i => ({ type: "material", materialId: i.materialId, quantity: i.quantity, unit: i.unit, cost: i.cost })) : []);
  const [errors, setErrors] = useState<{
    name?: string;
    category?: string;
    price?: string;
    ingredients?: string;
    ingredientQuantity?: string;
  }>({});

  // Separate ingredients and sauces from the combined ingredients array
  const { materials: separatedIngredients, sauces: separatedSauces } = useMemo(() => {
    const materials: MenuItemIngredient[] = [];
    const sauces: MenuItemSauce[] = [];

    ingredients.forEach(item => {
      // Check if this is a sauce by looking for sauce objects in the sauces array
      const isSauce = sauces && sauces.some(sauce => sauce.sauceId.toString() === item.materialId.toString());

      if (isSauce) {
        sauces.push({
          sauceId: item.materialId.toString(), // This should be numeric
          quantity: item.quantity,
          unit: item.unit,
          cost: item.cost
        });
      } else {
        materials.push(item);
      }
    });

    return { materials, sauces };
  }, [ingredients, sauces]);

  // Initialize category when menuItem or categories change
  useEffect(() => {
    if (!Array.isArray(categories) || categories.length === 0) {
      setCategory("");
      return;
    }
    if (!menuItem?.category) {
      setCategory("");
      return;
    }
    if (typeof menuItem.category === "number") {
      const categoryObj = categories.find(cat => cat.id === menuItem.category);
      setCategory((categoryObj?.value || "") as MenuItemCategory | "");
    } else if (typeof menuItem.category === "object" && menuItem.category !== null && "id" in menuItem.category) {
      const categoryId = (menuItem.category as { id: number }).id;
      const categoryObj = categories.find(cat => cat.id === categoryId);
      setCategory((categoryObj?.value || "") as MenuItemCategory | "");
    } else if (typeof menuItem.category === "string") {
      setCategory(menuItem.category as MenuItemCategory | "");
    } else {
      setCategory("");
    }
  }, [menuItem?.category, categories]);

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "required";
    if (!category) newErrors.category = "required";
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) newErrors.price = "required";
    const noIngredientsCategories = ["alcohol", "cold", "hot", "shisha"];
    const requiresIngredients = !noIngredientsCategories.includes(category.toLowerCase());
    const hasMaterials = separatedIngredients.length > 0;
    const hasSauces = separatedSauces.length > 0;
    if (requiresIngredients && !hasMaterials && !hasSauces) {
      newErrors.ingredients = "At least one ingredient or sauce is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, category, price, separatedIngredients, separatedSauces]);

  useEffect(() => {
    validateForm();
  }, [name, category, price, separatedIngredients, separatedSauces, validateForm]);

  // In your useEffect that initializes the form
  useEffect(() => {
    if (menuItem) {
      setName(menuItem.name || "");
      let categoryValue: MenuItemCategory | "" = "";
      if (typeof menuItem.category === "object" && menuItem.category !== null) {
        categoryValue = (menuItem.category.name || "") as MenuItemCategory | "";
      } else if (typeof menuItem.category === "string") {
        categoryValue = menuItem.category as MenuItemCategory | "";
      } else if (typeof menuItem.category === "number") {
        const matchingCategory = categories.find(cat => cat.id === menuItem.category);
        categoryValue = (matchingCategory?.name || "") as MenuItemCategory | "";
      }
      setCategory(categoryValue);
      setPrice(menuItem.price.toString() || "");
      setIsPOSItem(menuItem.isPOSItem || false);

      // Combine both ingredients and sauces into a single array
      const combinedIngredients: MenuItemIngredient[] = [];

      // Add materials (ingredients)
      if (menuItem.ingredients && Array.isArray(menuItem.ingredients)) {
        menuItem.ingredients.forEach(i => {
          combinedIngredients.push({
            type: "material",
            materialId: i.materialId.toString(),
            quantity: i.quantity,
            unit: i.unit,
            cost: i.cost
          });
        });
      }

      // Add sauces (use numeric IDs directly)
      if (menuItem.menuItemSauces && Array.isArray(menuItem.menuItemSauces)) {
        menuItem.menuItemSauces.forEach(s => {
          combinedIngredients.push({
            type: "sauce",
            materialId: s.sauceId.toString(), // Use numeric ID directly
            quantity: s.quantity,
            unit: s.unit,
            cost: s.cost
          });
        });
      }

      setIngredients(combinedIngredients);
    } else {
      setName("");
      setCategory("");
      setPrice("");
      setIsPOSItem(true);
      setIngredients([]);
    }
    setErrors({});
  }, [menuItem]);

  const handleImageChange = useCallback((imageValue: string | undefined, file?: File) => {
    setImage(imageValue);
    setImageFile(file);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    const selectedCategory = categories.find(cat => cat.value === category);
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Selected category is invalid",
        variant: "destructive"
      });
      return;
    }

    // Map ingredients gracefully: detect type and use materialId or sauceId
    const submitIngredients = ingredients.map(i => {
      if (i.type === "sauce") {
        return {
          sauceId: parseInt(i.materialId),
          quantity: Number(i.quantity),
          unit: i.unit,
          cost: Number(i.cost)
        };
      } else {
        return {
          materialId: parseInt(i.materialId),
          quantity: Number(i.quantity),
          unit: i.unit,
          cost: Number(i.cost)
        };
      }
    });

    const submitData = {
      name: name.trim(),
      category: selectedCategory,
      price: Number(price),
      ingredients: submitIngredients, // single array with materials or sauces
      isPOSItem,
      image,
      imageFile,
      unit: "",
      availableQuantity: 0,
      costPerUnit: 0
    };

    onSubmit(submitData);
  }, [ingredients, name, category, price, isPOSItem, image, categories, onSubmit]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const hasName = !!(name && name.trim());
      const hasCategory = !!category;
      const hasValidPrice = !!(price && !isNaN(parseFloat(price)) && parseFloat(price) > 0);
      const noIngredientsCategories = ["alcohol", "cold", "hot", "shisha"];
      const requiresIngredients = !noIngredientsCategories.includes(category.toLowerCase());
      const hasMaterials = separatedIngredients.length > 0;
      const hasSauces = separatedSauces.length > 0;
      const hasIngredients = hasMaterials || hasSauces;
      const hasNoErrors = Object.keys(errors).length === 0;
      const isFormValid = hasNoErrors && hasName && hasCategory && hasValidPrice && (hasIngredients || !requiresIngredients);

      if (isFormValid) {
        handleSubmit();
      }
    }
  };

  const normalizedCategory = useMemo(() => {
    if (!category || !Array.isArray(categories) || !categories.length) return category;
    const hasExactMatch = categories.some(c => c.value === category);
    if (hasExactMatch) return category;
    const matchByName = categories.find(c => c.name.toLowerCase() === category.toLowerCase() || c.value.toLowerCase() === category.toLowerCase());
    if (matchByName) {
      setTimeout(() => setCategory(matchByName.value as MenuItemCategory | ""), 0);
      return matchByName.value;
    }
    return category;
  }, [category, categories]);

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="md:col-span-2 lg:col-span-3">
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g., Hamburger" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
          {errors.name ? (
            <p id="name-error" className="text-sm text-red-500 mt-1">
              {errors.name}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Name is required</p>
          )}
        </div>

        <div className="md:col-span-1 lg:col-span-2">
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select id="category" value={normalizedCategory} onChange={e => setCategory(e.target.value as MenuItemCategory | "")} onKeyDown={handleKeyDown} className="w-full px-3 py-2 border border-input bg-background rounded-md" aria-invalid={!!errors.category} aria-describedby={errors.category ? "category-error" : undefined}>
            <option value="">Select a category</option>
            {Array.isArray(categories) &&
              categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.name}
                </option>
              ))}
          </select>
          {errors.category ? (
            <p id="category-error" className="text-sm text-red-500 mt-1">
              {errors.category}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Category is required</p>
          )}
        </div>

        <div className="md:col-span-1 lg:col-span-1">
          <label htmlFor="price" className="block text-sm font-medium mb-1">
            Price <span className="text-red-500">*</span>
          </label>
          <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" min="0" step="0.01" aria-invalid={!!errors.price} aria-describedby={errors.price ? "price-error" : undefined} />
          {errors.price ? (
            <p id="price-error" className="text-sm text-red-500 mt-1">
              {errors.price}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Price is required</p>
          )}
        </div>

        <div className="md:col-span-1 lg:col-span-2">
          <label className="block text-sm font-medium mb-1">Show in POS</label>
          <div className="flex items-center space-x-2 mt-2">
            <Switch id="isPOSItem" checked={isPOSItem} onCheckedChange={setIsPOSItem} />
            <p className="text-sm text-gray-500 mt-1">(Make this item available for sale in the POS system)</p>
          </div>
        </div>
      </div>

      <Ingredients
        ingredients={ingredients}
        stockEntries={stockEntries}
        sauces={sauces}
        menuItem={menuItem}
        category={category}
        price={price}
        onIngredientsChange={setIngredients}
        errors={{
          ingredients: errors.ingredients,
          ingredientQuantity: errors.ingredientQuantity
        }}
        onErrorsChange={ingredientErrors => {
          setErrors(prev => ({
            ...prev,
            ...ingredientErrors
          }));
        }}
      />

      {/* Image Upload Section */}
      <div className="border-t pt-4">
        <ImageUpload value={image} onChange={handleImageChange} maxSizeInMB={5} acceptedFormats={["image/jpeg", "image/png", "image/webp", "image/gif"]} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={handleCancel} aria-label="Cancel form">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={(() => {
            const noIngredientsCategories = ["alcohol", "cold", "hot", "shisha"];
            const requiresIngredients = !noIngredientsCategories.includes(category.toLowerCase());
            const hasMaterials = separatedIngredients.length > 0;
            const hasSauces = separatedSauces.length > 0;
            const hasIngredients = hasMaterials || hasSauces;

            return !!Object.keys(errors).length || !name.trim() || !category || !price || parseFloat(price) <= 0 || (requiresIngredients && !hasIngredients);
          })()}
          aria-label={menuItem ? "Update menu item" : "Create menu item"}
        >
          {menuItem ? "Update" : "Create"} Menu Item
        </Button>
      </div>
    </div>
  );
}
