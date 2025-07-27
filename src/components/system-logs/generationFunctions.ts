import { logsApiClient } from "@/api/logs.api";
import { format } from "date-fns";
import { LogType } from "./configs.tsx";

// Generate stock entry logs report
export async function generateStockEntryLogsReport(
  filters: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    status?: "success" | "failure" | "warning";
    actionType?: string;
    startDate?: string;
    endDate?: string;
    materialName?: string;
    userName?: string;
  } = {}
) {
  try {
    const response = await logsApiClient.getAllLogs({
      page: 1,
      limit: 1000, // Get more records for comprehensive report
      sortBy: "actionTimestamp",
      sortOrder: "DESC",
      ...filters
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch stock entry logs");
    }

    return response.data.logs.map(log => ({
      Timestamp: log.actionTimestamp,
      "Action Type": log.actionType,
      Material: log.materialName,
      User: log.userName || "System",
      "Quantity Δ": log.quantityDelta || 0,
      "Cost Δ": log.costDelta || 0,
      Status: log.status,
      Description: log.actionDescription || "-"
    }));
  } catch (error) {
    console.error("Error generating stock entry logs report:", error);
    throw error;
  }
}

// Generate user activity logs report
export async function generateUserActivityLogsReport(userId: number) {
  try {
    const response = await logsApiClient.getUserActivity(userId, {
      limit: 1000
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch user activity logs");
    }

    return response.data.activity.map(log => ({
      Timestamp: log.actionTimestamp,
      "Action Type": log.actionType,
      Material: log.materialName,
      "Stock Entry": log.stockEntryId,
      "Quantity Δ": log.quantityDelta || 0,
      "Cost Δ": log.costDelta || 0,
      Status: log.status,
      Description: log.actionDescription || "-"
    }));
  } catch (error) {
    console.error("Error generating user activity logs report:", error);
    throw error;
  }
}

// Generate material activity logs report
export async function generateMaterialActivityLogsReport(materialId: number) {
  try {
    const response = await logsApiClient.getMaterialActivity(materialId, {
      limit: 1000
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch material activity logs");
    }

    return response.data.activity.map(log => ({
      Timestamp: log.actionTimestamp,
      "Action Type": log.actionType,
      User: log.userName || "System",
      "Stock Entry": log.stockEntryId,
      "Quantity Δ": log.quantityDelta || 0,
      "Cost Δ": log.costDelta || 0,
      Status: log.status,
      Description: log.actionDescription || "-"
    }));
  } catch (error) {
    console.error("Error generating material activity logs report:", error);
    throw error;
  }
}

// Generate failed operations report
export async function generateFailedOperationsReport() {
  try {
    const logs = await logsApiClient.getFailedOperations(1000);

    return logs.map(log => ({
      Timestamp: log.actionTimestamp,
      "Action Type": log.actionType,
      Material: log.materialName,
      User: log.userName || "System",
      "Error Message": log.errorMessage || "Unknown error",
      "Quantity Δ": log.quantityDelta || 0,
      "Cost Δ": log.costDelta || 0,
      Description: log.actionDescription || "-"
    }));
  } catch (error) {
    console.error("Error generating failed operations report:", error);
    throw error;
  }
}

// Generate recent activity report
export async function generateRecentActivityReport() {
  try {
    const logs = await logsApiClient.getRecentActivity();

    return logs.map(log => ({
      Timestamp: log.actionTimestamp,
      "Action Type": log.actionType,
      Material: log.materialName,
      User: log.userName || "System",
      "Quantity Δ": log.quantityDelta || 0,
      "Cost Δ": log.costDelta || 0,
      Status: log.status
    }));
  } catch (error) {
    console.error("Error generating recent activity report:", error);
    throw error;
  }
}

// Generate today's logs report
export async function generateTodayLogsReport() {
  try {
    const logs = await logsApiClient.getTodaysLogs();

    return logs.map(log => ({
      Time: format(new Date(log.actionTimestamp), "HH:mm:ss"),
      "Action Type": log.actionType,
      Material: log.materialName,
      User: log.userName || "System",
      "Quantity Δ": log.quantityDelta || 0,
      "Cost Δ": log.costDelta || 0,
      Status: log.status,
      Description: log.actionDescription || "-"
    }));
  } catch (error) {
    console.error("Error generating today's logs report:", error);
    throw error;
  }
}

// Generate action type logs report
export async function generateActionTypeLogsReport(actionType: string) {
  try {
    const logs = await logsApiClient.getLogsByActionType(actionType, 1000);

    return logs.map(log => ({
      Timestamp: log.actionTimestamp,
      Material: log.materialName,
      User: log.userName || "System",
      "Stock Entry": log.stockEntryId,
      "Quantity Δ": log.quantityDelta || 0,
      "Cost Δ": log.costDelta || 0,
      Status: log.status,
      Description: log.actionDescription || "-"
    }));
  } catch (error) {
    console.error("Error generating action type logs report:", error);
    throw error;
  }
}

// Generate date range logs report
export async function generateDateRangeLogsReport(startDate: string, endDate: string) {
  try {
    const logs = await logsApiClient.getLogsForDateRange(startDate, endDate, 1000);

    return logs.map(log => ({
      Timestamp: log.actionTimestamp,
      "Action Type": log.actionType,
      Material: log.materialName,
      User: log.userName || "System",
      "Quantity Δ": log.quantityDelta || 0,
      "Cost Δ": log.costDelta || 0,
      Status: log.status,
      Description: log.actionDescription || "-"
    }));
  } catch (error) {
    console.error("Error generating date range logs report:", error);
    throw error;
  }
}

// Generate summary overview report
export async function generateSummaryOverviewReport(
  options: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  } = {}
) {
  try {
    const response = await logsApiClient.getSummary(options);

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch summary data");
    }

    const { overview, actionBreakdown, topUsers, topMaterials } = response.data;

    const summaryData = [
      {
        Metric: "Total Logs",
        Value: overview.totalLogs.toString(),
        Percentage: "100%",
        Change: "-",
        Status: "info"
      },
      {
        Metric: "Successful Operations",
        Value: overview.successfulLogs.toString(),
        Percentage: overview.successRate,
        Change: "-",
        Status: "success"
      },
      {
        Metric: "Failed Operations",
        Value: overview.failedLogs.toString(),
        Percentage: `${(100 - parseFloat(overview.successRate.replace("%", ""))).toFixed(1)}%`,
        Change: "-",
        Status: "error"
      },
      ...actionBreakdown.map(action => ({
        Metric: `${action.actionType.replace(/_/g, " ").toUpperCase()} Actions`,
        Value: action.count.toString(),
        Percentage: `${((action.count / overview.totalLogs) * 100).toFixed(1)}%`,
        Change: `Qty: ${action.totalQuantityChange.toFixed(2)}`,
        Status: "neutral"
      })),
      ...topUsers.slice(0, 5).map((user, index) => ({
        Metric: `Top User #${index + 1}`,
        Value: user.userName,
        Percentage: `${((user.activityCount / overview.totalLogs) * 100).toFixed(1)}%`,
        Change: `${user.activityCount} actions`,
        Status: "user"
      })),
      ...topMaterials.slice(0, 5).map((material, index) => ({
        Metric: `Top Material #${index + 1}`,
        Value: material.materialName,
        Percentage: `${((material.activityCount / overview.totalLogs) * 100).toFixed(1)}%`,
        Change: `${material.activityCount} operations`,
        Status: "material"
      }))
    ];

    // Add summary metadata
    const reportWithSummary = summaryData as typeof summaryData & {
      summary: typeof overview & { actionBreakdown: typeof actionBreakdown; topUsers: typeof topUsers; topMaterials: typeof topMaterials };
    };
    reportWithSummary.summary = { ...overview, actionBreakdown, topUsers, topMaterials };

    return reportWithSummary;
  } catch (error) {
    console.error("Error generating summary overview report:", error);
    throw error;
  }
}

// Generate search logs report
export async function generateSearchLogsReport(
  searchQuery: string,
  options: {
    searchFields?: string[];
    page?: number;
    limit?: number;
  } = {}
) {
  try {
    const response = await logsApiClient.searchLogs({
      q: searchQuery,
      searchFields: options.searchFields || ["materialName", "actionDescription", "userName"],
      page: options.page || 1,
      limit: options.limit || 1000
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to search logs");
    }

    return response.data.logs.map((log, index) => ({
      Timestamp: log.actionTimestamp,
      "Action Type": log.actionType,
      Material: log.materialName,
      User: log.userName || "System",
      "Quantity Δ": log.quantityDelta || 0,
      "Cost Δ": log.costDelta || 0,
      Status: log.status,
      Description: log.actionDescription || "-",
      Relevance: `${Math.max(100 - index * 2, 10)}%` // Simple relevance calculation
    }));
  } catch (error) {
    console.error("Error generating search logs report:", error);
    throw error;
  }
}
