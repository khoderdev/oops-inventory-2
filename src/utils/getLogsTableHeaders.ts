import { LogType } from "@/components/system-logs/configs";

// Get table headers based on log type
export function getLogsTableHeaders(logType: LogType): string[] {
  const headerMap: Record<LogType, string[]> = {
    "stock-entry-logs": ["Timestamp", "Action Type", "Material", "User", "Stock Entry", "Quantity", "Cost", "Status", "Description"],
    "user-activity-logs": ["Timestamp", "Action Type", "Material", "Stock Entry", "Quantity", "Cost", "Status", "Description"],
    "material-activity-logs": ["Timestamp", "Action Type", "User", "Stock Entry", "Quantity", "Cost", "Status", "Description"],
    "failed-operations": ["Timestamp", "Action Type", "Material", "User", "Stock Entry", "Error Message", "Quantity", "Cost", "Description"],
    "recent-activity": ["Timestamp", "Action Type", "Material", "User", "Stock Entry", "Quantity", "Cost", "Status"],
    "today-logs": ["Time", "Action Type", "Material", "User", "Stock Entry", "Quantity", "Cost", "Status", "Description"],
    "action-type-logs": ["Timestamp", "Material", "User", "Stock Entry", "Quantity", "Cost", "Status", "Description"],
    "date-range-logs": ["Timestamp", "Action Type", "Material", "User", "Stock Entry", "Quantity", "Cost", "Status", "Description"],
    "summary-overview": ["Metric", "Value", "Percentage", "Change", "Status"],
    "search-logs": ["Timestamp", "Action Type", "Material", "User", "Stock Entry", "Quantity", "Cost", "Status", "Description", "Relevance"]
  };

  return headerMap[logType] || [];
}
