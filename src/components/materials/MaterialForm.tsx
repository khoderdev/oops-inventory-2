import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Material, MATERIAL_CATEGORIES } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { UNIT_DEFINITIONS } from "@/utils/enhancedConversions";
import { getSuggestedUnits } from "@/utils/inventoryCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const materialSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  category: z.string().min(1, "Category is required"),
  unitType: z.string().min(1, "Unit type is required"),
  inputUnit: z.string().min(1, "Input unit is required"),
  inputCost: z.number().min(0, "Cost must be positive"),
  baseUnit: z.string().min(1, "Base unit is required"),
  costPerBaseUnit: z.number().min(0, "Cost must be positive"),
  description: z.string().optional()
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface MaterialFormProps {
  material?: Material;
  onSubmit: (data: MaterialFormData) => void;
  onCancel: () => void;
}

export function MaterialForm({ material, onSubmit, onCancel }: MaterialFormProps) {
  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: material?.name || "",
      category: material?.category || "",
      unitType: material?.unitType || "",
      inputUnit: material?.baseUnit || "",
      inputCost: material?.costPerBaseUnit || 0,
      baseUnit: material?.baseUnit || "",
      costPerBaseUnit: material?.costPerBaseUnit || 0,
      description: material?.description || ""
    }
  });

  const watchedUnitType = form.watch("unitType");
  const watchedInputUnit = form.watch("inputUnit");
  const watchedInputCost = form.watch("inputCost");
  const watchedBaseUnit = form.watch("baseUnit");

  const suggestedUnits = getSuggestedUnits(watchedUnitType);

  // Get base unit for the selected unit type
  const getBaseUnitForType = (unitType: string): string => {
    switch (unitType) {
      case "mass":
        return "g";
      case "volume":
        return "ml";
      case "piece":
        return "piece";
      case "package":
        return "piece";
      default:
        return "piece";
    }
  };

  // Calculate conversion and costs
  const conversionData = useMemo(() => {
    if (!watchedInputUnit || !watchedInputCost || !watchedUnitType) {
      return null;
    }

    const baseUnit = getBaseUnitForType(watchedUnitType);
    const inputUnitDef = UNIT_DEFINITIONS[watchedInputUnit];
    const baseUnitDef = UNIT_DEFINITIONS[baseUnit];

    if (!inputUnitDef || !baseUnitDef || inputUnitDef.category !== baseUnitDef.category) {
      return null;
    }

    // Convert input unit to base unit
    const conversionFactor = inputUnitDef.baseQuantity / baseUnitDef.baseQuantity;
    const costPerBaseUnit = watchedInputCost / conversionFactor;

    return {
      inputUnit: watchedInputUnit,
      inputCost: watchedInputCost,
      baseUnit,
      conversionFactor,
      costPerBaseUnit,
      examples: {
        perInputUnit: watchedInputCost,
        perBaseUnit: costPerBaseUnit
      }
    };
  }, [watchedInputUnit, watchedInputCost, watchedUnitType]);

  // Auto-update base unit and cost when conversion data changes
  useEffect(() => {
    if (conversionData) {
      form.setValue("baseUnit", conversionData.baseUnit);
      form.setValue("costPerBaseUnit", conversionData.costPerBaseUnit);
    }
  }, [conversionData, form]);

  const handleSubmit = (data: MaterialFormData) => {
    // Only submit the final converted data, excluding input fields
    const finalData = {
      name: data.name,
      category: data.category,
      unitType: data.unitType,
      baseUnit: data.baseUnit,
      costPerBaseUnit: data.costPerBaseUnit,
      description: data.description
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MATERIAL_CATEGORIES.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
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
                        <SelectItem value="mass">Mass (kg, gram, lb)</SelectItem>
                        <SelectItem value="volume">Volume (liter, ml, gallon)</SelectItem>
                        <SelectItem value="piece">Piece Count</SelectItem>
                        <SelectItem value="package">Package (box, pack, case)</SelectItem>
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

              <FormField
                control={form.control}
                name="inputCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per Input Unit ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="costPerBaseUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per Base Unit (Auto-calculated)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" {...field} disabled className="bg-gray-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Conversion Display */}
            {conversionData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-blue-900">Unit Conversion & Cost Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Input:</span>
                      <span className="font-medium">
                        {formatCurrency(conversionData.inputCost)} per {conversionData.inputUnit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Base Unit:</span>
                      <span className="font-medium">
                        {formatCurrency(conversionData.costPerBaseUnit)} per {conversionData.baseUnit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Conversion Factor:</span>
                      <span className="font-medium">
                        1 {conversionData.inputUnit} = {conversionData.conversionFactor.toFixed(2)} {conversionData.baseUnit}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-blue-800 font-medium">Cost Examples:</div>
                    <div className="text-xs space-y-1">
                      <div>
                        • 1 {conversionData.inputUnit} costs {formatCurrency(conversionData.examples.perInputUnit)}
                      </div>
                      <div>
                        • 1 {conversionData.baseUnit} costs {formatCurrency(conversionData.examples.perBaseUnit)}
                      </div>
                      {conversionData.inputUnit === "kg" && conversionData.baseUnit === "g" && (
                        <div>
                          • 1000 {conversionData.baseUnit} costs {formatCurrency(conversionData.examples.perInputUnit)}
                        </div>
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
