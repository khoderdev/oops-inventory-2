import { AlertTriangle, BarChart3, DollarSign, Layout, Package, ShoppingCart, Tag, Trash2, TrendingUp, Utensils } from "lucide-react";

export type ReportType = "inventory-summary" | "stock-purchases" | "sales-performance" | "cost-analysis" | "supplier-performance" | "expiry-alerts" | "category-analysis" | "menu-profitability" | "section-performance" | "waste-report" | "variance-analysis";

export const REPORT_CONFIGS: ReadonlyArray<{
  id: ReportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresDateRange: boolean;
}> = [
  {
    id: "inventory-summary",
    name: "Inventory Summary",
    description: "Overview of current inventory levels, stock status, and total value by material.",
    icon: <Package className="h-4 w-4" />,
    requiresDateRange: false
  },
  {
    id: "stock-purchases",
    name: "Stock Purchases",
    description: "Details of stock purchase history including supplier, quantity, and cost.",
    icon: <ShoppingCart className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "sales-performance",
    name: "Sales Performance",
    description: "Analysis of sales performance by date and section with revenue metrics.",
    icon: <TrendingUp className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "cost-analysis",
    name: "Cost Analysis",
    description: "Tracks material cost trends and variances for cost optimization.",
    icon: <DollarSign className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "supplier-performance",
    name: "Supplier Performance",
    description: "Evaluates supplier reliability based on order history and value.",
    icon: <Tag className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "expiry-alerts",
    name: "Expiry Alerts",
    description: "Alerts for materials nearing expiry with urgency indicators.",
    icon: <AlertTriangle className="h-4 w-4" />,
    requiresDateRange: false
  },
  {
    id: "category-analysis",
    name: "Category Analysis",
    description: "Breakdown of inventory by category with value and volume metrics.",
    icon: <Layout className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "menu-profitability",
    name: "Menu Profitability",
    description: "Profitability analysis of menu items based on cost and sales.",
    icon: <Utensils className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "section-performance",
    name: "Section Performance",
    description: "Performance metrics for sections based on sales and assignments.",
    icon: <Layout className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "waste-report",
    name: "Waste Report",
    description: "Summary of waste records including material, quantity, reason, and cost impact.",
    icon: <Trash2 className="h-4 w-4" />,
    requiresDateRange: true
  },
  {
    id: "variance-analysis",
    name: "Variance Analysis",
    description: "Comprehensive analysis of variances between stock entries, sales, wastages, and expected vs actual inventory levels.",
    icon: <BarChart3 className="h-4 w-4" />,
    requiresDateRange: true
  }
];
