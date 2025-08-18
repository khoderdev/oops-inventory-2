import { BeverageItem, BeverageItemCategory, MenuItem, MenuItemCategory, StockEntryWithMaterial } from "@/types/inventory";
import { Category } from "@/types/categories";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Selection, StockEntryItemRenderer } from "../ui/Selection";
import { Switch } from "../ui/switch";
import { ImageUpload } from "../ui/image-upload";
import { toast } from "../ui/use-toast";
import { beverageStockAPI } from "@/api/stock.api.ts";

interface BeverageItemFormProps {
  menuItem?: BeverageItem;
  categories: Category[];
  onSubmit: (
    data: Omit<BeverageItem, "id" | "createdAt" | "updatedAt"> & {
      beverageStockId?: string | null;
    }
  ) => void;
  onCancel: () => void;
}

export function BeverageItemForm({ menuItem, categories, onSubmit, onCancel }: BeverageItemFormProps) {
  const [name, setName] = useState(menuItem?.name || "");
  const [category, setCategory] = useState<BeverageItemCategory | "">("");
  const [price, setPrice] = useState(menuItem?.price?.toString() || "");
  const [isPOSItem, setIsPOSItem] = useState(menuItem?.isPOSItem ?? true);
  const [image, setImage] = useState<string | undefined>(menuItem?.image);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [beverageStockEntries, setBeverageStockEntries] = useState<StockEntryWithMaterial[]>([]);
  const [selectedBeverageId, setSelectedBeverageId] = useState(menuItem?.beverageStockId || "");
  const [beverageSearchTerm, setBeverageSearchTerm] = useState("");
  const [showBeverageDropdown, setShowBeverageDropdown] = useState(false);
  const [isBeverageLoading, setIsBeverageLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; category?: string; price?: string; beverageId?: string }>({});
  const beverageSelectRef = useRef<HTMLInputElement>(null);

  // Load beverage stock entries when component mounts
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

  // Initialize category from menuItem if editing
  useEffect(() => {
    if (categories.length === 0) {
      setCategory("");
      return;
    }
    if (!menuItem?.category) {
      setCategory("");
      return;
    }
    if (typeof menuItem.category === "number") {
      const categoryObj = categories.find(cat => cat.id === menuItem.category);
      setCategory((categoryObj?.value || "") as BeverageItemCategory | "");
    } else if (typeof menuItem.category === "object" && menuItem.category !== null && "id" in menuItem.category) {
      const categoryId = (menuItem.category as { id: number }).id;
      const categoryObj = categories.find(cat => cat.id === categoryId);
      setCategory((categoryObj?.value || "") as BeverageItemCategory | "");
    } else if (typeof menuItem.category === "string") {
      setCategory(menuItem.category as BeverageItemCategory | "");
    } else {
      setCategory("");
    }
  }, [menuItem?.category, categories]);

  // Filter beverage stock based on search term
  const filteredBeverageStock = useMemo(() => {
    if (!beverageSearchTerm.trim()) {
      return beverageStockEntries;
    }
    return beverageStockEntries.filter(entry => entry.material?.name?.toLowerCase().includes(beverageSearchTerm.toLowerCase()));
  }, [beverageStockEntries, beverageSearchTerm]);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "required";
    if (!category) newErrors.category = "required";
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) newErrors.price = "required";
    if (!menuItem && !selectedBeverageId) {
      newErrors.beverageId = "Please select a beverage from stock";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, category, price, selectedBeverageId, menuItem]);

  // Validate form on input changes
  useEffect(() => {
    validateForm();
  }, [name, category, price, validateForm]);

  // Beverage selection handlers
  const handleBeverageSearchChange = useCallback((value: string) => {
    setBeverageSearchTerm(value);
    setSelectedBeverageId("");
    setShowBeverageDropdown(value.length > 0);
  }, []);

  const handleBeverageSelect = useCallback(
    (beverageId: string, beverageName?: string) => {
      setSelectedBeverageId(beverageId);
      setBeverageSearchTerm(beverageName || "");
      setShowBeverageDropdown(false);
      if (beverageId) {
        const selectedBeverage = beverageStockEntries.find(entry => String(entry.id) === beverageId);
        if (selectedBeverage?.material?.name) {
          setName(selectedBeverage.material.name);
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
      const hasCategory = !!category;
      const hasValidPrice = !!(price && !isNaN(parseFloat(price)) && parseFloat(price) > 0);
      const hasNoErrors = Object.keys(errors).length === 0;
      const isFormValid = hasNoErrors && hasName && hasCategory && hasValidPrice;
      if (isFormValid) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    try {
      let categoryToSubmit: string = "";
      if (typeof category === "object" && category !== null) {
        const categoryObj = category as { id?: number; name?: string };
        if (categoryObj.name) {
          categoryToSubmit = categoryObj.name;
        }
      } else if (typeof category === "string") {
        categoryToSubmit = category;
      }

      const selectedCategory = categories.find(cat => cat.value === category);
      if (!selectedCategory && category) {
        toast({
          title: "Error",
          description: "Please select a valid category",
          variant: "destructive"
        });
        return;
      }
      const selectedBeverage = beverageStockEntries.find(entry => String(entry.id) === selectedBeverageId);

      if (!selectedBeverage && !menuItem) {
        toast({
          title: "Error",
          description: "Please select a valid beverage from stock",
          variant: "destructive"
        });
        return;
      }

      const availableQty = selectedBeverage?.purchasedIndividualQuantity || selectedBeverage?.purchasedQuantity || (selectedBeverage as any)?.availableQuantity || 0;

      const costPerUnit = typeof selectedBeverage?.costPerPurchasedUnit === "number" ? selectedBeverage.costPerPurchasedUnit : (selectedBeverage as any)?.costPerPurchasedUnit || 0;

      const submitData = {
        name: name.trim(),
        category: categoryToSubmit as BeverageItemCategory,
        price: parseFloat(price),
        ingredients: [],
        isPOSItem,
        image,
        imageFile,
        menuItemIngredients: false,
        unit: selectedBeverage?.purchasedUnit || "",
        availableQuantity: availableQty,
        costPerUnit: costPerUnit,
        beverageStockId: selectedBeverageId || menuItem?.beverageStockId || null
      };

      onSubmit(submitData);
      setName("");
      setCategory("");
      setPrice("");
      setIsPOSItem(true);
      setImage(undefined);
      setImageFile(undefined);
      setSelectedBeverageId("");
      setBeverageSearchTerm("");
      setErrors({});
      onCancel();
    } catch (error) {
      console.error("Error submitting form:", error);
      onCancel();
    }
  }, [name, category, price, isPOSItem, image, imageFile, selectedBeverageId, beverageStockEntries, categories, menuItem, onSubmit, onCancel, validateForm]);

  const normalizedCategory = useMemo(() => {
    if (!category || !categories.length) return category;
    const hasExactMatch = categories.some(c => c.value === category);
    if (hasExactMatch) return category;
    const matchByName = categories.find(c => c.name.toLowerCase() === category.toLowerCase() || c.value.toLowerCase() === category.toLowerCase());
    if (matchByName) {
      setTimeout(() => setCategory(matchByName.value as BeverageItemCategory | ""), 0);
      return matchByName.value;
    }
    return category;
  }, [category, categories]);

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
            value={normalizedCategory}
            onChange={e => {
              setCategory(e.target.value as BeverageItemCategory | "");
            }}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? "category-error" : undefined}
          >
            <option value="">Select a category</option>
            {categories.map(cat => {
              return (
                <option key={cat.id || cat.value} value={cat.value}>
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

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} aria-label="Cancel form">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!!Object.keys(errors).length || !name.trim() || !category || !price || parseFloat(price) <= 0}>
          {menuItem ? "Update" : "Create"} Beverage Item
        </Button>
      </div>
    </div>
  );
}
