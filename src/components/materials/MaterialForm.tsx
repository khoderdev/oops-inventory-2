import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaterialFormData, MaterialFormProps } from "@/types/inventory";
import { UNIT_DEFINITIONS } from "@/utils/enhancedConversions";
import { getSuggestedUnits } from "@/utils/inventoryCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { materialSchema } from "./materialsSchema";
import { getCategoriesByType } from "@/api/categories.api";
import { Category } from "@/types/categories";
import { Loader2 } from "lucide-react";

export function MaterialForm({ material, onSubmit, onCancel }: MaterialFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

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

  // Fetch material categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('🔄 Starting to fetch categories...');
        setLoadingCategories(true);
        setCategoriesError(null);
        const response = await getCategoriesByType('materials', true);
        console.log('📦 Categories API response:', response);
        console.log('📋 Categories totalItems:', response.totalItems);
        // Use the correct response structure with totalItems
        setCategories(response.totalItems);
        console.log('✅ Categories set in state:', response.totalItems);
      } catch (error) {
        console.error('❌ Failed to fetch categories:', error);
        setCategoriesError('Failed to load categories');
        setCategories([]);
      } finally {
        setLoadingCategories(false);
        console.log('🏁 Loading categories finished');
      }
    };

    fetchCategories();
  }, []);

  // Set default category if none selected and categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !form.getValues('category') && !material) {
      const defaultCategory = categories.find(cat => cat.value === 'other') || categories[0];
      form.setValue('category', defaultCategory.value);
    }
  }, [categories, form, material]);

  // Convert categoryId to category value when editing existing material (one-time only)
  useEffect(() => {
    if (categories.length > 0 && material && (material as any).categoryId && !form.formState.isDirty) {
      const categoryId = (material as any).categoryId;
      console.log('🔍 Looking for categoryId:', categoryId, 'in categories:', categories.map(c => `${c.id}:${c.name}`));
      const matchingCategory = categories.find(cat => cat.id === categoryId);
      if (matchingCategory) {
        console.log('✅ Found matching category:', matchingCategory.name, 'value:', matchingCategory.value);
        form.setValue('category', matchingCategory.value);
      } else {
        // Fallback: categoryId doesn't match any materials category - just leave it empty for user to select
        console.warn('⚠️ Material categoryId', categoryId, 'not found in materials categories. User needs to select manually.');
        form.setValue('category', '');
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

  return (
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
                  console.log('🎯 CATEGORY FIELD RENDER - field.value:', field.value);
                  console.log('🎯 CATEGORY FIELD RENDER - form.getValues("category"):', form.getValues("category"));
                  return (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          console.log('🔄 Category changed to:', value);
                          field.onChange(value);
                        }} 
                        value={field.value} 
                        disabled={loadingCategories}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
                            {loadingCategories && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoriesError ? (
                            <SelectItem value="" disabled>
                              {categoriesError}
                            </SelectItem>
                          ) : (
                            <>
                              {categories.length === 0 && !loadingCategories ? (
                                <SelectItem value="no-categories" disabled>
                                  No categories available
                                </SelectItem>
                              ) : (
                                categories.map(category => {
                                  return (
                                    <SelectItem key={category.id} value={category.value}>
                                      {category.name}
                                    </SelectItem>
                                  );
                                })
                              )}
                            </>
                          )}
                        </SelectContent>
                      </Select>
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
                        <SelectItem value="package">Package (box, pack, bag)</SelectItem>
                        <SelectItem value="mass">Mass (kg, gram)</SelectItem>
                        <SelectItem value="volume">Volume (liter, ml)</SelectItem>
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
                        {suggestedUnits.map(unit => (
                          <SelectItem key={unit} value={unit}>
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
  );
}
