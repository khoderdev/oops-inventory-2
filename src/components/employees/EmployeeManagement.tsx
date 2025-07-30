import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { employeeFormModeAtom, employeeFormOpenAtom, employeesAtom, employeesErrorAtom, employeesLoadingAtom, employeeStatsAtom, fetchEmployeesAtom, fetchEmployeeStatsAtom, selectedEmployeeAtom } from "@/store/employeeAtoms";
import type { Employee } from "@/types/employee";
import { useAtom } from "jotai";
import { Calendar, DollarSign, Plus, TrendingUp, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { EmployeeForm } from "./EmployeeForm";
import { EmployeeSettlementView } from "./EmployeeSettlementView";
import { EmployeeStatsCards } from "./EmployeeStatsCards";
import { EmployeeTable } from "./EmployeeTable";
import { EmployeeUsageView } from "./EmployeeUsageView";

export const EmployeeManagement: React.FC = () => {
  const [employees] = useAtom(employeesAtom);
  const [employeeStats] = useAtom(employeeStatsAtom);
  const [loading] = useAtom(employeesLoadingAtom);
  const [error] = useAtom(employeesErrorAtom);
  const [, fetchEmployees] = useAtom(fetchEmployeesAtom);
  const [, fetchStats] = useAtom(fetchEmployeeStatsAtom);
  const [formOpen, setFormOpen] = useAtom(employeeFormOpenAtom);
  const [formMode, setFormMode] = useAtom(employeeFormModeAtom);
  const [selectedEmployee, setSelectedEmployee] = useAtom(selectedEmployeeAtom);

  const [activeTab, setActiveTab] = useState("employees");

  // Load employees and stats on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchEmployees();
        await fetchStats();
      } catch (err) {
        console.error("Failed to load employee data:", err);
      }
    };

    loadData();
  }, [fetchEmployees, fetchStats]);

  const [viewingUsage, setViewingUsage] = useState<number | null>(null);
  const [viewingSettlements, setViewingSettlements] = useState<number | null>(null);

  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleViewUsage = (employeeId: number) => {
    setViewingUsage(employeeId);
    setActiveTab("usage");
  };

  const handleViewSettlements = (employeeId: number) => {
    setViewingSettlements(employeeId);
    setActiveTab("settlements");
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedEmployee(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
          <p className="text-muted-foreground">Manage employees, track usage, and process settlements</p>
        </div>
        <Button onClick={handleCreateEmployee} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <EmployeeStatsCards stats={employeeStats} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees" className="gap-2">
            <Users className="h-4 w-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Usage Tracking
          </TabsTrigger>
          <TabsTrigger value="settlements" className="gap-2">
            <Calendar className="h-4 w-4" />
            Settlements
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee List</CardTitle>
              <CardDescription>Manage employee information, salaries, and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeTable
                employees={employees}
                onEdit={handleEditEmployee}
                onDelete={id => {
                  // Handle delete - will implement with confirmation dialog
                  console.log("Delete employee:", id);
                }}
                onViewUsage={handleViewUsage}
                onViewSettlements={handleViewSettlements}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <EmployeeUsageView selectedEmployeeId={viewingUsage} onEmployeeSelect={setViewingUsage} />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <EmployeeSettlementView selectedEmployeeId={viewingSettlements} onEmployeeSelect={setViewingSettlements} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Reports</CardTitle>
              <CardDescription>View detailed reports and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Reports and analytics coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Employee Form Dialog */}
      <EmployeeForm open={formOpen} onClose={handleCloseForm} employee={selectedEmployee} mode={formMode} />
    </div>
  );
};
