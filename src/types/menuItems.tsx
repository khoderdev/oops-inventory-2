import { ValidationResult } from "@/utils/dataValidation";
import { Category } from "./categories";
import { CreateMenuItemData, Material, MenuItem, MenuItemIngredient, Section, StockEntry } from "./inventory";
import { Table } from "@tanstack/react-table";

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
  availableMaterials: any[];
  menuItemCategories: { id?: number; value: string; name: string }[];
  handleUpdateMenuItem: (item: MenuItem) => void;
  handleAddMenuItem: (item: MenuItem) => void;
  handleCancel: () => void;
  stockEntries: any[];
  isMobile: boolean;
  handleDeleteMenuItem: (id: string) => void;
  handleTogglePOSVisibility: (item: MenuItem) => void;
  handlePrinterAssignment: (menuItemId: string, printerId: string) => void;
  handleSelectMenuItem: (id: string, selected: boolean) => void;
  selectedMenuItems: Set<string>;
  bulkSelectionMode: boolean;
  highlightSearchTerm: (text: string) => React.ReactNode;
  getMaterialName: (id: string | number) => string;
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
  getMaterialName: (id: string | number) => string;
  handleTogglePOSVisibility: (item: MenuItem) => void;
  handleOpenPrinterDialog: (menuItem: MenuItem) => void;
  handleDeleteMenuItem: (id: string) => void;
  setEditingMenuItem: (item: MenuItem | null) => void;
  setShowMenuItemForm: (show: boolean) => void;
}

export interface BeveragesMenuBuilderProps {
  stockEntries: StockEntry[];
  materials: Material[];
  menuItems: MenuItem[];
  categories: Category[];
  categoriesLoading?: boolean;
  categoriesError?: string | null;
  sections: Section[];
  onCreateBeverageItem: (data: CreateMenuItemData, imageFile?: File) => void | Promise<void>;
  onUpdateBeverageItem: (id: string, data: Partial<MenuItem>) => void | Promise<void>;
  onDeleteBeverageItem: (id: string) => void | Promise<void>;
}
