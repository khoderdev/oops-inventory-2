import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaterialFormData, MaterialFormProps, StockEntryWithMaterial } from "@/types/inventory";
import { UNIT_DEFINITIONS } from "@/utils/enhancedConversions";
import { getSuggestedUnits } from "@/utils/inventoryCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { materialSchema } from "./materialsSchema";
import { createCategory, getCategoriesByType, updateCategory } from "@/api/categories.api";
import { Category, CategoryFormData } from "@/types/categories";
import { Loader2 } from "lucide-react";
import { CategoryModal } from "../categories/CategoryModal";
import { stockAPI } from "@/api/stock.api.ts.tsx";

export function MaterialForm({ material, onSubmit, onCancel }: MaterialFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError] = useState<string | null>(null);
  const [, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [, setBeverageStockEntries] = useState<StockEntryWithMaterial[]>([]);
  const [, setLoadingBeverages] = useState(false);
  const [, setBeverageError] = useState<string | null>(null);
  const [volumePerBottle, setVolumePerBottle] = useState<number>(); // Default 330ml per bottle
  const [volumeUnit, setVolumeUnit] = useState<string>("ml"); // Default to ml

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: material?.name || "",
      category: (() => {
        if (!material?.category) return "";
        if (typeof material.category === "string") return material.category;
        if (typeof material.category === "object" && material.category?.name) return material.category.value || material.category.name;
        if (typeof material.category === "number") {
          const categoryObj = categories.find(c => c.id === material.category);
          return categoryObj?.value || "";
        }
        return "";
      })(),
      unitType: material?.unitType || "piece",
      inputUnit: material?.inputUnit || material?.baseUnit || "",
      packageQuantity: material?.packageQuantity || 1,
      baseUnit: material?.baseUnit || ""
    }
  });

  // Reset form with material data when material changes
  useEffect(() => {
    if (material) {
      form.reset({
        name: material.name,
        category: (() => {
          if (!material.category) return "";
          if (typeof material.category === "string") return material.category;
          if (typeof material.category === "object" && material.category?.name) return material.category.value || material.category.name;
          if (typeof material.category === "number") {
            const categoryObj = categories.find(c => c.id === material.category);
            return categoryObj?.value || "";
          }
          return "";
        })(),
        unitType: material.unitType || "piece",
        inputUnit: material.inputUnit || material.baseUnit || "",
        packageQuantity: material.packageQuantity || 1,
        baseUnit: material.baseUnit || ""
      });

      // Set volume data if available in material (database uses volumePerUnit)
      if ((material as any).volumePerUnit) {
        setVolumePerBottle((material as any).volumePerUnit);
      }
      if ((material as any).volumeUnit) {
        setVolumeUnit((material as any).volumeUnit);
      }
    }
  }, [material, form]);

  const watchedUnitType = form.watch("unitType");
  const watchedInputUnit = form.watch("inputUnit");
  const watchedPackageQuantity = form.watch("packageQuantity");
  const suggestedUnits = getSuggestedUnits(watchedUnitType);
  const uniqueSuggestedUnits = useMemo(() => Array.from(new Set(suggestedUnits)), [suggestedUnits]);

  useEffect(() => {
    if (categories.length > 0 && !form.getValues("category") && !material) {
      const defaultCategory = categories.find(cat => cat.value === "other") || categories[0];
      form.setValue("category", defaultCategory.value);
    }
  }, [categories, form, material]);

  useEffect(() => {
    if (categories.length > 0 && material && (material as any).categoryId) {
      const categoryId = (material as any).categoryId;
      const matchingCategory = categories.find(cat => cat.id === categoryId);
      if (matchingCategory) {
        form.setValue("category", matchingCategory.value, { shouldDirty: true, shouldTouch: true });
      } else {
        console.warn("⚠️ Material categoryId", categoryId, "not found in materials categories. User needs to select manually.");
        form.setValue("category", "");
      }
    }
  }, [categories, material, form]);

  // Get base unit for the selected unit type
  const getBaseUnitForType = (unitType: string): string => {
    switch (unitType) {
      case "mass":
        return "g";
      case "volume":
        return "ml";
      case "package":
        return "piece";
      default:
        return "piece";
    }
  };

  const isPackageUnit = (unit: string): boolean => {
    return ["box", "pack", "bag"].includes(unit);
  };

  const conversionData = useMemo(() => {
    if (!watchedInputUnit || !watchedUnitType) {
      return null;
    }
    const getPackageBaseUnit = (inputUnit: string): string => {
      if (inputUnit === "box" && watchedUnitType === "package") {
        return "bottle";
      }
      if (inputUnit === "pack" && watchedUnitType === "package") {
        return "piece";
      }
      if (inputUnit === "bottle" && watchedUnitType === "package") {
        return volumeUnit; // Use selected volume unit (ml/cl)
      }
      return "piece";
    };

    const baseUnit = getBaseUnitForType(watchedUnitType);
    if (isPackageUnit(watchedInputUnit) && watchedUnitType === "package") {
      const packageQuantity = watchedPackageQuantity || 1;
      const packageBaseUnit = getPackageBaseUnit(watchedInputUnit);

      // For bottles or boxes containing bottles, calculate total volume
      let totalVolume = packageQuantity;
      const hasBottleVolume = watchedInputUnit === "bottle" || (packageBaseUnit === "bottle" && volumePerBottle > 0);

      if (hasBottleVolume) {
        totalVolume = packageQuantity * volumePerBottle;
      }

      return {
        inputUnit: watchedInputUnit,
        baseUnit: packageBaseUnit,
        conversionFactor: packageQuantity,
        packageQuantity,
        volumePerBottle: hasBottleVolume ? volumePerBottle : undefined,
        volumeUnit: hasBottleVolume ? volumeUnit : undefined,
        totalVolume: hasBottleVolume ? totalVolume : undefined,
        isPackage: true,
        isBottle: watchedInputUnit === "bottle",
        hasBottleVolume
      };
    }
    if (watchedInputUnit === baseUnit) {
      return {
        inputUnit: watchedInputUnit,
        baseUnit,
        conversionFactor: 1,
        isPackage: false
      };
    }
    const inputUnitDef = UNIT_DEFINITIONS[watchedInputUnit];
    const baseUnitDef = UNIT_DEFINITIONS[baseUnit];
    if (!inputUnitDef || !baseUnitDef || inputUnitDef.category !== baseUnitDef.category) {
      return null;
    }
    const conversionFactor = inputUnitDef.baseQuantity / baseUnitDef.baseQuantity;
    return {
      inputUnit: watchedInputUnit,
      baseUnit,
      conversionFactor,
      isPackage: false
    };
  }, [watchedInputUnit, watchedUnitType, watchedPackageQuantity, volumePerBottle, volumeUnit]);

  useEffect(() => {
    if (conversionData) {
      // For bottle units, use the volume unit as the base unit
      if (watchedUnitType === "package" && watchedInputUnit === "bottle") {
        form.setValue("baseUnit", volumeUnit);
      } else {
        form.setValue("baseUnit", conversionData.baseUnit);
      }
    } else if (watchedUnitType === "package" && watchedInputUnit === "bottle") {
      // Ensure base unit is set even when conversionData is not available
      form.setValue("baseUnit", volumeUnit);
    } else if (watchedUnitType && watchedInputUnit) {
      // Fallback: set base unit based on unit type
      const fallbackBaseUnit = getBaseUnitForType(watchedUnitType);
      form.setValue("baseUnit", fallbackBaseUnit);
    }
  }, [conversionData, form, watchedUnitType, watchedInputUnit, volumeUnit]);

  React.useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLInputElement).blur();
    };

    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
      input.addEventListener("wheel", handleWheel, { passive: false });
    });

    return () => {
      numberInputs.forEach(input => {
        input.removeEventListener("wheel", handleWheel);
      });
    };
  }, []);

  const handleSubmit = (data: MaterialFormData) => {
    console.log("🚀 MaterialForm handleSubmit called with data:", data);
    console.log("🚀 Form validation state:", form.formState);
    console.log("🚀 Form errors:", form.formState.errors);
    
    const selectedCategory = categories.find(cat => cat.value === data.category);
    console.log("🚀 Selected category:", selectedCategory);

    // Include volume data if it exists (user has entered volume information)
    const hasVolumeData = volumePerBottle && volumePerBottle > 0 && volumeUnit;
    console.log("🚀 Volume data - volumePerBottle:", volumePerBottle, "volumeUnit:", volumeUnit, "hasVolumeData:", hasVolumeData);

    const finalData = {
      name: data.name,
      category: data.category,
      categoryId: selectedCategory?.id ? String(selectedCategory.id) : undefined,
      unitType: data.unitType,
      inputUnit: data.inputUnit,
      baseUnit: data.baseUnit,
      packageQuantity: data.unitType === "package" ? data.packageQuantity : undefined,
      volumePerBottle: hasVolumeData ? volumePerBottle : undefined,
      volumeUnit: hasVolumeData ? volumeUnit : undefined
    };
    
    console.log("🚀 Final data being submitted:", finalData);
    console.log("🚀 Calling onSubmit with finalData...");
    
    try {
      onSubmit(finalData);
      console.log("🚀 onSubmit called successfully");
    } catch (error) {
      console.error("❌ Error calling onSubmit:", error);
    }
  };

  const loadCategories = useCallback(async (): Promise<Category[]> => {
    try {
      setLoading(true);
      setLoadingCategories(true);
      const response = await getCategoriesByType("materials", true);
      const fetched = response.totalItems;
      setCategories(prev => {
        const currentVal = form.getValues("category");
        let next = fetched;
        if (currentVal && !fetched.some(c => c.value === currentVal)) {
          const localMatch = prev.find(c => c.value === currentVal);
          if (localMatch) {
            next = [...fetched, localMatch];
          }
        }
        return next.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      });
      return fetched;
    } catch (error) {
      console.error("Error loading categories:", error);
      return [];
    } finally {
      setLoading(false);
      setLoadingCategories(false);
    }
  }, [form]);

  useEffect(() => {
    loadCategories();
    loadBeverageStockEntries();
  }, [loadCategories]);

  // Function to load beverage stock entries
  const loadBeverageStockEntries = async () => {
    try {
      setLoadingBeverages(true);
      setBeverageError(null);
      const stockEntries = await stockAPI.getStockEntries({
        includeMaterial: "true",
        limit: 1000
      });
      const beverageCategories = ["beverages", "cold", "hot", "drinks", "alcohol"];
      const filteredEntries = stockEntries.filter(entry => {
        if (!entry.material) return false;
        const category = entry.material.category;
        if (typeof category === "string") {
          return beverageCategories.includes(category);
        } else if (typeof category === "object" && category?.name) {
          return beverageCategories.includes(category.name);
        } else if (typeof category === "number") {
          const categoryObj = categories.find(c => c.id === category);
          return categoryObj ? beverageCategories.includes(categoryObj.value) : false;
        }
        return false;
      });
      const sortedEntries = filteredEntries.sort((a, b) => {
        const nameA = a.material?.name || "";
        const nameB = b.material?.name || "";
        return nameA.localeCompare(nameB);
      });
      setBeverageStockEntries(sortedEntries);
    } catch (error) {
      console.error("Error loading beverage stock entries:", error);
      setBeverageError("Failed to load beverage options");
    } finally {
      setLoadingBeverages(false);
    }
  };

  const handleFormSubmit = async (formData: CategoryFormData) => {
    try {
      setFormLoading(true);
      let savedCategory: Category | undefined;
      if (selectedCategory) {
        const res = await updateCategory(selectedCategory.id, formData);
        const unwrapped = ((res as any)?.data?.data ?? (res as any)?.data ?? (res as any)) as any;
        savedCategory = unwrapped as unknown as Category;
      } else {
        const res = await createCategory({
          ...formData,
          categoryTypeIds: [1],
          isActive: true
        });
        const unwrapped = ((res as any)?.data?.data ?? (res as any)?.data ?? (res as any)) as any;
        savedCategory = unwrapped as unknown as Category;
      }
      let finalSelectedValue: string | undefined;
      if (savedCategory) {
        const normalized: Category = {
          ...savedCategory,
          value: (savedCategory as any)?.value ?? (savedCategory as any)?.name
        } as Category;
        setCategories(prev => {
          const exists = prev.some(c => c.id === normalized.id);
          const next = exists ? prev.map(c => (c.id === normalized.id ? normalized : c)) : [...prev, normalized];
          return next.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        });
        const optimisticValue = (normalized as any).value ?? (normalized as any).name ?? "";
        finalSelectedValue = optimisticValue;
        form.setValue("category", optimisticValue, {
          shouldDirty: true,
          shouldTouch: true
        });
        await form.trigger("category");
        try {
          const fetched = await loadCategories();
          const match = fetched.find(c => c.id === normalized.id || c.value === normalized.value || c.name === normalized.name);
          if (match && match.value) {
            form.setValue("category", match.value, {
              shouldDirty: true,
              shouldTouch: true
            });
            await form.trigger("category");
            finalSelectedValue = match.value;
          }
        } catch (e) {
          console.warn("Category reload failed; keeping optimistic selection.", e);
        }
      }

      setShowForm(false);
      setSelectedCategory(undefined);

      if (finalSelectedValue) {
        setTimeout(() => {
          const current = form.getValues("category");
          if (current !== finalSelectedValue) {
            form.setValue("category", finalSelectedValue!, { shouldDirty: true, shouldTouch: true });
            form.trigger("category");
          }
          const all = form.getValues();
          if (all.category !== finalSelectedValue) {
            form.reset({ ...all, category: finalSelectedValue });
          }
        }, 0);
      }
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{material ? "Edit Material" : "Add New Material"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter material name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <div className="flex items-center gap-2">
                          <Select
                            onValueChange={value => {
                              field.onChange(value);
                            }}
                            value={field.value || ""}
                            disabled={loadingCategories}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
                                {loadingCategories && (
                                  <div className="flex items-center">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    <span>Loading categories...</span>
                                  </div>
                                )}
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categoriesError && (
                                <SelectItem key="categories-error" value="" disabled>
                                  {categoriesError}
                                </SelectItem>
                              )}
                              {!categoriesError && categories.length === 0 && !loadingCategories && (
                                <SelectItem key="no-categories" value="no-categories" disabled>
                                  No categories available
                                </SelectItem>
                              )}
                              {!categoriesError &&
                                categories.length > 0 &&
                                categories.map(category => (
                                  <SelectItem key={`cat-${category.id}`} value={category.value}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={() => setShowForm(true)} type="button">
                            new
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="unitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key="unitType-package" value="package">
                            Package (box, pack, bag)
                          </SelectItem>
                          <SelectItem key="unitType-mass" value="mass">
                            Mass (kg, gram)
                          </SelectItem>
                          <SelectItem key="unitType-volume" value="volume">
                            Volume (liter, ml)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inputUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Input Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select input unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {uniqueSuggestedUnits.map(unit => (
                            <SelectItem key={`unit-${unit}`} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Package Quantity Field - Only show for package units */}
                {watchedUnitType === "package" && watchedInputUnit && isPackageUnit(watchedInputUnit) && (
                  <FormField
                    control={form.control}
                    name="packageQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{watchedInputUnit === "pack" ? "How many Pieces per 1 Pack?" : watchedInputUnit === "box" ? "How many Bottles per 1 Box?" : watchedInputUnit === "bag" ? "How many Items per 1 Bag?" : "How many Items per Package?"}</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" placeholder="1" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Base Unit Field - Hidden for bottle units since Volume Unit serves as base unit */}
                {watchedUnitType === "package" && watchedInputUnit === "bottle" ? null : (
                  <FormField
                    control={form.control}
                    name="baseUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Unit (Auto-calculated)</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-gray-50" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Volume per Bottle Field - Show for bottle units OR box/pack units with bottle base */}
                {watchedUnitType === "package" && (watchedInputUnit === "bottle" || (isPackageUnit(watchedInputUnit) && form.watch("baseUnit") === "bottle")) && (
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Volume Unit</label>
                        <Select value={volumeUnit} onValueChange={setVolumeUnit}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ml">ml (milliliters)</SelectItem>
                            <SelectItem value="cl">cl (centiliters)</SelectItem>
                            <SelectItem value="dl">dl (deciliters)</SelectItem>
                            <SelectItem value="l">l (liters)</SelectItem>
                            <SelectItem value="fl_oz">fl oz (fluid ounces)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">How many {volumeUnit} per 1 Bottle?</label>
                        <Input type="number" step="1" placeholder="330" value={volumePerBottle} onChange={e => setVolumePerBottle(parseInt(e.target.value) || 330)} className="w-full" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Unit Conversion Display (without cost) - Show for all unit combinations */}
              {watchedInputUnit && watchedUnitType && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-blue-900">Unit Conversion Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Input Unit:</span>
                        <span className="font-medium">{watchedInputUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Base Unit:</span>
                        <span className="font-medium">
                          {watchedUnitType === "package" && watchedInputUnit === "bottle" 
                            ? volumeUnit 
                            : form.watch("baseUnit") || getBaseUnitForType(watchedUnitType)}
                        </span>
                      </div>
                      {watchedUnitType === "package" && watchedInputUnit === "bottle" && volumePerBottle && volumeUnit && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Volume per Bottle:</span>
                          <span className="font-medium">
                            {volumePerBottle} {volumeUnit}
                            {volumeUnit !== "ml" && (
                              <span className="text-gray-600">
                                {" / "}
                                {volumeUnit === "cl" ? volumePerBottle * 10 : 
                                 volumeUnit === "dl" ? volumePerBottle * 100 :
                                 volumeUnit === "l" ? volumePerBottle * 1000 :
                                 volumeUnit === "fl_oz" ? Math.round(volumePerBottle * 29.5735) :
                                 volumePerBottle} ml
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {conversionData?.totalVolume && conversionData?.volumeUnit && (
                        <div className="flex justify-between">
                          <span className="text-blue-700">Total Volume:</span>
                          <span className="font-medium">
                            {conversionData.totalVolume} {conversionData.volumeUnit}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-blue-700">
                          {conversionData?.isPackage ? "Package Contents:" : "Conversion Factor:"}
                        </span>
                        <span className="font-medium">
                          {conversionData?.isPackage 
                            ? `${conversionData.packageQuantity} ${conversionData.baseUnit} per ${conversionData.inputUnit}`
                            : conversionData?.conversionFactor 
                              ? (() => {
                                  const baseUnit = conversionData.baseUnit;
                                  const factor = conversionData.conversionFactor;
                                  let display = `1 ${watchedInputUnit} = ${factor.toFixed(2)} ${baseUnit}`;
                                  
                                  // Add conversion to standard units for common cases
                                  if (baseUnit === "g" && watchedInputUnit !== "g") {
                                    if (watchedInputUnit === "kg") display += ` / ${(factor / 1000).toFixed(3)} kg`;
                                    else if (watchedInputUnit === "lb") display += ` / ${(factor / 453.592).toFixed(3)} lb`;
                                    else if (watchedInputUnit === "oz") display += ` / ${(factor / 28.3495).toFixed(2)} oz`;
                                  } else if (baseUnit === "ml" && watchedInputUnit !== "ml") {
                                    if (watchedInputUnit === "l") display += ` / ${(factor / 1000).toFixed(3)} l`;
                                    else if (watchedInputUnit === "cl") display += ` / ${(factor / 10).toFixed(1)} cl`;
                                    else if (watchedInputUnit === "dl") display += ` / ${(factor / 100).toFixed(2)} dl`;
                                    else if (watchedInputUnit === "fl_oz") display += ` / ${(factor / 29.5735).toFixed(2)} fl_oz`;
                                  }
                                  
                                  return display;
                                })()
                              : watchedInputUnit === (form.watch("baseUnit") || getBaseUnitForType(watchedUnitType))
                                ? `1 ${watchedInputUnit} = 1 ${form.watch("baseUnit") || getBaseUnitForType(watchedUnitType)}`
                                : "Conversion not available"
                          }
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-blue-800 font-medium">Examples:</div>
                      <div className="text-xs space-y-1">
                        {conversionData?.isPackage ? (
                          <>
                            <div>
                              • 1 {watchedInputUnit} contains {conversionData.packageQuantity} {conversionData.baseUnit}
                            </div>
                            <div>
                              • 2 {watchedInputUnit} contains {conversionData.packageQuantity * 2} {conversionData.baseUnit}
                            </div>
                            {conversionData.hasBottleVolume && conversionData.volumePerBottle && conversionData.volumeUnit && (
                              <>
                                <div>
                                  • Each bottle contains {conversionData.volumePerBottle} {conversionData.volumeUnit}
                                </div>
                                {watchedInputUnit === "bottle" ? (
                                  <div>
                                    • 6 bottles = {conversionData.volumePerBottle * 6} {conversionData.volumeUnit}
                                  </div>
                                ) : (
                                  <div>
                                    • 1 {watchedInputUnit} = {conversionData.totalVolume} {conversionData.volumeUnit} total volume
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        ) : watchedInputUnit === "bottle" && volumePerBottle && volumeUnit ? (
                          <>
                            <div>
                              • 1 bottle = {volumePerBottle} {volumeUnit}
                              {volumeUnit !== "ml" && (
                                <span className="text-gray-600">
                                  {" / "}
                                  {volumeUnit === "cl" ? volumePerBottle * 10 : 
                                   volumeUnit === "dl" ? volumePerBottle * 100 :
                                   volumeUnit === "l" ? volumePerBottle * 1000 :
                                   volumeUnit === "fl_oz" ? Math.round(volumePerBottle * 29.5735) :
                                   volumePerBottle} ml
                                </span>
                              )}
                            </div>
                            <div>
                              • 6 bottles = {volumePerBottle * 6} {volumeUnit}
                              {volumeUnit !== "ml" && (
                                <span className="text-gray-600">
                                  {" / "}
                                  {volumeUnit === "cl" ? (volumePerBottle * 6) * 10 : 
                                   volumeUnit === "dl" ? (volumePerBottle * 6) * 100 :
                                   volumeUnit === "l" ? (volumePerBottle * 6) * 1000 :
                                   volumeUnit === "fl_oz" ? Math.round((volumePerBottle * 6) * 29.5735) :
                                   volumePerBottle * 6} ml
                                </span>
                              )}
                            </div>
                            <div>
                              • 12 bottles = {volumePerBottle * 12} {volumeUnit}
                              {volumeUnit !== "ml" && (
                                <span className="text-gray-600">
                                  {" / "}
                                  {volumeUnit === "cl" ? (volumePerBottle * 12) * 10 : 
                                   volumeUnit === "dl" ? (volumePerBottle * 12) * 100 :
                                   volumeUnit === "l" ? (volumePerBottle * 12) * 1000 :
                                   volumeUnit === "fl_oz" ? Math.round((volumePerBottle * 12) * 29.5735) :
                                   volumePerBottle * 12} ml
                                </span>
                              )}
                            </div>
                          </>
                        ) : conversionData?.conversionFactor ? (
                          <>
                            <div>
                              • 1 {watchedInputUnit} = {conversionData.conversionFactor.toFixed(2)} {conversionData.baseUnit}
                              {(() => {
                                const baseUnit = conversionData.baseUnit;
                                const factor = conversionData.conversionFactor;
                                
                                if (baseUnit === "g" && watchedInputUnit !== "g") {
                                  if (watchedInputUnit === "kg") return <span className="text-gray-600"> / {(factor / 1000).toFixed(3)} kg</span>;
                                  else if (watchedInputUnit === "lb") return <span className="text-gray-600"> / {(factor / 453.592).toFixed(3)} lb</span>;
                                  else if (watchedInputUnit === "oz") return <span className="text-gray-600"> / {(factor / 28.3495).toFixed(2)} oz</span>;
                                } else if (baseUnit === "ml" && watchedInputUnit !== "ml") {
                                  if (watchedInputUnit === "l") return <span className="text-gray-600"> / {(factor / 1000).toFixed(3)} l</span>;
                                  else if (watchedInputUnit === "cl") return <span className="text-gray-600"> / {(factor / 10).toFixed(1)} cl</span>;
                                  else if (watchedInputUnit === "dl") return <span className="text-gray-600"> / {(factor / 100).toFixed(2)} dl</span>;
                                  else if (watchedInputUnit === "fl_oz") return <span className="text-gray-600"> / {(factor / 29.5735).toFixed(2)} fl_oz</span>;
                                }
                                return null;
                              })()}
                            </div>
                            <div>
                              • {conversionData.conversionFactor >= 1 ? 1 : Math.ceil(1 / conversionData.conversionFactor)} {conversionData.baseUnit} = {conversionData.conversionFactor >= 1 ? (1 / conversionData.conversionFactor).toFixed(2) : 1} {watchedInputUnit}
                              {(() => {
                                const baseUnit = conversionData.baseUnit;
                                const factor = conversionData.conversionFactor;
                                const reverseAmount = conversionData.conversionFactor >= 1 ? (1 / conversionData.conversionFactor) : 1;
                                
                                if (baseUnit === "g" && watchedInputUnit !== "g") {
                                  if (watchedInputUnit === "kg") return <span className="text-gray-600"> / {(reverseAmount / 1000).toFixed(6)} kg</span>;
                                  else if (watchedInputUnit === "lb") return <span className="text-gray-600"> / {(reverseAmount / 453.592).toFixed(6)} lb</span>;
                                  else if (watchedInputUnit === "oz") return <span className="text-gray-600"> / {(reverseAmount / 28.3495).toFixed(4)} oz</span>;
                                } else if (baseUnit === "ml" && watchedInputUnit !== "ml") {
                                  if (watchedInputUnit === "l") return <span className="text-gray-600"> / {(reverseAmount / 1000).toFixed(6)} l</span>;
                                  else if (watchedInputUnit === "cl") return <span className="text-gray-600"> / {(reverseAmount / 10).toFixed(3)} cl</span>;
                                  else if (watchedInputUnit === "dl") return <span className="text-gray-600"> / {(reverseAmount / 100).toFixed(4)} dl</span>;
                                  else if (watchedInputUnit === "fl_oz") return <span className="text-gray-600"> / {(reverseAmount / 29.5735).toFixed(4)} fl_oz</span>;
                                }
                                return null;
                              })()}
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              • 1 {watchedInputUnit} = 1 {form.watch("baseUnit") || getBaseUnitForType(watchedUnitType)}
                            </div>
                            <div>
                              • 5 {watchedInputUnit} = 5 {form.watch("baseUnit") || getBaseUnitForType(watchedUnitType)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  onClick={(e) => {
                    console.log("🔥 Submit button clicked!");
                    console.log("🔥 Form values:", form.getValues());
                    console.log("🔥 Form errors:", form.formState.errors);
                    console.log("🔥 Form isValid:", form.formState.isValid);
                    console.log("🔥 Form isDirty:", form.formState.isDirty);
                    console.log("🔥 Form isSubmitting:", form.formState.isSubmitting);
                  }}
                >
                  {material ? "Update Material" : "Add Material"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <CategoryModal showForm={showForm} setShowForm={setShowForm} selectedCategory={selectedCategory} handleFormSubmit={handleFormSubmit} handleFormCancel={() => setShowForm(false)} formLoading={formLoading} />
    </>
  );
}
