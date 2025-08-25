import { ReportType } from "@/components/analytics/configs";
import { assignmentSchema } from "@/components/sections/assignmentSchema";
import { stockSchema } from "@/components/stock/stockSchema";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Employee } from "./employee";
import { Order, OrderStatus, OrderSummary, OrderType } from "./orders";
import { Category } from "./categories";

// Interface for pagination metadata
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
  meta?: {
    requestTime: string;
    totalDataSize: number;
    negativeEntriesCount?: number;
  };
}

// Legacy hardcoded material categories for backward compatibility
export type MaterialCategory = "meat" | "dairy" | "vegetables" | "grains" | "spices" | "beverages" | "alcohol" | "packaging" | "other" | "sweets" | "tobacco" | "hot" | "cold";

// New material category type that can be either a legacy string or a Category object from the API
export type MaterialCategoryType = MaterialCategory | Category | number | { id: number; name: string; value: string };

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
  materialId: string;
  materialName: string;
  assignmentId?: number;
  stockEntryId: string;
  menuItemId?: string;
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
  totalAmount: number;
  updatedStockEntries?: StockEntryWithMaterial[];
  message: string;
  negativeStockWarnings?: NegativeStockWarning[];
  hasNegativeStock?: boolean;
}

//-----------------------------------------------------------------------------

