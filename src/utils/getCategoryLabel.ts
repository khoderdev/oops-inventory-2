import { MATERIAL_CATEGORIES } from "@/types/inventory";

export const getCategoryLabel = (categoryValue: string) => {
  const category = MATERIAL_CATEGORIES.find(c => c.value === categoryValue);
  return category?.label || categoryValue;
};
