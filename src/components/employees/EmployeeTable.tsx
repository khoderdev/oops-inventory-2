import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { employeeAPI } from "@/api/employee.api";
import { departmentAPI } from "@/api/department.api";
import { deleteEmployeeAtom, employeesFiltersAtom, employeesLoadingAtom, employeeStatsAtom, fetchEmployeesAtom, fetchEmployeeStatsAtom } from "@/store/employeeAtoms";
import type { Employee } from "@/types/employee";
import { useAtom } from "jotai";
import { Calendar, Edit, MoreHorizontal, Plus, Search, Trash2, TrendingUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmployeeForm } from "./EmployeeForm";
import { EmployeeStatsCards } from "./EmployeeStatsCards";
import { Department } from "@/types/department";

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  // onDelete: (employeeId: number) => void;
}

const departmentColors = {
  kitchen: "bg-orange-100 text-orange-800",
  service: "bg-blue-100 text-blue-800",
  management: "bg-purple-100 text-purple-800",
  cleaning: "bg-green-100 text-green-800",
  security: "bg-red-100 text-red-800",
  other: "bg-gray-100 text-gray-800"
};

// Helper functions to support both legacy string department values and new Department objects
const getDeptKey = (dept: any): keyof typeof departmentColors => {
  if (!dept) return "other";
  const raw = typeof dept === "string" ? dept : dept.code || dept.name || "other";
  const key = String(raw).toLowerCase();
  return key in departmentColors ? (key as keyof typeof departmentColors) : "other";
};

const getDeptLabel = (dept: any): string => {
  if (!dept) return "Other";
  const label = typeof dept === "string" ? dept : dept.name || dept.code || "Other";
  return String(label).charAt(0).toUpperCase() + String(label).slice(1);
};

export const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees, onEdit }) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useAtom(employeesFiltersAtom);
  const [loading] = useAtom(employeesLoadingAtom);
  const [, fetchEmployees] = useAtom(fetchEmployeesAtom);
  const [, fetchStats] = useAtom(fetchEmployeeStatsAtom);
  const [employeeStats] = useAtom(employeeStatsAtom);
  const [, deleteEmployee] = useAtom(deleteEmployeeAtom);

  // Employee form state
  const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Departments state
  const [departments, setDepartments] = useState<Department[]>([]);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch employees data and stats on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Use current filters from atom state
        await fetchEmployees();
        await fetchStats();
      } catch (error) {
        console.error("Failed to load employee data:", error);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to prevent infinite loops

  // Load departments once
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await departmentAPI.getDepartments({ isActive: true, limit: 1000 });
        setDepartments(res.data.departments || []);
      } catch (err) {
        console.error("Failed to load departments:", err);
      }
    };
    loadDepartments();
  }, []);

  const handleSearchChange = (value: string) => {
    const updatedFilters = { ...filters, search: value || undefined };
    setFilters(updatedFilters);
    // Debounce the search
    setTimeout(() => fetchEmployees(updatedFilters), 300);
  };

  const handleDepartmentFilter = (deptIdStr: string) => {
    const selected = deptIdStr === "all" ? undefined : departments.find(d => String(d.id) === deptIdStr);
    const updatedFilters = {
      ...filters,
      department: selected
    };
    setFilters(updatedFilters);
    fetchEmployees(updatedFilters);
  };

  const handleStatusFilter = (status: string) => {
    const updatedFilters = {
      ...filters,
      isActive: status === "all" ? undefined : status === "active"
    };
    setFilters(updatedFilters);
    fetchEmployees(updatedFilters);
  };

  // Employee form handlers
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setFormMode("create");
    setEmployeeFormOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormMode("edit");
    setEmployeeFormOpen(true);
    onEdit(employee); // Call the original onEdit prop
  };

  const handleFormClose = () => {
    setEmployeeFormOpen(false);
    setSelectedEmployee(null);
    // Refresh data after form operations
    fetchEmployees(filters);
    fetchStats();
  };

  // Smooth navigation handlers
  const handleViewUsage = (employeeId: number) => {
    // Navigate smoothly to employee usage view with the selected employee ID
    navigate(`/employees/usage?employeeId=${employeeId}`);
  };

  const handleViewSettlements = (employeeId: number) => {
    // Navigate smoothly to employee settlements view with the selected employee ID
    navigate(`/employees/settlements?employeeId=${employeeId}`);
  };

  const handleDeleteEmployee = (employeeId: number) => {
    // Find the employee to show in confirmation dialog
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setEmployeeToDelete(employee);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    const employeeName = `${employeeToDelete.firstName} ${employeeToDelete.lastName}`;
    setIsDeleting(true);

    try {
      // Call the actual API to delete employee from database
      const response = await employeeAPI.deleteEmployee(employeeToDelete.id);

      if (response.success) {
        // Update local state after successful API call
        await deleteEmployee(employeeToDelete.id);

        toast({
          title: "Employee Deleted",
          description: `${employeeName} has been successfully deleted.`,
          variant: "default"
        });

        // Refresh the employee list and stats
        await fetchEmployees(filters);
        await fetchStats();

        // Close dialog and reset state
        setDeleteDialogOpen(false);
        setEmployeeToDelete(null);
      } else {
        toast({
          title: "Delete Failed",
          description: response.message || `Failed to delete ${employeeName}. Please try again.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "Delete Error",
        description: `An error occurred while deleting ${employeeName}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteEmployee = () => {
    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "N/A";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4 p-4 px-6">
      <EmployeeStatsCards stats={employeeStats} />
      {/* Filters */}
      <div className="flex flex-col items-start justify-between sm:flex-row gap-4">
        <div className="flex md:w-1/2 gap-4">
          <Input placeholder="Search employees..." value={filters.search || ""} onChange={e => handleSearchChange(e.target.value)} className="w-32 lg:w-48" />

          <Select value={filters.department ? String(filters.department.id) : "all"} onValueChange={handleDepartmentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={String(dept.id)}>
                  {getDeptLabel(dept)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.isActive === undefined ? "all" : filters.isActive ? "active" : "inactive"} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddEmployee} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-8 bg-muted rounded animate-pulse ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees.map(employee => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(employee.firstName, employee.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">#{employee.employeeNumber}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={departmentColors[getDeptKey(employee.department)]}>
                      {getDeptLabel(employee.department)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{employee.position}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(employee.baseSalary)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee.discountPercentage}%</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.isActive ? "default" : "secondary"} className={employee.isActive ? "bg-green-100 text-green-800" : ""}>
                      {employee.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(employee.hireDate)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Employee
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewUsage(employee.id)}>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          View Usage
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewSettlements(employee.id)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          View Settlements
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteEmployee(employee.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Employee Form Dialog */}
      <EmployeeForm open={employeeFormOpen} onClose={handleFormClose} employee={selectedEmployee} mode={formMode} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Employee
            </DialogTitle>
            <DialogDescription className="text-left">
              Are you sure you want to delete <span className="font-semibold">{employeeToDelete ? `${employeeToDelete.firstName} ${employeeToDelete.lastName}` : "this employee"}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={cancelDeleteEmployee} disabled={isDeleting} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteEmployee} disabled={isDeleting} className="w-full sm:w-auto">
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Employee
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