export interface Material {
  id: string;
  name: string;
  category: MaterialCategoryType;
  categoryId?: number;
  baseUnit: string;
  unitType: UnitType;
  inputUnit?: string;
  costPerUnit: number;
  packageQuantity?: number;
  description?: string;
  isPOSItem?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Form data interfaces
export interface MaterialFormData {
  name: string;
  category: string; // Match materialSchema which expects string
  baseUnit: string;
  unitType: UnitType;
  inputUnit: string;
  packageQuantity?: number;
  description?: string;
  categoryId?: number | string;
  // For internal use after form processing
  _categoryObject?: MaterialCategoryType;
}

export interface MaterialFormProps {
  material?: Material;
  onSubmit: (data: MaterialFormData) => void;
  onCancel: () => void;
}

export interface CreateMaterialData {
  name: string;
  category?: MaterialCategoryType;
  categoryId?: number;
  baseUnit: string;
  unitType: UnitType;
  inputUnit?: string;
  packageQuantity?: number;
  description?: string;
  isPOSItem?: boolean;
}

export interface UpdateMaterialData {
  name?: string;
  category?: MaterialCategoryType;
  categoryId?: number | string;
  baseUnit?: string;
  unitType?: UnitType;
  inputUnit?: string;
  packageQuantity?: number;
  description?: string;
  isPOSItem?: boolean;
}

export interface MaterialTableProps {
  filteredMaterials: MaterialWithStock[];
  categories: Category[];
  onEditMaterial: (material: MaterialWithStock) => void;
  onBulkEdit: (materialIds: string[], data: any) => void;
  onBulkDelete: (materialIds: string[]) => void;
  onAddStock: (materialId: string) => void;
  onDeleteMaterial: (materialId: string) => void;
}

// Interface for cached data
export interface CachedMaterialData {
  materials: MaterialWithStock[];
  pagination: PaginationInfo;
  timestamp: number;
  searchTerm: string;
  categoryFilter: string;
  sortBy: string;
  sortOrder: string;
}

export interface CachedStockEntryData {
  stockEntries: StockEntryWithMaterial[];
  pagination: PaginationInfo;
  timestamp: number;
  searchTerm: string;
  materialFilter: string;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
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
  costPerBaseUnit?: number;
  purchaseDate: Date;
  expiryDate?: Date;
  batchNumber?: string;
  notes?: string;
  isPOSItem: boolean;
  printerId?: number | null;
  assignedPrinter?: {
    id: number;
    name: string;
    type: string;
    status: string;
  };
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

export type StockEntriesTableProps = {
  stockEntries?: StockEntry[];
  materials?: Material[];
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
  onDeleteStockEntry?: (stockEntryId: string | number) => Promise<void> | void;
  onTogglePOSVisibility?: (entry: StockEntry & { material?: Material }) => Promise<void> | void;
  onAssign?: (id: string | number, printerId: number | null) => Promise<StockEntry | void>;
  onBulkAssign?: (ids: (string | number)[], printerId: number | null) => Promise<StockEntry[] | void>;
};

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

export type AssignmentFormData = z.infer<typeof assignmentSchema>;

export interface AssignmentFormProps {
  sections: Section[];
  stockEntries: StockEntry[];
  materials: Material[];
  menuItems: MenuItem[];
  assignment?: SectionAssignment;
  existingAssignments?: SectionAssignment[];
  onSubmit: (data: CreateSectionAssignmentData | UpdateSectionAssignmentData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  selectedSectionId?: string;
  onAssignAll?: (sectionId: string, itemType: "stockEntry" | "menuItem", items: StockEntry[] | MenuItem[]) => void | Promise<void>;
}

//-----------------------------------------------------------------------------

export interface SoldItem {
  quantity: number;
  unitPrice: number;
  materialId: string;
  totalPrice: number;
  assignmentId?: string | null;
  materialName?: string;
  unit?: string;
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
  creator?: {
    username: string;
  };
  order?: {
    id: string;
    orderNumber: string;
    orderType: string;
    customerName?: string;
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
}

export type CartItem = {
  id: string;
  type: "individual" | "menu_item";
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
  assignmentId?: string;
  menuItemId?: string;
  ingredients?: { materialId: string; quantity: number; unit: string }[];
};

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

//------------------------------------------------------------------------------------------

export interface ReceiptData {
  id: string;
  date: string;
  time: string;
  cashier: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    type: "material" | "menu_item";
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentAmount: number;
  change: number;
  paymentMethod: string;
  // Discount information
  discountType?: "percentage" | "fixed" | null;
  discountValue?: number | null;
  discountAmount?: number | null;
  discountReason?: string | null;
  // Employee and order information
  employeeName?: string | null;
  orderType?: string;
  tableNumber?: number | null;
}

export interface ReceiptPrinterProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
  autoPrint?: boolean;
  onPrintSuccess?: () => void;
  businessInfo?: {
    name: string;
    address: string;
    phone: string;
    taxId?: string;
  };
}
//------------------------------------------------------------------------------------------

export interface POSPanelProps {
  materials: MaterialWithStock[];
  sectionAssignments: SectionAssignment[];
}

export interface POSCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "material" | "menu_item";
  originalItem: StockEntryWithMaterial | MenuItem;
  posItem?: POSItem;
  stockEntryId?: string;
  menuItemId?: string;
  printerId?: number | null;
  assignedPrinter?: {
    id: number;
    name: string;
    type: string;
    status: string;
  };
  // Backend order item ID when editing an existing order
  orderItemId?: string;
  notes?: string; // Individual item notes for kitchen/sections
}

export interface POSClientProps {
  sectionAssignments: SectionAssignment[];
  onSaleComplete?: (saleData: SaleResponse) => void;
  onOrderSelect?: (order: OrderSummary) => void;
  selectedOrderForPOS?: Order | null;
  onOrderProcessed?: () => void;
  refreshCountsRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  isDayOpen?: boolean;
}

export interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  paymentAmount: string;
  onPaymentAmountChange: (amount: string) => void;
  onPayment: () => void;
  isLoading: boolean;
}

// Unified POS Item types for new endpoint
export interface POSItem {
  id: string;
  type: "menu_item" | "stock_entry";
  name: string;
  description?: string;
  price: number;
  category: string | Category | number | { id: number; name: string; value: string };
  unit: string;
  availableQuantity: number;
  costPerUnit: number;
  materialId?: string;
  menuItemId?: number | string;
  material?: Material;
  ingredients?: Array<{
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
    cost: number;
  }>;
  stockEntries?: Array<{
    id: string;
    supplier: string;
    purchasedQuantity: number;
    purchasedUnit: string;
    purchasedIndividualQuantity: number;
    costPerBaseUnit: number;
    totalCost: number;
    purchaseDate: string;
    expiryDate?: string;
    printerId?: number | null;
    assignedPrinter?: {
      id: number;
      name: string;
      type: string;
      status: string;
    };
  }>;
  printerId?: number | null;
  assignedPrinter?: {
    id: number;
    name: string;
    type: string;
    status: string;
  };
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface POSItemsResponse {
  success: boolean;
  data: POSItem[];
  summary: {
    totalItems: number;
    menuItems: number;
    stockEntries: number;
    categories: string[];
    totalStockValue: number;
    lastUpdated: string;
  };
  message: string;
}

export interface ProductGridProps {
  posItems: POSItem[];
  onAddToCart: (item: POSItem) => void;
  rightPanelPixelWidth?: number;
  isLoading?: boolean;
}

export interface OrderSummaryProps {
  cart: POSCartItem[];
  subtotal: number;
  total: number;
  onPaymentClick: () => void;
  onSaveClick: () => void;
  orderStatus?: OrderStatus;
  isOrderCompleted?: boolean;
  appliedDiscount?: {
    type: "percentage" | "fixed";
    value: number;
    amount: number;
    reason?: string;
  } | null;
  onRemoveDiscount?: () => void;
}

export interface OrderItemsListProps {
  cart: POSCartItem[];
  updateCartQuantity: (cartId: string, newQuantity: number) => void;
  orderType: OrderType;
  selectedTable?: Table;
  selectedEmployee?: Employee;
  onOrderTypeChange: (type: OrderType) => void;
  onTableSelect: () => void;
  onEmployeeSelect: (employee: Employee) => void;
  incompleteTableOrdersCount?: number;
  orderStatus?: OrderStatus;
  isOrderCompleted?: boolean;
  discountReason?: string;
  leftPanelPixelWidth?: number;
  onItemNotesChange?: (itemId: string, notes: string) => void;
  onShowItemNotes?: (item: POSCartItem) => void;
}

export interface POSLayoutProps {
  children: React.ReactNode;
  currentTotal?: number;
  transactionCount?: number;
  incompleteOrdersCount?: number;
  onOrderSelect?: (order: Order) => void;
  onLogout?: () => void;
  onRefreshCounts?: (refreshFn: () => Promise<void>) => void;
}

export interface POSClientOrdersProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOrderSelect?: (order: OrderSummary) => void;
  onOrderStatusChange?: () => void; // Callback to refresh table badges when order status changes
}

export interface OrderFilters {
  status?: OrderStatus;
  orderType?: OrderType;
  searchTerm?: string;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
}

export interface POSClientSalesProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOrderSelect?: (order: Order) => void;
}

