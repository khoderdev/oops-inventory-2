import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmployeeStats } from "@/types/employee";
import { Building, Calendar, TrendingUp, UserCheck, Users, UserX } from "lucide-react";
import React from "react";

interface EmployeeStatsCardsProps {
  stats: EmployeeStats | null;
}

export const EmployeeStatsCards: React.FC<EmployeeStatsCardsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const departmentColors = {
    kitchen: "bg-orange-100 text-orange-800",
    service: "bg-blue-100 text-blue-800",
    management: "bg-purple-100 text-purple-800",
    cleaning: "bg-green-100 text-green-800",
    security: "bg-red-100 text-red-800",
    other: "bg-gray-100 text-gray-800"
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* Total Employees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEmployees}</div>
          <p className="text-xs text-muted-foreground">All registered employees</p>
        </CardContent>
      </Card>

      {/* Active Employees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.activeEmployees}</div>
          <p className="text-xs text-muted-foreground">Currently working</p>
        </CardContent>
      </Card>

      {/* Inactive Employees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          <UserX className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.inactiveEmployees}</div>
          <p className="text-xs text-muted-foreground">Not currently working</p>
        </CardContent>
      </Card>

      {/* Monthly Usages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Usages</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.monthlyUsages}</div>
          <p className="text-xs text-muted-foreground">This month's usage records</p>
        </CardContent>
      </Card>

      {/* Pending Settlements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
          <Calendar className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.pendingSettlements}</div>
          <p className="text-xs text-muted-foreground">Awaiting processing</p>
        </CardContent>
      </Card>

      {/* Department Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Departments</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.departmentBreakdown).map(
              ([dept, count]) =>
                count > 0 && (
                  <div key={dept} className="flex items-center justify-between">
                    <Badge variant="secondary" className={`text-xs ${departmentColors[dept as keyof typeof departmentColors] || departmentColors.other}`}>
                      {dept}
                    </Badge>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
