import { ValidationResult } from "@/utils/dataValidation";
import { Category } from "./categories";
import { CreateMenuItemData, Material, MenuItem, MenuItemIngredient,  Sauce,  StockEntry } from "./inventory";
import { Table } from "@tanstack/react-table";

export interface MenuItemsContextState {
  // Menu items data
  foodMenuItems: MenuItem[];
  beverageMenuItems: MenuItem[];
  menuItemsLoading: boolean;
  menuItemsError: string | null;

  // Categories data
  menuItemCategories: Category[];
  beverageCategories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  
  // Materials data
  materialsWithStock: Material[];
  materialsLoading: boolean;
  materialsError: string | null;

  // Active tab
  activeTab: string;

  // Actions
  fetchMenuItems: (mode?: 'food' | 'beverages' | 'both') => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchMaterials: () => Promise<void>;
  handleTabChange: (value: string) => void;
  handleCreateMenuItem: (menuItem: any, imageFile?: File) => Promise<void>;
  handleUpdateMenuItem: (id: string, menuItem: Partial<MenuItem>) => Promise<void>;
  handleDeleteMenuItem: (id: string, isBeverage?: boolean) => Promise<void>;
}

export interface MenuBuilderLayoutProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: any) => void;
  dataValidationEnabled: boolean;
  validationResults: ValidationResult | null;
  showValidationPanel: boolean;
  setShowValidationPanel: (show: boolean) => void;
  filteredMenuItems: MenuItem[];
  currentMenuItems: MenuItem[];
  categories: { id?: number; value: string; name: string }[];
  showMenuItemForm: boolean;
  handleCloseModal: (open: boolean) => void;
  editingMenuItem: MenuItem | null;
  menuItemCategories: { id?: number; value: string; name: string }[];
  handleUpdateMenuItem: (item: MenuItem) => void;
  handleAddMenuItem: (item: MenuItem) => void;
  handleCancel: () => void;
  isMobile: boolean;
  handleDeleteMenuItem: (id: string) => void;
  handleTogglePOSVisibility: (item: MenuItem) => void;
  handlePrinterAssignment: (menuItemId: string, printerId: string) => void;
  handleSelectMenuItem: (id: string, selected: boolean) => void;
  selectedMenuItems: Set<string>;
  bulkSelectionMode: boolean;
  highlightSearchTerm: (text: string) => React.ReactNode;
  categoriesFiltered: { id?: number; value: string; name: string }[];
  calculateMenuItemCost: (ingredients: MenuItemIngredient[]) => number;
  table: Table<MenuItem>;
}

export const mapToCategory = (categories: { id?: number; value: string; name: string }[]): Category[] => {
  return categories.map(cat => ({
    id: cat.id || 0,
    name: cat.name,
    value: cat.value,
    isActive: true,
    sortOrder: 0,
    categoryTypeIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
};

export interface MenuItemColumnsProps {
  searchTerm: string;
  categories: { id?: number; value: string; name: string }[];
  calculateMenuItemCost: (ingredients: MenuItemIngredient[]) => number;
  getMaterialName?: (id: string | number) => string; // Made optional with '?'
  handleTogglePOSVisibility: (item: MenuItem) => void;
  handleOpenPrinterDialog: (menuItem: MenuItem) => void;
  handleDeleteMenuItem: (id: string) => void;
  setEditingMenuItem: (item: MenuItem | null) => void;
  setShowMenuItemForm: (show: boolean) => void;
}

export interface BeveragesMenuBuilderProps {
  menuItems: MenuItem[];
  categories: Category[];
  categoriesLoading?: boolean;
  categoriesError?: string | null;
  onCreateBeverageItem: (data: CreateMenuItemData, imageFile?: File) => void | Promise<void>;
  onUpdateBeverageItem: (id: string, data: Partial<MenuItem>) => void | Promise<void>;
  onDeleteBeverageItem: (id: string) => void | Promise<void>;
}

export interface BeverageItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBeverageItem: MenuItem | null;
  categories: { id: string; name: string; value: string }[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export interface BeverageDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBeverageDetails: MenuItem | null;
  onClose: () => void;
  onEdit: (menuItem: MenuItem) => void;
}

export interface MenuItemFormProps {
  menuItem?: MenuItem;
  categories: Category[];
  stockEntries?: StockEntry[];
  sauces?: Sauce[];
  onSubmit: (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: MenuItemIngredient[] }) => void;
  onCancel: () => void;
}

export interface IngredientsProps {
  ingredients: MenuItemIngredient[];
  stockEntries: StockEntry[];
  materials?: Material[];
  menuItem?: MenuItem;
  category: string;
  price: string;
  onIngredientsChange: (ingredients: MenuItemIngredient[]) => void;
  onValidationChange?: (hasErrors: boolean) => void;
  errors?: {
    ingredients?: string;
    ingredientQuantity?: string;
  };
  onErrorsChange?: (errors: { ingredients?: string; ingredientQuantity?: string }) => void;
}

export interface IngredientsTableProps {
  ingredients: MenuItemIngredient[];
  materials: Material[];
  sauces?: Sauce[];
  menuItem?: MenuItem;
  calculateIngredientCost: (ingredient: Omit<MenuItemIngredient, "cost">) => number;
  getMaterialCostPerBaseUnit: (materialId: string) => number;
  formatNumber: (value: number) => string;
  formatCurrency: (amount: number) => string;
  handleRemoveIngredient: (index: number) => void;
  totalIngredientsCost: number;
  price: string;
}

export interface BeveragesMenuColumnsProps {
  categories: any[];
  bulkSelectionMode: boolean;
  handleTogglePOSVisibility: (item: MenuItem) => void;
  handleEditBeverageItem: (item: MenuItem) => void;
  handleDeleteBeverageItem: (id: string) => void;
}