import { LogType } from "@/components/system/system-logs/configs";

// Get table headers based on log type
export function getLogsTableHeaders(logType: LogType): string[] {
  const headerMap: Record<LogType, string[]> = {
    "stock-entry-logs": ["Timestamp", "User", "Action", "Item", "Quantity", "Cost", "Description", "Status"],
    "user-activity-logs": ["Timestamp", "User", "Action", "Item", "Quantity", "Cost", "Description", "Status"],
    "material-activity-logs": ["Timestamp", "User", "Action", "Item", "Quantity", "Cost", "Description", "Status"],
    "failed-operations": ["Timestamp", "User", "Action", "Item", "Quantity", "Cost", "Description", "Status", "Error Message"],
    "recent-activity": ["Timestamp", "User", "Action", "Item", "Quantity", "Cost", "Description", "Status"],
    "today-logs": ["Timestamp", "User", "Action", "Item", "Quantity", "Cost", "Description", "Status"],
    "action-type-logs": ["Timestamp", "User", "Action", "Item", "Quantity", "Cost", "Description", "Status"],
    "employee-logs": ["Timestamp", "User", "Action", "Resource", "Employee", "Item", "Description", "Status"],
    "settlement-logs": ["Timestamp", "User", "Action", "Resource", "Employee", "Item", "Description", "Status"],

    "summary-overview": ["Metric", "Value", "Percentage", "Change", "Status"],
    "search-logs": ["Timestamp", "User", "Action", "Item", "Quantity", "Cost", "Description", "Status", "Relevance"]
  };

  return headerMap[logType] || [];
}
