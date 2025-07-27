import { LogType } from "@/components/system-logs/configs";

// Get table headers based on log type
export function getLogsTableHeaders(logType: LogType): string[] {
  const headerMap: Record<LogType, string[]> = {
    "stock-entry-logs": ["Timestamp", "Action Type", "Material", "User", "Quantity Δ", "Cost Δ", "Status", "Description"],
    "user-activity-logs": ["Timestamp", "Action Type", "Material", "Stock Entry", "Quantity Δ", "Cost Δ", "Status", "Description"],
    "material-activity-logs": ["Timestamp", "Action Type", "User", "Stock Entry", "Quantity Δ", "Cost Δ", "Status", "Description"],
    "failed-operations": ["Timestamp", "Action Type", "Material", "User", "Error Message", "Quantity Δ", "Cost Δ", "Description"],
    "recent-activity": ["Timestamp", "Action Type", "Material", "User", "Quantity Δ", "Cost Δ", "Status"],
    "today-logs": ["Time", "Action Type", "Material", "User", "Quantity Δ", "Cost Δ", "Status", "Description"],
    "action-type-logs": ["Timestamp", "Material", "User", "Stock Entry", "Quantity Δ", "Cost Δ", "Status", "Description"],
    "date-range-logs": ["Timestamp", "Action Type", "Material", "User", "Quantity Δ", "Cost Δ", "Status", "Description"],
    "summary-overview": ["Metric", "Value", "Percentage", "Change", "Status"],
    "search-logs": ["Timestamp", "Action Type", "Material", "User", "Quantity Δ", "Cost Δ", "Status", "Description", "Relevance"]
  };

  return headerMap[logType] || [];
}
