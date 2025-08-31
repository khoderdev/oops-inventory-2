import React, { useState, useEffect, useCallback } from "react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";
import { ImageUpload } from "../../ui/image-upload";
import { Variants, VariantData } from "../../ui/Variants";
import { CostBreakdown } from "./CostBreakdown";
import { Ingredients } from "./Ingredients";
import { toast } from "../../ui/use-toast";
import { BeverageItemFormProps, StockEntryWithMaterial, MenuItemIngredient, MenuItem } from "@/types/inventory";

export const BeverageItemForm: React.FC<BeverageItemFormProps> = ({ menuItem, categories, materials = [], stockEntries = [], onSubmit, onCancel, enableVariants = false }) => {
  const [name, setName] = useState(menuItem?.name || "");
  const [categoryId, setCategoryId] = useState<string>(() => {
    if (!menuItem?.category) return "";
    if (typeof menuItem.category === "string") {
      return menuItem.category;
    }
    if (typeof menuItem.category === "object" && menuItem.category !== null) {
      if ("id" in menuItem.category) {
        return String(menuItem.category.id);
      }
    }
    return "";
  });
  const [price, setPrice] = useState(menuItem?.price?.toString() || "");
  const [isPOSItem, setIsPOSItem] = useState(menuItem?.isPOSItem ?? true);
  const [image, setImage] = useState<string | undefined>(menuItem?.image);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [selectedBeverageStock, setSelectedBeverageStock] = useState<StockEntryWithMaterial | null>(null);
  const [ingredients, setIngredients] = useState<MenuItemIngredient[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVariantsSection, setShowVariantsSection] = useState(true);
  const [showIngredientsSection, setShowIngredientsSection] = useState(false);
  const [variantData, setVariantData] = useState<VariantData>({
    selectedVariants: [],
    variantVolumes: { 
      // Size-based variants
      small: 25, medium: 33, large: 50, glass: 30, shot: 5,
      // Container-based variants with realistic volumes
      can: 33, bottle: 33, pint: 47, pitcher: 150, 
      mini: 18, standard: 70, magnum: 150,
      // Additional common sizes
      regular: 33, jumbo: 75, family: 200
    },
    variantVolumeUnits: { 
      // Most beverages use cl for serving sizes
      small: "cl", medium: "cl", large: "cl", glass: "cl", shot: "cl",
      can: "cl", bottle: "cl", pint: "cl", pitcher: "cl", 
      mini: "cl", standard: "cl", magnum: "cl",
      regular: "cl", jumbo: "cl", family: "cl"
    },
    variantPrices: { 
      // Pricing based on volume and container type
      small: 2.5, medium: 3.5, large: 5.0, glass: 3.0, shot: 2.0,
      can: 3.5, bottle: 4.0, pint: 5.5, pitcher: 18.0,
      mini: 8.0, standard: 28.0, magnum: 50.0,
      regular: 3.5, jumbo: 6.5, family: 12.0
    }
  });

  useEffect(() => {
    if (categories.length === 0 || !menuItem?.category) {
      setCategoryId("");
      return;
    }

    // If category is already an ID
    if (typeof menuItem.category === "string") {
      setCategoryId(menuItem.category);
      return;
    }

    // If category is an object
    if (typeof menuItem.category === "object" && menuItem.category !== null) {
      // Try to find by id
      if ("id" in menuItem.category) {
        setCategoryId(String(menuItem.category.id));
        return;
      }
      // Try to find by _id
      if ("_id" in menuItem.category && (menuItem.category as any)._id) {
        setCategoryId(String((menuItem.category as any)._id));
        return;
      }
      // Try to find by name
      if ("name" in menuItem.category && (menuItem.category as any).name) {
        const categoryObj = categories.find(cat => cat.name === (menuItem.category as any).name || cat.id === (menuItem.category as any).id);
        if (categoryObj) {
          setCategoryId(String(categoryObj.id));
          return;
        }
      }
    }

    // If we get here, we couldn't determine the category
    setCategoryId("");
  }, [menuItem?.category, categories]);

  useEffect(() => {
    if (selectedBeverageStock?.costPerBaseUnit && !menuItem) {
      setPrice(parseFloat(selectedBeverageStock.costPerBaseUnit.toString()).toFixed(2));
    }
  }, [selectedBeverageStock, menuItem]);

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!categoryId) newErrors.category = "Category is required";
    
    // Price validation - only required if no variants are selected
    if (variantData.selectedVariants.length === 0) {
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        newErrors.price = "Price is required";
      }
    } else {
      // Validate that all selected variants have valid prices
      const invalidVariants = variantData.selectedVariants.filter(variant => {
        const variantPrice = variantData.variantPrices[variant];
        return !variantPrice || isNaN(variantPrice) || variantPrice <= 0;
      });
      
      if (invalidVariants.length > 0) {
        newErrors.variants = `Invalid prices for variants: ${invalidVariants.join(', ')}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, categoryId, price, variantData.selectedVariants, variantData.variantPrices]);

  useEffect(() => {
    validateForm();
  }, [name, categoryId, price, variantData.selectedVariants, variantData.variantPrices, validateForm]);

  // Initialize form data when editing existing menu item or when beverageStockEntries changes
  useEffect(() => {
    if (menuItem) {
      setName(menuItem.name || "");
      setPrice(menuItem.price?.toString() || "");
      setIsPOSItem(menuItem.isPOSItem ?? true);
      setImage(menuItem.image);
      if (menuItem.isBeverage) {
        if (stockEntries.length > 0) {
          const matchingStock = stockEntries.find(entry => String(entry.id) === String(menuItem.isBeverage));
          if (matchingStock) {
            setSelectedBeverageStock(matchingStock);
          }
        }
      }
      if (menuItem.menuItemIngredients && Array.isArray(menuItem.menuItemIngredients)) {
        const loadedIngredients = menuItem.menuItemIngredients.map(ingredient => ({
          materialId: ingredient.materialId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost,
          type: ingredient.type || "material"
        }));
        setIngredients(loadedIngredients);
        if (loadedIngredients.length > 0) {
          setShowIngredientsSection(true);
        }
      }
      if (menuItem.variants && Array.isArray(menuItem.variants) && menuItem.variants.length > 0) {
        const selectedVariants = menuItem.variants.map(v => v.name);
        const variantVolumes: Record<string, number> = {};
        const variantVolumeUnits: Record<string, string> = {};
        const variantPrices: Record<string, number> = {};
        menuItem.variants.forEach(variant => {
          variantVolumes[variant.name] = parseFloat(variant.volume);
          variantVolumeUnits[variant.name] = variant.unit;
          variantPrices[variant.name] = parseFloat(variant.price);
        });
        setVariantData({
          selectedVariants,
          variantVolumes,
          variantVolumeUnits,
          variantPrices
        });
        setShowVariantsSection(true);
      }
    }
  }, [menuItem]);

  const handleBeverageNameChange = useCallback((value: string) => {
    setName(value);
  }, []);

  const handleImageChange = useCallback((imageValue: string | undefined, file?: File) => {
    setImage(imageValue);
    setImageFile(file);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const hasName = !!(name && name.trim());
      const hasCategory = !!categoryId;
      const hasValidPrice = !!(price && !isNaN(parseFloat(price)) && parseFloat(price) > 0);
      const hasNoErrors = Object.keys(errors).length === 0;
      const isFormValid = hasNoErrors && hasName && hasCategory && hasValidPrice;
      if (isFormValid) {
        handleSubmit();
      }
    }
  };

  const handleVariantChange = useCallback((data: VariantData) => {
    setVariantData(data);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    const selectedCategoryObj = categories.find(cat => cat.id === categoryId);
    if (!selectedCategoryObj && categoryId) {
      toast({
        title: "Error",
        description: "Invalid category selected",
        variant: "destructive"
      });
      return;
    }
    // Prepare form data matching BeverageItemFormProps.onSubmit signature
    const formData: Omit<MenuItem, "id" | "createdAt" | "updatedAt"> & {
      imageFile?: File;
      id?: string | number; // Add id for updates
    } = {
      ...(menuItem?.id && { id: menuItem.id }), // Include ID for updates
      name,
      category: selectedCategoryObj
        ? {
            id: typeof selectedCategoryObj.id === "string" ? parseInt(selectedCategoryObj.id) : selectedCategoryObj.id,
            name: selectedCategoryObj.name,
            value: selectedCategoryObj.value
          }
        : null,
      price: parseFloat(price),
      description: "",
      ingredients: ingredients.length > 0 ? ingredients : [],
      menuItemSauces: [], // Add required menuItemSauces property
      isPOSItem,
      image: image || "",
      imageFile: imageFile,
      isBeverage: true,
      unit: "piece",
      availableQuantity: selectedBeverageStock?.purchasedQuantity ? parseFloat(selectedBeverageStock.purchasedQuantity.toString()) : undefined,
      costPerUnit: selectedBeverageStock?.costPerPurchasedUnit ? parseFloat(selectedBeverageStock.costPerPurchasedUnit.toString()) : undefined,
      variants: showVariantsSection && variantData.selectedVariants.length > 0 ? variantData : undefined
    };
    onSubmit(formData);
    setName("");
    setCategoryId("");
    setPrice("");
    setIsPOSItem(true);
    setImage(undefined);
    setImageFile(undefined);
    setSelectedBeverageStock(null);
    setIngredients([]);
    setErrors({});
    setVariantData({
      selectedVariants: [],
      variantVolumes: { 
        small: 2, medium: 3, large: 5, glass: 3, shot: 1,
        can: 33, bottle: 33, pint: 47, pitcher: 150, 
        mini: 18, standard: 70, magnum: 150
      },
      variantVolumeUnits: { 
        small: "cl", medium: "cl", large: "cl", glass: "cl", shot: "cl",
        can: "cl", bottle: "cl", pint: "cl", pitcher: "cl", 
        mini: "cl", standard: "cl", magnum: "cl"
      },
      variantPrices: { 
        small: 2.0, medium: 3.0, large: 5.0, glass: 3.0, shot: 1.0,
        can: 3.5, bottle: 4.0, pint: 5.0, pitcher: 15.0,
        mini: 6.0, standard: 25.0, magnum: 45.0
      }
    });
  }, [name, categoryId, price, isPOSItem, image, imageFile, selectedBeverageStock, showVariantsSection, variantData, categories, ingredients, validateForm, onSubmit]);

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter beverage name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-500 mt-1">
              {errors.name}
            </p>
          )}
        </div>

        <div className="md:col-span-1 lg:col-span-2">
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={e => {
              setCategoryId(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? "category-error" : undefined}
          >
            <option value="">Select a category</option>
            {categories.map(cat => {
              return (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              );
            })}
          </select>
          {errors.category ? (
            <p id="category-error" className="text-sm text-red-500 mt-1">
              {errors.category}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Category is required</p>
          )}
        </div>

        {/* Only show price input when no variants are selected */}
        {variantData.selectedVariants.length === 0 && (
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
        )}

        <div className="md:col-span-1 lg:col-span-1">
          <label htmlFor="isPOSItem" className="block text-sm font-medium mb-1">
            Show in POS
          </label>
          <div className="flex items-center gap-3">
            <Switch id="isPOSItem" checked={isPOSItem} onCheckedChange={setIsPOSItem} />
          </div>
        </div>
      </div>

      {/* Variants Section */}
      <div>
        {enableVariants && <Variants 
          initialVariantSizes={[
            "small", "medium", "large", "glass", "shot",
            "can", "bottle", "pint", "pitcher",
            "mini", "standard", "magnum"
          ]} 
          initialSelectedVariants={variantData.selectedVariants} 
          initialVariantPrices={variantData.variantPrices} 
          onChange={handleVariantChange} 
          title="Beverage Variants" 
          description="Select variant sizes, containers, or add custom options" 
        />}
        {errors.variants && (
          <p className="text-sm text-red-500 mt-1">
            {errors.variants}
          </p>
        )}
      </div>

      {/* Cost Breakdown Section */}
      {selectedBeverageStock && <CostBreakdown selectedBeverageStock={selectedBeverageStock} price={price} variantData={variantData} />}

      {/* Ingredients Toggle Button */}
      {materials && stockEntries && materials.length > 0 && stockEntries.length > 0 && (
        <div className="border-t pt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowIngredientsSection(!showIngredientsSection)} className="mb-4">
            {showIngredientsSection ? "Hide" : "Add"} Ingredients
          </Button>
        </div>
      )}

      {/* Ingredients Section - Optional */}
      {showIngredientsSection && materials && stockEntries && materials.length > 0 && stockEntries.length > 0 && (
        <Ingredients
          ingredients={ingredients}
          materials={materials.map(material => ({
            ...material,
            availableQuantity: 0,
            stockEntries: [],
            totalQuantityInBaseUnit: 0,
            totalValue: 0,
            averageCostPerBaseUnit: 0
          }))}
          stockEntries={stockEntries.map(entry => ({
            ...entry,
            material: (entry as StockEntryWithMaterial).material || { id: "", name: "", unitType: "piece", packageQuantity: 1 }
          }))}
          menuItem={menuItem}
          category={categories.find(cat => cat.id === categoryId)?.name || ""}
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
      )}

      {/* Image Upload Section */}
      <div className="border-t pt-4">
        <ImageUpload value={image} onChange={handleImageChange} maxSizeInMB={5} acceptedFormats={["image/jpeg", "image/png", "image/webp", "image/gif"]} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} aria-label="Cancel form">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!name.trim() || !categoryId || (variantData.selectedVariants.length === 0 && (!price || parseFloat(price) <= 0))}
        >
          {menuItem ? "Update" : "Create"} Beverage Item
        </Button>
      </div>
    </div>
  );
};
