import z from "zod";

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  managerId?: number | null;
  costCenter?: string | null;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  // Associated data (optional depending on endpoint)
  manager?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position?: string;
    email?: string;
    phone?: string;
  } | null;
  employees?: Array<{
    id: number;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position?: string;
    hireDate?: string;
  }>;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  updater?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  // Present in list endpoint
  employeeCount?: number;
}

export interface DepartmentsResponse {
  success: boolean;
  data: {
    departments: Department[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
  message: string;
}

export interface DepartmentResponse {
  success: boolean;
  data: Department;
  message: string;
}

export interface DepartmentStats {
  totalDepartments: number;
  activeDepartments: number;
  inactiveDepartments: number;
  totalEmployees: number;
  employeesWithDepartment: number;
  employeesWithoutDepartment: number;
  departments: Array<{
    id: number;
    name: string;
    code: string;
    employeeCount: number;
  }>;
}

export interface DepartmentStatsResponse {
  success: boolean;
  data: DepartmentStats;
  message: string;
}

export interface DepartmentFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateDepartmentData {
  name: string;
  code: string;
  description?: string;
  managerId?: number;
  costCenter?: string;
}

export interface UpdateDepartmentData {
  name?: string;
  code?: string;
  description?: string | null;
  managerId?: number | null;
  costCenter?: string | null;
  isActive?: boolean;
}

export interface DepartmentTableProps {
  data: Department[];
  total: number;
  page: number;
  limit: number;
  loading?: boolean;
  search?: string;
  isActive?: boolean;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
  onBulkDelete?: (ids: number[]) => void;
  onAdd?: () => void;
  onFiltersChange?: (filters: Partial<DepartmentFilters>) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
}

export const createSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  code: z
    .string()
    .min(2, "Code is too short")
    .max(10, "Code is too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, '_' and '-' allowed"),
  description: z.string().optional(),
  managerId: z.number().int().positive().optional(),
  costCenter: z.string().optional()
});

export const updateSchema = createSchema.extend({
  isActive: z.boolean().optional()
});

export type DepartmentCreateValues = z.infer<typeof createSchema>;
export type DepartmentUpdateValues = z.infer<typeof updateSchema>;

export interface DepartmentFormProps {
  mode: "create" | "edit";
  initialData?: Department | null;
  onSubmit: (values: CreateDepartmentData | UpdateDepartmentData) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}
