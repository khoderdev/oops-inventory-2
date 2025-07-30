import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { employeesFiltersAtom, employeesLoadingAtom, fetchEmployeesAtom } from "@/store/employeeAtoms";
import type { Employee, EmployeeDepartment } from "@/types/employee";
import { useAtom } from "jotai";
import { Calendar, Edit, MoreHorizontal, Search, Trash2, TrendingUp } from "lucide-react";
import React from "react";

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: number) => void;
  onViewUsage: (employeeId: number) => void;
  onViewSettlements: (employeeId: number) => void;
}

const departmentColors = {
  kitchen: "bg-orange-100 text-orange-800",
  service: "bg-blue-100 text-blue-800",
  management: "bg-purple-100 text-purple-800",
  cleaning: "bg-green-100 text-green-800",
  security: "bg-red-100 text-red-800",
  other: "bg-gray-100 text-gray-800"
};

const departments: EmployeeDepartment[] = ["kitchen", "service", "management", "cleaning", "security", "other"];

export const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees, onEdit, onDelete, onViewUsage, onViewSettlements }) => {
  const [filters, setFilters] = useAtom(employeesFiltersAtom);
  const [loading] = useAtom(employeesLoadingAtom);
  const [, fetchEmployees] = useAtom(fetchEmployeesAtom);

  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, search: value || undefined });
    // Debounce the search
    setTimeout(() => fetchEmployees(), 300);
  };

  const handleDepartmentFilter = (department: string) => {
    setFilters({
      ...filters,
      department: department === "all" ? undefined : (department as EmployeeDepartment)
    });
    fetchEmployees();
  };

  const handleStatusFilter = (status: string) => {
    setFilters({
      ...filters,
      isActive: status === "all" ? undefined : status === "active"
    });
    fetchEmployees();
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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employees..." value={filters.search || ""} onChange={e => handleSearchChange(e.target.value)} className="pl-10" />
        </div>

        <Select value={filters.department || "all"} onValueChange={handleDepartmentFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>
                {dept.charAt(0).toUpperCase() + dept.slice(1)}
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
                        <AvatarFallback>{getInitials(employee.user?.firstName, employee.user?.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {employee.user?.firstName} {employee.user?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">#{employee.employeeNumber}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={departmentColors[employee.department]}>
                      {employee.department}
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
                        <DropdownMenuItem onClick={() => onEdit(employee)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Employee
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onViewUsage(employee.id)}>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          View Usage
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewSettlements(employee.id)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          View Settlements
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(employee.id)} className="text-red-600">
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

      {/* Pagination would go here if needed */}
    </div>
  );
};
