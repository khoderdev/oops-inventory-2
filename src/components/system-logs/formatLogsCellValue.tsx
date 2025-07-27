import { LogType } from "@/components/system-logs/configs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, Clock, Package, TrendingDown, TrendingUp, User, XCircle } from "lucide-react";

export function formatLogsCellValue(row: Record<string, unknown>, header: string, logType: LogType): React.ReactNode {
  const value = row[header];

  if (value === null || value === undefined) {
    return "-";
  }

  // Handle timestamp formatting
  if (header === "Timestamp" || header === "Time") {
    try {
      const date = new Date(String(value));
      if (header === "Time") {
        return format(date, "HH:mm:ss");
      }
      return format(date, "MMM dd, yyyy HH:mm:ss");
    } catch {
      return String(value);
    }
  }

  // Handle action type badges
  if (header === "Action Type") {
    const actionType = String(value);
    const actionColors: Record<string, string> = {
      create: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      update: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
      delete: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
      add_to_stock: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      waste_from_stock: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
      pos_toggle: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300"
    };

    const colorClass = actionColors[actionType] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";

    return (
      <Badge variant="outline" className={colorClass}>
        {actionType.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  }

  // Handle status badges
  if (header === "Status") {
    const status = String(value);
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      case "failure":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Warning
          </Badge>
        );
      case "info":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
            <Clock className="w-3 h-3 mr-1" />
            Info
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      case "neutral":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
            <Clock className="w-3 h-3 mr-1" />
            Neutral
          </Badge>
        );
      case "user":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
            <User className="w-3 h-3 mr-1" />
            User
          </Badge>
        );
      case "material":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <Package className="w-3 h-3 mr-1" />
            Material
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  }

  // Handle quantity delta with visual indicators
  if (header === "Quantity") {
    const quantity = typeof value === "number" ? value : Number(value);

    if (quantity === 0) {
      return <span className="text-gray-500">-</span>;
    }

    const isPositive = quantity > 0;
    const colorClass = isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    const icon = isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;

    return (
      <div className={`flex items-center gap-1 ${colorClass} font-medium`}>
        {icon}
        <span>
          {isPositive ? "+" : ""}
          {formatNumber(quantity)}
        </span>
      </div>
    );
  }

  // Handle cost delta with visual indicators
  if (header === "Cost") {
    const cost = typeof value === "number" ? value : Number(value);

    if (cost === 0) {
      return <span className="text-gray-500">-</span>;
    }

    const isPositive = cost > 0;
    const colorClass = isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    const icon = isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;

    return (
      <div className={`flex items-center gap-1 ${colorClass} font-medium`}>
        {icon}
        <span>
          {isPositive ? "+" : ""}
          {formatCurrency(cost)}
        </span>
      </div>
    );
  }

  // Handle material names with icon
  if (header === "Material") {
    return (
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-gray-400" />
        <span className="font-medium">{String(value)}</span>
      </div>
    );
  }

  // Handle user names with icon
  if (header === "User") {
    const userName = String(value);
    const isSystem = userName === "System";

    return (
      <div className="flex items-center gap-2">
        <User className={`w-4 h-4 ${isSystem ? "text-blue-400" : "text-gray-400"}`} />
        <span className={`${isSystem ? "font-medium text-blue-600 dark:text-blue-400" : ""}`}>{userName}</span>
      </div>
    );
  }

  // Handle error messages with truncation
  if (header === "Error Message") {
    const errorMessage = String(value);
    if (errorMessage.length > 50) {
      return (
        <div className="max-w-xs">
          <span className="text-red-600 dark:text-red-400 text-sm" title={errorMessage}>
            {errorMessage.substring(0, 50)}...
          </span>
        </div>
      );
    }
    return <span className="text-red-600 dark:text-red-400 text-sm">{errorMessage}</span>;
  }

  // Handle descriptions with truncation
  if (header === "Description") {
    const description = String(value);
    if (description === "-" || !description) {
      return <span className="text-gray-400">-</span>;
    }

    if (description.length > 60) {
      return (
        <div className="max-w-sm">
          <span className="text-sm text-gray-600 dark:text-gray-400" title={description}>
            {description.substring(0, 60)}...
          </span>
        </div>
      );
    }
    return <span className="text-sm text-gray-600 dark:text-gray-400">{description}</span>;
  }

  // Handle stock entry IDs
  if (header === "Stock Entry") {
    return (
      <Badge variant="outline" className="font-mono text-xs">
        #{String(value)}
      </Badge>
    );
  }

  // Handle percentage values
  if (header === "Percentage" || header === "Relevance") {
    const percentage = String(value);
    let colorClass = "text-gray-600";

    if (percentage.includes("%")) {
      const numValue = parseFloat(percentage.replace("%", ""));
      if (numValue >= 80) {
        colorClass = "text-green-600 dark:text-green-400";
      } else if (numValue >= 60) {
        colorClass = "text-blue-600 dark:text-blue-400";
      } else if (numValue >= 40) {
        colorClass = "text-yellow-600 dark:text-yellow-400";
      } else {
        colorClass = "text-red-600 dark:text-red-400";
      }
    }

    return <span className={`font-medium ${colorClass}`}>{percentage}</span>;
  }

  // Handle change values
  if (header === "Change") {
    const change = String(value);
    if (change === "-") {
      return <span className="text-gray-400">-</span>;
    }

    return <span className="text-sm text-gray-600 dark:text-gray-400">{change}</span>;
  }

  // Handle metric values for summary overview
  if (logType === "summary-overview" && header === "Value") {
    const valueStr = String(value);

    // Check if it's a number
    if (!isNaN(Number(valueStr))) {
      const numValue = Number(valueStr);
      if (numValue > 1000) {
        return <span className="font-bold text-lg">{formatNumber(numValue)}</span>;
      }
    }

    return <span className="font-medium">{valueStr}</span>;
  }

  // Default formatting
  return String(value);
}
