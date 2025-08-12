export interface Category {
  id: number;
  name: string;
  value: string;
  type: 'materials' | 'menu_items';
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  name: string;
  value: string;
  type: 'materials' | 'menu_items';
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CategoryFilters {
  type?: 'materials' | 'menu_items';
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CategoriesTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  onUpdateSortOrder: (categories: { id: number; sortOrder: number }[]) => void;
  onCreateNew: () => void;
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



export interface Category {
    id: number;
    name: string;
    value: string;
    type: 'materials' | 'menu_items';
    description?: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface CategoryFormData {
    name: string;
    value: string;
    type: 'materials' | 'menu_items';
    description?: string;
    isActive?: boolean;
    sortOrder?: number;
  }
  
  export interface CategoryFilters {
    type?: 'materials' | 'menu_items';
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
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