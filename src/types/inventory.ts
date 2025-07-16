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

//---------------------------------------------------------------------------------

export const mockMaterials: Material[] = [
  {
    id: "1",
    name: "Ground Beef",
    category: "meat",
    baseUnit: "kg",
    unitType: "mass",
    costPerBaseUnit: 3.3,
    description: "Fresh ground beef for burger patties",
    createdAt: new Date(),
    updatedAt: new Date(),
    availableQuantity: 0
  },
  {
    id: "2",
    name: "Burger Buns",
    category: "grains",
    baseUnit: "piece",
    unitType: "piece",
    costPerBaseUnit: 0.25,
    description: "Sesame seed burger buns",
    createdAt: new Date(),
    updatedAt: new Date(),
    availableQuantity: 0
  },
  {
    id: "3",
    name: "Pickles",
    category: "vegetables",
    baseUnit: "kg",
    unitType: "mass",
    costPerBaseUnit: 1.1,
    description: "Dill pickle slices",
    createdAt: new Date(),
    updatedAt: new Date(),
    availableQuantity: 0
  }
];

export const mockSections: Section[] = [
  {
    id: "1",
    name: "Kitchen",
    description: "Main food preparation area",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    name: "Bar",
    description: "Beverage preparation and service",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockAssignments: SectionAssignment[] = [
  {
    id: "1",
    materialId: "1",
    sectionId: "1",
    stockEntryId: "1",
    assignedQuantity: 5,
    assignedUnit: "kg",
    notes: "For daily burger production",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    materialId: "2",
    sectionId: "1",
    stockEntryId: "2",
    assignedQuantity: 24,
    assignedUnit: "piece",
    notes: "For lunch service",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockStockEntries: StockEntry[] = [
  {
    id: "1",
    materialId: "1",
    supplier: "Fresh Meat Co.",
    purchasedQuantity: 10,
    purchasedUnit: "kg",
    costPerPurchasedUnit: 3.3,
    totalCost: 33.0,
    purchaseDate: new Date("2024-01-15"),
    expiryDate: new Date("2024-01-25"),
    batchNumber: "BEEF-001",
    notes: "Grade A ground beef",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    materialId: "2",
    supplier: "Baker's Best",
    purchasedQuantity: 48,
    purchasedUnit: "piece",
    costPerPurchasedUnit: 0.25,
    totalCost: 12.0,
    purchaseDate: new Date("2024-01-14"),
    expiryDate: new Date("2024-01-21"),
    batchNumber: "BUNS-001",
    notes: "Fresh sesame buns",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    materialId: "3",
    supplier: "Veggie Distributors",
    purchasedQuantity: 3,
    purchasedUnit: "kg",
    costPerPurchasedUnit: 1.1,
    totalCost: 3.3,
    purchaseDate: new Date("2024-01-13"),
    expiryDate: new Date("2024-03-13"),
    batchNumber: "PICKLE-001",
    notes: "Premium dill pickles",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Menu categories
export const MENU_CATEGORIES = [
  { value: "appetizers", label: "Appetizers" },
  { value: "mains", label: "Main Courses" },
  { value: "sides", label: "Sides" },
  { value: "desserts", label: "Desserts" },
  { value: "beverages", label: "Beverages" },
  { value: "other", label: "Other" }
];
