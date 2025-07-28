import { PERMISSIONS } from "@/types/auth";
import { NavigationItem } from "@/types/inventory";
import { Activity, BarChart3, Calendar, FileText, Home, Package, Receipt, Shield, ShoppingCart, Users } from "lucide-react";

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home
  },
  {
    label: "Inventory",
    icon: Package,
    children: [
      {
        label: "Stock",
        href: "/inventory",
        icon: Package,
        permission: PERMISSIONS.MENU_ITEMS_READ
      },
      {
        label: "Menu Items",
        href: "/inventory/menu-items",
        icon: Package,
        permission: PERMISSIONS.MENU_ITEMS_READ
      }
    ]
  },
  {
    label: "Sales",
    icon: ShoppingCart,
    children: [
      {
        label: "POS Client",
        href: "/pos",
        icon: ShoppingCart,
        permission: PERMISSIONS.SALES_CREATE
      },
      {
        label: "POS Backoffice",
        href: "/backoffice-pos",
        icon: ShoppingCart,
        permission: PERMISSIONS.SALES_CREATE
      },
      {
        label: "Sales History",
        href: "/sales",
        icon: FileText,
        permission: PERMISSIONS.SALES_READ
      },
      {
        label: "Menu Items",
        href: "/menu",
        icon: Package,
        permission: PERMISSIONS.MENU_ITEMS_READ
      }
    ]
  },
  {
    label: "Operations",
    icon: Calendar,
    children: [
      {
        label: "Day Operations",
        href: "/day-operations",
        icon: Calendar,
        permission: PERMISSIONS.DAY_OPERATIONS_READ
      }
    ]
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    permission: PERMISSIONS.AUDIT_REPORTS
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: Activity,
    permission: PERMISSIONS.ANALYTICS_TRENDS
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
        permission: PERMISSIONS.USERS_READ
      },
      {
        label: "System Logs",
        href: "/admin/system-logs",
        icon: Receipt,
        permission: PERMISSIONS.SYSTEM_LOGS
      }
    ]
  }
];
