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
  // {
  //   label: "POS System",
  //   icon: ShoppingCart,
  //   children: [
  //     {
  //       label: "POS Client",
  //       href: "/pos",
  //       icon: ShoppingCart,
  //       permission: PERMISSIONS.POS_ACCESS
  //     },
  //     {
  //       label: "POS Backoffice",
  //       href: "/backoffice-pos",
  //       icon: Receipt,
  //       permission: PERMISSIONS.POS_ACCESS
  //     },
  //     {
  //       label: "Kitchen Display",
  //       href: "/pos/kitchen-display",
  //       icon: Utensils,
  //       permission: PERMISSIONS.POS_KITCHEN_DISPLAY
  //     },
  //     {
  //       label: "Customer Display",
  //       href: "/pos/customer-display",
  //       icon: Users,
  //       permission: PERMISSIONS.POS_CUSTOMER_DISPLAY
  //     },
  //     {
  //       label: "Floor Designer",
  //       href: "/pos/floor-designer",
  //       icon: Users,
  //       permission: PERMISSIONS.POS_CUSTOMER_DISPLAY
  //     }
  //   ]
  // },
  {
    label: "Inventory Management",
    icon: Package,
    href: "/inventory"
  },

  {
    label: "Menu Management",
    icon: Utensils,
    href: "/menu"
    // children: [
    //   {
    //     label: "Menu Items",
    //     href: "/menu",
    //     icon: Utensils,
    //     permission: PERMISSIONS.MENU_ITEMS_READ
    //   },
    //   {
    //     label: "Menu Categories",
    //     href: "/menu/categories",
    //     icon: Settings,
    //     permission: PERMISSIONS.MENU_ITEMS_READ
    //   },
    //   {
    //     label: "Recipes",
    //     href: "/menu/recipes",
    //     icon: FileText,
    //     permission: PERMISSIONS.MENU_ITEMS_READ
    //   },
    //   {
    //     label: "Pricing",
    //     href: "/menu/pricing",
    //     icon: DollarSign,
    //     permission: PERMISSIONS.MENU_ITEMS_PRICING
    //   }
    // ]
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
      },
      {
        label: "Sales Refunds",
        href: "/sales/refunds",
        icon: CreditCard,
        permission: PERMISSIONS.SALES_REFUND
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
    // children: [
    //   {
    //     label: "Sales Reports",
    //     href: "/reports/sales",
    //     icon: BarChart3,
    //     permission: PERMISSIONS.REPORTS_SALES
    //   },
    //   {
    //     label: "Inventory Reports",
    //     href: "/reports/inventory",
    //     icon: Package,
    //     permission: PERMISSIONS.REPORTS_INVENTORY
    //   },
    //   {
    //     label: "Financial Reports",
    //     href: "/reports/financial",
    //     icon: DollarSign,
    //     permission: PERMISSIONS.REPORTS_FINANCIAL
    //   },
    //   {
    //     label: "Analytics Dashboard",
    //     href: "/analytics",
    //     icon: Activity,
    //     permission: PERMISSIONS.ANALYTICS_DASHBOARD
    //   },
    //   {
    //     label: "Trends Analysis",
    //     href: "/analytics/trends",
    //     icon: Activity,
    //     permission: PERMISSIONS.ANALYTICS_TRENDS
    //   }
    // ]
  },
  // {
  //   label: "Financial Management",
  //   icon: DollarSign,
  //   children: [
  //     {
  //       label: "Financial Overview",
  //       href: "/finance",
  //       icon: DollarSign,
  //       permission: PERMISSIONS.FINANCE_VIEW_COSTS
  //     },
  //     {
  //       label: "Budget Management",
  //       href: "/finance/budgets",
  //       icon: BarChart3,
  //       permission: PERMISSIONS.FINANCE_BUDGETS
  //     },
  //     {
  //       label: "Expense Tracking",
  //       href: "/finance/expenses",
  //       icon: Receipt,
  //       permission: PERMISSIONS.FINANCE_EXPENSES
  //     }
  //   ]
  // },
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
