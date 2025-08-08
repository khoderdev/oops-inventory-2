import { Activity, AlertTriangle, BarChart3, Calendar, FileText, Package, Search, User, Users, DollarSign } from "lucide-react";

export type LogType = "stock-entry-logs" | "user-activity-logs" | "material-activity-logs" | "failed-operations" | "recent-activity" | "today-logs" | "action-type-logs" | "summary-overview" | "search-logs" | "employee-logs" | "settlement-logs";

export const LOG_CONFIGS: ReadonlyArray<{
  id: LogType;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresDateRange: boolean;
  supportsDateRange: boolean;
  requiresAdditionalParams: boolean;
  additionalParamType?: "userId" | "materialId" | "actionType" | "searchQuery";
  additionalParamLabel?: string;
}> = [
  {
    id: "stock-entry-logs",
    name: "Stock Entry Logs",
    description: "Complete history of all stock entry operations including create, update, delete, and stock movements.",
    icon: <Package className="h-4 w-4" />,
    requiresDateRange: false,
    supportsDateRange: true,
    requiresAdditionalParams: false
  },
  {
    id: "user-activity-logs",
    name: "User Activity Logs",
    description: "Track specific user's activity across all stock operations with performance metrics.",
    icon: <User className="h-4 w-4" />,
    requiresDateRange: false,
    supportsDateRange: true,
    requiresAdditionalParams: true,
    additionalParamType: "userId",
    additionalParamLabel: "Select User"
  },
  {
    id: "material-activity-logs",
    name: "Material Activity Logs",
    description: "View all operations performed on a specific material across different stock entries.",
    icon: <Package className="h-4 w-4" />,
    requiresDateRange: false,
    supportsDateRange: true,
    requiresAdditionalParams: true,
    additionalParamType: "materialId",
    additionalParamLabel: "Select Material"
  },
  {
    id: "failed-operations",
    name: "Failed Operations",
    description: "List of all failed operations with error details for troubleshooting and system monitoring.",
    icon: <AlertTriangle className="h-4 w-4" />,
    requiresDateRange: false,
    supportsDateRange: true,
    requiresAdditionalParams: false
  },
  {
    id: "recent-activity",
    name: "Recent Activity",
    description: "Latest 50 operations across all stock entries for real-time monitoring.",
    icon: <Activity className="h-4 w-4" />,
    requiresDateRange: false,
    supportsDateRange: true,
    requiresAdditionalParams: false
  },
  {
    id: "today-logs",
    name: "Today's Logs",
    description: "All operations performed today for daily activity review and monitoring.",
    icon: <Calendar className="h-4 w-4" />,
    requiresDateRange: false,
    supportsDateRange: true,
    requiresAdditionalParams: false
  },
  {
    id: "action-type-logs",
    name: "Action Type Logs",
    description: "Filter logs by specific action types like create, update, delete, add_to_stock, etc.",
    icon: <FileText className="h-4 w-4" />,
    requiresDateRange: false,
    supportsDateRange: true,
    requiresAdditionalParams: true,
    additionalParamType: "actionType",
    additionalParamLabel: "Select Action Type"
  },

  {
    id: "summary-overview",
    name: "Summary Overview",
    description: "Statistical overview with action breakdowns, top users, materials, and success rates.",
    icon: <BarChart3 className="h-4 w-4" />,
    requiresDateRange: false,
    supportsDateRange: true,
    requiresAdditionalParams: false
  },
  {
    id: "search-logs",
    name: "Search Logs",
    description: "Advanced text search across all log fields including descriptions, materials, and users.",
    icon: <Search className="h-4 w-4" />,
    requiresDateRange: false,
    supportsDateRange: true,
    requiresAdditionalParams: true,
    additionalParamType: "searchQuery",
    additionalParamLabel: "Search Query"
  },
  {
    id: "employee-logs",
    name: "Employee Activity Logs",
    description: "Complete audit trail of employee operations including create, update, delete, and status changes.",
    icon: <Users className="h-4 w-4" />,
    requiresDateRange: false,
    supportsDateRange: true,
    requiresAdditionalParams: false
  },
  {
    id: "settlement-logs",
    name: "Settlement Activity Logs", 
    description: "Comprehensive tracking of settlement operations including creation, approval, payment, and modifications.",
    icon: <DollarSign className="h-4 w-4" />,
    requiresDateRange: false,
    supportsDateRange: true,
    requiresAdditionalParams: false
  }
];

// Action type options for filtering
export const ACTION_TYPE_OPTIONS = [
  { value: "create", label: "Create Stock Entry" },
  { value: "update", label: "Update Stock Entry" },
  { value: "delete", label: "Delete Stock Entry" },
  { value: "add_to_stock", label: "Add to Stock" },
  { value: "waste_from_stock", label: "Waste from Stock" },
  { value: "pos_toggle", label: "POS Toggle" },
  { value: "create_employee", label: "Create Employee" },
  { value: "update_employee", label: "Update Employee" },
  { value: "delete_employee", label: "Delete Employee" },
  { value: "create_settlement", label: "Create Settlement" },
  { value: "approve_settlement", label: "Approve Settlement" },
  { value: "mark_paid", label: "Mark Settlement as Paid" },
  { value: "update_settlement", label: "Update Settlement" },
  { value: "delete_settlement", label: "Delete Settlement" }
];

// Status options for filtering
export const STATUS_OPTIONS = [
  { value: "success", label: "Success" },
  { value: "failure", label: "Failed" },
  { value: "warning", label: "Warning" }
];
