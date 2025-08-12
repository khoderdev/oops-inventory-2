import { ReportType } from "@/components/analytics/configs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "../../utils/conversionLogic";

// Helper function to format dates consistently as DD-MM-YYYY HH:MM:SS AM/PM
const formatDateToDDMMYYYY = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  // Convert to 12-hour format
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const hoursStr = hours.toString().padStart(2, '0');
  
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${day}-${month}-${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
};

export function formatCellValue(row: Record<string, unknown>, header: string, reportType: ReportType): React.ReactNode {
  // Use the header as-is to match Title Case keys with spaces
  const value = row[header];



  if (value === null || value === undefined) {
    return "-";
  }

  // Handle waste-report specific headers
  if (reportType === "waste-report") {
    switch (header) {
      case "Material": {
        const materialText = String(value);
        const [materialName, category] = materialText.split("\n");
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-gray-900 dark:text-gray-100">{materialName}</span>
            {category && <span className="text-xs text-muted-foreground/80 capitalize">{category}</span>}
          </div>
        );
      }

      case "Waste Quantity": {
        const quantity = typeof value === "number" ? value : Number(value);
        let colorClass = "";
        let indicator = "";

        if (quantity <= 0.5) {
          colorClass = "text-red-600 font-semibold";
          indicator = "🔴";
        } else if (quantity < 2) {
          colorClass = "text-yellow-600";
          indicator = "🟡";
        } else {
          colorClass = "text-green-600";
          indicator = "🟢";
        }

        return (
          <div className="flex items-center gap-1">
            <span className={colorClass}>{formatNumber(quantity)}</span>
            <span className="text-xs">{indicator}</span>
          </div>
        );
      }
      case "Unit": {
        return String(value);
      }
      case "Reason": {
        return String(value);
      }
      case "Cost": {
        // Remove any existing '$' prefix to avoid double formatting
        const costValue = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : Number(value);

        if (isNaN(costValue) || costValue === 0) {
          return <span className="text-muted-foreground">-</span>;
        }

        // Color coding based on cost amount
        let colorClass = "";
        let bgClass = "";

        if (costValue >= 10) {
          colorClass = "text-red-700 dark:text-red-400";
          bgClass = "bg-red-50 dark:bg-red-950/20";
        } else if (costValue >= 5) {
          colorClass = "text-orange-700 dark:text-orange-400";
          bgClass = "bg-orange-50 dark:bg-orange-950/20";
        } else if (costValue >= 1) {
          colorClass = "text-yellow-700 dark:text-yellow-400";
          bgClass = "bg-yellow-50 dark:bg-yellow-950/20";
        } else {
          colorClass = "text-green-700 dark:text-green-400";
          bgClass = "bg-green-50 dark:bg-green-950/20";
        }

        return <div className={`inline-flex items-center px-2 py-1 rounded-md font-semibold text-sm ${colorClass} ${bgClass}`}>{formatCurrency(costValue)}</div>;
      }
      case "Waste Date": {
        const dateValue = value instanceof Date ? value : new Date(String(value));
        return isNaN(dateValue.getTime()) ? "Never" : formatDateToDDMMYYYY(dateValue);
      }
      case "Entries Affected": {
        const entries = typeof value === "number" ? value : Number(value);
        const entriesColor = entries === 0 ? "text-red-500" : entries < 3 ? "text-yellow-600" : "text-green-600";
        const entriesIcon = entries === 0 ? "⚠️" : entries < 3 ? "📊" : "✅";

        return (
          <div className={`flex items-center gap-1 ${entriesColor}`}>
            <span>{entriesIcon}</span>
            <span>{entries}</span>
          </div>
        );
      }
    }
  }

  // Handle cost-analysis specific headers
  if (reportType === "cost-analysis") {
    switch (header) {
      case "Material": {
        return String(row.materialname || row.materialName || value);
      }
      case "Current Cost": {
        const currentCost = row.currentaveragecost || row.currentAverageCost || value;
        const numCurrentCost = typeof currentCost === "number" ? currentCost : Number(currentCost);
        return numCurrentCost > 0 ? formatCurrency(numCurrentCost) : "-";
      }
      case "Previous Cost": {
        const previousCost = row.previousaveragecost || row.previousAverageCost || value;
        const numPreviousCost = typeof previousCost === "number" ? previousCost : Number(previousCost);
        return numPreviousCost > 0 ? formatCurrency(numPreviousCost) : "-";
      }
      case "Trend": {
        const trend = row.costtrend || row.costTrend || value;
        const trendValue = String(trend);
        let trendIcon = "";
        let trendColor = "";

        switch (trendValue) {
          case "increasing":
            trendIcon = "📈";
            trendColor = "text-red-600";
            break;
          case "decreasing":
            trendIcon = "📉";
            trendColor = "text-green-600";
            break;
          default:
            trendIcon = "➡️";
            trendColor = "text-gray-600";
        }

        return (
          <div className={`flex items-center gap-1 ${trendColor} font-medium`}>
            <span>{trendIcon}</span>
            <span className="capitalize">{trendValue}</span>
          </div>
        );
      }
      case "Variance %": {
        const variance = row.costvariance || row.costVariance || value;
        const numVariance = typeof variance === "number" ? variance : Number(variance);

        if (numVariance === 0) return "0%";

        const absVariance = Math.abs(numVariance);
        const varianceColor = numVariance > 0 ? "text-red-600" : "text-green-600";
        const varianceIcon = numVariance > 0 ? "↑" : "↓";

        return (
          <div className={`flex items-center gap-1 ${varianceColor} font-medium`}>
            <span>{varianceIcon}</span>
            <span>{absVariance.toFixed(1)}%</span>
          </div>
        );
      }
      case "Entries": {
        const entries = row.stockentriescount || row.stockEntriesCount || row.entries || value;
        const numEntries = typeof entries === "number" ? entries : Number(entries);

        let entriesColor = "";
        let entriesIcon = "";

        if (numEntries === 0) {
          entriesColor = "text-red-500";
          entriesIcon = "⚠️";
        } else if (numEntries < 3) {
          entriesColor = "text-yellow-600";
          entriesIcon = "📊";
        } else {
          entriesColor = "text-green-600";
          entriesIcon = "✅";
        }

        return (
          <div className={`flex items-center gap-1 ${entriesColor}`}>
            <span>{entriesIcon}</span>
            <span>{numEntries}</span>
          </div>
        );
      }
      case "Recommendation": {
        const recommendation = row.recommendation || value;
        const recText = String(recommendation);

        let recColor = "";
        let recIcon = "";

        if (recText.toLowerCase().includes("critical") || recText.toLowerCase().includes("alternative")) {
          recColor = "text-red-600";
          recIcon = "🚨";
        } else if (recText.toLowerCase().includes("monitor") || recText.toLowerCase().includes("increasing")) {
          recColor = "text-yellow-600";
          recIcon = "⚠️";
        } else if (recText.toLowerCase().includes("good") || recText.toLowerCase().includes("favorable")) {
          recColor = "text-green-600";
          recIcon = "✅";
        } else {
          recColor = "text-blue-600";
          recIcon = "💡";
        }

        return (
          <div className={`${recColor} text-sm`}>
            <div className="flex items-start gap-1">
              <span className="flex-shrink-0 mt-0.5">{recIcon}</span>
              <span className="leading-tight">{recText}</span>
            </div>
          </div>
        );
      }
    }
  }

  // Currency formatting (exclude variance-analysis columns)
  if ((header.toLowerCase().includes("cost") || header.toLowerCase().includes("value") || header.toLowerCase().includes("revenue") || header.toLowerCase().includes("profit")) && reportType !== "variance-analysis") {
    const numValue = typeof value === "number" ? value : Number(value);
    return isNaN(numValue) || numValue === 0 ? "-" : formatCurrency(numValue);
  }

  // Threshold formatting
  if (header.toLowerCase().includes("threshold")) {
    const numValue = typeof value === "number" ? value : Number(value);
    return isNaN(numValue) ? "-" : formatNumber(numValue);
  }

  // Percentage formatting (exclude variance-analysis columns)
  if ((header.toLowerCase().includes("%") || header.toLowerCase().includes("percentage")) && reportType !== "variance-analysis") {
    const numValue = typeof value === "number" ? value : Number(value);
    return isNaN(numValue) ? "-" : `${numValue.toFixed(1)}%`;
  }

  // Date formatting
  if (header.toLowerCase().includes("date") || header.toLowerCase().includes("purchase")) {
    if (!value) return "Never";
    const dateValue = value instanceof Date ? value : new Date(String(value));
    if (isNaN(dateValue.getTime())) return "Never";

    if (header.toLowerCase().includes("purchase")) {
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - dateValue.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return (
        <div className="flex flex-col">
          <span className="text-sm">{formatDateToDDMMYYYY(dateValue)}</span>
          <span className="text-xs text-muted-foreground">{diffDays === 1 ? "1 day ago" : `${diffDays} days ago`}</span>
        </div>
      );
    }

    return formatDateToDDMMYYYY(dateValue);
  }

  // Quantity formatting with visual indicators (exclude variance-analysis columns)
  if ((header.toLowerCase().includes("qty") || header.toLowerCase().includes("quantity")) && reportType !== "variance-analysis") {
    const numValue = typeof value === "number" ? value : Number(value);

    if (header.toLowerCase().includes("available")) {
      const threshold = 2;
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

    return isNaN(numValue) ? "-" : formatNumber(numValue);
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

  // Handle variance-analysis specific headers
  if (reportType === "variance-analysis") {
    
    switch (header) {
      case "Material": {
        const materialText = String(value);
        const [materialName, category] = materialText.split("\n");
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-gray-900 dark:text-gray-100">{materialName}</span>
            {category && <span className="text-xs text-muted-foreground/80 capitalize">{category}</span>}
          </div>
        );
      }

      case "Variance %": {
        const percentText = String(value);
        const percentValue = parseFloat(percentText.replace("%", "").replace("+", ""));
        let colorClass = "";
        let bgClass = "";
        
        if (Math.abs(percentValue) <= 5) {
          colorClass = "text-green-700 dark:text-green-300";
          bgClass = "bg-green-100 dark:bg-green-900/30";
        } else if (Math.abs(percentValue) <= 15) {
          colorClass = "text-yellow-700 dark:text-yellow-300";
          bgClass = "bg-yellow-100 dark:bg-yellow-900/30";
        } else {
          colorClass = "text-red-700 dark:text-red-300";
          bgClass = "bg-red-100 dark:bg-red-900/30";
        }

        return (
          <span className={`px-2 py-1 rounded-md font-semibold text-sm ${colorClass} ${bgClass}`}>
            {percentText}
          </span>
        );
      }

      case "Status": {
        const status = String(value);
        let variant: "default" | "secondary" | "destructive" | "outline" = "default";
        
        switch (status) {
          case "Acceptable":
            variant = "secondary";
            break;
          case "Attention Needed":
            variant = "default";
            break;
          case "Stock Shortage":
            variant = "destructive";
            break;
          case "Excess Stock":
            variant = "outline";
            break;
        }
        
        return <Badge variant={variant}>{status}</Badge>;
      }

      case "Cost Variance": {
        const costText = String(value);
        const costValue = parseFloat(costText.replace("$", ""));
        let colorClass = "";
        
        if (costValue >= 50) {
          colorClass = "text-red-600 font-bold";
        } else if (costValue >= 20) {
          colorClass = "text-orange-600 font-semibold";
        } else if (costValue >= 5) {
          colorClass = "text-yellow-600";
        } else {
          colorClass = "text-green-600";
        }
        
        return <span className={colorClass}>{costText}</span>;
      }

      case "Variance Qty": {
        const qtyText = String(value);
        const isPositive = qtyText.startsWith("+");
        const isNegative = qtyText.startsWith("-");
        
        let colorClass = "text-gray-600";
        if (isPositive) {
          colorClass = "text-blue-600 font-semibold";
        } else if (isNegative) {
          colorClass = "text-red-600 font-semibold";
        }
        
        return <span className={colorClass}>{qtyText}</span>;
      }
    }
  }

  return String(value);
}
