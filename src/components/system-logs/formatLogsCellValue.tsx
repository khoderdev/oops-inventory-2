import { LogType } from "@/components/system-logs/configs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, Clock, Package, TrendingDown, TrendingUp, User, XCircle } from "lucide-react";
import React from "react";

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
        return (
          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
            {format(date, "HH:mm:ss")}
          </span>
        );
      }
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{format(date, "dd-MM-yyyy")}</span>
          <span className="font-mono text-xs text-gray-500">{format(date, "HH:mm:ss")}</span>
        </div>
      );
    } catch {
      return String(value);
    }
  }

  // Handle action type badges
  if (header === "Action") {
    const actionType = String(value);
    const actionColors: Record<string, string> = {
      create: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
      update: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
      delete: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
      add_to_stock: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
      waste_from_stock: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800",
      pos_toggle: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800"
    };

    const colorClass = actionColors[actionType] || "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
    
    // Format action text for better readability
    const formatActionText = (action: string) => {
      return action
        .replace(/_/g, " ")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    };

    return (
      <div className="flex justify-center">
        <Badge variant="outline" className={`${colorClass} font-medium text-xs px-3 py-1 text-center min-w-[80px]`}>
          {formatActionText(actionType)}
        </Badge>
      </div>
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

  // Handle Item column (Material + Stock Entry combined)
  if (header === "Item") {
    // Check if we have both material and stock entry data
    const materialName = row["Material"] || row["materialName"] || value;
    const stockEntryId = row["Stock Entry"] || row["stockEntryId"] || row["stockEntry"];
    
    return (
      <div className="flex items-center gap-3">
        <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {String(materialName || "-")}
          </span>
          {stockEntryId && (
            <Badge variant="outline" className="font-mono text-xs w-fit mt-1 px-2 py-0.5 bg-gray-50 dark:bg-gray-800">
              #{String(stockEntryId)}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // Handle user names with avatar
  if (header === "User") {
    const userName = String(value);
    const isSystem = userName === "System";
    
    // Get user initials
    const getInitials = (name: string) => {
      if (name === "System") return "SY";
      return name
        .split(" ")
        .map(word => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className={`text-xs font-semibold ${
            isSystem 
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" 
              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }`}>
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${
            isSystem ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"
          }`}>
            {userName}
          </span>
          {isSystem && (
            <span className="text-xs text-blue-500 dark:text-blue-400">Automated</span>
          )}
        </div>
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
