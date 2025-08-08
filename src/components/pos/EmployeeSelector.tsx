import { employeeAPI } from "@/api/employee.api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Employee } from "@/types/employee";
import { Search, User, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface EmployeeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeSelect: (employee: Employee) => void;
  selectedEmployee?: Employee | null;
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({ isOpen, onClose, onEmployeeSelect, selectedEmployee }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch employees when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeAPI.getEmployees({
        isActive: true,
        limit: 100
      });

      if (response.success) {
        setEmployees(response.data.employees);
      } else {
        setError("Failed to load employees");
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.user?.firstName || ""} ${employee.user?.lastName || ""}`.trim();
    const searchLower = searchTerm.toLowerCase();

    return fullName.toLowerCase().includes(searchLower) || employee.employeeNumber.toLowerCase().includes(searchLower) || employee.department.toLowerCase().includes(searchLower) || employee.position.toLowerCase().includes(searchLower);
  });

  const handleEmployeeSelect = (employee: Employee) => {
    onEmployeeSelect(employee);
    onClose();
  };

  const getDepartmentColor = (department: string) => {
    const colors: Record<string, string> = {
      kitchen: "bg-orange-100 text-orange-800",
      service: "bg-blue-100 text-blue-800",
      management: "bg-purple-100 text-purple-800",
      cleaning: "bg-green-100 text-green-800",
      security: "bg-red-100 text-red-800",
      other: "bg-gray-100 text-gray-800"
    };
    return colors[department] || colors.other;
  };

  const getEmployeeInitials = (employee: Employee) => {
    // Try user account name first
    let firstName = employee.user?.firstName || "";
    let lastName = employee.user?.lastName || "";
    
    // Fall back to employee personal information if no user account name
    if (!firstName && !lastName) {
      firstName = employee.firstName || "";
      lastName = employee.lastName || "";
    }
    
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return initials || employee.employeeNumber.substring(0, 2).toUpperCase();
  };

  const getEmployeeFullName = (employee: Employee) => {
    // Try user account name first
    if (employee.user?.firstName || employee.user?.lastName) {
      const fullName = `${employee.user.firstName || ""} ${employee.user.lastName || ""}`.trim();
      if (fullName) return fullName;
    }
    
    // Fall back to employee personal information
    if (employee.firstName || employee.lastName) {
      const personalName = `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
      if (personalName) return personalName;
    }
    
    // Final fallback to employee number
    return employee.employeeNumber;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Select Employee
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Search employees by name, number, department, or position..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {/* Selected Employee */}
        {selectedEmployee && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-500 text-white text-xs">{getEmployeeInitials(selectedEmployee)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">Currently Selected</div>
                  <div className="text-blue-700 font-semibold">{getEmployeeFullName(selectedEmployee)}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onEmployeeSelect({} as Employee);
                  onClose();
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Employee List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading employees...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-500">{error}</div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">{searchTerm ? "No employees found matching your search" : "No active employees found"}</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEmployees.map(employee => (
                <div key={employee.id} className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${selectedEmployee?.id === employee.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`} onClick={() => handleEmployeeSelect(employee)}>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gray-500 text-white">{getEmployeeInitials(employee)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{getEmployeeFullName(employee)}</span>
                        <Badge variant="outline" className="text-xs">
                          {employee.employeeNumber}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Badge className={`text-xs ${getDepartmentColor(employee.department)}`}>{employee.department.charAt(0).toUpperCase() + employee.department.slice(1)}</Badge>
                        <span>•</span>
                        <span>{employee.position}</span>
                        {employee.discountPercentage > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">{employee.discountPercentage}% discount</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""} found
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
