export type MaterialCategory = "meat" | "dairy" | "vegetables" | "grains" | "spices" | "beverages" | "packaging" | "other";

export type UnitType = "mass" | "volume" | "piece" | "package";

//-----------------------------------------------------------------------------
// Negative Stock Support Types
//-----------------------------------------------------------------------------

export interface NegativeStockWarning {
  materialId: string;
  materialName: string;
  type?: 'assignment' | 'stockEntry' | string;
  stockEntryId?: string;
  availableQuantity: number;
  requiredQuantity: number;
  shortageQuantity: number;
  unit: string;
  action?: string;
}

export interface NegativeStockReportItem {
  stockEntryId: string;
  materialId: string;
  materialName: string;
  category: string;
  supplier: string;
  purchasedQuantity: number;
  purchasedUnit: string;
  purchasedIndividualQuantity: number;
  purchasedIndividualUnit: string;
  lastUpdated: Date;
  isVirtualEntry: boolean;
}

export interface NegativeStockReport {
  totalNegativeEntries: number;
  negativeStockItems: NegativeStockReportItem[];
  summary: {
    totalVirtualEntries: number;
    categorySummary: Record<string, number>;
  };
  generatedAt: Date;
  message: string;
}

export interface SaleResponse {
  sale: SaleRecord;
  updatedStockEntries?: StockEntryWithMaterial[];
  message: string;
  negativeStockWarnings?: NegativeStockWarning[];
  hasNegativeStock?: boolean;
}

//-----------------------------------------------------------------------------

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  baseUnit: string;
  unitType: UnitType;
  inputUnit?: string; // Original input unit from MaterialForm (e.g., "box", "pack")
  costPerUnit: number;
  costPerBaseUnit?: number;
  packageQuantity?: number; // For package units: how many base units per package
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateMaterialData {
  name: string;
  category: MaterialCategory;
  baseUnit: string;
  unitType: UnitType;
  inputUnit?: string;
  costPerBaseUnit?: number;
  packageQuantity?: number;
  description?: string;
}

export interface UpdateMaterialData {
  name?: string;
  category?: MaterialCategory;
  baseUnit?: string;
  unitType?: UnitType;
  inputUnit?: string;
  costPerBaseUnit?: number;
  packageQuantity?: number;
  description?: string;
}

//-----------------------------------------------------------------------------

export interface StockEntry {
  id: string;
  materialId: string;
  supplier: string;
  purchasedQuantity: number;
  purchasedUnit: string;
  purchasedIndividualQuantity?: number;
  purchasedIndividualUnit?: string;
  purchasedConvertedQuantity?: number;
  purchasedConvertedUnit?: string;
  costPerPurchasedUnit: number;
  totalCost: number;
  purchaseDate: Date;
  expiryDate?: Date;
  batchNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockEntryWithMaterial extends StockEntry {
  material?: Material;
}

export interface CreateStockEntryData {
  materialId: string;
  supplier: string;
  purchasedQuantity: number;
  purchasedUnit: string;
  purchasedIndividualQuantity?: number;
  purchasedIndividualUnit?: string;
  purchasedConvertedQuantity?: number;
  purchasedConvertedUnit?: string;
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
  purchasedIndividualQuantity?: number;
  purchasedIndividualUnit?: string;
  purchasedConvertedQuantity?: number;
  purchasedConvertedUnit?: string;
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

//-----------------------------------------------------------------------------

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
  sectionId: string;
  itemType: "stockEntry" | "menuItem";
  materialId: string | null;
  menuItemId: string | null;
  stockEntryId: string | null;
  assignedQuantity: number | null;
  assignedUnit: string | null;
  assignedIndividualQuantity?: number | null; // Integer - whole number of individual units for package materials
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  material?: Material;
  stockEntry?: StockEntry;
  menuItem?: MenuItem;
  section?: Section;
}

export interface CreateSectionAssignmentData {
  sectionId: string;
  itemType: "stockEntry" | "menuItem";
  materialId?: string;
  menuItemId?: string;
  stockEntryId?: string;
  assignedQuantity?: number;
  assignedUnit?: string;
  assignedIndividualQuantity?: number;
  notes?: string;
}

export interface UpdateSectionAssignmentData {
  sectionId?: string;
  itemType?: "stockEntry" | "menuItem";
  materialId?: string;
  menuItemId?: string;
  stockEntryId?: string;
  assignedQuantity?: number;
  assignedUnit?: string;
  assignedIndividualQuantity?: number;
  notes?: string;
}

export interface SectionWithAssignments extends Section {
  assignments: Array<
    SectionAssignment & {
      stockEntry: StockEntry;
      material: Material;
      menuItem: MenuItem;
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

//-----------------------------------------------------------------------------

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
  saleDate: Date;
  items: SoldItem[];
  menuItems: MenuItemSale[];
  totalAmount: number;
  sectionId: string;
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

export type CartItem = {
  id: string;
  type: "individual" | "menu";
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
  assignmentId?: string;
  menuItemId?: number;
  ingredients?: { materialId: number; quantity: number; unit: string }[];
};

export interface POSPanelProps {
  materials: MaterialWithStock[];
  sectionAssignments: SectionAssignment[];
}

//-----------------------------------------------------------------------------

export type MenuItemCategory = "appetizers" | "mains" | "sides" | "desserts" | "beverages" | "other";

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  category: MenuItemCategory;
  price: number;
  ingredients: MenuItemIngredient[];
  menuItemIngredients: boolean;
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

//-----------------------------------------------------------------------------

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
  package: ["box", "pack", "case", "bottle", "piece"]
};

// Menu categories
export const MENU_CATEGORIES = [
  { value: "appetizers", label: "Appetizers" },
  { value: "mains", label: "Main Courses" },
  { value: "sides", label: "Sides" },
  { value: "desserts", label: "Desserts" },
  { value: "beverages", label: "Beverages" },
  { value: "other", label: "Other" }
];
