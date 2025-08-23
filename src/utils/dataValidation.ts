import { Material, StockEntry, MenuItemIngredient } from "@/types/inventory";
import { toast } from "@/components/ui/use-toast";

export interface ValidationIssue {
  type: "error" | "warning" | "info";
  category: "unit_mismatch" | "missing_data" | "cost_calculation" | "conversion_error" | "data_quality";
  materialId?: string;
  materialName?: string;
  stockEntryId?: string;
  ingredientUnit?: string;
  message: string;
  suggestion?: string;
  impact: "high" | "medium" | "low";
  autoFixable?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

export class DataValidator {
  private static instance: DataValidator;
  private validationCache = new Map<string, ValidationResult>();
  private lastValidation = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): DataValidator {
    if (!DataValidator.instance) {
      DataValidator.instance = new DataValidator();
    }
    return DataValidator.instance;
  }

  // Helper functions for unit type detection
  private isMassUnit(unit: string): boolean {
    const massUnits = ["kg", "kgs", "g", "gram", "grams", "lb", "lbs", "pound", "pounds", "oz", "ounce", "ounces"];
    return massUnits.includes(unit.toLowerCase());
  }

  private isVolumeUnit(unit: string): boolean {
    const volumeUnits = ["l", "liter", "liters", "ml", "milliliter", "milliliters", "gal", "gallon", "gallons", "fl oz", "fluid ounce", "fluid ounces"];
    return volumeUnits.includes(unit.toLowerCase());
  }

  private isPieceUnit(unit: string): boolean {
    const pieceUnits = ["piece", "pieces", "unit", "units", "item", "items", "each"];
    return pieceUnits.includes(unit.toLowerCase());
  }

  public getUnitTypeFromUnit(unit: string): "mass" | "volume" | "piece" | "unknown" {
    if (this.isMassUnit(unit)) return "mass";
    if (this.isVolumeUnit(unit)) return "volume";
    if (this.isPieceUnit(unit)) return "piece";
    return "unknown";
  }

