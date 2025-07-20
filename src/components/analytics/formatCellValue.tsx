import { ReportType } from "@/components/analytics/configs";
import { formatCurrency, formatNumber } from "../../utils/conversionLogic";
import { Badge } from "@/components/ui/badge";

export function formatCellValue(row: Record<string, unknown>, header: string, reportType: ReportType): React.ReactNode {
  const key = header.toLowerCase().replace(/\s+/g, "");
  const value = row[key];

  if (value === null || value === undefined) return "-";

  // Currency formatting
  if (header.toLowerCase().includes("cost") || header.toLowerCase().includes("value") || header.toLowerCase().includes("revenue") || header.toLowerCase().includes("profit")) {
    const numValue = typeof value === "number" ? value : Number(value);
    return formatCurrency(numValue);
  }

  // Threshold formatting (simple numeric display)
  if (header.toLowerCase().includes("threshold")) {
    const numValue = typeof value === "number" ? value : Number(value);
    return formatNumber(numValue);
  }

  // Percentage formatting
  if (header.toLowerCase().includes("%") || header.toLowerCase().includes("percentage")) {
    const numValue = typeof value === "number" ? value : Number(value);
    return `${numValue.toFixed(1)}%`;
  }

  // Date formatting
  if (header.toLowerCase().includes("date") || header.toLowerCase().includes("purchase")) {
    if (!value || value === null || value === undefined) return "Never";
    const dateValue = value instanceof Date ? value : new Date(String(value));

    // Check if date is valid
    if (isNaN(dateValue.getTime())) return "Never";

    // Calculate days ago for last purchase
    if (header.toLowerCase().includes("purchase")) {
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - dateValue.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return (
        <div className="flex flex-col">
          <span className="text-sm">{dateValue.toLocaleDateString()}</span>
          <span className="text-xs text-muted-foreground">{diffDays === 1 ? "1 day ago" : `${diffDays} days ago`}</span>
        </div>
      );
    }

    return dateValue.toLocaleDateString();
  }

  // Quantity formatting with visual indicators
  if (header.toLowerCase().includes("qty") || header.toLowerCase().includes("quantity")) {
    const numValue = typeof value === "number" ? value : Number(value);

    // For available quantity, add visual indicators
    if (header.toLowerCase().includes("available")) {
      const threshold = 2; // Min threshold
      let colorClass = "";
      let indicator = "";

      if (numValue <= 0.5) {
        colorClass = "text-red-600 font-semibold";
        indicator = "🔴";
      } else if (numValue < threshold) {
        colorClass = "text-red-500 font-medium";
        indicator = "🟡";
      } else if (numValue < threshold * 2) {
        colorClass = "text-yellow-600";
        indicator = "🟡";
      } else {
        colorClass = "text-green-600";
        indicator = "🟢";
      }

      return (
        <div className="flex items-center gap-1">
          <span className={colorClass}>{formatNumber(numValue)}</span>
          <span className="text-xs">{indicator}</span>
        </div>
      );
    }

    return formatNumber(numValue);
  }

  // Status badges
  if (header.toLowerCase() === "status") {
    const stringValue = String(value);
    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";

    switch (stringValue.toLowerCase()) {
      case "critical":
        variant = "destructive";
        break;
      case "low stock":
        variant = "destructive";
        break;
      case "warning":
        variant = "outline";
        break;
      case "good":
        variant = "default";
        break;
    }

    return (
      <Badge variant={variant} className={stringValue === "Critical" ? "bg-red-600 text-white hover:bg-red-700" : stringValue === "Low Stock" ? "bg-red-500 text-white hover:bg-red-600" : stringValue === "Warning" ? "bg-yellow-500 text-white hover:bg-yellow-600" : "bg-green-600 text-white hover:bg-green-700"}>
        {stringValue}
      </Badge>
    );
  }

  // Urgency badges
  if (header.toLowerCase() === "urgency") {
    const stringValue = String(value);
    const variant = stringValue === "critical" ? "destructive" : stringValue === "warning" ? "default" : "secondary";
    return <Badge variant={variant}>{stringValue}</Badge>;
  }

  // Trend indicators
  if (header.toLowerCase() === "trend") {
    const stringValue = String(value);
    const color = stringValue === "increasing" ? "text-red-600" : stringValue === "decreasing" ? "text-green-600" : "text-gray-600";
    return <span className={color}>{stringValue}</span>;
  }

  return String(value);
}
