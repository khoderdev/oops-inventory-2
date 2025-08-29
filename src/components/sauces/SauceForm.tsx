import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Minus, Calculator, Utensils, Info } from "lucide-react";
import { SauceFormProps, Material, SauceFormData, SauceCalculationResult, SauceIngredient } from "@/types/inventory";
import { SAUCE_CATEGORIES, SAUCE_UNITS, SauceFormInputs, sauceFormSchema } from "./constants";
import { calculateSauceMetrics, autoUpdateSauceYield, calculateIngredientCostSmart } from "@/utils/conversionLogic";
import { VirtualSelect } from "../ui/VirtualSelect";

export function SauceForm({ sauce, materials, stockEntries = [], onSubmit, onCancel }: SauceFormProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<SauceCalculationResult | null>(null);
  const [autoYieldEnabled, setAutoYieldEnabled] = useState(true);

  const form = useForm<SauceFormInputs>({
    resolver: zodResolver(sauceFormSchema),
    defaultValues: {
      name: sauce?.name || "",
      description: sauce?.description || "",
      category: sauce?.category || "",
      baseIngredients: sauce?.baseIngredients || [{ materialId: "", quantity: 0, unit: "", cost: 0 }],
      yieldQuantity: sauce?.yieldQuantity?.toString() || "",
      unit: sauce?.unit || "ml",
      preparationTime: sauce?.preparationTime?.toString() || "",
      isPOSItem: sauce?.isPOSItem || false
    } as SauceFormInputs
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "baseIngredients"
  });

  const watchedIngredients = form.watch("baseIngredients");
  const watchedYieldQuantity = form.watch("yieldQuantity");

  const materialsWithStock = useMemo(() => {
    return materials
      .map(material => {
        const materialStockEntries = stockEntries.filter(entry => entry.materialId === material.id);
        const totalStock = materialStockEntries.reduce((sum, entry) => sum + (entry.purchasedIndividualQuantity || 0), 0);
        let costPerUnit = material.costPerBaseUnit != null ? parseFloat(material.costPerBaseUnit as any) : typeof material.costPerUnit === "string" ? parseFloat(material.costPerUnit) : material.costPerUnit;
        if (!costPerUnit || isNaN(costPerUnit) || costPerUnit <= 0) {
          const recentEntries = materialStockEntries
            .filter(entry => entry.purchasedIndividualQuantity > 0)
            .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
            .slice(0, 5);
          if (recentEntries.length > 0) {
            let totalValue = 0;
            let totalQuantity = 0;
            recentEntries.forEach(entry => {
              totalValue += Number(entry.totalCost);
              totalQuantity += entry.purchasedIndividualQuantity;
            });
            costPerUnit = totalQuantity > 0 ? totalValue / totalQuantity : 0;
          } else {
            console.warn(`⚠️ No valid cost data for ${material.name}`);
            costPerUnit = 0;
          }
        }
        return {
          ...material,
          costPerUnit,
          hasStock: totalStock > 0,
          availableStock: totalStock
        };
      })
      .filter(material => material.hasStock);
  }, [materials, stockEntries]);

  // Materials lookup for quick access (using enriched materials with cost data)
  const materialsById = useMemo(() => {
    const map = new Map<string, Material>();
    materialsWithStock.forEach(material => map.set(material.id.toString(), material));
    return map;
  }, [materialsWithStock]);

  // Smart sauce calculation with automatic yield estimation
  useEffect(() => {
    const calculateSauceMetricsAsync = async () => {
      if (!watchedIngredients?.length) {
        setCalculationResult(null);
        return;
      }
      const validIngredients = watchedIngredients.filter(ing => ing.materialId && ing.quantity > 0 && ing.unit);
      if (validIngredients.length === 0) {
        setCalculationResult(null);
        return;
      }
      setIsCalculating(true);
      try {
        const sauceIngredients: SauceIngredient[] = validIngredients.map(ing => ({
          materialId: ing.materialId,
          quantity: ing.quantity,
          unit: ing.unit,
          cost: ing.cost || 0
        }));
        const manualYield = watchedYieldQuantity && parseFloat(watchedYieldQuantity) > 0 ? { quantity: parseFloat(watchedYieldQuantity), unit: form.getValues("unit") } : undefined;
        const result = calculateSauceMetrics(sauceIngredients, materialsWithStock, manualYield);
        if (!result) {
          console.error("❌ calculateSauceMetrics returned undefined");
          setCalculationResult(null);
        } else {
          setCalculationResult(result);
        }
        if (autoYieldEnabled && (!watchedYieldQuantity || parseFloat(watchedYieldQuantity) === 0)) {
          const autoYield = autoUpdateSauceYield(sauceIngredients, materialsWithStock, form.getValues("unit"));
          form.setValue("yieldQuantity", autoYield.quantity.toString(), { shouldValidate: false });
          form.setValue("unit", autoYield.unit, { shouldValidate: false });
        }
      } catch (error) {
        console.error("❌ Error in calculateSauceMetricsAsync:", error);
        setCalculationResult(null);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateSauceMetricsAsync();
  }, [watchedIngredients, watchedYieldQuantity, materialsWithStock, autoYieldEnabled, form]);

  // Update ingredient costs from calculation results
  useEffect(() => {
    if (calculationResult?.ingredients) {
      // Create a map of materialId to ingredient cost for quick lookup
      const costMap = new Map<string, number>();
      calculationResult.ingredients.forEach(ing => {
        costMap.set(ing.materialId.toString(), ing.cost);
      });

      // Update each ingredient's cost in the form
      const updatedIngredients = [...form.getValues("baseIngredients")];
      let hasChanges = false;

      updatedIngredients.forEach((ing, index) => {
        if (ing.materialId && costMap.has(ing.materialId)) {
          const newCost = costMap.get(ing.materialId) || 0;
          if (ing.cost !== newCost) {
            updatedIngredients[index] = {
              ...ing,
              cost: newCost
            };
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        form.setValue("baseIngredients", updatedIngredients, { shouldValidate: true });
      }
    }
  }, [calculationResult, form]);

  const handleSubmit = (data: SauceFormInputs) => {
    const processedData: SauceFormData = {
      name: data.name,
      description: data.description,
      category: data.category,
      baseIngredients: data.baseIngredients.map(ing => ({
        materialId: ing.materialId,
        quantity: typeof ing.quantity === "string" ? parseFloat(ing.quantity) : ing.quantity,
        unit: ing.unit,
        cost: typeof ing.cost === "string" ? parseFloat(ing.cost) : ing.cost
      })),
      yieldQuantity: data.yieldQuantity,
      unit: data.unit,
      preparationTime: data.preparationTime,
      isPOSItem: data.isPOSItem
    };

    onSubmit(processedData);
  };

  const addIngredient = () => {
    append({ materialId: "", quantity: 0, unit: "", cost: 0 });
  };

  const removeIngredient = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // In SauceForm component, update the useEffect
  useEffect(() => {
    if (sauce) {
      // Transform the sauce data to match form expectations
      form.reset({
        name: sauce.name || "",
        description: sauce.description || "",
        category: sauce.category || "",
        baseIngredients: sauce.baseIngredients?.map(ing => ({
          materialId: ing.materialId.toString(), // Ensure string format
          quantity: typeof ing.quantity === "string" ? parseFloat(ing.quantity) : ing.quantity,
          unit: ing.unit || "",
          cost: typeof ing.cost === "string" ? parseFloat(ing.cost) : ing.cost
        })) || [{ materialId: "", quantity: 0, unit: "", cost: 0 }],
        yieldQuantity: sauce.yieldQuantity?.toString() || "",
        unit: sauce.unit || "ml",
        preparationTime: sauce.preparationTime?.toString() || "",
        isPOSItem: sauce.isPOSItem || false
      });
    } else {
      // Reset to empty form for new sauce
      form.reset({
        name: "",
        description: "",
        category: "",
        baseIngredients: [{ materialId: "", quantity: 0, unit: "", cost: 0 }],
        yieldQuantity: "",
        unit: "ml",
        preparationTime: "",
        isPOSItem: false
      });
    }
  }, [sauce, form]);

  return (
    <div className=" mx-auto p-6 space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          <Calculator className="w-3 h-3" />
          Total Cost: ${calculationResult?.totalCost?.toFixed(2) ?? "0.00"}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Utensils className="w-3 h-3" />
          Cost/Unit: ${calculationResult?.costPerUnit?.toFixed(4) ?? "0.0000"}
        </Badge>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Sauce Name *</Label>
                  <Input id="name" {...form.register("name")} placeholder="e.g., Spicy Garlic Aioli" className="mt-1" />
                  {form.formState.errors.name && <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>}
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={form.watch("category")} onValueChange={value => form.setValue("category", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAUCE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && <p className="text-red-500 text-sm mt-1">{form.formState.errors.category.message}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...form.register("description")} placeholder="Brief description of the sauce..." className="mt-1" rows={2} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="yieldQuantity">Final Quantity *</Label>
                    <div className="flex items-center space-x-2">
                      <Switch id="autoYield" checked={autoYieldEnabled} onCheckedChange={setAutoYieldEnabled} />
                      <Label htmlFor="autoYield" className="text-xs text-gray-500">
                        Auto
                      </Label>
                    </div>
                  </div>
                  <Input id="yieldQuantity" {...form.register("yieldQuantity")} placeholder="500" className="mt-1" disabled={autoYieldEnabled} />
                  {autoYieldEnabled && <p className="text-xs text-blue-600 mt-1">Auto-calculated from ingredients</p>}
                </div>

                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <Select value={form.watch("unit")} onValueChange={value => form.setValue("unit", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAUCE_UNITS.map(unit => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="preparationTime">Prep Time (minutes)</Label>
                  <Input id="preparationTime" {...form.register("preparationTime")} placeholder="30" className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Smart Cost Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Cost Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Cost:</span>
                  <span className="font-semibold">${calculationResult?.totalCost?.toFixed(2) ?? "0.00"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cost per {calculationResult?.yieldUnit ?? form.watch("unit") ?? "unit"}:</span>
                  <span className="font-semibold">${calculationResult?.costPerUnit?.toFixed(4) ?? "0.0000"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Yield:</span>
                  <span className="font-semibold">
                    {calculationResult?.estimatedYield?.toFixed(1) ?? form.watch("yieldQuantity") ?? "0"} {calculationResult?.yieldUnit ?? form.watch("unit") ?? "unit"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ingredients:</span>
                  <span className="font-semibold">{fields.length}</span>
                </div>
              </div>

              {isCalculating && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  Calculating smart metrics...
                </div>
              )}

              {calculationResult?.calculationSteps && calculationResult.calculationSteps.length > 0 ? (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Calculation Details</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 max-h-32 overflow-y-auto">
                    {calculationResult.calculationSteps.map((step, index) => (
                      <div key={index} className="font-mono">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">No calculation details available</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ingredients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Ingredients ({fields.length})
              </div>
              <Button type="button" onClick={addIngredient} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Ingredient
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                  <div className="md:col-span-2">
                    <Label>Ingredient *</Label>
                    <VirtualSelect
                      items={materialsWithStock.map(material => ({
                        id: material.id,
                        label: `${material.name} (${material.baseUnit})`
                      }))}
                      value={(() => {
                        const materialId = form.getValues(`baseIngredients.${index}.materialId`);
                        if (!materialId) return null;
                        const material = materialsWithStock.find(m => m.id.toString() === materialId.toString());
                        return material ? { id: material.id, label: `${material.name} (${material.baseUnit})` } : null;
                      })()}
                      onChange={value => {
                        if (!value) {
                          // Clear the field properly
                          form.setValue(`baseIngredients.${index}.materialId`, "");
                          form.setValue(`baseIngredients.${index}.unit`, "");
                          form.setValue(`baseIngredients.${index}.cost`, 0, { shouldValidate: true });

                          // Update the ingredients array to trigger sauce metrics calculation
                          const currentIngredients = [...form.getValues("baseIngredients")];
                          currentIngredients[index] = {
                            ...currentIngredients[index],
                            materialId: "",
                            unit: "",
                            cost: 0
                          };
                          form.setValue("baseIngredients", currentIngredients, { shouldValidate: true });
                          return;
                        }

                        // Handle material selection
                        const material = materialsWithStock.find(m => m.id === value.id);
                        if (material) {
                          const quantity = form.getValues(`baseIngredients.${index}.quantity`) || 0;
                          const smartCost = quantity > 0 ? calculateIngredientCostSmart(material.id.toString(), quantity, material.baseUnit, materialsWithStock) : 0;

                          // Update all fields at once
                          const currentIngredients = [...form.getValues("baseIngredients")];
                          currentIngredients[index] = {
                            ...currentIngredients[index],
                            materialId: material.id.toString(),
                            unit: material.baseUnit,
                            cost: smartCost,
                            quantity: quantity
                          };

                          form.setValue(`baseIngredients.${index}.materialId`, material.id.toString(), { shouldValidate: true });
                          form.setValue(`baseIngredients.${index}.unit`, material.baseUnit, { shouldValidate: true });
                          form.setValue(`baseIngredients.${index}.cost`, smartCost, { shouldValidate: true });
                          form.setValue("baseIngredients", currentIngredients, { shouldValidate: true });
                        }
                      }}
                      placeholder="Select item"
                      height={200}
                      rowHeight={40}
                    />
                  </div>

                  <div>
                    <Label>Quantity *</Label>
                    <Controller
                      control={form.control}
                      name={`baseIngredients.${index}.quantity`}
                      render={({ field }) => (
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="0"
                          className="mt-1"
                          value={field.value || ""}
                          onChange={e => {
                            const quantity = parseFloat(e.target.value) || 0;
                            field.onChange(quantity);

                            const materialId = form.getValues(`baseIngredients.${index}.materialId`);
                            const unit = form.getValues(`baseIngredients.${index}.unit`);

                            if (materialId && unit) {
                              const material = materialsWithStock.find(m => m.id.toString() === materialId.toString());
                              if (material) {
                                const cost = calculateIngredientCostSmart(materialId.toString(), quantity, unit, materialsWithStock);

                                // Update the ingredients array to trigger sauce metrics calculation
                                const currentIngredients = [...form.getValues("baseIngredients")];
                                currentIngredients[index] = {
                                  ...currentIngredients[index],
                                  quantity,
                                  cost,
                                  materialId,
                                  unit
                                };

                                // Update both the specific field and the entire array
                                form.setValue(`baseIngredients.${index}.cost`, cost, { shouldValidate: true });
                                form.setValue("baseIngredients", currentIngredients, { shouldValidate: true });
                              }
                            }
                          }}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Unit *</Label>
                    <Controller
                      control={form.control}
                      name={`baseIngredients.${index}.unit`}
                      render={({ field }) => (
                        <Input
                          placeholder="g"
                          className="mt-1"
                          value={field.value || ""}
                          onChange={e => {
                            const unit = e.target.value;
                            field.onChange(unit);

                            const materialId = form.getValues(`baseIngredients.${index}.materialId`);
                            const quantity = form.getValues(`baseIngredients.${index}.quantity`) || 0;

                            if (materialId && quantity > 0) {
                              const material = materialsWithStock.find(m => m.id.toString() === materialId.toString());
                              if (material) {
                                const smartCost = calculateIngredientCostSmart(materialId.toString(), quantity, unit, materialsWithStock);

                                // Update the ingredients array to trigger sauce metrics calculation
                                const currentIngredients = [...form.getValues("baseIngredients")];
                                currentIngredients[index] = {
                                  ...currentIngredients[index],
                                  unit,
                                  cost: smartCost,
                                  materialId,
                                  quantity
                                };

                                // Update both the specific field and the entire array
                                form.setValue(`baseIngredients.${index}.cost`, smartCost, { shouldValidate: true });
                                form.setValue("baseIngredients", currentIngredients, { shouldValidate: true });
                              }
                            }
                          }}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Cost</Label>
                    <Input type="number" step="0.01" {...form.register(`baseIngredients.${index}.cost`, { valueAsNumber: true })} placeholder="0.00" className="mt-1" readOnly />
                  </div>

                  <div className="flex items-end justify-center">
                    <Button className="!bg-transparent !border-none !hover:bg-transparent !hover:border-none" onClick={() => removeIngredient(index)} disabled={fields.length <= 1}>
                      <Minus className="!w-6 !h-6 cursor-pointer text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isCalculating}>
            {sauce ? "Update Sauce" : "Create Sauce"}
          </Button>
        </div>
      </form>
    </div>
  );
}
