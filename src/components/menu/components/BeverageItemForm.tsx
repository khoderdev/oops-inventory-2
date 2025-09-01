import React, { useState, useEffect, useCallback } from "react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";
// import { ImageUpload } from "../../ui/image-upload";
import { CostBreakdown } from "./CostBreakdown";
import { Ingredients } from "./Ingredients";
import { VariantIngredientInput } from "./VariantIngredientInput";
import { toast } from "../../ui/use-toast";
import { BeverageItemFormProps, StockEntryWithMaterial, MenuItemIngredient, MenuItem } from "@/types/inventory";
import { variantsAPI, Variant, CreateVariantData } from "@/api/variants.api";
import { availableVariantTypes } from "@/types/menuItems";
import { calculateVariantIngredientCost } from "@/utils/calculateVariantIngredientCost";

interface ExtendedVariant extends Variant {
  ingredients?: Array<{
    materialId: string;
    quantity: number;
    unit: string;
    cost: number;
    type: string;
  }>;
}

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
  const [showIngredientsSection, setShowIngredientsSection] = useState(false);
  const [variants, setVariants] = useState<ExtendedVariant[]>([]);
  const [selectedVariantTypes, setSelectedVariantTypes] = useState<string[]>([]);
  const [variantInputs, setVariantInputs] = useState<Record<string, { volume: string; unit: string; price: string }>>({});
  const [variantIngredients, setVariantIngredients] = useState<Record<string, MenuItemIngredient[]>>({});

  // Handle variant type selection
  const handleVariantTypeChange = useCallback(
    (variantName: string, checked: boolean) => {
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
          setVariantIngredients(prev => ({
            ...prev,
            [variantName]: []
          }));
        }
      } else {
        setSelectedVariantTypes(prev => prev.filter(v => v !== variantName));
        setVariantInputs(prev => {
          const newInputs = { ...prev };
          delete newInputs[variantName];
          return newInputs;
        });
        setVariantIngredients(prev => {
          const newIngredients = { ...prev };
          delete newIngredients[variantName];
          return newIngredients;
        });
      }
    },
    [availableVariantTypes]
  );

  const handleVariantInputChange = useCallback((variantName: string, field: "volume" | "unit" | "price", value: string) => {
    setVariantInputs(prev => ({
      ...prev,
      [variantName]: {
        ...prev[variantName],
        [field]: value
      }
    }));
  }, []);

  const formatCost = useCallback((cost: number): number => {
    return parseFloat(parseFloat(String(cost)).toFixed(6));
  }, []);

  // Use the imported calculateVariantIngredientCost utility function
  const calculateIngredientCost = useCallback(
    (ingredient: Omit<MenuItemIngredient, "cost">) => {
      return calculateVariantIngredientCost(ingredient, materials, stockEntries);
    },
    [materials, stockEntries]
  );

  const addIngredientToVariant = useCallback(
    (variantName: string, ingredient: MenuItemIngredient) => {
      const material = materials.find(m => String(m.id) === ingredient.materialId);
      const isVolumeBasedPackage = ingredient.type === "material" && material && ["ml", "cl", "dl", "l", "fl_oz"].includes(material.baseUnit) && ingredient.unit === "box";

      // Format the cost to avoid floating point precision issues
      const formattedIngredient: MenuItemIngredient = {
        ...ingredient,
        unit: isVolumeBasedPackage ? material.baseUnit : ingredient.unit,
        cost: formatCost(ingredient.cost)
      };

      setVariantIngredients(prev => ({
        ...prev,
        [variantName]: [...(prev[variantName] || []), formattedIngredient]
      }));
    },
    [materials, formatCost]
  );

  const removeIngredientFromVariant = useCallback((variantName: string, index: number) => {
    setVariantIngredients(prev => ({
      ...prev,
      [variantName]: prev[variantName]?.filter((_, i) => i !== index) || []
    }));
  }, []);

  useEffect(() => {
    if (menuItem?.id && enableVariants) {
      const loadVariants = async () => {
        try {
          const existingVariants = await variantsAPI.getVariantsByMenuItemId(Number(menuItem.id));
          setVariants(existingVariants as ExtendedVariant[]);
          const selectedTypes = existingVariants.map(v => v.name);
          setSelectedVariantTypes(selectedTypes);
          const inputs: Record<string, { volume: string; unit: string; price: string }> = {};
          const variantIngredientsData: Record<string, MenuItemIngredient[]> = {};
          existingVariants.forEach(variant => {
            inputs[variant.name] = {
              volume: String(variant.volume),
              unit: variant.unit,
              price: String(variant.price)
            };
            variantIngredientsData[variant.name] = [];
            const extendedVariant = variant as ExtendedVariant;
            if (extendedVariant.ingredients && Array.isArray(extendedVariant.ingredients)) {
              variantIngredientsData[variant.name] = extendedVariant.ingredients.map(ingredient => ({
                materialId: ingredient.materialId,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                cost: ingredient.cost || 0,
                type: ingredient.type || "material"
              }));
            }
          });

          setVariantInputs(inputs);
          setVariantIngredients(variantIngredientsData);
        } catch (error) {
          console.error("Failed to load variants:", error);
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
    if (typeof menuItem.category === "string") {
      setCategoryId(menuItem.category);
      return;
    }
    if (typeof menuItem.category === "object" && menuItem.category !== null) {
      if ("id" in menuItem.category) {
        setCategoryId(String(menuItem.category.id));
        return;
      }
      if ("_id" in menuItem.category && (menuItem.category as any)._id) {
        setCategoryId(String((menuItem.category as any)._id));
        return;
      }
      if ("name" in menuItem.category && (menuItem.category as any).name) {
        const categoryObj = categories.find(cat => cat.name === (menuItem.category as any).name || cat.id === (menuItem.category as any).id);
        if (categoryObj) {
          setCategoryId(String(categoryObj.id));
          return;
        }
      }
    }
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
    if (selectedVariantTypes.length === 0) {
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        newErrors.price = "Price is required";
      }
    } else {
      let hasInvalidVariantPrice = false;
      let hasEmptyVariantPrice = false;
      for (const variantName of selectedVariantTypes) {
        const variantPrice = variantInputs[variantName]?.price;
        if (!variantPrice || variantPrice.trim() === "") {
          hasEmptyVariantPrice = true;
          break;
        }
        const priceValue = parseFloat(variantPrice);
        if (isNaN(priceValue) || priceValue <= 0) {
          hasInvalidVariantPrice = true;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, categoryId, price, selectedVariantTypes, variantInputs]);

  useEffect(() => {
    validateForm();
  }, [name, categoryId, price, selectedVariantTypes, variantInputs, validateForm]);

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
      console.error("Failed to create variants:", error);
      toast({
        title: "Warning",
        description: "Menu item created but variants failed to save",
        variant: "destructive"
      });
    }
  };

  const updateVariants = async (menuItemId: number) => {
    try {
      if (variants.length > 0) {
        const variantIds = variants.map(v => v.id);
        await variantsAPI.deleteVariantsBulk(variantIds);
      }
      await createVariants(menuItemId);
    } catch (error) {
      console.error("Failed to update variants:", error);
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

    // Keep regular ingredients separate from variant ingredients
    let regularIngredients = [...ingredients];
    console.log("🔍 [BeverageItemForm] Starting to process variant ingredients");
    console.log("🔍 [BeverageItemForm] Regular ingredients:", ingredients);
    console.log("🔍 [BeverageItemForm] Selected variant types:", selectedVariantTypes); 
    console.log("🔍 [BeverageItemForm] Variant ingredients map:", variantIngredients);

    // Create variant data in the format expected by the backend
    // We need to create a structure that matches the expected format in the API
    const selectedVariants: string[] = selectedVariantTypes;
    const variantVolumes: Record<string, number> = {};
    const variantVolumeUnits: Record<string, string> = {};
    const variantPrices: Record<string, number> = {};

    // Also create a separate structure for the backend that includes ingredients
    const backendVariants: Record<string, any> = {};

    if (selectedVariantTypes.length > 0) {
      selectedVariantTypes.forEach(variantName => {
        // Fill in the data for the TypeScript interface
        variantVolumes[variantName] = parseFloat(variantInputs[variantName]?.volume || "0");
        variantVolumeUnits[variantName] = variantInputs[variantName]?.unit || "cl";
        variantPrices[variantName] = parseFloat(variantInputs[variantName]?.price || "0");

        // Create the backend structure with ingredients
        backendVariants[variantName] = {
          volume: variantVolumes[variantName],
          unit: variantVolumeUnits[variantName],
          price: variantPrices[variantName],
          ingredients: []
        };

        // Add ingredients to this variant if any exist
        if (variantIngredients[variantName] && variantIngredients[variantName].length > 0) {
          console.log(`🔍 [BeverageItemForm] Processing ingredients for variant: ${variantName}`, variantIngredients[variantName]);
          backendVariants[variantName].ingredients = variantIngredients[variantName];
          console.log(`🔍 [BeverageItemForm] Added ingredients to variant ${variantName}:`, backendVariants[variantName].ingredients);
        }
      });

      console.log("🔍 [BeverageItemForm] Backend variants with ingredients:", backendVariants);
    }

    const formData: Omit<MenuItem, "id" | "createdAt" | "updatedAt"> & {
      imageFile?: File;
      id?: string | number;
    } = {
      ...(menuItem?.id && { id: menuItem.id }),
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
      ingredients: regularIngredients.length > 0 ? regularIngredients : [],
      menuItemSauces: [],
      isPOSItem,
      image: image || "",
      imageFile: imageFile,
      isBeverage: true,
      unit: "piece",
      availableQuantity: selectedBeverageStock?.purchasedQuantity ? parseFloat(selectedBeverageStock.purchasedQuantity.toString()) : undefined,
      costPerUnit: selectedBeverageStock?.costPerPurchasedUnit ? parseFloat(selectedBeverageStock.costPerPurchasedUnit.toString()) : undefined,
      variants:
        selectedVariantTypes.length > 0
          ? {
              selectedVariants,
              variantVolumes,
              variantVolumeUnits,
              variantPrices
            }
          : undefined
    };

    try {
      console.log("🔍 [BeverageItemForm] Submitting form data with variants:", {
        variants: formData.variants,
        regularIngredients: formData.ingredients,
        selectedVariantTypes
      });

      // For the API call, we need to use our backend structure with ingredients
      // while keeping the TypeScript-friendly structure in the form data
      const apiFormData = {
        ...formData,
        // Override the variants with our backend structure that includes ingredients
        variants: selectedVariantTypes.length > 0 ? backendVariants : undefined
      };

      console.log("🔍 [BeverageItemForm] API form data with backend variants:", apiFormData);

      const result = await onSubmit(apiFormData as any);
      console.log("🔍 [BeverageItemForm] Form submission result:", result);
      // No need to call separate variant creation methods anymore
      // as variants are now included in the main menu item payload
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
      console.error("Failed to submit beverage item:", error);
    }
  }, [name, categoryId, price, isPOSItem, image, imageFile, selectedBeverageStock, categories, ingredients, validateForm, onSubmit, enableVariants, selectedVariantTypes, variantInputs, menuItem, variants, createVariants, updateVariants]);

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
        {selectedVariantTypes.length === 0 && (
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
      {enableVariants && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Beverage Variants</h4>
          <p className="text-sm text-gray-500 mb-4">Select variant sizes, containers, or add custom options</p>

          {/* Variant Type Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            {availableVariantTypes.map((variantType, index) => {
              const isSelected = selectedVariantTypes.includes(variantType.name);
              const colorClasses = [
                { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
                { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700' },
                { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
                { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
                { border: 'border-pink-500', bg: 'bg-pink-50', text: 'text-pink-700' },
                { border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
                { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
                { border: 'border-teal-500', bg: 'bg-teal-50', text: 'text-teal-700' }
              ];
              const colorClass = colorClasses[index % colorClasses.length];
              
              return (
                <label 
                  key={variantType.name} 
                  className={`
                    relative flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ease-in-out
                    ${isSelected 
                      ? `${colorClass.border} ${colorClass.bg} ${colorClass.text} shadow-md` 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }
                    hover:shadow-sm active:scale-95
                  `}
                >
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={e => handleVariantTypeChange(variantType.name, e.target.checked)} 
                    className="sr-only" 
                  />
                  <span className="text-sm font-medium capitalize">{variantType.name}</span>
                </label>
              );
            })}
          </div>

          {/* Variant Configuration */}
          {selectedVariantTypes.length > 0 && (
            <div className="space-y-4">
              {selectedVariantTypes.map(variantName => {
                const input = variantInputs[variantName];
                if (!input) return null;

                // Find the index of this variant in the availableVariantTypes to get matching color
                const variantIndex = availableVariantTypes.findIndex(vt => vt.name === variantName);
                const colorClasses = [
                  { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
                  { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700' },
                  { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
                  { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
                  { border: 'border-pink-500', bg: 'bg-pink-50', text: 'text-pink-700' },
                  { border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
                  { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
                  { border: 'border-teal-500', bg: 'bg-teal-50', text: 'text-teal-700' }
                ];
                const colorClass = colorClasses[variantIndex % colorClasses.length];

                return (
                  <div key={variantName} className={`border-2 rounded-md p-4 space-y-4 ${colorClass.border} ${colorClass.bg}`}>
                    <h5 className="font-medium mb-2 capitalize">{variantName}</h5>

                    {/* Variant Configuration Section */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <h6 className="text-sm font-semibold text-gray-700">Variant Configuration</h6>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-600">Volume</label>
                          <Input type="number" value={input.volume} onChange={e => handleVariantInputChange(variantName, "volume", e.target.value)} placeholder="Volume" min="0" step="0.1" className="bg-gray-50 border-gray-200" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-600">Unit</label>
                          <select value={input.unit} onChange={e => handleVariantInputChange(variantName, "unit", e.target.value)} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md">
                            <option value="cl">cl</option>
                            <option value="ml">ml</option>
                            <option value="l">l</option>
                            <option value="oz">oz</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-600">Price ($)</label>
                          <Input type="number" value={input.price} onChange={e => handleVariantInputChange(variantName, "price", e.target.value)} placeholder="0.00" min="0" step="0.01" className="bg-gray-50 border-gray-200" />
                        </div>
                      </div>
                    </div>

                    {/* Variant Ingredients Section */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-dashed border-amber-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <h6 className="text-sm font-semibold text-amber-800">Ingredients for {variantName}</h6>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Optional</span>
                      </div>
                      <div className="text-xs text-amber-600 mb-3">
                        Add specific ingredients that are unique to this variant size/type
                      </div>

                      {/* Add New Ingredient */}
                      <VariantIngredientInput 
                        variantName={variantName} 
                        materials={materials} 
                        stockEntries={stockEntries} 
                        sauces={[]} 
                        existingIngredients={variantIngredients[variantName] || []}
                        onAddIngredient={addIngredientToVariant} 
                        onRemoveIngredient={removeIngredientFromVariant}
                        errors={{}} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {errors.variants && <p className="text-sm text-red-500 mt-1">{errors.variants}</p>}
        </div>
      )}

      {/* Ingredients Toggle Button - Only show when no variants are selected */}
      {!selectedVariantTypes.length && materials && stockEntries && materials.length > 0 && stockEntries.length > 0 && (
        <div className="border-t pt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowIngredientsSection(!showIngredientsSection)} className="mb-4">
            {showIngredientsSection ? "Hide" : "Add"} Ingredients
          </Button>
        </div>
      )}

      {/* Ingredients Section - Only show when no variants are selected */}
      {!selectedVariantTypes.length && showIngredientsSection && materials && stockEntries && materials.length > 0 && stockEntries.length > 0 && (
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

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} aria-label="Cancel form">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!name.trim() || !categoryId || (selectedVariantTypes.length === 0 && (!price || parseFloat(price) <= 0))}>
          {menuItem ? "Update" : "Create"} Item
        </Button>
      </div>
    </div>
  );
};
