import { ReportType } from "@/components/analytics/configs";
import { stockSchema } from "@/components/stock/stockSchema";
import { z } from "zod";

export type MaterialCategory = "meat" | "dairy" | "vegetables" | "grains" | "spices" | "beverages" | "packaging" | "other";

export type UnitType = "mass" | "volume" | "piece" | "package";

//-----------------------------------------------------------------------------
// Negative Stock Support Types
//-----------------------------------------------------------------------------

export interface NegativeStockWarning {
  materialId: string;
  materialName: string;
  type?: "assignment" | "stockEntry" | string;
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

export interface StockRestorationItem {
  type: "individual_item" | "menu_item_ingredient";
  materialId: number;
  materialName: string;
  assignmentId?: number;
  stockEntryId: number;
  menuItemId?: number;
  menuItemName?: string;
  quantityRestored: number;
  unit: string;
  oldAssignmentQuantity?: number;
  newAssignmentQuantity?: number;
  oldStockQuantity: number;
  newStockQuantity: number;
  action?: string;
}

export interface RevertSaleResponse {
  message: string;
  saleId: string;
  stockRestorationReport: StockRestorationItem[];
  totalItemsRestored: number;
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
  section?: {
    id: string;
    name: string;
  };
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItemSale {
  menuItemId: string;
  menuItemName?: string;
  menuItemDescription?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  ingredients: Array<{
    materialId: string;
    materialName?: string;
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

export interface ItemSale {
  id: string;
  saleId: string;
  saleDate: Date;
  sectionId?: string;
  sectionName?: string;
  itemName: string;
  itemType: "individual" | "menu";
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalPrice: number;
  materialId?: string;
  menuItemId?: string;
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

//-----------------------------------------------------------------------------
// Stock Operations Types

export interface AddStockData {
  materialId: string;
  additionalQuantity: number;
  unit: string;
  additionDate?: Date;
  notes?: string;
}

export interface RecordWasteData {
  materialId: string;
  wasteQuantity: number;
  unit: string;
  wasteReason: string;
  wasteDate?: Date;
  notes?: string;
}

export interface AddStockResponse {
  message: string;
  stockEntry: StockEntry;
}

export interface RecordWasteResponse {
  message: string;
  wasteRecord: StockEntry;
  updatedEntries: Array<{
    id: string;
    originalQuantity: number;
    reducedBy: number;
    newQuantity: number;
  }>;
  reason: string;
}

export type StockFormData = z.infer<typeof stockSchema>;

// Form interface with string types for inputs
export interface StockFormInputs {
  materialId: string;
  supplier: string;
  purchasedQuantity: string;
  purchasedUnit: string;
  costPerPurchasedUnit: string;
  totalCost: string;
  purchaseDate: Date;
  expiryDate?: Date;
  batchNumber?: string;
  notes?: string;
  stockEntryId?: string; // For specific entry operations
}

export interface StockFormProps {
  materials: MaterialWithStock[];
  stockEntry?: StockEntry;
  selectedMaterialId?: string;
  onSubmit: (data: StockFormData) => void;
  onAddStock?: (data: StockFormData) => void;
  onRecordWaste?: (data: StockFormData) => void;
  onAddToSpecificEntry?: (data: StockFormData) => void;
  onWasteFromSpecificEntry?: (data: StockFormData) => void;
  onCancel: () => void;
}

export interface ReportConfig {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresDateRange: boolean;
}

export interface ReportGeneratorProps {
  className?: string;
}

//-----------------------------------------------------------------------------
// Day Operations Types

export interface StockSnapshot {
  stockEntryId: number;
  materialId: number;
  materialName: string;
  materialCategory: string;
  quantity: number;
  unit: string;
  supplier: string;
  costPerUnit: number;
  snapshotTime: Date;
}

export interface StockVariance {
  stockEntryId: number;
  materialId: number;
  materialName: string;
  openingQuantity: number;
  closingQuantity: number;
  variance: number;
  unit: string;
  varianceType: 'gain' | 'loss';
}

export interface DailyReportData {
  date: string;
  operationalHours: number;
  sales: {
    totalAmount: number;
    totalTransactions: number;
    averageTicket: number;
    salesBySection: Record<string, { count: number; total: number }>;
  };
  cash: {
    opening: number;
    expected: number;
    actual: number;
    variance: number;
    variancePercentage: number;
  };
  inventory: {
    totalVariances: number;
    gains: number;
    losses: number;
    significantVariances: StockVariance[];
  };
  generatedAt: Date;
}

export interface ActivityLog {
  timestamp: Date;
  type: 'SALE' | 'STOCK' | 'INVENTORY' | 'OTHER';
  userId: string;
  details: {
    method: string;
    endpoint: string;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    query?: Record<string, string>;
  };
}

export interface DayOperation {
  id: number;
  date: string;
  status: 'opened' | 'closed';
  openedAt: Date;
  closedAt?: Date;
  openedBy: string;
  closedBy?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash: number;
  cashVariance: number;
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  openingStockSnapshot: StockSnapshot[];
  closingStockSnapshot: StockSnapshot[];
  stockVariances: StockVariance[];
  autoReportGenerated: boolean;
  reportData: DailyReportData;
  notes?: string;
  activityLogs?: ActivityLog[];
  lastActivity?: Date;
  realTimeUpdate?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpenDayRequest {
  openingCash?: number;
  openedBy?: string;
  notes?: string;
}

export interface CloseDayRequest {
  closingCash: number;
  closedBy?: string;
  notes?: string;
}

export interface DayOperationResponse {
  message: string;
  dayOperation: DayOperation;
  stockItemsCaptured?: number;
  dailyReport?: DailyReportData;
  summary?: {
    totalSales: number;
    totalTransactions: number;
    averageTicket: number;
    cashVariance: number;
    stockVariances: number;
  };
}

export interface DayOperationsListResponse {
  dayOperations: DayOperation[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface DayActivitiesResponse {
  activities: ActivityLog[];
  totalActivities: number;
  lastActivity?: Date;
  dayStatus: 'opened' | 'closed';
}
