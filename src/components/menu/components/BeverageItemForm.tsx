import React, { useState, useEffect, useCallback } from "react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";
import { ImageUpload } from "../../ui/image-upload";
import { CostBreakdown } from "./CostBreakdown";
import { Ingredients } from "./Ingredients";
import { toast } from "../../ui/use-toast";
import { BeverageItemFormProps, StockEntryWithMaterial, MenuItemIngredient, MenuItem } from "@/types/inventory";
import { variantsAPI, Variant, CreateVariantData } from "@/api/variants.api";

export const BeverageItemForm: React.FC<BeverageItemFormProps> = ({ 
  menuItem, 
  categories, 
  materials = [], 
  stockEntries = [], 
  onSubmit, 
  onCancel, 
  enableVariants = false 
}) => {
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
  const [showIngredientsSection, setShowIngredientsSection] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariantTypes, setSelectedVariantTypes] = useState<string[]>([]);
  const [variantInputs, setVariantInputs] = useState<Record<string, { volume: string; unit: string; price: string }>>({});
  
  // Available variant types with default values
  const availableVariantTypes = [
    { name: 'small', defaultVolume: 25, defaultUnit: 'cl', defaultPrice: 2.5 },
    { name: 'medium', defaultVolume: 33, defaultUnit: 'cl', defaultPrice: 3.5 },
    { name: 'large', defaultVolume: 50, defaultUnit: 'cl', defaultPrice: 5.0 },
    { name: 'glass', defaultVolume: 30, defaultUnit: 'cl', defaultPrice: 3.0 },
    { name: 'shot', defaultVolume: 5, defaultUnit: 'cl', defaultPrice: 2.0 },
    { name: 'can', defaultVolume: 33, defaultUnit: 'cl', defaultPrice: 3.5 },
    { name: 'bottle', defaultVolume: 33, defaultUnit: 'cl', defaultPrice: 4.0 },
    { name: 'pint', defaultVolume: 47, defaultUnit: 'cl', defaultPrice: 5.5 },
    { name: 'pitcher', defaultVolume: 150, defaultUnit: 'cl', defaultPrice: 18.0 },
    { name: 'mini', defaultVolume: 18, defaultUnit: 'cl', defaultPrice: 8.0 },
    { name: 'standard', defaultVolume: 70, defaultUnit: 'cl', defaultPrice: 28.0 },
    { name: 'magnum', defaultVolume: 150, defaultUnit: 'cl', defaultPrice: 50.0 }
  ];

  // Handle variant type selection
  const handleVariantTypeChange = useCallback((variantName: string, checked: boolean) => {
    if (checked) {
      setSelectedVariantTypes(prev => [...prev, variantName]);
      const variantType = availableVariantTypes.find(v => v.name === variantName);
      if (variantType) {
        setVariantInputs(prev => ({
          ...prev,
          [variantName]: {
            volume: variantType.defaultVolume.toString(),
            unit: variantType.defaultUnit,
            price: variantType.defaultPrice.toString()
          }
        }));
      }
    } else {
      setSelectedVariantTypes(prev => prev.filter(v => v !== variantName));
      setVariantInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[variantName];
        return newInputs;
      });
    }
  }, [availableVariantTypes]);

  // Handle variant input changes
  const handleVariantInputChange = useCallback((variantName: string, field: 'volume' | 'unit' | 'price', value: string) => {
    setVariantInputs(prev => ({
      ...prev,
      [variantName]: {
        ...prev[variantName],
        [field]: value
      }
    }));
  }, []);

  // Load existing variants when editing
  useEffect(() => {
    if (menuItem?.id && enableVariants) {
      const loadVariants = async () => {
        try {
          const existingVariants = await variantsAPI.getVariantsByMenuItemId(Number(menuItem.id));
          setVariants(existingVariants);
          
          // Set selected variant types and inputs based on existing variants
          const selectedTypes = existingVariants.map(v => v.name);
          setSelectedVariantTypes(selectedTypes);
          
          const inputs: Record<string, { volume: string; unit: string; price: string }> = {};
          existingVariants.forEach(variant => {
            inputs[variant.name] = {
              volume: variant.volume,
              unit: variant.unit,
              price: variant.price
            };
          });
          setVariantInputs(inputs);
        } catch (error) {
          console.error('Failed to load variants:', error);
        }
      };
      loadVariants();
    }
  }, [menuItem?.id, enableVariants]);

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
    if (selectedVariantTypes.length === 0) {
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        newErrors.price = "Price is required";
      }
    } else {
      // Validate that all selected variants have valid prices
      const invalidVariants = selectedVariantTypes.filter(variant => {
        const variantInput = variantInputs[variant];
        return !variantInput?.price || isNaN(parseFloat(variantInput.price)) || parseFloat(variantInput.price) <= 0;
      });
      
      if (invalidVariants.length > 0) {
        newErrors.variants = `Invalid prices for variants: ${invalidVariants.join(', ')}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, categoryId, price, selectedVariantTypes, variantInputs]);

  useEffect(() => {
    validateForm();
  }, [name, categoryId, price, selectedVariantTypes, variantInputs, validateForm]);

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
    }
  }, [menuItem, stockEntries]);

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
      const isFormValid = hasNoErrors && hasName && hasCategory && (hasValidPrice || selectedVariantTypes.length > 0);
      if (isFormValid) {
        handleSubmit();
      }
    }
  };

  // Create variants after menu item is created/updated
  const createVariants = async (menuItemId: number) => {
    if (selectedVariantTypes.length === 0) return;
    
    const variantsToCreate: CreateVariantData[] = selectedVariantTypes.map((variantName, index) => {
      const input = variantInputs[variantName];
      return {
        menuItemId,
        name: variantName,
        volume: parseFloat(input.volume),
        unit: input.unit,
        price: parseFloat(input.price),
        isActive: true,
        sortOrder: index
      };
    });
    
    try {
      await variantsAPI.createVariantsBulk(variantsToCreate);
    } catch (error) {
      console.error('Failed to create variants:', error);
      toast({
        title: "Warning",
        description: "Menu item created but variants failed to save",
        variant: "destructive"
      });
    }
  };
  
  // Update variants for existing menu item
  const updateVariants = async (menuItemId: number) => {
    try {
      // Delete existing variants
      if (variants.length > 0) {
        const variantIds = variants.map(v => v.id);
        await variantsAPI.deleteVariantsBulk(variantIds);
      }
      
      // Create new variants
      await createVariants(menuItemId);
    } catch (error) {
      console.error('Failed to update variants:', error);
      toast({
        title: "Warning",
        description: "Menu item updated but variants failed to save",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = useCallback(async () => {
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
      variants: undefined // Remove variants from form data - handled separately
    };
    
    try {
      // Submit the menu item first
      const result = await onSubmit(formData);
      
      // Handle variants after menu item is created/updated
      if (enableVariants && selectedVariantTypes.length > 0) {
        const menuItemId = menuItem?.id ? Number(menuItem.id) : (result as any)?.id;
        if (menuItemId) {
          if (menuItem?.id) {
            await updateVariants(menuItemId);
          } else {
            await createVariants(menuItemId);
          }
        }
      }
      
      // Reset form
      setName("");
      setCategoryId("");
      setPrice("");
      setIsPOSItem(true);
      setImage(undefined);
      setImageFile(undefined);
      setSelectedBeverageStock(null);
      setIngredients([]);
      setErrors({});
      setSelectedVariantTypes([]);
      setVariantInputs({});
      setVariants([]);
    } catch (error) {
      console.error('Failed to submit beverage item:', error);
    }
  }, [name, categoryId, price, isPOSItem, image, imageFile, selectedBeverageStock, categories, ingredients, validateForm, onSubmit, enableVariants, selectedVariantTypes, variantInputs, menuItem, variants, createVariants, updateVariants]);

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input 
            id="name" 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            onKeyDown={handleKeyDown} 
            placeholder="Enter beverage name" 
            aria-invalid={!!errors.name} 
            aria-describedby={errors.name ? "name-error" : undefined} 
          />
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
        {selectedVariantTypes.length === 0 && (
          <div className="md:col-span-1 lg:col-span-1">
            <label htmlFor="price" className="block text-sm font-medium mb-1">
              Price <span className="text-red-500">*</span>
            </label>
            <Input 
              id="price" 
              type="number" 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              onKeyDown={handleKeyDown} 
              placeholder="0.00" 
              min="0" 
              step="0.01" 
              aria-invalid={!!errors.price} 
              aria-describedby={errors.price ? "price-error" : undefined} 
            />
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
      {enableVariants && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Beverage Variants</h4>
          <p className="text-sm text-gray-500 mb-4">Select variant sizes, containers, or add custom options</p>
          
          {/* Variant Type Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            {availableVariantTypes.map(variantType => (
              <label key={variantType.name} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedVariantTypes.includes(variantType.name)}
                  onChange={e => handleVariantTypeChange(variantType.name, e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm capitalize">{variantType.name}</span>
              </label>
            ))}
          </div>

          {/* Variant Configuration */}
          {selectedVariantTypes.length > 0 && (
            <div className="space-y-4">
              {selectedVariantTypes.map(variantName => {
                const input = variantInputs[variantName];
                if (!input) return null;
                
                return (
                  <div key={variantName} className="border rounded-md p-3">
                    <h5 className="font-medium mb-2 capitalize">{variantName}</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Volume</label>
                        <Input
                          type="number"
                          value={input.volume}
                          onChange={e => handleVariantInputChange(variantName, 'volume', e.target.value)}
                          placeholder="Volume"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Unit</label>
                        <select
                          value={input.unit}
                          onChange={e => handleVariantInputChange(variantName, 'unit', e.target.value)}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md"
                        >
                          <option value="cl">cl</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>
                          <option value="oz">oz</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Price ($)</label>
                        <Input
                          type="number"
                          value={input.price}
                          onChange={e => handleVariantInputChange(variantName, 'price', e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {errors.variants && (
            <p className="text-sm text-red-500 mt-1">
              {errors.variants}
            </p>
          )}
        </div>
      )}

      {/* Cost Breakdown Section */}
      {selectedBeverageStock && (
        <CostBreakdown 
          selectedBeverageStock={selectedBeverageStock} 
          price={price} 
          variantData={{
            selectedVariants: selectedVariantTypes,
            variantPrices: Object.fromEntries(
              selectedVariantTypes.map(name => [name, parseFloat(variantInputs[name]?.price || '0')])
            )
          }} 
        />
      )}

      {/* Ingredients Toggle Button */}
      {materials && stockEntries && materials.length > 0 && stockEntries.length > 0 && (
        <div className="border-t pt-4">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => setShowIngredientsSection(!showIngredientsSection)} 
            className="mb-4"
          >
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
        <ImageUpload 
          value={image} 
          onChange={handleImageChange} 
          maxSizeInMB={5} 
          acceptedFormats={["image/jpeg", "image/png", "image/webp", "image/gif"]} 
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} aria-label="Cancel form">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!name.trim() || !categoryId || (selectedVariantTypes.length === 0 && (!price || parseFloat(price) <= 0))}
        >
          {menuItem ? "Update" : "Create"} Beverage Item
        </Button>
      </div>
    </div>
  );
};
