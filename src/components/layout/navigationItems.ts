import { PERMISSIONS } from "@/types/auth";
import { NavigationItem } from "@/types/inventory";
import { Activity, AlertTriangle, BarChart3, Bell, Calendar, Clock, CreditCard, Database, DollarSign, FileText, Home, Key, Lock, MessageSquare, Package, Receipt, Settings, Shield, ShoppingCart, Truck, UserCheck, Users, Utensils } from "lucide-react";

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
    permission: PERMISSIONS.DAY_OPERATIONS_READ
  },
  {
    label: "Inventory Management",
    icon: Package,
    href: "/inventory"
  },

  {
    label: "Menu Management",
    icon: Utensils,
    href: "/menu"
  },
  {
    label: "Sales & Orders",
    icon: ShoppingCart,
    children: [
      {
        label: "Sales History",
        href: "/sales",
        icon: FileText,
        permission: PERMISSIONS.SALES_READ
      },

      {
        label: "Orders",
        href: "/orders",
        icon: Receipt,
        permission: PERMISSIONS.ORDERS_READ
      }
    ]
  },
  {
    label: "Daily Operations",
    icon: Calendar,
    children: [
      {
        label: "Day Operations",
        href: "/day-operations",
        icon: Calendar,
        permission: PERMISSIONS.DAY_OPERATIONS_READ
      },
      {
        label: "Close Day",
        href: "/day-operations/close",
        icon: Lock,
        permission: PERMISSIONS.DAY_OPERATIONS_CLOSE
      },
      {
        label: "Cash Count",
        href: "/day-operations/cash-count",
        icon: DollarSign,
        permission: PERMISSIONS.DAY_OPERATIONS_CASH_COUNT
      }
    ]
  },
  {
    label: "Reports & Analytics",
    icon: BarChart3,
    href: "/reports"
  },
  {
    label: "Employee Management",
    icon: UserCheck,
    children: [
      {
        label: "Employees",
        href: "/employees",
        icon: Users,
        permission: PERMISSIONS.EMPLOYEE_READ
      },
      {
        label: "Usage Tracking",
        href: "/employees/usage",
        icon: Activity,
        permission: PERMISSIONS.EMPLOYEE_USAGE_VIEW
      },
      {
        label: "Settlements",
        href: "/employees/settlements",
        icon: Calendar,
        permission: PERMISSIONS.EMPLOYEE_SETTLEMENT_VIEW
      }
    ]
  },

  {
    label: "Administration",
    icon: Shield,
    role: ["admin", "manager"],
    children: [
      {
        label: "User Management",
        href: "/admin/users",
        icon: Users,
        permission: PERMISSIONS.USERS_READ,
        role: ["admin", "manager"]
      },
      {
        label: "System Settings",
        href: "/admin/system",
        icon: Settings,
        permission: PERMISSIONS.SYSTEM_SETTINGS,
        role: ["admin"]
      },
      {
        label: "System Backup",
        href: "/admin/system/backup",
        icon: Database,
        permission: PERMISSIONS.SYSTEM_SETTINGS,
        role: ["admin"]
      },
      {
        label: "System Logs",
        href: "/admin/system-logs",
        icon: FileText,
        permission: PERMISSIONS.SYSTEM_LOGS
      }
    ]
  }
];
