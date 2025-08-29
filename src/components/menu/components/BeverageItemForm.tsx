import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";
import { ImageUpload } from "../../ui/image-upload";
import { Selection, StockEntryItemRenderer } from "../../ui/Selection";
import { Variants, VariantData } from "../../ui/Variants";
import { CostBreakdown } from "./CostBreakdown";
import { Ingredients } from "./Ingredients";
import { toast } from "../../ui/use-toast";
import { beverageStockAPI } from "@/api/stock.api.ts";
import { BeverageItemFormProps, StockEntryWithMaterial, MenuItemIngredient, MenuItem } from "@/types/inventory";

export const BeverageItemForm: React.FC<BeverageItemFormProps> = ({ menuItem, categories, materials = [], stockEntries = [], onSubmit, onCancel, enableVariants = false }) => {
  const [name, setName] = useState(menuItem?.name || "");
  const [categoryId, setCategoryId] = useState<string>(() => {
    if (!menuItem?.category) return "";
    
    // Handle case where category is already an ID
    if (typeof menuItem.category === 'string') {
      return menuItem.category;
    }
    
    // Handle case where category is an object with id
    if (typeof menuItem.category === 'object' && menuItem.category !== null) {
      if ('id' in menuItem.category) {
        return String(menuItem.category.id);
      }
      if ('_id' in menuItem.category) {
        return String(menuItem.category._id);
      }
    }
    
    return "";
  });
  const [price, setPrice] = useState(menuItem?.price?.toString() || "");
  const [isPOSItem, setIsPOSItem] = useState(menuItem?.isPOSItem ?? true);
  const [image, setImage] = useState<string | undefined>(menuItem?.image);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [beverageStockEntries, setBeverageStockEntries] = useState<StockEntryWithMaterial[]>([]);
  const [beverageSearchTerm, setBeverageSearchTerm] = useState("");
  const [isBeverageLoading, setIsBeverageLoading] = useState(false);
  const [selectedBeverageStock, setSelectedBeverageStock] = useState<StockEntryWithMaterial | null>(null);
  const [ingredients, setIngredients] = useState<MenuItemIngredient[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVariantsSection, setShowVariantsSection] = useState(true);
  const [showIngredientsSection, setShowIngredientsSection] = useState(false);
  const [variantData, setVariantData] = useState<VariantData>({
    selectedVariants: [],
    variantVolumes: { small: 2, medium: 3, large: 5, glass: 3, shot: 1 },
    variantVolumeUnits: { small: "cl", medium: "cl", large: "cl", glass: "cl", shot: "cl" },
    variantPrices: { small: 2.0, medium: 3.0, large: 5.0, glass: 3.0, shot: 1.0 }
  });
  const beverageSelectRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchBeverageStock = async () => {
      try {
        setIsBeverageLoading(true);
        const entries = await beverageStockAPI.getBeverageStockEntries({
          limit: 10000,
          includeMaterial: "true"
        });
        setBeverageStockEntries(entries);
      } catch (error) {
        console.error("Error fetching beverage stock:", error);
        toast({
          title: "Error",
          description: "Failed to load beverage stock entries. Please try again.",
          variant: "destructive",
          duration: 5000
        });
      } finally {
        setIsBeverageLoading(false);
      }
    };

    fetchBeverageStock();
  }, []);

  useEffect(() => {
    if (categories.length === 0 || !menuItem?.category) {
      setCategoryId("");
      return;
    }

    // If category is already an ID
    if (typeof menuItem.category === 'string') {
      setCategoryId(menuItem.category);
      return;
    }

    // If category is an object
    if (typeof menuItem.category === 'object' && menuItem.category !== null) {
      // Try to find by id
      if ('id' in menuItem.category) {
        setCategoryId(String(menuItem.category.id));
        return;
      }
      // Try to find by _id
      if ('_id' in menuItem.category) {
        setCategoryId(String(menuItem.category._id));
        return;
      }
      // Try to find by name
      if ('name' in menuItem.category) {
        const categoryObj = categories.find(cat => 
          cat.name === menuItem.category?.name || 
          cat.id === (menuItem.category as any).id
        );
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

  const filteredBeverageStock = useMemo(() => {
    if (!beverageSearchTerm.trim()) {
      return beverageStockEntries;
    }
    return beverageStockEntries.filter(entry => entry.material?.name?.toLowerCase().includes(beverageSearchTerm.toLowerCase()));
  }, [beverageStockEntries, beverageSearchTerm]);

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "required";
    if (!categoryId) newErrors.category = "required";
    if (variantData.selectedVariants.length === 0) {
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        newErrors.price = "required";
      }
    }

    if (!menuItem && !selectedBeverageStock) {
      newErrors.beverageId = "Please select a beverage from stock";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, categoryId, price, selectedBeverageStock, menuItem, variantData.selectedVariants]);

  useEffect(() => {
    validateForm();
  }, [name, categoryId, price, validateForm]);

  // Initialize form data when editing existing menu item or when beverageStockEntries changes
  useEffect(() => {
    if (menuItem) {
      console.log('Initializing form with menuItem:', menuItem);
      setName(menuItem.name || "");
      setPrice(menuItem.price?.toString() || "");
      setIsPOSItem(menuItem.isPOSItem ?? true);
      setImage(menuItem.image);
      
      // Handle beverage stock selection
      if (menuItem.isBeverage) {
        if (beverageStockEntries.length > 0) {
          const matchingStock = beverageStockEntries.find(entry => 
            String(entry.id) === String(menuItem.isBeverage) ||
            entry.material?.name?.toLowerCase() === menuItem.name?.toLowerCase()
          );
          
          if (matchingStock) {
            console.log('Found matching stock entry:', matchingStock);
            setSelectedBeverageStock(matchingStock);
            setBeverageSearchTerm(matchingStock.material?.name || "");
          } else {
            console.log('No matching stock entry found for beverage:', menuItem.isBeverage);
          }
        } else {
          console.log('No beverage stock entries loaded yet');
        }
      }
      if (menuItem.menuItemIngredients && Array.isArray(menuItem.menuItemIngredients)) {
        const loadedIngredients = menuItem.menuItemIngredients.map(ingredient => ({
          materialId: ingredient.materialId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost
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
  }, [menuItem, beverageStockEntries]);

  const handleBeverageSearchChange = useCallback((value: string) => {
    setBeverageSearchTerm(value);
    setSelectedBeverageStock(null);
  }, []);

  const handleBeverageSelect = useCallback(
    (beverageId: string, beverageName?: string) => {
      setBeverageSearchTerm(beverageName || "");
      if (beverageId) {
        const selectedBeverage = beverageStockEntries.find(entry => String(entry.id) === beverageId);
        if (selectedBeverage) {
          setSelectedBeverageStock(selectedBeverage);
          if (selectedBeverage.material?.name) {
            setName(selectedBeverage.material.name);
          }
          if (selectedBeverage.costPerBaseUnit) {
            setPrice(parseFloat(selectedBeverage.costPerBaseUnit.toString()).toFixed(2));
          }
        }
      }
    },
    [beverageStockEntries]
  );

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
      console.log('Form validation failed');
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
    
    console.log('Submitting form with category:', selectedCategoryObj);

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
      isPOSItem,
      image: image || "",
      imageFile: imageFile,
      isBeverage: true,
      unit: selectedBeverageStock?.purchasedUnit || "piece",
      availableQuantity: selectedBeverageStock?.purchasedQuantity ? parseFloat(selectedBeverageStock.purchasedQuantity.toString()) : undefined,
      costPerUnit: selectedBeverageStock?.costPerPurchasedUnit ? parseFloat(selectedBeverageStock.costPerPurchasedUnit.toString()) : undefined,
      variants:
        showVariantsSection && variantData.selectedVariants.length > 0
          ? variantData.selectedVariants.reduce(
              (acc, variantName) => {
                const volume = variantData.variantVolumes?.[variantName];
                const unit = variantData.variantVolumeUnits?.[variantName];
                const price = variantData.variantPrices?.[variantName];

                if (volume && unit && price !== undefined) {
                  acc[variantName] = { volume, unit, price };
                }

                return acc;
              },
              {} as Record<string, { volume: number; unit: string; price: number }>
            )
          : undefined
    };
    onSubmit(formData);
    setName("");
    setCategoryId("");
    setPrice("");
    setIsPOSItem(true);
    setImage(undefined);
    setImageFile(undefined);
    setSelectedBeverageStock(null);
    setBeverageSearchTerm("");
    setIngredients([]);
    setErrors({});
    setVariantData({
      selectedVariants: [],
      variantVolumes: { small: 2, medium: 3, large: 5, glass: 3, shot: 1 },
      variantVolumeUnits: { small: "cl", medium: "cl", large: "cl", glass: "cl", shot: "ml" },
      variantPrices: { small: 2.0, medium: 3.0, large: 5.0, glass: 3.0, shot: 1.0 }
    });
  }, [name, categoryId, price, isPOSItem, image, imageFile, selectedBeverageStock, showVariantsSection, variantData, categories, ingredients, validateForm, onSubmit]);

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-1 lg:col-span-2">
          <Selection
            label="Stock Beverages"
            id="beverage"
            errors={errors}
            errorField="beverageId"
            searchTerm={beverageSearchTerm}
            onSearchChange={handleBeverageSearchChange}
            isLoading={isBeverageLoading}
            items={filteredBeverageStock}
            onItemSelect={handleBeverageSelect}
            inputRef={beverageSelectRef}
            placeholder="Search beverages..."
            loadingText="Loading beverages..."
            noResultsText="No beverages found matching"
            itemRenderer={StockEntryItemRenderer}
            getDisplayValue={item => item.material?.name || ""}
            getItemId={item => String(item.id)}
          />
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
      {enableVariants && <Variants initialVariantSizes={["small", "medium", "large", "glass", "shot"]} initialSelectedVariants={variantData.selectedVariants} initialVariantPrices={variantData.variantPrices} onChange={handleVariantChange} title="Beverage Variants" description="Select variant sizes or add custom size" />}

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
        <Button onClick={handleSubmit} disabled={!!Object.keys(errors).length || !name.trim() || !categoryId || (variantData.selectedVariants.length === 0 && (!price || parseFloat(price) <= 0))}>
          {menuItem ? "Update" : "Create"} Beverage Item
        </Button>
      </div>
    </div>
  );
};
