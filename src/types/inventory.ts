export type MaterialCategory = "meat" | "dairy" | "vegetables" | "grains" | "spices" | "beverages" | "packaging" | "other";

export type UnitType = "mass" | "volume" | "piece" | "package";

export interface Material {
  sectionAssignments: any[];
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

export interface MaterialWithStock extends Material {
  sectionAssignments: any;
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

export const MATERIAL_CATEGORIES: { value: MaterialCategory; label: string }[] = [
  { value: "meat", label: "Meat & Poultry" },
  { value: "dairy", label: "Dairy Products" },
  { value: "vegetables", label: "Vegetables & Fruits" },
  { value: "grains", label: "Grains & Cereals" },
  { value: "spices", label: "Spices & Seasonings" },
  { value: "beverages", label: "Beverages" },
  { value: "packaging", label: "Packaging Materials" },
  { value: "other", label: "Other" }
];

export const UNIT_OPTIONS = {
  mass: ["kg", "gram", "lb"],
  volume: ["liter", "ml", "gallon"],
  piece: ["piece", "unit"],
  package: ["box", "pack", "case", "bottle"]
};

export type Section = {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface SectionAssignment {
  materialId: string;
  id: string;
  sectionId: string;
  stockEntryId: string;
  assignedQuantity: number;
  assignedUnit: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionWithAssignments extends Section {
  assignments: (SectionAssignment & {
    stockEntry: StockEntry;
    material: Material;
  })[];
  totalValue: number;
}

export interface MaterialWithSectionAssignments extends MaterialWithStock {
  sectionAssignments: {
    sectionId: string;
    sectionName: string;
    assignedQuantity: number;
    assignedUnit: string;
  }[];
  availableQuantity: number;
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
}
