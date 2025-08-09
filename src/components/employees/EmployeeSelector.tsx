import { employeeAPI } from "@/api/employee.api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { employeesAtom } from "@/store/employeeAtoms";
import type { Employee } from "@/types/employee";
import { useAtom } from "jotai";
import { ChevronDown, User } from "lucide-react";
import React, { useEffect, useState } from "react";

interface EmployeeSelectorProps {
  selectedEmployeeId?: number | null;
  onEmployeeSelect: (employee: Employee | null) => void;
  placeholder?: string;
  showAvatar?: boolean;
  compact?: boolean;
  className?: string;
} 

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({ selectedEmployeeId, onEmployeeSelect, placeholder = "Select employee", showAvatar = true, compact = false, className = "" }) => {
  const [employees, setEmployees] = useAtom(employeesAtom);
  const [loading, setLoading] = useState(false);

  // Load employees on mount
  useEffect(() => {
    const loadEmployees = async () => {
      if (employees.length === 0) {
        try {
          setLoading(true);
          const response = await employeeAPI.getEmployees({ limit: 100 });
          setEmployees(response.data.employees);
        } catch (error) {
          console.error("Error loading employees:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadEmployees();
  }, [employees.length, setEmployees]);

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  const activeEmployees = employees.filter(emp => emp.isActive);

  const handleEmployeeChange = (employeeId: string) => {
    if (employeeId === "none") {
      onEmployeeSelect(null);
    } else {
      const employee = employees.find(emp => emp.id === parseInt(employeeId));
      onEmployeeSelect(employee || null);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "N/A";
  };

  if (compact) {
    return (
      <Select value={selectedEmployeeId?.toString() || "none"} onValueChange={handleEmployeeChange}>
        <SelectTrigger className={`w-full ${className}`}>
          <div className="flex items-center gap-2">
            {showAvatar && selectedEmployee && (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">{getInitials(selectedEmployee.firstName, selectedEmployee.lastName)}</AvatarFallback>
              </Avatar>
            )}
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              No employee selected
            </div>
          </SelectItem>
          {activeEmployees.map(employee => (
            <SelectItem key={employee.id} value={employee.id.toString()}>
              <div className="flex items-center gap-2">
                {showAvatar && (
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{getInitials(employee.firstName, employee.lastName)}</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col">
                  <span className="font-medium">
                    {employee.firstName} {employee.lastName}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium">Current Employee</label>

      {selectedEmployee ? (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
          <div className="flex items-center gap-3">
            {showAvatar && (
              <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(selectedEmployee.firstName, selectedEmployee.lastName)}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="font-medium">
                {selectedEmployee.firstName} {selectedEmployee.lastName}
              </div>
            </div>
          </div>

          <Select value={selectedEmployee.id.toString()} onValueChange={handleEmployeeChange}>
            <SelectTrigger className="w-auto border-0 bg-transparent p-1">
              <ChevronDown className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  No employee selected
                </div>
              </SelectItem>
              {activeEmployees.map(employee => (
                <SelectItem key={employee.id} value={employee.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{getInitials(employee.user?.firstName, employee.user?.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {employee.user?.firstName} {employee.user?.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        #{employee.employeeNumber} • {employee.department}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <Select value="none" onValueChange={handleEmployeeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                No employee selected
              </div>
            </SelectItem>
            {activeEmployees.map(employee => (
              <SelectItem key={employee.id} value={employee.id.toString()}>
                <div className="flex items-center gap-2">
                  {showAvatar && (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{getInitials(employee.user?.firstName, employee.user?.lastName)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {employee.user?.firstName} {employee.user?.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      #{employee.employeeNumber} • {employee.department}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
