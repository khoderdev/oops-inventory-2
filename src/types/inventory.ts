export type MaterialCategory = "meat" | "dairy" | "vegetables" | "grains" | "spices" | "beverages" | "packaging" | "other";

export type UnitType = "mass" | "volume" | "piece" | "package";

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  baseUnit: string;
  unitType: UnitType;
  costPerBaseUnit: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaterialData {
  name: string;
  category: MaterialCategory;
  baseUnit: string;
  unitType: UnitType;
  costPerBaseUnit: number;
  description?: string;
}

export interface UpdateMaterialData {
  name?: string;
  category?: MaterialCategory;
  baseUnit?: string;
  unitType?: UnitType;
  costPerBaseUnit?: number;
  description?: string;
}

export interface StockEntry {
  id: string;
  materialId: string;
  supplier: string;
  purchasedQuantity: number;
  purchasedUnit: string;
  costPerPurchasedUnit: number;
  totalCost: number;
  purchaseDate: Date;
  expiryDate?: Date;
  batchNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStockEntryData {
  materialId: string;
  supplier: string;
  purchasedQuantity: number;
  purchasedUnit: string;
  costPerPurchasedUnit: number;
  totalCost: number;
  purchaseDate: Date;
  expiryDate?: Date;
  batchNumber?: string;
  notes?: string;
}

export interface UpdateStockEntryData {
  materialId?: string;
  supplier?: string;
  purchasedQuantity?: number;
  purchasedUnit?: string;
  costPerPurchasedUnit?: number;
  totalCost?: number;
  purchaseDate?: Date;
  expiryDate?: Date;
  batchNumber?: string;
  notes?: string;
}

export interface MaterialWithStock extends Material {
  availableQuantity: number;
  stockEntries: StockEntry[];
  totalQuantityInBaseUnit: number;
  totalValue: number;
  averageCostPerBaseUnit: number;
}

export interface ConversionData {
  convertedQuantity: number;
  convertedUnit: string;
  costPerBaseUnit: number;
  totalCostInBaseUnit: number;
  conversionFactor: number;
}

export const MATERIAL_CATEGORIES: ReadonlyArray<{ value: MaterialCategory; label: string }> = [
  { value: "meat", label: "Meat & Poultry" },
  { value: "dairy", label: "Dairy Products" },
  { value: "vegetables", label: "Vegetables & Fruits" },
  { value: "grains", label: "Grains & Cereals" },
  { value: "spices", label: "Spices & Seasonings" },
  { value: "beverages", label: "Beverages" },
  { value: "packaging", label: "Packaging Materials" },
  { value: "other", label: "Other" }
];

export const UNIT_OPTIONS: Readonly<Record<UnitType, ReadonlyArray<string>>> = {
  mass: ["kg", "g", "lb", "oz"],
  volume: ["l", "ml", "gal", "fl oz"],
  piece: ["piece", "unit", "dozen"],
  package: ["box", "pack", "case", "bottle"]
};

export interface Section {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSectionData {
  name: string;
  description?: string;
}

export interface UpdateSectionData {
  name?: string;
  description?: string;
}

export interface SectionAssignment {
  id: string;
  materialId: string;
  sectionId: string;
  stockEntryId: string;
  assignedQuantity: number;
  assignedUnit: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionWithAssignments extends Section {
  assignments: Array<
    SectionAssignment & {
      stockEntry: StockEntry;
      material: Material;
    }
  >;
  totalValue: number;
}

export interface MaterialWithSectionAssignments extends MaterialWithStock {
  sectionAssignments: Array<{
    sectionId: string;
    sectionName: string;
    assignedQuantity: number;
    assignedUnit: string;
  }>;
}

export interface SoldItem {
  assignmentId: string;
  materialId: string;
  sectionId: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleRecord {
  id: string;
  date: Date;
  items: SoldItem[];
  totalAmount: number;
  sectionId: string;
  customerName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItemSale {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  ingredients: Array<{
    materialId: string;
    quantity: number;
    unit: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export type MenuItemCategory = "appetizers" | "mains" | "sides" | "desserts" | "beverages" | "other";

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  category: MenuItemCategory;
  price: number;
  ingredients: MenuItemIngredient[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItemIngredient {
  materialId: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface CreateMenuItemData {
  name: string;
  description?: string;
  category: MenuItemCategory;
  price: number;
  ingredients: MenuItemIngredient[];
}

export interface UpdateMenuItemData {
  name?: string;
  description?: string;
  category?: MenuItemCategory;
  price?: number;
  ingredients?: MenuItemIngredient[];
}
