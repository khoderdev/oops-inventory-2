import { Material, MenuItemIngredient } from "@/types/inventory";
import { useMemo } from "react";
import { getConversionFactor } from "./getConversionFactor";

export const getIngredientCost = (ingredient: Omit<MenuItemIngredient, "cost">, materials: Material[]) => {
  const material = materials.find(m => m.id === ingredient.materialId);
  if (!material) return 0;
  const costPerUnit = material.costPerBaseUnit || 0;
  const conversionFactor = getConversionFactor(ingredient.unit, material.baseUnit, material.unitType, material);
  return ingredient.quantity * conversionFactor * costPerUnit;
};

export const useTotalIngredientCost = (ingredients: MenuItemIngredient[], materials: Material[]) =>
  useMemo(() => {
    return ingredients.reduce((sum, i) => sum + getIngredientCost(i, materials), 0);
  }, [ingredients, materials]);