export interface SalesFilters {
  status?: OrderStatus;
  orderType?: OrderType;
  searchTerm?: string;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
}

export interface Table {
  table: Table;
  id: string;
  number: number;
  name?: string;
  seats: number;
  status: "available" | "opened" | "reserved" | "cleaning";
  position: { x: number; y: number };
  shape: "round" | "square" | "rectangle";
  section?: string;
  currentOrder?: {
    orderId: string;
    orderNumber?: string;
    customerName?: string;
    startTime: Date | string;
    totalAmount: number;
    itemCount: number;
  };
}

export interface TablesLayoutProps {
  tables: Table[];
  selectedTable?: Table;
  onTableSelect: (table: Table) => void;
  onClose: () => void;
  tableOrders?: { [tableId: string]: number }; // For notification badges
}

export interface CategoryTabsProps {
  categories: string[] | Category[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

//-----------------------------------------------------------------------------

// Legacy hardcoded menu item categories for backward compatibility
export type MenuItemCategory = "appetizers" | "burgers" | "sandwiches" | "plates" | "pasta" | "sushi" | "pizza" | "salads" | "desserts" | "breakfast" | "shisha";

// New menu item category type that can be either a legacy string or a Category object from the API
export type MenuItemCategoryType = MenuItemCategory | Category | number | { id: number; name: string; value: string };

// Legacy hardcoded beverage item categories for backward compatibility
export type BeverageItemCategory = "beverages" | "cold" | "hot" | "alcohol";

// New beverage item category type that can be either a legacy string or a Category object from the API
export type BeverageItemCategoryType = BeverageItemCategory | Category | number | { id: number; name: string; value: string };

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  category: MenuItemCategoryType | null;
  categoryId?: number;
  price: number;
  ingredients: MenuItemIngredient[];
  menuItemIngredients?: MenuItemIngredient[];
  isPOSItem?: boolean;
  image?: string;
  printerId?: number | null;
  assignedPrinter?: {
    id: number;
    name: string;
    type: string;
    status: string;
  };
  isBeverage?: boolean;
  unit?: string | null;
  availableQuantity?: number | null;
  costPerUnit?: number | null;
  variants?: {
    selectedVariants: string[];
    variantVolumes: Record<string, number>;
    variantVolumeUnits: Record<string, string>;
    variantPrices: Record<string, number>;
    nameFormat?: "prefix" | "suffix";
  };
  createdAt: Date;
  updatedAt: Date;
}


export interface CategoryOption {
  id: number | string;
  value: string;
  name: string;
}

export interface BeverageItemFormProps {
  menuItem?: MenuItem;
  categories: CategoryOption[];
  materials?: Material[];
  stockEntries?: StockEntry[];
  onSubmit: (
    data: Omit<MenuItem, "id" | "createdAt" | "updatedAt"> & {
      variants?: {
        selectedVariants: string[];
        variantVolumes: Record<string, number>;
        variantVolumeUnits: Record<string, string>;
        variantPrices: Record<string, number>;
        nameFormat?: "prefix" | "suffix";
      };
      imageFile?: File;
    }
  ) => void;
  onCancel: () => void;
  enableVariants?: boolean;
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
  category?: MenuItemCategoryType | null;
  categoryId?: number;
  price: number;
  ingredients: MenuItemIngredient[];
  isPOSItem?: boolean;
  image?: string;
  isBeverage?: boolean;
  unit?: string;
  availableQuantity?: number;
  costPerUnit?: number;
  variants?:
    | {
        selectedVariants: string[];
        variantVolumes: Record<string, number>;
        variantVolumeUnits: Record<string, string>;
        variantPrices: Record<string, number>;
        nameFormat?: "prefix" | "suffix";
      }
    | Record<string, { volume: number; unit: string; price: number }>;
}

export interface UpdateMenuItemData {
  name?: string;
  description?: string;
  category?: MenuItemCategoryType | null;
  categoryId?: number;
  price?: number;
  ingredients?: MenuItemIngredient[];
  isPOSItem?: boolean;
  image?: string;
  unit?: string;
  availableQuantity?: number;
  costPerUnit?: number;
  variants?:
    | {
        selectedVariants: string[];
        variantVolumes: Record<string, number>;
        variantVolumeUnits: Record<string, string>;
        variantPrices: Record<string, number>;
        nameFormat?: "prefix" | "suffix";
      }
    | Record<string, { volume: number; unit: string; price: number }>;
}

export interface MenuItemBuilderProps {
  menuItems: MenuItem[];
  categories?: Category[];
  categoriesLoading?: boolean;
  categoriesError?: string | null;
  onCreateMenuItem?: (menuItem: CreateMenuItemData, imageFile?: File) => Promise<void>;
  onUpdateMenuItem?: (id: string, menuItem: Partial<MenuItem>) => Promise<void>;
  onDeleteMenuItem?: (id: string) => Promise<void>;
}

//-----------------------------------------------------------------------------

export interface Printer {
  id: number;
  name: string;
  type: string;
  ipAddress?: string;
  port?: number;
  status: "online" | "offline" | "error";
  location?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UNIT_OPTIONS: Readonly<Record<UnitType, ReadonlyArray<string>>> = {
  mass: ["kg", "g", "lb", "oz"],
  volume: ["l", "ml", "gal", "fl oz"],
  piece: ["piece", "unit", "dozen"],
  package: ["box", "pack", "case", "bottle", "piece"]
};

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
  category?: string;
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
export interface WasteRecord {
  materialId: string;
  materialName: string;
  quantity: number;
  category?: string;
  unit: string;
  reason: string;
  totalCost: number;
  costPerBaseUnit: number;
  wasteDate: Date | string;
  materialUnitType: string;
}
export interface RecordWasteTabProps {
  form: UseFormReturn<StockFormInputs>;
  materials: Material[];
  availableUnits: string[];
  onRecordWaste: (data: RecordWasteData) => void;
  onCancel: () => void;
}

// export type StockFormData = z.infer<typeof stockSchema>;

export interface StockFormData extends z.infer<typeof stockSchema> {
  materialId: string;
  supplier: string;
  purchasedQuantity: number;
  purchasedUnit: string;
  purchasedIndividualQuantity?: number;
  purchasedIndividualUnit?: string;
  costPerPurchasedUnit: number;
  totalCost: number;
  purchaseDate: Date;
  expiryDate?: Date;
  batchNumber?: string;
  notes?: string;
}

// Form interface with string types for inputs
export interface StockFormInputs {
  materialId: string;
  supplier?: string;
  purchasedQuantity: string;
  purchasedUnit: string;
  costPerPurchasedUnit: string;
  totalCost: string;
  purchaseDate: Date;
  expiryDate?: Date;
  batchNumber?: string;
  wasteQuantity: string;
  wasteReason: string;
  wasteDate?: Date;
  notes?: string;
  stockEntryId?: string;
}

export interface StockFormProps {
  materials: MaterialWithStock[];
  stockEntry?: StockEntry;
  selectedMaterialId?: string;
  onSubmit: (data: StockFormData) => void;
  onAddStock?: (data: AddStockData) => void;
  onRecordWaste?: (data: RecordWasteData) => void;
  onAddToSpecificEntry?: (data: StockFormData & { stockEntryId: string }) => void;
  onWasteFromSpecificEntry?: (data: StockFormData & { stockEntryId: string }) => void;
  onCancel: () => void;
}

export interface NewStockTabProps {
  form: UseFormReturn<StockFormInputs>;
  materials: Material[];
  availableUnits: string[];
  selectedMaterial: Material | undefined;
  watchedQuantity: string;
  watchedCostPerUnit: string;
  watchedTotalCost: string;
  stockEntry?: StockEntry;
  onSubmit: (data: StockFormData) => void;
  onCancel: () => void;
}

export interface UpdateEntryTabProps {
  form: UseFormReturn<StockFormInputs>;
  materials: Material[];
  availableUnits: string[];
  selectedMaterial: Material | undefined;
  watchedQuantity: string;
  watchedCostPerUnit: string;
  watchedTotalCost: string;
  stockEntry: StockEntry;
  onSubmit: (data: StockFormData) => void;
  onCancel: () => void;
}

export interface WasteFromEntryTabProps {
  form: UseFormReturn<StockFormInputs>;
  materials: Material[];
  availableUnits: string[];
  selectedMaterial: Material | undefined;
  watchedQuantity: string;
  watchedCostPerUnit: string;
  watchedTotalCost: string;
  stockEntry: StockEntry;
  onRecordWaste: (data: StockFormData & { stockEntryId: string }) => void;
  onCancel: () => void;
}

export interface AddToEntryTabProps {
  form: UseFormReturn<StockFormInputs>;
  materials: Material[];
  availableUnits: string[];
  selectedMaterial: Material | undefined;
  watchedQuantity: string;
  watchedCostPerUnit: string;
  watchedTotalCost: string;
  stockEntry: StockEntry | undefined;
  onAddToSpecificEntry: (data: StockFormData & { stockEntryId: string }) => void;
  onCancel: () => void;
}

//-----------------------------------------------------------------------------

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

export interface DailyReportsProps {
  className?: string;
}

//-----------------------------------------------------------------------------
// Sauce Management Types
//-----------------------------------------------------------------------------

export interface Sauce {
  ingredients: SauceIngredient[];
  id: string;
  name: string;
  description?: string;
  category: string;
  baseIngredients: SauceIngredient[];
  totalCost: number;
  costPerUnit: number;
  unit: string;
  yieldQuantity: number;
  preparationTime?: number;
  isPOSItem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SauceIngredient {
  materialId: string;
  materialName?: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface CreateSauceData {
  name: string;
  description?: string;
  category: string;
  baseIngredients: SauceIngredient[];
  yieldQuantity: number;
  unit: string;
  preparationTime?: number;
  isPOSItem?: boolean;
}

export interface UpdateSauceData {
  name?: string;
  description?: string;
  category?: string;
  baseIngredients?: SauceIngredient[];
  yieldQuantity?: number;
  unit?: string;
  preparationTime?: number;
  isPOSItem?: boolean;
  isActive?: boolean;
}

export interface SauceFormData {
  name: string;
  description?: string;
  category: string;
  baseIngredients: SauceIngredient[];
  yieldQuantity: string;
  unit: string;
  preparationTime?: string;
  isPOSItem?: boolean;
}

export interface SauceFormProps {
  sauce?: Sauce;
  materials: Material[];
  stockEntries?: StockEntry[];
  onSubmit: (data: SauceFormData) => void;
  onCancel: () => void;
}

export interface SauceTableProps {
  sauces: Sauce[];
  materials: Material[];
  onEditSauce: (sauce: Sauce) => void;
  onDeleteSauce: (sauceId: string) => void;
  onBulkDelete: (sauceIds: string[]) => void;
  onTogglePOSVisibility: (sauce: Sauce) => void;
}

export interface SauceManagementProps {
  materials: Material[];
  stockEntries: StockEntry[];
  onRefresh?: () => void;
}

// Sauce-specific types
export interface SauceIngredient {
  materialId: string;
  quantity: number;
  unit: string;
  cost: number;
  material?: Material;
}

export interface SauceCalculationResult {
  totalCost: number;
  estimatedYield: number;
  yieldUnit: string;
  costPerUnit: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    cost: number;
    normalizedQuantity: number;
    normalizedUnit: string;
  }>;
  calculationSteps: string[];
}

//-----------------------------------------------------------------------------

export interface DailyReportsModalProps {
  showReportModal: boolean;
  setShowReportModal: (show: boolean) => void;
  selectedReport: DailyReportData | null;
  error?: string | null;
  setError?: (error: string | null) => void;
}

export interface ReportTableProps {
  reportType: ReportType;
  data: Record<string, unknown>[] & {
    summary?: {
      totalWasteQuantity?: number;
      totalWasteCost?: number;
      totalMaterials?: number;
      totalEntriesAffected?: number;
      totalCostVariance?: number;
      avgVariancePercentage?: number;
      highestVariance?: {
        material: string;
        percentage: number;
      };
      totalSalesImpact?: number;
      totalWasteImpact?: number;
      totalSalesValue?: number;
      dateRange?: {
        from: string | null;
        to: string;
      };
    };
  };
}

//-----------------------------------------------------------------------------
// Day Operations Types

export interface StockSnapshot {
  stockEntryId: string;
  materialId: string;
  materialName: string;
  materialCategory: string;
  quantity: number;
  unit: string;
  supplier: string;
  costPerUnit: number;
  snapshotTime: Date;
}

export interface StockVariance {
  cost: number;
  stockEntryId: string;
  materialId: string;
  materialName: string;
  openingQuantity: number;
  closingQuantity: number;
  variance: number;
  unit: string;
  varianceType: "gain" | "loss";
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
  type: "SALE" | "STOCK" | "INVENTORY" | "OTHER";
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
  status: "opened" | "closed";
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
  reports?: DayOperationReport[];
}

export interface OpenDayRequest {
  openingCash?: number;
  openedBy?: string;
  notes?: string;
  userId?: number; // For individual user day tracking
}

export interface CloseDayRequest {
  closingCash: number;
  closedBy?: string;
  notes?: string;
  userId?: number; // For individual user day tracking
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

export interface UserOrderStats {
  openingTime: boolean;
  closingTime: any;
  openingCash: number;
  cashSales: number;
  userId: number;
  userName: string;
  orderCount: number;
  totalAmount: number;
}

export interface DayActivitiesResponse {
  activities: ActivityLog[];
  totalActivities: number;
  lastActivity?: Date;
  dayStatus: "opened" | "closed";
}

//-----------------------------------------------------------------------------
// Day Operation Reports Types

export interface UserDayReport {
  userId: number;
  userName: string;
  openingTime?: Date;
  closingTime?: Date;
  openingCash: number;
  closingCash: number;
  expectedClosingCash: number;
  variance: number;
  variancePercentage: number;
  orderCount: number;
  totalAmount: number;
  notes?: string;
}

export interface DayOperationReport {
  date: string;
  id: number;
  dayOperationId: number;
  reportDate: string;
  reportType: "daily" | "weekly" | "monthly" | "custom";
  userReports?: UserDayReport[];
  salesSummary: {
    totalAmount: number;
    totalTransactions: number;
    averageTicket: number;
    topCategories?: Record<string, number>;
    topItems?: Array<{
      name: string;
      quantity: number;
      revenue: number;
    }>;
    comparisonToPrevious?: {
      percentage: number;
      trend: "up" | "down" | "stable";
    };
  };
  cashSummary: {
    opening: number;
    closing: number;
    expected: number;
    variance: number;
    variancePercentage: number;
    transactions: {
      cash: number;
      card: number;
      other: number;
    };
  };
  inventorySummary: {
    totalItems: number;
    totalValue: number;
    totalVariances: number;
    gains: number;
    losses: number;
  };
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
    profitMargin: number;
  }>;
  salesByCategory: Record<
    string,
    {
      count: number;
      total: number;
      percentage: number;
    }
  >;
  salesBySection: Record<
    string,
    {
      count: number;
      total: number;
      percentage: number;
    }
  >;
  salesByHour: Array<{
    hour: number;
    count: number;
    total: number;
  }>;
  paymentMethodBreakdown: Record<
    string,
    {
      count: number;
      total: number;
      percentage: number;
    }
  >;
  stockMovements: Array<{
    materialId: string;
    materialName: string;
    startQuantity: number;
    endQuantity: number;
    consumed: number;
    unit: string;
    costPerUnit: number;
    totalCost: number;
  }>;
  significantVariances: StockVariance[];
  notes?: string;
  generatedBy: string;
  generatedAt: Date;
  reportStatus: "draft" | "final" | "amended";
  dayOperation?: DayOperation;
  createdAt: Date;
  updatedAt: Date;
}

//-------------------------------------------------------------------------------------------------------

export interface InventoryManagementPanelProps {
  onDeleteMaterial?: (id: string) => void;
  onDeleteStockEntry?: (id: string) => void;
  onCreateMenuItem?: (data: MenuItem) => void;
  onUpdateMenuItem?: (id: string, data: MenuItem) => void;
  onDeleteMenuItem?: (id: string) => void;
  onCreateSection?: (data: { name: string; description?: string }) => void;
  onUpdateSection?: (id: string, data: { name: string; description?: string }) => void;
  onDeleteSection?: (id: string) => void;
}

export interface NavigationItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  role?: string | string[];
  children?: NavigationItem[];
  badge?: string;
  badgeVariant?: "default" | "destructive" | "secondary";
}
