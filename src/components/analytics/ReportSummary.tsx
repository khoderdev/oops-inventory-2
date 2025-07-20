import { AlertTriangle, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/conversionLogic";

interface ReportSummaryProps {
  data: Record<string, unknown>[];
}

export function ReportSummary({ data }: ReportSummaryProps) {
  const totalItems = data.length;
  const criticalItems = data.filter(item => item.status === "Critical").length;
  const lowStockItems = data.filter(item => item.status === "Low Stock").length;
  const warningItems = data.filter(item => item.status === "Warning").length;
  const goodItems = data.filter(item => item.status === "Good").length;

  const totalValue = data.reduce((sum, item) => sum + (Number(item.totalvalue) || 0), 0);
  const zeroStockItems = data.filter(item => Number(item.availableqty) <= 0).length;

  const summaryCards = [
    {
      title: "Total Items",
      value: totalItems,
      icon: <Package className="h-4 w-4" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Critical Stock",
      value: criticalItems,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Low Stock",
      value: lowStockItems,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Warning Items",
      value: warningItems,
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Good Stock",
      value: goodItems,
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Total Value",
      value: formatCurrency(totalValue),
      icon: <ShoppingCart className="h-4 w-4" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {summaryCards.map((card, index) => (
        <Card key={index} className={cn("p-3", card.bgColor)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{card.title}</p>
              <p className={cn("text-lg font-bold", card.color)}>{typeof card.value === "string" ? card.value : card.value.toLocaleString()}</p>
            </div>
            <div className={cn("p-2 rounded-full", card.color)}>{card.icon}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
