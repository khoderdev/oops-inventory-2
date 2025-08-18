import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { ImageUpload } from "../ui/image-upload";
import { Selection, StockEntryItemRenderer } from "../ui/Selection";
import { Variants, VariantData } from "../ui/Variants";
import { CostBreakdown } from "./CostBreakdown";
import { toast } from "../ui/use-toast";
import { beverageStockAPI } from "@/api/stock.api.ts";
import { BeverageItemFormProps, StockEntryWithMaterial } from "@/types/inventory";

export const BeverageItemForm: React.FC<BeverageItemFormProps> = ({ menuItem, categories, onSubmit, onCancel, enableVariants = false }) => {
  const [name, setName] = useState(menuItem?.name || "");
  const [categoryId, setCategoryId] = useState<string>(typeof menuItem?.category === "object" && menuItem.category !== null && "id" in menuItem.category ? String(menuItem.category.id) : "");
  const [price, setPrice] = useState(menuItem?.price?.toString() || "");
  const [isPOSItem, setIsPOSItem] = useState(menuItem?.isPOSItem ?? true);
  const [image, setImage] = useState<string | undefined>(menuItem?.image);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [beverageStockEntries, setBeverageStockEntries] = useState<StockEntryWithMaterial[]>([]);
  const [beverageSearchTerm, setBeverageSearchTerm] = useState("");
  const [showBeverageDropdown, setShowBeverageDropdown] = useState(false);
  const [isBeverageLoading, setIsBeverageLoading] = useState(false);
  const [selectedBeverageStock, setSelectedBeverageStock] = useState<StockEntryWithMaterial | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVariantsSection, setShowVariantsSection] = useState(true);
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
          variant: "destructive"
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
    if (typeof menuItem.category === "object" && menuItem.category !== null && "id" in menuItem.category) {
      setCategoryId(String(menuItem.category.id));
    } else if (typeof menuItem.category === "string") {
      const categoryObj = categories.find(cat => cat.name === menuItem.category);
      if (categoryObj) {
        setCategoryId(String(categoryObj.id));
      }
    }
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

    // Only require price if no variants are selected
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

  // Initialize form data when editing existing menu item
  useEffect(() => {
    if (menuItem) {
      setName(menuItem.name || "");
      setPrice(menuItem.price?.toString() || "");
      setIsPOSItem(menuItem.isPOSItem ?? true);
      setImage(menuItem.image);
      
      // Initialize variant data if menu item has variants
      if (menuItem.variants) {
        setVariantData({
          selectedVariants: menuItem.variants.selectedVariants || [],
          variantVolumes: menuItem.variants.variantVolumes || {},
          variantVolumeUnits: menuItem.variants.variantVolumeUnits || {},
          variantPrices: menuItem.variants.variantPrices || {}
        });
        setShowVariantsSection(true);
      }
    }
  }, [menuItem]);

  const handleBeverageSearchChange = useCallback((value: string) => {
    setBeverageSearchTerm(value);
    setSelectedBeverageStock(null);
    setShowBeverageDropdown(value.length > 0);
  }, []);

  const handleBeverageSelect = useCallback(
    (beverageId: string, beverageName?: string) => {
      setBeverageSearchTerm(beverageName || "");
      setShowBeverageDropdown(false);
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

  const handleBeverageInputFocus = useCallback(() => {
    setShowBeverageDropdown(beverageSearchTerm.length > 0 || filteredBeverageStock.length > 0);
  }, [beverageSearchTerm, filteredBeverageStock]);

  const handleBeverageInputBlur = useCallback(() => {
    setTimeout(() => setShowBeverageDropdown(false), 150);
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
    if (!validateForm()) return;
    const selectedCategoryObj = categories.find(cat => cat.id === categoryId);
    if (!selectedCategoryObj && categoryId) {
      toast({
        title: "Error",
        description: "Invalid category selected",
        variant: "destructive"
      });
      return;
    }
    const formData = {
      name,
      category: selectedCategoryObj
        ? {
            id: parseInt(selectedCategoryObj.id),
            name: selectedCategoryObj.name,
            value: true
          }
        : null,
      price: parseFloat(price),
      unit: selectedBeverageStock?.purchasedUnit || "piece",
      availableQuantity: selectedBeverageStock?.purchasedQuantity || 0,
      costPerUnit: selectedBeverageStock?.costPerPurchasedUnit || 0,
      ingredients: [],
      menuItemIngredients: false,
      isPOSItem,
      image: image || "",
      imageFile: imageFile, // Include imageFile in the form data
      beverageStockId: selectedBeverageStock?.id || "",
      variants:
        showVariantsSection && variantData.selectedVariants.length > 0
          ? {
              selectedVariants: variantData.selectedVariants,
              variantVolumes: variantData.variantVolumes,
              variantVolumeUnits: variantData.variantVolumeUnits,
              variantPrices: variantData.variantPrices,
              nameFormat: "prefix" as const
            }
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
    setErrors({});
  }, [name, categoryId, price, isPOSItem, image, imageFile, selectedBeverageStock, showVariantsSection, variantData, categories, validateForm, onSubmit]);

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-1 lg:col-span-2">
          <Selection<StockEntryWithMaterial>
            label="Stock Beverages"
            id="beverage"
            // width="lg"
            errors={errors}
            errorField="beverageId"
            searchTerm={beverageSearchTerm}
            onSearchChange={handleBeverageSearchChange}
            onInputFocus={handleBeverageInputFocus}
            onInputBlur={handleBeverageInputBlur}
            onKeyDown={handleKeyDown}
            isLoading={isBeverageLoading}
            showDropdown={showBeverageDropdown}
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

      {/* Image Upload Section */}
      <div className="border-t pt-4">
        <ImageUpload value={image} onChange={handleImageChange} maxSizeInMB={5} acceptedFormats={["image/jpeg", "image/png", "image/webp", "image/gif"]} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} aria-label="Cancel form">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!!Object.keys(errors).length || !name.trim() || !categoryId || !price || parseFloat(price) <= 0}>
          {menuItem ? "Update" : "Create"} Beverage Item
        </Button>
      </div>
    </div>
  );
};
