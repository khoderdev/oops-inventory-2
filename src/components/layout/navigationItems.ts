import { PERMISSIONS } from "@/types/auth";
import { NavigationItem } from "@/types/inventory";
import { Activity, BarChart3, Calendar, Database, FileText, Home, Package, Receipt, Settings, Shield, ShoppingCart, UserCheck, Users, Utensils, Building } from "lucide-react";

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
    href: "/day-operations"
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
        label: "Departments",
        href: "/departments",
        icon: Building,
        permission: PERMISSIONS.DEPARTMENT_READ
      },
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
