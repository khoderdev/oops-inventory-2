export type CategoryType = string;

export interface CategoryTypeEntity {
  id: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  value: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  categoryTypeIds: number[];
  createdAt: string;
  updatedAt: string;
  categoryTypes?: CategoryTypeEntity[];
}

export interface CategoryFormData {
  name: string;
  value: string;
  categoryTypeIds: number[];
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CategoryFilters {
  type?: CategoryType;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface CategoriesTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  onUpdateSortOrder: (categories: { id: number; sortOrder: number }[]) => void;
  loading?: boolean;
}

export interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface CategoryManagementProps {
  onCategoryChange?: () => void;
}

export interface CategoriesResponse {
  currentPage: number;
  totalPages: number | null;
  totalItems: Category[];
  endIndex: number | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  itemsPerPage: {
    page: number;
    limit: number;
    offset: number;
    sortBy: string;
    sortOrder: string;
  };
  limit: number;
  offset: number;
  page: number;
  sortBy: string;
  sortOrder: string;
  startIndex: number | null;
}

export interface CategoryResponse {
  success: boolean;
  data: Category;
}

export interface SortOrderUpdate {
  id: number;
  sortOrder: number;
}

// CategoryType interfaces
export interface CategoryTypeEntity {
  id: number;
  categoryId: number;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface CategoryTypeFormData {
  categoryId?: number | null;
  type: CategoryType;
}

export interface CategoryTypeFilters {
  type?: CategoryType;
  categoryId?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  fields?: string;
}

export interface CategoryTypesResponse {
  currentPage: number;
  totalPages: number | null;
  totalItems: CategoryTypeEntity[];
  endIndex: number | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  itemsPerPage: {
    page: number;
    limit: number;
    offset: number;
    sortBy: string;
    sortOrder: string;
  };
  limit: number;
  offset: number;
  page: number;
  sortBy: string;
  sortOrder: string;
  startIndex: number | null;
}

export interface CategoryTypeResponse {
  success: boolean;
  data: CategoryTypeEntity;
}

export interface BulkCategoryTypeRequest {
  categoryTypes: CategoryTypeFormData[];
}

export interface BulkDeleteRequest {
  ids: number[];
}

export interface CategoryModalProps {
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  selectedCategory?: Category;
  handleFormSubmit: (formData: CategoryFormData) => void;
  handleFormCancel: () => void;
  formLoading: boolean;
  error?: string;
}

export interface CategoryTypeProps {
  onCategoryTypeChange?: () => void;
}

export interface CategoryTypeFormProps {
  categoryType?: CategoryTypeEntity;
  onSave: (data: CategoryTypeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}


// TypeMultiSelect Component
export interface TypeMultiSelectProps {
  selectedTypeIds: number[];
  availableTypes: CategoryTypeEntity[];
  onSelectionChange: (typeIds: number[]) => void;
  loading: boolean;
  error?: string;
}