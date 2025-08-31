import React, { useState, useEffect, useCallback } from "react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";
import { ImageUpload } from "../../ui/image-upload";
import { CostBreakdown } from "./CostBreakdown";
import { Ingredients } from "./Ingredients";
import { toast } from "../../ui/use-toast";
import { BeverageItemFormProps, StockEntryWithMaterial, MenuItemIngredient, MenuItem } from "@/types/inventory";
import { variantsAPI, Variant, CreateVariantData } from "@/api/variants.api";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { getAvailableUnits } from "@/utils/getAvailableUnits";

// Component for adding ingredients to variants
const VariantIngredientInput: React.FC<{
  variantName: string;
  materials: any[];
  stockEntries: any[];
  onAddIngredient: (variantName: string, materialId: string, quantity: number, unit: string) => void;
}> = ({ variantName, materials, stockEntries, onAddIngredient }) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  // Get available units for selected material
  const availableUnits = React.useMemo(() => {
    if (!selectedMaterialId || !materials) return [];
    return getAvailableUnits(selectedMaterialId, materials);
  }, [selectedMaterialId, materials]);

  // Reset unit when material changes
  React.useEffect(() => {
    if (selectedMaterialId && availableUnits.length > 0) {
      // Find the selected material to get its base unit
      const selectedMaterial = materials?.find(m => String(m.id) === selectedMaterialId);
      if (selectedMaterial?.baseUnit && availableUnits.includes(selectedMaterial.baseUnit)) {
        setUnit(selectedMaterial.baseUnit);
      } else {
        setUnit(availableUnits[0]);
      }
    } else {
      setUnit("");
    }
  }, [selectedMaterialId, availableUnits, materials]);

  const handleAdd = () => {
    if (!selectedMaterialId || !quantity || parseFloat(quantity) <= 0 || !unit) return;

    // Debug log to verify unit at the point of adding ingredient
    console.log(`📌 Adding ingredient with unit verification:`, {
      materialId: selectedMaterialId,
      materialName: materials?.find(m => String(m.id) === selectedMaterialId)?.name,
      quantity: parseFloat(quantity),
      unit: unit, // This should match what was selected in the dropdown
      variantName
    });

    onAddIngredient(variantName, selectedMaterialId, parseFloat(quantity), unit);

    // Reset form
    setSelectedMaterialId("");
    setQuantity("");
    setUnit("");
  };

  const handleMaterialChange = (materialId: string) => {
    setSelectedMaterialId(materialId);
    // Unit will be automatically set by the useEffect above

    // Log material information on selection
    if (materialId) {
      const material = materials?.find(m => String(m.id) === materialId);
      if (material) {
        const relevantStockEntries = stockEntries?.filter(entry => String(entry.materialId) === materialId) || [];

        console.log(`🔍 Selected material: ${material.name}`, {
          material: {
            id: material.id,
            name: material.name,
            unitType: material.unitType,
            baseUnit: material.baseUnit,
            packageQuantity: material.packageQuantity,
            availableUnits: getAvailableUnits(materialId, materials)
          },
          stockEntries: relevantStockEntries.map(entry => ({
            id: entry.id,
            materialId: entry.materialId,
            purchasedQuantity: entry.purchasedQuantity,
            purchasedUnit: entry.purchasedUnit,
            costPerPurchasedUnit: entry.costPerPurchasedUnit,
            costPerBaseUnit: entry.costPerBaseUnit,
            totalCost: entry.totalCost
          }))
        });

        // Debug log for available units
        console.log(`🧪 Available units for ${material.name}:`, {
          baseUnit: material.baseUnit,
          unitType: material.unitType,
          availableUnits: getAvailableUnits(materialId, materials),
          defaultUnitToBeSet: material.baseUnit || getAvailableUnits(materialId, materials)[0]
        });
      }
    }
  };

  return (
    <div className="border rounded p-3 bg-gray-50">
      <div className="grid grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">Ingredient</label>
          <select value={selectedMaterialId} onChange={e => handleMaterialChange(e.target.value)} className="w-full px-2 py-1 text-sm border border-input bg-background rounded">
            <option value="">Select ingredient...</option>
            {materials?.map(material => (
              <option key={material.id} value={String(material.id)}>
                {material.name}
                <span className="text-xs text-gray-500 ml-1">({material.unitType === "mass" ? "Mass" : material.unitType === "volume" ? "Volume" : material.unitType === "package" ? "Package" : material.unitType === "piece" ? "Piece" : material.unitType})</span>
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Quantity</label>
          <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" min="0" step="0.1" className="text-sm h-8" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Unit</label>
          <select
            value={unit}
            onChange={e => {
              const selectedUnit = e.target.value;
              console.log(`🔄 Unit selection changed to: ${selectedUnit}`, {
                previousUnit: unit,
                materialId: selectedMaterialId,
                materialName: materials?.find(m => String(m.id) === selectedMaterialId)?.name
              });
              setUnit(selectedUnit);
            }}
            className="w-full px-2 py-1 text-sm border border-input bg-background rounded h-8"
            disabled={!selectedMaterialId}
          >
            {selectedMaterialId ? (
              (() => {
                // Find the selected material
                const material = materials?.find(m => String(m.id) === selectedMaterialId);

                if (!material) {
                  return <option value="">Invalid material</option>;
                }

                let availableUnits: string[] = [];

                // Determine units based on material type and base unit - same logic as main Ingredients
                if (material.unitType === "mass") {
                  // Mass materials: show mass units
                  availableUnits = ["g", "kg", "lb", "oz"];
                } else if (material.unitType === "volume") {
                  // Volume materials: show volume units
                  availableUnits = ["ml", "cl", "dl", "l", "fl_oz", "cup", "pt", "qt", "gal"];
                } else if (material.unitType === "package") {
                  // Package materials: determine by base unit
                  if (material.baseUnit === "bottle") {
                    // Bottle-based packages (beverages): show volume units + bottle
                    availableUnits = ["bottle", "ml", "cl", "dl", "l", "fl_oz"];
                  } else if (material.baseUnit === "piece") {
                    // Piece-based packages: show piece + package units
                    availableUnits = ["piece", material.inputUnit || "box", "bag", "pack"];
                  } else if (["ml", "cl", "dl", "l", "fl_oz"].includes(material.baseUnit)) {
                    // Volume-based packages (like Bombay Gin with cl as base unit)
                    availableUnits = ["bottle", "ml", "cl", "dl", "l", "fl_oz"];
                    // Add package units if available
                    if (material.inputUnit && !availableUnits.includes(material.inputUnit)) {
                      availableUnits.push(material.inputUnit);
                    }
                  } else {
                    // Other package types: include base unit and input unit
                    availableUnits = [material.baseUnit];
                    if (material.inputUnit && material.inputUnit !== material.baseUnit) {
                      availableUnits.push(material.inputUnit);
                    }
                  }
                } else {
                  // Fallback: use available units from utility function
                  availableUnits = [...getAvailableUnits(selectedMaterialId, materials)];
                }

                // Remove duplicates and ensure base unit is included
                const uniqueUnits = Array.from(new Set([material.baseUnit, ...availableUnits]));

                return uniqueUnits.map(unitOption => {
                  const isBaseUnit = material.baseUnit === unitOption;
                  return (
                    <option key={unitOption} value={unitOption}>
                      {unitOption}
                      {isBaseUnit ? " (base unit)" : ""}
                    </option>
                  );
                });
              })()
            ) : (
              <option value="">Select material first</option>
            )}
          </select>
        </div>
        <Button type="button" onClick={handleAdd} disabled={!selectedMaterialId || !quantity || parseFloat(quantity) <= 0 || !unit} className="h-8 text-sm">
          Add
        </Button>
      </div>
    </div>
  );
};

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
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariantTypes, setSelectedVariantTypes] = useState<string[]>([]);
  const [variantInputs, setVariantInputs] = useState<Record<string, { volume: string; unit: string; price: string }>>({});
  const [variantIngredients, setVariantIngredients] = useState<Record<string, MenuItemIngredient[]>>({});

  // Available variant types with default values
  const availableVariantTypes = [
    { name: "small", defaultVolume: 25, defaultUnit: "cl", defaultPrice: 0 },
    { name: "medium", defaultVolume: 33, defaultUnit: "cl", defaultPrice: 0 },
    { name: "large", defaultVolume: 50, defaultUnit: "cl", defaultPrice: 0 },
    { name: "glass", defaultVolume: 200, defaultUnit: "ml", defaultPrice: 0 },
    { name: "shot", defaultVolume: 10, defaultUnit: "ml", defaultPrice: 0 },
    { name: "can", defaultVolume: 33, defaultUnit: "cl", defaultPrice: 0 },
    { name: "bottle", defaultVolume: 75, defaultUnit: "cl", defaultPrice: 0 },
    { name: "pint", defaultVolume: 47, defaultUnit: "cl", defaultPrice: 0 },
    { name: "pitcher", defaultVolume: 150, defaultUnit: "cl", defaultPrice: 0 },
    { name: "mini", defaultVolume: 18, defaultUnit: "cl", defaultPrice: 0 },
    { name: "standard", defaultVolume: 70, defaultUnit: "cl", defaultPrice: 0 },
    { name: "magnum", defaultVolume: 150, defaultUnit: "cl", defaultPrice: 0 }
  ];

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
          // Initialize empty ingredients array for this variant
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

  // Handle variant input changes
  const handleVariantInputChange = useCallback((variantName: string, field: "volume" | "unit" | "price", value: string) => {
    setVariantInputs(prev => ({
      ...prev,
      [variantName]: {
        ...prev[variantName],
        [field]: value
      }
    }));
  }, []);

  // Calculate ingredient cost for variants
  const calculateVariantIngredientCost = useCallback(
    (ingredient: Omit<MenuItemIngredient, "cost">) => {
      const material = materials?.find(m => String(m.id) === ingredient.materialId);
      if (!material) {
        console.warn(`Material not found for ID: ${ingredient.materialId}`);
        return 0;
      }

      const relevantStockEntries = stockEntries.filter(entry => String(entry.materialId) === ingredient.materialId);
      if (relevantStockEntries.length === 0) {
        console.warn(`No stock entries found for material: ${material.name}`);
        return 0;
      }

      // CRITICAL: Verify the actual unit being used for calculation
      console.log(`🔍 Calculating cost for ${material.name} with unit ${ingredient.unit}:`, {
        ingredient: {
          materialId: ingredient.materialId,
          quantity: ingredient.quantity,
          unit: ingredient.unit, // This should match what was selected in the dropdown
          type: ingredient.type
        },
        material: {
          name: material.name,
          baseUnit: material.baseUnit,
          unitType: material.unitType,
          packageQuantity: material.packageQuantity
        },
        stockEntries: relevantStockEntries.length
      });

      if (material.unitType === "package" && ingredient.unit === "box" && material.baseUnit === "piece" && !["ml", "cl", "dl", "l", "fl_oz"].includes(material.baseUnit)) {
        console.log(`📦 Special case: Package material with box unit and piece base unit`);

        // Find the most recent or relevant stock entry
        const entry = relevantStockEntries[0]; // Using first entry as default

        // Try to calculate cost per box directly
        if (entry.costPerPurchasedUnit && entry.costPerPurchasedUnit > 0 && (entry.purchasedUnit === "box" || !entry.purchasedUnit)) {
          // If we have cost per purchased unit and it's in boxes, use directly
          const costPerBox = parseFloat(String(entry.costPerPurchasedUnit));
          const finalCost = ingredient.quantity * costPerBox;

          console.log(`📊 Box calculation (direct):`, {
            costPerBox,
            quantity: ingredient.quantity,
            finalCost
          });

          return isNaN(finalCost) ? 0 : finalCost;
        } else if (entry.totalCost && entry.totalCost > 0 && entry.purchasedQuantity && entry.purchasedQuantity > 0) {
          // Calculate cost per box from total cost
          const totalCost = parseFloat(String(entry.totalCost));
          const purchasedQuantity = parseFloat(String(entry.purchasedQuantity));
          const costPerBox = totalCost / purchasedQuantity;
          const finalCost = ingredient.quantity * costPerBox;

          console.log(`📊 Box calculation (from total):`, {
            totalCost,
            purchasedQuantity,
            costPerBox,
            quantity: ingredient.quantity,
            finalCost
          });

          return isNaN(finalCost) ? 0 : finalCost;
        }
        // If we can't calculate directly, fall through to standard calculation
        console.log(`⚠️ Could not calculate box cost directly, falling back to standard calculation`);
      }

      let totalWeightedCost = 0;
      let totalQuantity = 0;

      for (const entry of relevantStockEntries) {
        const quantity = parseFloat(String(entry.purchasedQuantity)) || 0;
        if (quantity <= 0) continue;

        let unitCost = 0;

        // Priority 1: Use costPerBaseUnit if available
        if (entry.costPerBaseUnit && entry.costPerBaseUnit > 0) {
          unitCost = parseFloat(String(entry.costPerBaseUnit));
          console.log(`📊 Using costPerBaseUnit: ${unitCost} per ${material.baseUnit}`);
        }
        // Priority 2: Calculate from totalCost
        else if (entry.totalCost && entry.totalCost > 0) {
          const totalCost = parseFloat(String(entry.totalCost));

          // For package materials, need to calculate cost per base unit correctly
          if (material.unitType === "package") {
            let actualPackageSize = material.packageQuantity || 1;

            // Infer standard bottle sizes if packageQuantity is 1 or missing
            if (actualPackageSize <= 1) {
              if (material.baseUnit === "cl") {
                actualPackageSize = 75; // 750ml = 75cl
              } else if (material.baseUnit === "ml") {
                actualPackageSize = 750; // 750ml
              }
            }

            // Total cost is for 'quantity' bottles, each bottle has 'actualPackageSize' base units
            const totalBaseUnits = quantity * actualPackageSize;
            unitCost = totalCost / totalBaseUnits;

            console.log(`📦 Package calculation:`, {
              totalCost,
              quantity: `${quantity} bottles`,
              actualPackageSize: `${actualPackageSize} ${material.baseUnit} per bottle`,
              totalBaseUnits: `${totalBaseUnits} ${material.baseUnit}`,
              unitCost: `${unitCost} per ${material.baseUnit}`
            });
          } else {
            unitCost = totalCost / quantity;
            console.log(`📊 Non-package calculation: ${totalCost} / ${quantity} = ${unitCost}`);
          }
        }
        // Priority 3: Use costPerPurchasedUnit with conversion
        else if (entry.costPerPurchasedUnit && entry.costPerPurchasedUnit > 0) {
          const purchasedUnitCost = parseFloat(String(entry.costPerPurchasedUnit));

          if (material.unitType === "package") {
            let actualPackageSize = material.packageQuantity || 1;
            if (actualPackageSize <= 1) {
              if (material.baseUnit === "cl") {
                actualPackageSize = 75;
              } else if (material.baseUnit === "ml") {
                actualPackageSize = 750;
              }
            }
            unitCost = purchasedUnitCost / actualPackageSize;
            console.log(`📦 Package from purchased unit: ${purchasedUnitCost} / ${actualPackageSize} = ${unitCost}`);
          } else {
            try {
              const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
              unitCost = purchasedUnitCost / conversionFactor;
              console.log(`🔄 Conversion: ${purchasedUnitCost} / ${conversionFactor} = ${unitCost}`);
            } catch (error) {
              console.error(`Error converting cost units for ${material.name}:`, error);
              continue;
            }
          }
        }

        if (unitCost > 0) {
          totalWeightedCost += unitCost * quantity;
          totalQuantity += quantity;
          console.log(`✅ Added to calculation: unitCost=${unitCost}, quantity=${quantity}`);
        } else {
          console.warn(`❌ Could not determine unit cost for entry:`, entry);
        }
      }

      if (totalQuantity <= 0) {
        console.warn(`No valid quantity data for material ${material.name}`);
        return 0;
      }

      const costPerBaseUnit = totalWeightedCost / totalQuantity;
      console.log(`💰 Final cost per ${material.baseUnit}: ${costPerBaseUnit}`);

      // Special case for package materials with volume units (cl, ml) OR when unit is box/bottle
      // Also handle materials with bottle as base unit but volume inputs
      // Using type assertions to help TypeScript understand our comparisons
      const materialBaseUnit = material.baseUnit as string;
      // CRITICAL: Get the unit directly from the ingredient parameter to ensure we're using what was selected
      const ingredientUnit = ingredient.unit as string;
      const materialName = material.name as string;

      console.log(`🔎 UNIT CHECK: Material ${materialName} has base unit ${materialBaseUnit}, ingredient unit is ${ingredientUnit}`);

      // Check if this is a package material with volume units or a bottle with volume information
      // Use type assertions to help TypeScript understand our type comparisons
      const isPackageMaterial = material.unitType === "package";
      const isVolumeType = material.unitType === "volume";
      const isClBaseUnit = materialBaseUnit === "cl";
      const isBottleBaseUnit = materialBaseUnit === "bottle";
      const isVolumeIngredientUnit = ["cl", "ml", "l"].includes(ingredientUnit);
      const isBoxOrBottleUnit = ["box", "bottle"].includes(ingredientUnit);

      // Handle both package materials with volume-based units and single bottle materials with volume info
      if ((isPackageMaterial || isVolumeType) && (isClBaseUnit || isBottleBaseUnit) && (isVolumeIngredientUnit || isBoxOrBottleUnit)) {
        console.log(`🍸 Special case: Package material handling for ${material.name} with unit ${ingredient.unit}`);

        // Get the first stock entry to determine bottle cost
        const entry = relevantStockEntries[0];
        if (!entry) return 0;

        // Get bottle cost - this is the cost of one bottle, not the box cost
        // For package materials, we should use costPerBaseUnit which is the cost per bottle
        const bottleCost = parseFloat(String(entry.costPerBaseUnit || 0));
        console.log(`💲 Using bottle cost: $${bottleCost} per bottle (from costPerBaseUnit)`);

        // Log the entry data for debugging
        console.log(`📦 Stock entry data:`, {
          costPerBaseUnit: entry.costPerBaseUnit,
          costPerPurchasedUnit: entry.costPerPurchasedUnit
        });

        let bottleVolume = 0;
        let bottleVolumeUnit = "";

        if (material.volumePerBottle) {
          // If volumePerBottle is available, use it
          bottleVolume = material.volumePerBottle;
          bottleVolumeUnit = material.volumeUnit || "cl";
        } else {
          // Fallback to standard bottle sizes
          bottleVolume = 75; // Standard bottle size
          bottleVolumeUnit = "cl";
        }

        console.log(`🔍 Material details for ${material.name}:`, {
          type: material.type,
          bottleVolume: `${bottleVolume} ${bottleVolumeUnit}`,
          bottleCost: `$${bottleCost}`,
          packageQuantity: material.packageQuantity || 1,
          ingredientUnit,
          ingredientQuantity: ingredient.quantity
        });

        let finalCost = 0;

        // Check if the material was actually purchased in bottles but ingredient is specified in boxes
        const firstStockEntry = relevantStockEntries[0];
        const purchasedUnit = firstStockEntry?.purchasedUnit || "";

        console.log(`🧪 Ingredient unit verification:`, {
          materialId: ingredient.materialId,
          ingredientUnit, // This should match what was selected in the dropdown
          materialName: material.name,
          materialBaseUnit: material.baseUnit,
          materialType: material.unitType,
          purchasedUnit: purchasedUnit
        });

        // FIXED: Respect both the selected unit AND the material's actual unit in the database
        // First, get the material's input unit from the database
        const materialInputUnit = material.inputUnit || "bottle";

        console.log(`🔍 Material ${material.name} database info:`, {
          baseUnit: material.baseUnit,
          inputUnit: materialInputUnit,
          unitType: material.unitType,
          selectedUnit: ingredientUnit
        });

        // CRITICAL FIX: For volume-based packages (like Jager with cl base unit),
        // we should NEVER use box calculations even if the unit is "box"
        // Instead, we should force it to use the volume calculation path
        const isVolumeBasedPackage = ["ml", "cl", "dl", "l", "fl_oz"].includes(material.baseUnit);
        const shouldForceVolumeCalculation = isVolumeBasedPackage && ingredientUnit === "box";

        if (shouldForceVolumeCalculation) {
          console.log(`⚠️ Detected volume-based package with box unit. Forcing volume calculation for ${material.name}`);
          
          // Get the first stock entry to determine bottle cost and volume
          const entry = relevantStockEntries[0];
          if (!entry) return 0;
          
          // Get bottle volume - standard bottle size if not specified
          let bottleVolume = material.volumePerBottle || 75; // Default 75cl for standard bottle
          const bottleVolumeUnit = material.volumeUnit || "cl";
          
          // Get cost per bottle
          const bottleCost = parseFloat(String(entry.costPerBaseUnit || 0));
          
          // Calculate cost per cl (or other base unit)
          const costPerVolumeUnit = bottleCost / bottleVolume;
          
          // For a single cl, the cost is costPerVolumeUnit
          // So for the ingredient quantity (e.g., 10), the cost is quantity * costPerVolumeUnit
          finalCost = ingredient.quantity * costPerVolumeUnit;
          
          console.log(`📊 Corrected calculation for volume-based package:`, {
            bottleCost: `$${bottleCost}`,
            bottleVolume: `${bottleVolume} ${bottleVolumeUnit}`,
            costPerVolumeUnit: `$${costPerVolumeUnit.toFixed(4)} per ${bottleVolumeUnit}`,
            quantity: `${ingredient.quantity} ${material.baseUnit}`,
            finalCost: `$${finalCost.toFixed(2)}`
          });
          
          // CRITICAL FIX: Update the ingredient unit to show the base unit in the UI
          // This ensures that the UI shows "cl" instead of "box" for volume-based packages
          ingredient.unit = material.baseUnit;

          return isNaN(finalCost) ? 0 : finalCost;
        }

        // Handle different unit types based on what was selected
        if (isVolumeIngredientUnit) {
          // Handle volume units (ml, cl, l)
          // Convert ingredient quantity to the same unit as the bottle volume
          let volumeInBottleUnits = ingredient.quantity;

          // Handle unit conversions between ml, cl, and l using getConversionFactor
          if (ingredientUnit !== bottleVolumeUnit) {
            try {
              // Use the existing conversion utility to handle all volume conversions
              const conversionFactor = getConversionFactor(ingredientUnit, bottleVolumeUnit, "volume", material);
              volumeInBottleUnits = ingredient.quantity * conversionFactor;
              console.log(`📊 Converting ${ingredient.quantity} ${ingredientUnit} to ${volumeInBottleUnits} ${bottleVolumeUnit} (factor: ${conversionFactor})`);
            } catch (error) {
              console.error(`Error converting volume units from ${ingredientUnit} to ${bottleVolumeUnit}:`, error);
              // Fallback to direct calculation if conversion fails
              if (ingredientUnit === "ml" && bottleVolumeUnit === "cl") {
                volumeInBottleUnits = ingredient.quantity / 10;
              } else if (ingredientUnit === "cl" && bottleVolumeUnit === "ml") {
                volumeInBottleUnits = ingredient.quantity * 10;
              } else if (ingredientUnit === "l" && bottleVolumeUnit === "ml") {
                volumeInBottleUnits = ingredient.quantity * 1000;
              } else if (ingredientUnit === "l" && bottleVolumeUnit === "cl") {
                volumeInBottleUnits = ingredient.quantity * 100;
              } else if (ingredientUnit === "ml" && bottleVolumeUnit === "l") {
                volumeInBottleUnits = ingredient.quantity / 1000;
              } else if (ingredientUnit === "cl" && bottleVolumeUnit === "l") {
                volumeInBottleUnits = ingredient.quantity / 100;
              }
            }
          }

          // Calculate cost based on the proportion of the bottle used
          finalCost = (volumeInBottleUnits / bottleVolume) * bottleCost;

          console.log(`📊 Volume calculation:`, {
            bottleCost: `$${bottleCost}`,
            bottleVolume: `${bottleVolume} ${bottleVolumeUnit}`,
            ingredientVolume: `${ingredient.quantity} ${ingredient.unit}`,
            convertedVolume: `${volumeInBottleUnits} ${bottleVolumeUnit}`,
            volumeRatio: `${(volumeInBottleUnits / bottleVolume).toFixed(4)}`,
            finalCost: `$${finalCost.toFixed(2)}`
          });
        } else if (ingredientUnit === "bottle") {
          // For bottle inputs, simply multiply by bottle cost
          finalCost = ingredient.quantity * bottleCost;
          console.log(`🍾 Bottle calculation: ${ingredient.quantity} bottles × $${bottleCost.toFixed(2)}/bottle = $${finalCost.toFixed(2)}`);
        } else if (ingredientUnit === "box" || ingredientUnit === "pack" || ingredientUnit === "case") {
          // For box/pack/case inputs, consider the package quantity
          const packageQuantity = material.packageQuantity || 1;
          const boxCost = bottleCost * packageQuantity;
          finalCost = ingredient.quantity * boxCost;

          console.log(`📦 ${ingredientUnit.charAt(0).toUpperCase() + ingredientUnit.slice(1)} calculation:`, {
            bottleCost: `$${bottleCost}`,
            bottlesPerBox: packageQuantity,
            boxCost: `$${boxCost}`,
            quantity: `${ingredient.quantity} ${ingredientUnit}`,
            finalCost: `$${finalCost.toFixed(2)}`
          });
        } else {
          // For any other unit, use the material's actual unit for calculation
          console.log(`⚠️ Using default calculation for unit ${ingredientUnit}`);
          finalCost = ingredient.quantity * bottleCost;
        }

        return isNaN(finalCost) ? 0 : finalCost;
      }

      // Standard calculation for other cases
      try {
        const conversionFactor = getConversionFactor(ingredient.unit, material.baseUnit, material.unitType || "piece", material);
        const ingredientQuantityInBaseUnits = ingredient.quantity * conversionFactor;
        const finalCost = ingredientQuantityInBaseUnits * costPerBaseUnit;

        console.log(`🎯 Standard calculation:`, {
          ingredientQuantity: `${ingredient.quantity} ${ingredient.unit}`,
          conversionFactor,
          ingredientQuantityInBaseUnits: `${ingredientQuantityInBaseUnits} ${material.baseUnit}`,
          costPerBaseUnit: `${costPerBaseUnit} per ${material.baseUnit}`,
          finalCost
        });

        return isNaN(finalCost) ? 0 : finalCost;
      } catch (error) {
        console.error(`Error calculating final cost for ${material.name}:`, error);
        return 0;
      }
    },
    [materials, stockEntries]
  );

  // Handle variant ingredient changes
  const handleVariantIngredientChange = useCallback((variantName: string, ingredients: MenuItemIngredient[]) => {
    setVariantIngredients(prev => ({
      ...prev,
      [variantName]: ingredients
    }));
  }, []);

  // Add ingredient to variant
  const addIngredientToVariant = useCallback(
    (variantName: string, materialId: string, quantity: number, unit: string) => {
      // Debug log to verify the actual unit being passed
      console.log(`🔍 Adding ingredient to variant ${variantName}:`, {
        materialId,
        quantity,
        selectedUnit: unit, // Log the actual unit selected by the user
        material: materials.find(m => String(m.id) === materialId)?.name
      });

      // Find the material to verify its properties
      const material = materials.find(m => String(m.id) === materialId);
      if (material) {
        console.log(`📊 Material details for ${material.name} before cost calculation:`, {
          baseUnit: material.baseUnit,
          unitType: material.unitType,
          packageQuantity: material.packageQuantity || "N/A"
        });
      }

      // Create the ingredient object with explicit unit assignment
      const ingredientForCalculation = {
        materialId,
        quantity,
        unit, // Explicitly using the unit from parameter
        type: "material"
      };

      // Debug log right before cost calculation
      console.log(`💰 Passing to calculateVariantIngredientCost:`, ingredientForCalculation);

      // Check if this is a volume-based package that needs unit conversion
      const isVolumeBasedPackage = material && ["ml", "cl", "dl", "l", "fl_oz"].includes(material.baseUnit) && unit === "box";
      
      // Calculate the cost
      const calculatedCost = calculateVariantIngredientCost(ingredientForCalculation);
      
      // For volume-based packages with box unit, use the base unit (cl, ml, etc.) instead of box
      const displayUnit = isVolumeBasedPackage ? material.baseUnit : unit;
      
      // Create the new ingredient with the correct unit for display
      const newIngredient: MenuItemIngredient = {
        materialId,
        quantity,
        unit: displayUnit, // Use the correct unit for display
        cost: calculatedCost,
        type: "material"
      };

      console.log(`💸 Cost calculation result: $${calculatedCost.toFixed(4)} for ${quantity} ${displayUnit}`);

      setVariantIngredients(prev => ({
        ...prev,
        [variantName]: [...(prev[variantName] || []), newIngredient]
      }));
    },
    [calculateVariantIngredientCost, materials]
  );

  // Remove ingredient from variant
  const removeIngredientFromVariant = useCallback((variantName: string, index: number) => {
    setVariantIngredients(prev => ({
      ...prev,
      [variantName]: prev[variantName]?.filter((_, i) => i !== index) || []
    }));
  }, []);

  // Load existing variants when editing
  useEffect(() => {
    if (menuItem?.id && enableVariants) {
      const loadVariants = async () => {
        try {
          const existingVariants = await variantsAPI.getVariantsByMenuItemId(Number(menuItem.id));
          setVariants(existingVariants);

          // Set selected variant types and inputs based on existing variants
          const selectedTypes = existingVariants.map(v => v.name);
          setSelectedVariantTypes(selectedTypes);

          const inputs: Record<string, { volume: string; unit: string; price: string }> = {};
          existingVariants.forEach(variant => {
            inputs[variant.name] = {
              volume: variant.volume,
              unit: variant.unit,
              price: variant.price
            };
          });
          setVariantInputs(inputs);
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

    // If category is already an ID
    if (typeof menuItem.category === "string") {
      setCategoryId(menuItem.category);
      return;
    }

    // If category is an object
    if (typeof menuItem.category === "object" && menuItem.category !== null) {
      // Try to find by id
      if ("id" in menuItem.category) {
        setCategoryId(String(menuItem.category.id));
        return;
      }
      // Try to find by _id
      if ("_id" in menuItem.category && (menuItem.category as any)._id) {
        setCategoryId(String((menuItem.category as any)._id));
        return;
      }
      // Try to find by name
      if ("name" in menuItem.category && (menuItem.category as any).name) {
        const categoryObj = categories.find(cat => cat.name === (menuItem.category as any).name || cat.id === (menuItem.category as any).id);
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

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!categoryId) newErrors.category = "Category is required";

    // Price validation - only required if no variants are selected
    if (selectedVariantTypes.length === 0) {
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        newErrors.price = "Price is required";
      }
    } else {
      // Validate that all selected variants have valid prices
      const invalidVariants = selectedVariantTypes.filter(variant => {
        const variantInput = variantInputs[variant];
        return !variantInput?.price || isNaN(parseFloat(variantInput.price)) || parseFloat(variantInput.price) <= 0;
      });

    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, categoryId, price, selectedVariantTypes, variantInputs]);

  useEffect(() => {
    validateForm();
  }, [name, categoryId, price, selectedVariantTypes, variantInputs, validateForm]);

  // Initialize form data when editing existing menu item or when beverageStockEntries changes
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

  const handleBeverageNameChange = useCallback((value: string) => {
    setName(value);
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
      const isFormValid = hasNoErrors && hasName && hasCategory && (hasValidPrice || selectedVariantTypes.length > 0);
      if (isFormValid) {
        handleSubmit();
      }
    }
  };

  // Create variants after menu item is created/updated
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

  // Update variants for existing menu item
  const updateVariants = async (menuItemId: number) => {
    try {
      // Delete existing variants
      if (variants.length > 0) {
        const variantIds = variants.map(v => v.id);
        await variantsAPI.deleteVariantsBulk(variantIds);
      }

      // Create new variants
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
      menuItemSauces: [], // Add required menuItemSauces property
      isPOSItem,
      image: image || "",
      imageFile: imageFile,
      isBeverage: true,
      unit: "piece",
      availableQuantity: selectedBeverageStock?.purchasedQuantity ? parseFloat(selectedBeverageStock.purchasedQuantity.toString()) : undefined,
      costPerUnit: selectedBeverageStock?.costPerPurchasedUnit ? parseFloat(selectedBeverageStock.costPerPurchasedUnit.toString()) : undefined,
      variants: undefined // Remove variants from form data - handled separately
    };

    try {
      // Submit the menu item first
      const result = await onSubmit(formData);

      // Handle variants after menu item is created/updated
      if (enableVariants && selectedVariantTypes.length > 0) {
        const menuItemId = menuItem?.id ? Number(menuItem.id) : (result as any)?.id;
        if (menuItemId) {
          if (menuItem?.id) {
            await updateVariants(menuItemId);
          } else {
            await createVariants(menuItemId);
          }
        }
      }

      // Reset form
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
            {availableVariantTypes.map(variantType => (
              <label key={variantType.name} className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={selectedVariantTypes.includes(variantType.name)} onChange={e => handleVariantTypeChange(variantType.name, e.target.checked)} className="rounded border-gray-300" />
                <span className="text-sm capitalize">{variantType.name}</span>
              </label>
            ))}
          </div>

          {/* Variant Configuration */}
          {selectedVariantTypes.length > 0 && (
            <div className="space-y-4">
              {selectedVariantTypes.map(variantName => {
                const input = variantInputs[variantName];
                if (!input) return null;

                return (
                  <div key={variantName} className="border rounded-md p-4 space-y-4">
                    <h5 className="font-medium mb-2 capitalize">{variantName}</h5>

                    {/* Variant Basic Info */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Volume</label>
                        <Input type="number" value={input.volume} onChange={e => handleVariantInputChange(variantName, "volume", e.target.value)} placeholder="Volume" min="0" step="0.1" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Unit</label>
                        <select value={input.unit} onChange={e => handleVariantInputChange(variantName, "unit", e.target.value)} className="w-full px-3 py-2 border border-input bg-background rounded-md">
                          <option value="cl">cl</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>
                          <option value="oz">oz</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Price ($)</label>
                        <Input type="number" value={input.price} onChange={e => handleVariantInputChange(variantName, "price", e.target.value)} placeholder="0.00" min="0" step="0.01" />
                      </div>
                    </div>

                    {/* Variant Ingredients */}
                    <div className="border-t pt-3">
                      <h6 className="text-sm font-medium mb-3">Ingredients for {variantName}</h6>

                      {/* Existing Ingredients Table */}
                      {variantIngredients[variantName] && variantIngredients[variantName].length > 0 && (
                        <div className="mb-4">
                          <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-600 mb-2 px-2">
                            <div>Ingredient</div>
                            <div>Quantity</div>
                            <div>Unit</div>
                            <div>Cost</div>
                            <div></div>
                          </div>
                          {variantIngredients[variantName].map((ingredient, index) => {
                            const material = materials?.find(m => String(m.id) === ingredient.materialId);
                            return (
                              <div key={index} className="grid grid-cols-5 gap-2 items-center py-2 px-2 border rounded mb-2">
                                <div className="text-sm font-medium">
                                  {material?.name || "Unknown Material"}
                                  <div className="text-xs text-gray-500">Material</div>
                                </div>
                                <div className="text-sm">{ingredient.quantity}</div>
                                <div className="text-sm">{ingredient.unit}</div>
                                <div className="text-sm font-medium">${ingredient.cost.toFixed(2)}</div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeIngredientFromVariant(variantName, index)} className="h-6 w-6 p-0 text-red-500 hover:text-red-700">
                                  ×
                                </Button>
                              </div>
                            );
                          })}

                          {/* Total Cost */}
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between text-sm font-medium">
                              <span>Total Ingredients Cost:</span>
                              <span>${variantIngredients[variantName].reduce((sum, ing) => sum + ing.cost, 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Add New Ingredient */}
                      <VariantIngredientInput variantName={variantName} materials={materials} stockEntries={stockEntries} onAddIngredient={addIngredientToVariant} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {errors.variants && <p className="text-sm text-red-500 mt-1">{errors.variants}</p>}
        </div>
      )}

      {/* Cost Breakdown Section */}
      {selectedBeverageStock && (
        <CostBreakdown
          selectedBeverageStock={selectedBeverageStock}
          price={price}
          variantData={{
            selectedVariants: selectedVariantTypes,
            variantPrices: Object.fromEntries(selectedVariantTypes.map(name => [name, parseFloat(variantInputs[name]?.price || "0")])),
            variantVolumes: Object.fromEntries(selectedVariantTypes.map(name => [name, parseFloat(variantInputs[name]?.volume || "0")])),
            variantVolumeUnits: Object.fromEntries(selectedVariantTypes.map(name => [name, variantInputs[name]?.unit || "cl"]))
          }}
        />
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

      {/* Image Upload Section */}
      <div className="border-t pt-4">
        <ImageUpload value={image} onChange={handleImageChange} maxSizeInMB={5} acceptedFormats={["image/jpeg", "image/png", "image/webp", "image/gif"]} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} aria-label="Cancel form">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!name.trim() || !categoryId || (selectedVariantTypes.length === 0 && (!price || parseFloat(price) <= 0))}>
          {menuItem ? "Update" : "Create"} Beverage Item
        </Button>
      </div>
    </div>
  );
};
