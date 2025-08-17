import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaterialFormData, MaterialFormProps } from "@/types/inventory";
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

export function MaterialForm({ material, onSubmit, onCancel }: MaterialFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: material?.name || "",
      category: material?.category || "",
      unitType: material?.unitType || "piece",
      inputUnit: material?.inputUnit || material?.baseUnit || "",
      packageQuantity: material?.packageQuantity || 1,
      baseUnit: material?.baseUnit || ""
    }
  });

  const watchedUnitType = form.watch("unitType");
  const watchedInputUnit = form.watch("inputUnit");
  const watchedPackageQuantity = form.watch("packageQuantity");

  const suggestedUnits = getSuggestedUnits(watchedUnitType);
  const uniqueSuggestedUnits = useMemo(() => Array.from(new Set(suggestedUnits)), [suggestedUnits]);

  // Set default category if none selected and categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !form.getValues("category") && !material) {
      const defaultCategory = categories.find(cat => cat.value === "other") || categories[0];
      form.setValue("category", defaultCategory.value);
    }
  }, [categories, form, material]);

  // Convert categoryId to category value when editing existing material (one-time only)
  useEffect(() => {
    if (categories.length > 0 && material && (material as any).categoryId && !form.formState.isDirty) {
      const categoryId = (material as any).categoryId;
      console.log(
        "🔍 Looking for categoryId:",
        categoryId,
        "in categories:",
        categories.map(c => `${c.id}:${c.name}`)
      );
      const matchingCategory = categories.find(cat => cat.id === categoryId);
      if (matchingCategory) {
        console.log("✅ Found matching category:", matchingCategory.name, "value:", matchingCategory.value);
        form.setValue("category", matchingCategory.value);
      } else {
        // Fallback: categoryId doesn't match any materials category - just leave it empty for user to select
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

  // Check if input unit is a package type
  const isPackageUnit = (unit: string): boolean => {
    return ["box", "pack", "bag"].includes(unit);
  };

  // Calculate conversion information (without cost)
  const conversionData = useMemo(() => {
    if (!watchedInputUnit || !watchedUnitType) {
      return null;
    }

    // Get the base unit for package contents
    const getPackageBaseUnit = (inputUnit: string): string => {
      // For packages, the base unit is typically piece, bottle, or item
      if (inputUnit === "box" && watchedUnitType === "package") {
        return "bottle"; // Default for boxes
      }
      if (inputUnit === "pack" && watchedUnitType === "package") {
        return "piece"; // Default for packs
      }
      return "piece"; // Default fallback
    };

    const baseUnit = getBaseUnitForType(watchedUnitType);

    // Handle package units differently
    if (isPackageUnit(watchedInputUnit) && watchedUnitType === "package") {
      const packageQuantity = watchedPackageQuantity || 1;
      const packageBaseUnit = getPackageBaseUnit(watchedInputUnit);

      return {
        inputUnit: watchedInputUnit,
        baseUnit: packageBaseUnit,
        conversionFactor: packageQuantity,
        packageQuantity,
        isPackage: true
      };
    }

    // Handle regular units - check if input unit is same as base unit
    if (watchedInputUnit === baseUnit) {
      // Direct conversion - no conversion needed
      return {
        inputUnit: watchedInputUnit,
        baseUnit,
        conversionFactor: 1,
        isPackage: false
      };
    }

    // Handle regular units with conversion
    const inputUnitDef = UNIT_DEFINITIONS[watchedInputUnit];
    const baseUnitDef = UNIT_DEFINITIONS[baseUnit];

    if (!inputUnitDef || !baseUnitDef || inputUnitDef.category !== baseUnitDef.category) {
      return null;
    }

    // Convert input unit to base unit
    const conversionFactor = inputUnitDef.baseQuantity / baseUnitDef.baseQuantity;

    return {
      inputUnit: watchedInputUnit,
      baseUnit,
      conversionFactor,
      isPackage: false
    };
  }, [watchedInputUnit, watchedUnitType, watchedPackageQuantity]);

  // Auto-update base unit when conversion data changes
  useEffect(() => {
    if (conversionData) {
      form.setValue("baseUnit", conversionData.baseUnit);
    }
  }, [conversionData, form]);

  // Prevent wheel scrolling on number inputs
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
    const finalData = {
      name: data.name,
      category: data.category,
      unitType: data.unitType,
      inputUnit: data.inputUnit,
      baseUnit: data.baseUnit,
      packageQuantity: data.unitType === "package" ? data.packageQuantity : undefined
    };
    onSubmit(finalData);
  };

  const loadCategories = useCallback(async (): Promise<Category[]> => {
    try {
      setLoading(true);
      setLoadingCategories(true);
      // Fetch only material categories (active)
      const response = await getCategoriesByType("materials", true);
      const fetched = response.totalItems;
      // Preserve the currently selected category (possibly newly created)
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
  }, [loadCategories]);


  const handleFormSubmit = async (formData: CategoryFormData) => {
    try {
      setFormLoading(true);
      let savedCategory: Category | undefined;
      console.log(formData);
      if (selectedCategory) {
        const res = await updateCategory(selectedCategory.id, formData);
        savedCategory = res.data;
      } else {
        const res = await createCategory({
          ...formData,
          type: "materials",
          isActive: true
        });
        savedCategory = res.data;
      }
      console.log("savedCategory 1111", savedCategory);
      if (savedCategory) {
        // Update categories state immediately
        console.log("savedCategory 2222", savedCategory);
        setCategories(prev => {
          const exists = prev.some(c => c.id === savedCategory!.id);
          const next = exists ? prev.map(c => (c.id === savedCategory!.id ? savedCategory! : c)) : [...prev, savedCategory!];
          return next.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        });

        // IMPORTANT: Wait for state update before setting form value
        setTimeout(() => {
          if (savedCategory?.value) {
            form.setValue("category", savedCategory.value, {
              shouldDirty: true,
              shouldTouch: true
            });
          }
        }, 0);
      }

      // Background refresh for consistency
      loadCategories();
      setShowForm(false);
      setSelectedCategory(undefined);
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
                        <Input placeholder="e.g., Ground Beef" {...field} />
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
                            key={`category-select-${categories.length}`}
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
              </div>

              {/* Unit Conversion Display (without cost) */}
              {conversionData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-blue-900">Unit Conversion Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Input Unit:</span>
                        <span className="font-medium">{conversionData.inputUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Base Unit:</span>
                        <span className="font-medium">{conversionData.baseUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">{conversionData.isPackage ? "Package Contents:" : "Conversion Factor:"}</span>
                        <span className="font-medium">{conversionData.isPackage ? `${conversionData.packageQuantity} ${conversionData.baseUnit} per ${conversionData.inputUnit}` : `1 ${conversionData.inputUnit} = ${conversionData.conversionFactor.toFixed(2)} ${conversionData.baseUnit}`}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-blue-800 font-medium">Examples:</div>
                      <div className="text-xs space-y-1">
                        {conversionData.isPackage ? (
                          <>
                            <div>
                              • 1 {conversionData.inputUnit} contains {conversionData.packageQuantity} {conversionData.baseUnit}
                            </div>
                            <div>
                              • 2 {conversionData.inputUnit} contains {conversionData.packageQuantity * 2} {conversionData.baseUnit}
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              • 1 {conversionData.inputUnit} = {conversionData.conversionFactor.toFixed(2)} {conversionData.baseUnit}
                            </div>
                            <div>
                              • {conversionData.conversionFactor >= 1 ? 1 : Math.ceil(1 / conversionData.conversionFactor)} {conversionData.baseUnit} = {conversionData.conversionFactor >= 1 ? (1 / conversionData.conversionFactor).toFixed(2) : 1} {conversionData.inputUnit}
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
                <Button type="submit">{material ? "Update Material" : "Add Material"}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <CategoryModal showForm={showForm} setShowForm={setShowForm} selectedCategory={selectedCategory} handleFormSubmit={handleFormSubmit} handleFormCancel={() => setShowForm(false)} formLoading={formLoading} />
    </>
  );
}
