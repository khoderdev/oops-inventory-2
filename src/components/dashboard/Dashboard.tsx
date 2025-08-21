import { Activity, BarChart3, Calendar, DollarSign, Package, ShoppingCart, Users, Utensils } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDayOperations } from "@/contexts/DayOperationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/types/auth";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { employeesAtom, usageStatsAtom } from "@/store/employeeAtoms";
import { useAtom } from "jotai";
import WelcomeHeader from "./WelcomeHeader";
import DayOperationsCard from "./DayOperationsCard";
import KeyMetricsGrid from "./KeyMetricsGrid";
import QuickActionsCard from "./QuickActionsCard";
import LowStockAlertsCard from "./LowStockAlertsCard";
import EmployeeUsageCard from "./EmployeeUsageCard";
import SystemStatusCard from "./SystemStatusCard";

interface DashboardStats {
  totalMaterials: number;
  totalStockEntries: number;
  totalMenuItems: number;
  lowStockItems: number;
  totalStockValue: number;
  totalEmployees: number;
  pendingOrders: number;
  todaysSales: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  permission?: string;
  badge?: string | number;
  color: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { currentDay, userOrderStats, loading: dayOpsLoading } = useDayOperations();
  const { materialsWithStock, stockEntries, menuItems } = useInventoryStore();
  const [employees] = useAtom(employeesAtom);
  const [usageStats] = useAtom(usageStatsAtom);
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalMaterials: 0,
    totalStockEntries: 0,
    totalMenuItems: 0,
    lowStockItems: 0,
    totalStockValue: 0,
    totalEmployees: 0,
    pendingOrders: 0,
    todaysSales: 0
  });

  // Calculate dashboard statistics
  useEffect(() => {
    const stats: DashboardStats = {
      totalMaterials: materialsWithStock.length,
      totalStockEntries: stockEntries.length,
      totalMenuItems: menuItems.length,
      lowStockItems: materialsWithStock.filter(m => m.availableQuantity < 10).length,
      totalStockValue: materialsWithStock.reduce((sum, m) => {
        // Skip any suspicious values (extremely large values)
        const value = m.totalValue || 0;
        if (value > 1000000) { // Cap at $1M per material as a sanity check
          console.warn(`Extremely large stock value detected for material ${m.name}: $${value}`);
          return sum;
        }
        return sum + value;
      }, 0),
      totalEmployees: employees.length,
      pendingOrders: 0, // This would come from orders API
      todaysSales: currentDay?.totalSales || 0
    };
    setDashboardStats(stats);
  }, [materialsWithStock, stockEntries, menuItems, employees, currentDay]);

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      title: "POS System",
      description: "Process orders and sales",
      icon: <ShoppingCart className="h-6 w-6" />,
      href: "/pos",
      permission: PERMISSIONS.POS_ACCESS,
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Inventory",
      description: "Manage materials and stock",
      icon: <Package className="h-6 w-6" />,
      href: "/inventory",
      permission: PERMISSIONS.STOCK_READ,
      badge: dashboardStats.lowStockItems > 0 ? dashboardStats.lowStockItems : undefined,
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Menu Management",
      description: "Create and edit menu items",
      icon: <Utensils className="h-6 w-6" />,
      href: "/menu",
      permission: PERMISSIONS.MENU_ITEMS_READ,
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Orders",
      description: "View and manage orders",
      icon: <Activity className="h-6 w-6" />,
      href: "/orders",
      permission: PERMISSIONS.ORDERS_READ,
      badge: dashboardStats.pendingOrders > 0 ? dashboardStats.pendingOrders : undefined,
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      title: "Reports",
      description: "Analytics and insights",
      icon: <BarChart3 className="h-6 w-6" />,
      href: "/reports",
      permission: PERMISSIONS.REPORTS_SALES,
      color: "bg-indigo-500 hover:bg-indigo-600"
    },
    {
      title: "Employees",
      description: "Manage staff and usage",
      icon: <Users className="h-6 w-6" />,
      href: "/employees",
      permission: PERMISSIONS.EMPLOYEE_READ,
      color: "bg-teal-500 hover:bg-teal-600"
    },
    {
      title: "Sales History",
      description: "View transaction history",
      icon: <DollarSign className="h-6 w-6" />,
      href: "/sales",
      permission: PERMISSIONS.SALES_READ,
      color: "bg-emerald-500 hover:bg-emerald-600"
    },
    {
      title: "Day Operations",
      description: "Daily operations management",
      icon: <Calendar className="h-6 w-6" />,
      href: "/day-operations",
      permission: PERMISSIONS.DAY_OPERATIONS_READ,
      color: "bg-rose-500 hover:bg-rose-600"
    }
  ];

  // Filter actions based on permissions
  const availableActions = quickActions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Welcome Header */}
      <WelcomeHeader username={user?.firstName || user?.username || ""} />

      {/* Day Operations Status */}
      {hasPermission(PERMISSIONS.DAY_OPERATIONS_READ) && (
        <DayOperationsCard 
          loading={dayOpsLoading} 
          currentDay={currentDay} 
        />
      )}

      {/* Key Metrics */}
      <KeyMetricsGrid stats={dashboardStats} />

      {/* Quick Actions */}
      <QuickActionsCard actions={availableActions} />

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        {hasPermission(PERMISSIONS.STOCK_READ) && dashboardStats.lowStockItems > 0 && (
          <LowStockAlertsCard 
            lowStockMaterials={materialsWithStock
              .filter(m => m.availableQuantity < 10)
              .map(m => ({
                ...m,
                id: typeof m.id === 'string' ? parseInt(m.id, 10) : m.id
              }))
              .slice(0, 5)}
            totalLowStock={dashboardStats.lowStockItems}
          />
        )}

        {/* Employee Usage Summary */}
        {hasPermission(PERMISSIONS.EMPLOYEE_USAGE_VIEW) && usageStats && (
          <EmployeeUsageCard usageStats={usageStats} />
        )}
      </div>

      {/* System Status */}
      <SystemStatusCard 
        user={user} 
        currentDay={currentDay ? {
          status: currentDay.status,
          openedAt: currentDay.openedAt instanceof Date ? currentDay.openedAt.toISOString() : String(currentDay.openedAt)
        } : undefined} 
      />
    </div>
  );
};

export default Dashboard;