  // Validate a single material
  validateMaterial(material: Material): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!material.name || material.name.trim() === "") {
      issues.push({
        type: "error",
        category: "missing_data",
        materialId: material.id,
        materialName: material.name,
        message: "Material name is missing or empty",
        suggestion: "Provide a descriptive name for the material",
        impact: "high",
        autoFixable: false
      });
    }

    if (!material.baseUnit || material.baseUnit.trim() === "") {
      issues.push({
        type: "error",
        category: "missing_data",
        materialId: material.id,
        materialName: material.name,
        message: "Base unit is missing",
        suggestion: "Set an appropriate base unit (g, ml, piece, etc.)",
        impact: "high",
        autoFixable: false
      });
      return issues; // Can't continue validation without base unit
    }

    if (!material.inputUnit || material.inputUnit.trim() === "") {
      issues.push({
        type: "warning",
        category: "missing_data",
        materialId: material.id,
        materialName: material.name,
        message: "Input unit is missing",
        suggestion: "Set an input unit for purchasing (kg, l, pack, etc.)",
        impact: "medium",
        autoFixable: false
      });
    }

    // Check unit type consistency
    const baseUnitType = this.getUnitTypeFromUnit(material.baseUnit);
    const inputUnitType = material.inputUnit ? this.getUnitTypeFromUnit(material.inputUnit) : "unknown";
    const declaredUnitType = material.unitType;

    // Check if declared unitType matches baseUnit
    if (declaredUnitType && baseUnitType !== "unknown" && declaredUnitType !== baseUnitType) {
      const suggestedUnitType = baseUnitType;
      issues.push({
        type: "error",
        category: "unit_mismatch",
        materialId: material.id,
        materialName: material.name,
        message: `Unit type mismatch: declared '${declaredUnitType}' but baseUnit '${material.baseUnit}' is ${baseUnitType}`,
        suggestion: `Change unitType to '${suggestedUnitType}' or change baseUnit to match '${declaredUnitType}' type`,
        impact: "high",
        autoFixable: true
      });
    }

    // Check if inputUnit and baseUnit are compatible
    if (material.inputUnit && baseUnitType !== "unknown" && inputUnitType !== "unknown" && baseUnitType !== inputUnitType && declaredUnitType !== "package") {
      issues.push({
        type: "error",
        category: "unit_mismatch",
        materialId: material.id,
        materialName: material.name,
        message: `Input unit '${material.inputUnit}' (${inputUnitType}) incompatible with base unit '${material.baseUnit}' (${baseUnitType})`,
        suggestion: `Use compatible units or set unitType to 'package' if using different unit types`,
        impact: "high",
        autoFixable: true
      });
    }

    // Check package quantity for package type materials
    if (material.unitType === "package") {
      if (!material.packageQuantity || material.packageQuantity <= 0) {
        issues.push({
          type: "error",
          category: "missing_data",
          materialId: material.id,
          materialName: material.name,
          message: "Package quantity is missing or invalid for package type material",
          suggestion: "Set packageQuantity to indicate how many base units are in one input unit",
          impact: "high",
          autoFixable: false
        });
      }
    } else if (material.packageQuantity && material.packageQuantity > 0) {
      issues.push({
        type: "info",
        category: "data_quality",
        materialId: material.id,
        materialName: material.name,
        message: "Package quantity is set but material is not package type",
        suggestion: 'Consider changing unitType to "package" or remove packageQuantity',
        impact: "low",
        autoFixable: true
      });
    }

    return issues;
  }

  // Validate stock entries for a material
  validateStockEntries(material: Material, stockEntries: StockEntry[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!stockEntries || stockEntries.length === 0) {
      issues.push({
        type: "warning",
        category: "missing_data",
        materialId: material.id,
        materialName: material.name,
        message: "No stock entries found for material",
        suggestion: "Add stock entries to enable cost calculations",
        impact: "medium",
        autoFixable: false
      });
      return issues;
    }

    stockEntries.forEach(entry => {
      // Check for missing cost data
      const hasCostData = (entry.costPerBaseUnit && entry.costPerBaseUnit > 0) || (entry.totalCost && entry.totalCost > 0) || (entry.costPerPurchasedUnit && entry.costPerPurchasedUnit > 0);

      if (!hasCostData) {
        issues.push({
          type: "warning",
          category: "cost_calculation",
          materialId: material.id,
          materialName: material.name,
          stockEntryId: entry.id,
          message: "Stock entry has no cost data",
          suggestion: "Add totalCost, costPerPurchasedUnit, or costPerBaseUnit",
          impact: "medium",
          autoFixable: false
        });
      }

      // Check for missing quantity data
      const hasQuantityData = (entry.purchasedIndividualQuantity && entry.purchasedIndividualQuantity > 0) || (entry.purchasedQuantity && entry.purchasedQuantity > 0);

      if (!hasQuantityData) {
        issues.push({
          type: "error",
          category: "missing_data",
          materialId: material.id,
          materialName: material.name,
          stockEntryId: entry.id,
          message: "Stock entry has no quantity data",
          suggestion: "Add purchasedQuantity or purchasedIndividualQuantity",
          impact: "high",
          autoFixable: false
        });
      }

      // Check unit compatibility
      if (entry.purchasedUnit && material.baseUnit) {
        const entryUnitType = this.getUnitTypeFromUnit(entry.purchasedUnit);
        const materialBaseUnitType = this.getUnitTypeFromUnit(material.baseUnit);

        if (entryUnitType !== "unknown" && materialBaseUnitType !== "unknown" && entryUnitType !== materialBaseUnitType && material.unitType !== "package") {
          issues.push({
            type: "error",
            category: "unit_mismatch",
            materialId: material.id,
            materialName: material.name,
            stockEntryId: entry.id,
            message: `Stock entry unit '${entry.purchasedUnit}' (${entryUnitType}) incompatible with material base unit '${material.baseUnit}' (${materialBaseUnitType})`,
            suggestion: `Use compatible units or fix material configuration`,
            impact: "high",
            autoFixable: false
          });
        }
      }
    });

    return issues;
  }

  // Validate ingredient against material
  validateIngredient(ingredient: MenuItemIngredient, material: Material): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!ingredient.unit || ingredient.unit.trim() === "") {
      issues.push({
        type: "error",
        category: "missing_data",
        materialId: material.id,
        materialName: material.name,
        message: "Ingredient unit is missing",
        suggestion: "Specify the unit for the ingredient quantity",
        impact: "high",
        autoFixable: false
      });
      return issues;
    }

    if (!ingredient.quantity || ingredient.quantity <= 0) {
      issues.push({
        type: "error",
        category: "missing_data",
        materialId: material.id,
        materialName: material.name,
        message: "Ingredient quantity is missing or invalid",
        suggestion: "Specify a positive quantity for the ingredient",
        impact: "high",
        autoFixable: false
      });
    }

    // Check unit compatibility
    if (material.baseUnit) {
      const ingredientUnitType = this.getUnitTypeFromUnit(ingredient.unit);
      const materialBaseUnitType = this.getUnitTypeFromUnit(material.baseUnit);

      if (ingredientUnitType !== "unknown" && materialBaseUnitType !== "unknown" && ingredientUnitType !== materialBaseUnitType && material.unitType !== "package") {
        issues.push({
          type: "error",
          category: "unit_mismatch",
          materialId: material.id,
          materialName: material.name,
          ingredientUnit: ingredient.unit,
          message: `Ingredient unit '${ingredient.unit}' (${ingredientUnitType}) incompatible with material base unit '${material.baseUnit}' (${materialBaseUnitType})`,
          suggestion: `Use compatible units: ${materialBaseUnitType === "mass" ? "g, kg, lb, oz" : materialBaseUnitType === "volume" ? "ml, l, gal" : "piece, unit"}`,
          impact: "high",
          autoFixable: true
        });
      }
    }

    return issues;
  }

  // Comprehensive validation
  validateData(stockEntries: StockEntry[], ingredients?: MenuItemIngredient[], materials?: Material[]): ValidationResult {
    const cacheKey = `${stockEntries.length}-${ingredients?.length || 0}`;
    const now = Date.now();

    // Check cache
    if (this.validationCache.has(cacheKey) && this.lastValidation.has(cacheKey) && now - this.lastValidation.get(cacheKey)! < this.CACHE_DURATION) {
      return this.validationCache.get(cacheKey)!;
    }

    const allIssues: ValidationIssue[] = [];
    
    // Create a map of materials by ID for quick lookup
    const materialsMap = new Map<string, Material>();
    if (materials) {
      materials.forEach(material => materialsMap.set(material.id, material));
    }

    // Validate ingredients if provided
    if (ingredients) {
      ingredients.forEach(ingredient => {
        // First try to find the material in the provided materials array
        let material: Material | undefined = undefined;
        
        if (materials) {
          material = materialsMap.get(ingredient.materialId);
        }
        
        // If material not found in materials array, try to extract from stockEntries
        if (!material) {
          const stockEntry = stockEntries.find(entry => entry.materialId === ingredient.materialId);
          
          if (stockEntry) {
            // Check if stockEntry has a material property (StockEntryWithMaterial)
            if ((stockEntry as any).material) {
              material = (stockEntry as any).material;
            } else {
              // Create a minimal Material object from the StockEntry
              material = {
                id: stockEntry.materialId,
                name: 'Unknown Material',
                category: 'other',
                baseUnit: stockEntry.purchasedUnit || 'piece',
                unitType: 'piece',
                costPerUnit: stockEntry.costPerBaseUnit || 0
              };
            }
          }
        }
        
        if (material) {
          const ingredientIssues = this.validateIngredient(ingredient, material);
          allIssues.push(...ingredientIssues);
        } else {
          allIssues.push({
            type: "error",
            category: "missing_data",
            materialId: ingredient.materialId,
            message: `Material not found for ingredient (ID: ${ingredient.materialId})`,
            suggestion: "Ensure the material exists in the database",
            impact: "high",
            autoFixable: false
          });
        }
      });
    }

    // Count issues by type
    const summary = {
      errors: allIssues.filter(issue => issue.type === "error").length,
      warnings: allIssues.filter(issue => issue.type === "warning").length,
      infos: allIssues.filter(issue => issue.type === "info").length
    };

    const result: ValidationResult = {
      isValid: summary.errors === 0,
      issues: allIssues,
      summary
    };

    // Cache result
    this.validationCache.set(cacheKey, result);
    this.lastValidation.set(cacheKey, now);

    return result;
  }

  // Show validation results to user
  showValidationResults(result: ValidationResult, context: string = "Data Validation"): void {
    if (result.isValid && result.summary.warnings === 0 && result.summary.infos === 0) {
      toast({
        title: "✅ Data Validation Passed",
        description: "No data inconsistencies found.",
        duration: 3000
      });
      return;
    }

    // Group issues by material
    const issuesByMaterial = new Map<string, ValidationIssue[]>();
    result.issues.forEach(issue => {
      const key = issue.materialName || issue.materialId || "Unknown";
      if (!issuesByMaterial.has(key)) {
        issuesByMaterial.set(key, []);
      }
      issuesByMaterial.get(key)!.push(issue);
    });

    // Show summary toast
    const { errors, warnings, infos } = result.summary;
    const totalIssues = errors + warnings + infos;

    toast({
      title: `⚠️ ${context} Issues Found`,
      description: `${totalIssues} issues: ${errors} errors, ${warnings} warnings, ${infos} info`,
      variant: errors > 0 ? "destructive" : "default",
      duration: 5000
    });

    // Log detailed issues to console
    console.group(`🔍 ${context} - Detailed Issues`);

    issuesByMaterial.forEach((issues, materialName) => {
      console.group(`📦 Material: ${materialName}`);
      issues.forEach(issue => {
        const icon = issue.type === "error" ? "❌" : issue.type === "warning" ? "⚠️" : "ℹ️";
        console.log(`${icon} [${issue.category.toUpperCase()}] ${issue.message}`);
        if (issue.suggestion) {
          console.log(`   💡 Suggestion: ${issue.suggestion}`);
        }
        if (issue.autoFixable) {
          console.log(`   🔧 Auto-fixable: Yes`);
        }
      });
      console.groupEnd();
    });

    console.groupEnd();
  }

  // Clear cache
  clearCache(): void {
    this.validationCache.clear();
    this.lastValidation.clear();
  }
}

// Export singleton instance
export const dataValidator = DataValidator.getInstance();
