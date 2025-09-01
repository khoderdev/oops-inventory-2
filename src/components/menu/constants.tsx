import { Material, StockEntry, Sauce, MenuItemIngredient } from "@/types/inventory";

export interface VariantIngredientInputProps {
  variantName: string;
  materials: Material[];
  stockEntries: StockEntry[];
  sauces?: Sauce[];
  existingIngredients?: MenuItemIngredient[];
  onAddIngredient: (variantName: string, ingredient: MenuItemIngredient) => void;
  onRemoveIngredient?: (variantName: string, ingredientIndex: number) => void;
  errors?: {
    ingredients?: string;
    ingredientQuantity?: string;
  };
}

export const getVariantColorScheme = (variant: string) => {
  const colorSchemes = {
    bottle: { border: "border-blue-300", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-800", accent: "border-l-blue-500" },
    can: { border: "border-green-300", bg: "bg-green-50", badge: "bg-green-100 text-green-800", accent: "border-l-green-500" },
    glass: { border: "border-purple-300", bg: "bg-purple-50", badge: "bg-purple-100 text-purple-800", accent: "border-l-purple-500" },
    large: { border: "border-indigo-300", bg: "bg-indigo-50", badge: "bg-indigo-100 text-indigo-800", accent: "border-l-indigo-500" },
    shot: { border: "border-red-300", bg: "bg-red-50", badge: "bg-red-100 text-red-800", accent: "border-l-red-500" },
    default: { border: "border-slate-300", bg: "bg-slate-50", badge: "bg-slate-100 text-slate-800", accent: "border-l-slate-500" }
  };
  const variantLower = variant.toLowerCase();
  return colorSchemes[variantLower as keyof typeof colorSchemes] || colorSchemes.default;
};

export const unitGroups = {
  mass: {
    label: "Mass",
    units: ["g", "kg", "lb", "oz"]
  },
  volume: {
    label: "Volume",
    units: ["ml", "cl", "dl", "l", "fl_oz", "cup", "pt", "qt", "gal"]
  },
  package: {
    label: "Package",
    units: ["piece", "box", "bag", "pack", "bottle", "can"]
  },
  container: {
    label: "Container",
    units: ["bottle", "can"]
  },
  count: {
    label: "Count",
    units: ["piece", "unit", "each", "serving"]
  },
  custom: {
    label: "Custom",
    units: []
  }
};
