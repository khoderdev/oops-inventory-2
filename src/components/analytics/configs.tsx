import { FileText, TrendingUp, Package, ShoppingCart, AlertTriangle, Users, ChefHat } from "lucide-react";
import { ReportConfig } from "./ReportGenerator";

export type ReportType = "inventory-summary" | "stock-purchases" | "sales-performance" | "cost-analysis" | "supplier-performance" | "expiry-alerts" | "category-analysis" | "menu-profitability" | "section-performance";

export const REPORT_CONFIGS: ReportConfig[] = [
  {
    id: "inventory-summary",
    name: "Inventory Summary",
    description: "Current stock levels, values, and alerts",
    icon: <Package className="h-4 w-4" />,
    requiresDateRange: false
  },
  {
    id: "stock-purchases",
    name: "Stock Purchases",
    description: "Purchase history and supplier performance",
    icon: <ShoppingCart className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "sales-performance",
    name: "Sales Performance",
    description: "Revenue analysis and sales trends",
    icon: <TrendingUp className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "cost-analysis",
    name: "Cost Analysis",
    description: "Material cost trends and optimization",
    icon: <FileText className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "supplier-performance",
    name: "Supplier Performance",
    description: "Supplier comparison and analytics",
    icon: <Users className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "expiry-alerts",
    name: "Expiry Alerts",
    description: "Items expiring soon and waste management",
    icon: <AlertTriangle className="h-4 w-4" />,
    requiresDateRange: false
  },
  {
    id: "category-analysis",
    name: "Category Analysis",
    description: "Performance breakdown by material categories",
    icon: <Package className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "menu-profitability",
    name: "Menu Profitability",
    description: "Menu item costs vs pricing analysis",
    icon: <ChefHat className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "section-performance",
    name: "Section Performance",
    description: "Performance analysis by sections",
    icon: <TrendingUp className="h-4 w-4" />,
    requiresDateRange: true
  }
];
