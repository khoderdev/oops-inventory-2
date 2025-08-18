import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { ImageUpload } from "../ui/image-upload";
import { Selection, StockEntryItemRenderer } from "../ui/Selection";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/utils/conversionLogic";
import { toast } from "../ui/use-toast";
import { beverageStockAPI } from "@/api/stock.api.ts";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Card, CardContent } from "../ui/card";
import { BeverageItemFormProps, StockEntryWithMaterial } from "@/types/inventory";

export const BeverageItemForm: React.FC<BeverageItemFormProps> = ({ menuItem, categories, onSubmit, onCancel, enableVariants = false }) => {
  // Debug categories
  console.log('BeverageItemForm received categories:', categories);
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
  const [variantSizes, setVariantSizes] = useState<string[]>(["small", "medium", "large", "glass", "shot"]);
  const [selectedVariants, setSelectedVariants] = useState<string[]>(["small", "large"]);
  const [customVariant, setCustomVariant] = useState<string>("");
  const [variantPriceAdjustments, setVariantPriceAdjustments] = useState<Record<string, number>>({ small: 0.8, medium: 1.0, large: 1.2, glass: 0.9, shot: 0.5 });
  const [nameFormat, setNameFormat] = useState<"prefix" | "suffix">("suffix");
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
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) newErrors.price = "required";
    if (!menuItem && !selectedBeverageStock) {
      newErrors.beverageId = "Please select a beverage from stock";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, categoryId, price, selectedBeverageStock, menuItem]);

  useEffect(() => {
    validateForm();
  }, [name, categoryId, price, validateForm]);

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

  const variantPreviews = useMemo(() => {
    if (!name || !price || isNaN(parseFloat(price))) return [];
    return selectedVariants.map(size => {
      const priceAdjustment = variantPriceAdjustments[size] || 1.0;
      const variantName = nameFormat === "prefix" ? `${size} ${name}` : `${name} (${size})`;
      const variantPrice = parseFloat(price) * priceAdjustment;
      return {
        name: variantName,
        price: variantPrice,
        size
      };
    });
  }, [name, price, selectedVariants, variantPriceAdjustments, nameFormat]);

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
            name: selectedCategoryObj.name
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
      beverageStockId: selectedBeverageStock?.id || "",
      variants:
        showVariantsSection && selectedVariants.length > 0
          ? {
              selectedVariants,
              priceAdjustments: variantPriceAdjustments,
              nameFormat
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
  }, [name, categoryId, price, isPOSItem, image, selectedBeverageStock, showVariantsSection, selectedVariants, variantPriceAdjustments, nameFormat, categories, validateForm, onSubmit]);

  // Variant handlers
  const handleAddCustomVariant = useCallback(() => {
    if (!customVariant || selectedVariants.includes(customVariant)) return;
    setVariantSizes(prev => [...prev, customVariant]);
    setSelectedVariants(prev => [...prev, customVariant]);
    setVariantPriceAdjustments(prev => ({
      ...prev,
      [customVariant]: 1.0
    }));
    setCustomVariant("");
  }, [customVariant, selectedVariants]);

  const handlePriceAdjustmentChange = useCallback((size: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    setVariantPriceAdjustments(prev => ({
      ...prev,
      [size]: numValue
    }));
  }, []);

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

        <div className="md:col-span-1 lg:col-span-1">
          <label htmlFor="isPOSItem" className="block text-sm font-medium mb-1">
            Show in POS
          </label>
          <div className="flex items-center gap-3">
            <Switch id="isPOSItem" checked={isPOSItem} onCheckedChange={setIsPOSItem} />
          </div>
        </div>
      </div>
      {/* Image Upload Section */}
      <div className="border-t pt-4">
        <ImageUpload value={image} onChange={handleImageChange} maxSizeInMB={5} acceptedFormats={["image/jpeg", "image/png", "image/webp", "image/gif"]} />
      </div>

      {/* Variants Section */}
      {enableVariants && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-gray-800">Beverage Variants</h3>
            <p className="text-sm text-gray-500 mt-1">Create size variations with custom pricing</p>
          </div>

          <div className="space-y-6">
            {/* Size Selection Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-medium mb-3 text-gray-700">Select Variant Sizes</h4>
              <div className="flex flex-wrap gap-4">
                {variantSizes.map(size => (
                  <div key={size} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm">
                    <Checkbox
                      id={`variant-${size}`}
                      checked={selectedVariants.includes(size)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setSelectedVariants(prev => [...prev, size]);
                        } else {
                          setSelectedVariants(prev => prev.filter(s => s !== size));
                        }
                      }}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`variant-${size}`} className="font-medium">
                      {size}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Size Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-medium mb-3 text-gray-700">Add Custom Size</h4>
              <div className="flex items-center gap-3">
                <Input placeholder="Custom size name" value={customVariant} onChange={e => setCustomVariant(e.target.value)} className="max-w-xs bg-white" />
                <Button type="button" size="sm" onClick={handleAddCustomVariant} disabled={!customVariant.trim() || variantSizes.includes(customVariant)} className="px-4">
                  <Plus className="h-4 w-4 mr-2" /> Add Size
                </Button>
              </div>
            </div>

            {/* Price Adjustments Section */}
            {selectedVariants.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-medium mb-3 text-gray-700">Price Adjustments</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedVariants.map(size => (
                    <div key={`price-${size}`} className="flex items-center gap-3 bg-white p-3 rounded-md shadow-sm">
                      <Label htmlFor={`price-${size}`} className="w-20 font-medium">
                        {size}:
                      </Label>
                      <Input id={`price-${size}`} type="number" value={variantPriceAdjustments[size] || "1.0"} onChange={e => handlePriceAdjustmentChange(size, e.target.value)} min="0.1" step="0.1" className="max-w-[100px]" />
                      <span className="text-sm text-gray-600">× base price</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Name Format Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="font-medium mb-3 text-gray-700">Name Format</h4>
              <RadioGroup value={nameFormat} onValueChange={value => setNameFormat(value as "prefix" | "suffix")}>
                <div className="flex items-center space-x-2 mb-2 bg-white p-3 rounded-md shadow-sm">
                  <RadioGroupItem value="prefix" id="name-prefix" className="h-5 w-5" />
                  <Label htmlFor="name-prefix" className="font-medium">
                    Size first (e.g., "Small Coffee")
                  </Label>
                </div>
                <div className="flex items-center space-x-2 bg-white p-3 rounded-md shadow-sm">
                  <RadioGroupItem value="suffix" id="name-suffix" className="h-5 w-5" />
                  <Label htmlFor="name-suffix" className="font-medium">
                    Name first (e.g., "Coffee (Small)")
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Preview Section */}
            {variantPreviews.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-medium mb-3 text-gray-700">Preview</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {variantPreviews.map((variant, index) => (
                    <Card key={`preview-${index}`} className="overflow-hidden border-2 border-green-100 shadow-sm">
                      <CardContent className="p-4 bg-white">
                        <div className="font-medium text-gray-800">{variant.name}</div>
                        <div className="text-sm font-semibold text-green-600 mt-1">{formatCurrency(variant.price)}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
