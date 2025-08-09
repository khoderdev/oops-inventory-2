import { logsApiClient } from "@/api/logs.api";
import { format } from "date-fns";

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
      User: log.userName || "System",
      Action: log.actionType,
      Item: log.materialName,
      // Keep original data for Item column formatting
      Material: log.materialName,
      "Stock Entry": log.stockEntryId,
      stockEntryId: log.stockEntryId,
      Quantity: log.quantityDelta || 0,
      Cost: log.costDelta || 0,
      Description: log.actionDescription || "-",
      Status: log.status
    }));
  } catch (error) {
    console.error("Error generating stock entry logs report:", error);
    throw error;
  }
}

// Generate employee audit logs report
export async function generateEmployeeLogsReport(
  filters: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    employeeId?: number;
    userId?: number;
    action?: string | string[];
    startDate?: string;
    endDate?: string;
  } = {}
) {
  try {
    const response = await logsApiClient.getEmployeeAuditLogs({
      page: 1,
      limit: 1000, // Get more records for comprehensive report
      sortBy: "timestamp",
      sortOrder: "DESC",
      ...filters
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch employee audit logs");
    }

    return response.data.logs.map(log => {
      // Extract meaningful information based on resource type
      let description = log.description || "-";
      let itemInfo = "-";
      let employeeInfo = "-";
      
      // Handle different employee-related resource types
      if (["employee", "employee_usage"].includes(log.resource) && log.newValues) {
        const usage = log.newValues;
        
        // Type guard for employee object
        if (usage.employee && typeof usage.employee === 'object' && usage.employee !== null) {
          const employee = usage.employee as { firstName?: string; lastName?: string; employeeNumber?: string };
          if (employee.firstName && employee.lastName) {
            employeeInfo = `${employee.firstName} ${employee.lastName}${employee.employeeNumber ? ` (${employee.employeeNumber})` : ''}`;
          }
        }
        
        // Type guard for menuItem object
        if (usage.menuItem && typeof usage.menuItem === 'object' && usage.menuItem !== null) {
          const menuItem = usage.menuItem as { name?: string; category?: string };
          const quantity = typeof usage.quantity === 'number' || typeof usage.quantity === 'string' ? usage.quantity : '';
          const finalCost = typeof usage.finalCost === 'number' || typeof usage.finalCost === 'string' ? usage.finalCost : '';
          if (menuItem.name) {
            itemInfo = `${menuItem.name}${menuItem.category ? ` (${menuItem.category})` : ''} - Qty: ${quantity}, Cost: $${finalCost}`;
          }
        } else if (usage.material && typeof usage.material === 'object' && usage.material !== null) {
          const material = usage.material as { name?: string };
          const quantity = typeof usage.quantity === 'number' || typeof usage.quantity === 'string' ? usage.quantity : '';
          const finalCost = typeof usage.finalCost === 'number' || typeof usage.finalCost === 'string' ? usage.finalCost : '';
          if (material.name) {
            itemInfo = `${material.name} - Qty: ${quantity}, Cost: $${finalCost}`;
          }
        }
        
        // Enhanced description based on resource type
        const resourceType = log.resource as "employee" | "employee_usage";
        if (resourceType === "employee_usage") {
          description = `Employee usage recorded`;
          if (typeof usage.notes === 'string' && usage.notes) {
            description += ` - ${usage.notes}`;
          }
        } else {
          // For "employee" resource type
          description = (typeof usage.notes === 'string' ? usage.notes : null) || `${log.action} ${log.resource}`;
        }
      } else if (log.resource === "employees" && log.newValues) {
        const count = typeof log.newValues.count === 'number' || typeof log.newValues.count === 'string' ? log.newValues.count : 0;
        description = `Viewed ${count} employee(s)`;
        
        if (log.newValues.filters && typeof log.newValues.filters === 'object' && log.newValues.filters !== null && Object.keys(log.newValues.filters).length > 0) {
          description += ` with filters: ${JSON.stringify(log.newValues.filters)}`;
        }
      }
      
      // Try to extract employee info from oldValues if not found in newValues
      if (employeeInfo === "-" && log.oldValues) {
        if (log.oldValues.employee && typeof log.oldValues.employee === 'object' && log.oldValues.employee !== null) {
          const employee = log.oldValues.employee as { firstName?: string; lastName?: string; employeeNumber?: string };
          if (employee.firstName && employee.lastName) {
            employeeInfo = `${employee.firstName} ${employee.lastName}${employee.employeeNumber ? ` (${employee.employeeNumber})` : ''}`;
          }
        }
      }

      // Return simple object structure like Stock Entry Logs
      return {
        Timestamp: log.timestamp,
        User: log.userName || "System",
        Action: log.action,
        Resource: log.resource,
        Employee: employeeInfo,
        Item: itemInfo,
        Description: description,
        Status: "Success"
      };
    });
  } catch (error) {
    console.error("Error generating employee audit logs report:", error);
    throw error;
  }
}

// Generate settlement audit logs report
export async function generateSettlementLogsReport(
  filters: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    settlementId?: number;
    employeeId?: number;
    userId?: number;
    action?: string | string[];
    startDate?: string;
    endDate?: string;
  } = {}
) {
  try {
    const response = await logsApiClient.getSettlementAuditLogs({
      page: 1,
      limit: 1000, // Get more records for comprehensive report
      sortBy: "timestamp",
      sortOrder: "DESC",
      ...filters
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch settlement audit logs");
    }

    return response.data.logs.map(log => ({
      Timestamp: format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
      User: log.userName || "System",
      Action: log.action,
      Resource: log.resource,
      "Settlement ID": log.recordId,
      recordId: log.recordId,
      Description: log.description || "-",
      "Old Values": log.oldValues ? JSON.stringify(log.oldValues, null, 2) : "-",
      "New Values": log.newValues ? JSON.stringify(log.newValues, null, 2) : "-",
      "Settlement Info": log.settlementInfo ? JSON.stringify(log.settlementInfo, null, 2) : "-",
      "IP Address": log.ipAddress || "-",
      "User Agent": log.userAgent || "-"
    }));
  } catch (error) {
    console.error("Error generating settlement audit logs report:", error);
    throw error;
  }
}

// Generate user activity logs report
export async function generateUserActivityLogsReport(
  userId: number,
  options: {
    startDate?: string;
    endDate?: string;
  } = {}
) {
  try {
    const response = await logsApiClient.getUserActivity(userId, {
      limit: 1000,
      ...options
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch user activity logs");
    }

    return response.data.activity.map(log => ({
      Timestamp: log.actionTimestamp,
      User: log.userName || "System",
      Action: log.actionType,
      Item: log.materialName,
      // Keep original data for Item column formatting
      Material: log.materialName,
      "Stock Entry": log.stockEntryId,
      stockEntryId: log.stockEntryId,
      Quantity: log.quantityDelta || 0,
      Cost: log.costDelta || 0,
      Description: log.actionDescription || "-",
      Status: log.status
    }));
  } catch (error) {
    console.error("Error generating user activity logs report:", error);
    throw error;
  }
}

// Generate material activity logs report
export async function generateMaterialActivityLogsReport(
  materialId: number,
  options: {
    startDate?: string;
    endDate?: string;
  } = {}
) {
  try {
    const response = await logsApiClient.getMaterialActivity(materialId, {
      limit: 1000,
      ...options
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch material activity logs");
    }

    return response.data.activity.map(log => ({
      Timestamp: log.actionTimestamp,
      User: log.userName || "System",
      Action: log.actionType,
      Item: log.materialName,
      // Keep original data for Item column formatting
      Material: log.materialName,
      "Stock Entry": log.stockEntryId,
      stockEntryId: log.stockEntryId,
      Quantity: log.quantityDelta || 0,
      Cost: log.costDelta || 0,
      Description: log.actionDescription || "-",
      Status: log.status
    }));
  } catch (error) {
    console.error("Error generating material activity logs report:", error);
    throw error;
  }
}

// Generate failed operations report
export async function generateFailedOperationsReport(
  options: {
    startDate?: string;
    endDate?: string;
  } = {}
) {
  try {
    const response = await logsApiClient.getAllLogs({
      status: "failure",
      limit: 1000,
      sortBy: "actionTimestamp",
      sortOrder: "DESC",
      ...options
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch failed operations logs");
    }

    return response.data.logs.map(log => ({
      Timestamp: log.actionTimestamp,
      User: log.userName || "System",
      Action: log.actionType,
      Item: log.materialName,
      // Keep original data for Item column formatting
      Material: log.materialName,
      "Stock Entry": log.stockEntryId,
      stockEntryId: log.stockEntryId,
      Quantity: log.quantityDelta || 0,
      Cost: log.costDelta || 0,
      Description: log.actionDescription || "-",
      Status: log.status,
      "Error Message": log.errorMessage || "Unknown error"
    }));
  } catch (error) {
    console.error("Error generating failed operations report:", error);
    throw error;
  }
}

// Generate recent activity report
export async function generateRecentActivityReport(
  options: {
    startDate?: string;
    endDate?: string;
  } = {}
) {
  try {
    const response = await logsApiClient.getAllLogs({
      limit: 50,
      sortBy: "actionTimestamp",
      sortOrder: "DESC",
      ...options
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch recent activity logs");
    }

    return response.data.logs.map(log => ({
      Timestamp: log.actionTimestamp,
      User: log.userName || "System",
      Action: log.actionType,
      Item: log.materialName,
      // Keep original data for Item column formatting
      Material: log.materialName,
      "Stock Entry": log.stockEntryId,
      stockEntryId: log.stockEntryId,
      Quantity: log.quantityDelta || 0,
      Cost: log.costDelta || 0,
      Description: log.actionDescription || "-",
      Status: log.status
    }));
  } catch (error) {
    console.error("Error generating recent activity report:", error);
    throw error;
  }
}

// Generate today's logs report
export async function generateTodayLogsReport(
  options: {
    startDate?: string;
    endDate?: string;
  } = {}
) {
  try {
    // Use provided date range or default to today
    const today = format(new Date(), "yyyy-MM-dd");
    const startDate = options.startDate || today;
    const endDate = options.endDate || today;

    const response = await logsApiClient.getAllLogs({
      startDate,
      endDate,
      limit: 1000,
      sortBy: "actionTimestamp",
      sortOrder: "DESC"
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch today's logs");
    }

    return response.data.logs.map(log => ({
      Timestamp: log.actionTimestamp,
      User: log.userName || "System",
      Action: log.actionType,
      Item: log.materialName,
      // Keep original data for Item column formatting
      Material: log.materialName,
      "Stock Entry": log.stockEntryId,
      stockEntryId: log.stockEntryId,
      Quantity: log.quantityDelta || 0,
      Cost: log.costDelta || 0,
      Description: log.actionDescription || "-",
      Status: log.status
    }));
  } catch (error) {
    console.error("Error generating today's logs report:", error);
    throw error;
  }
}

// Generate action type logs report
export async function generateActionTypeLogsReport(
  actionType: string,
  options: {
    startDate?: string;
    endDate?: string;
  } = {}
) {
  try {
    const response = await logsApiClient.getAllLogs({
      actionType,
      limit: 1000,
      sortBy: "actionTimestamp",
      sortOrder: "DESC",
      ...options
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch action type logs");
    }

    return response.data.logs.map(log => ({
      Timestamp: log.actionTimestamp,
      User: log.userName || "System",
      Action: log.actionType,
      Item: log.materialName,
      // Keep original data for Item column formatting
      Material: log.materialName,
      "Stock Entry": log.stockEntryId,
      stockEntryId: log.stockEntryId,
      Quantity: log.quantityDelta || 0,
      Cost: log.costDelta || 0,
      Description: log.actionDescription || "-",
      Status: log.status
    }));
  } catch (error) {
    console.error("Error generating action type logs report:", error);
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
    startDate?: string;
    endDate?: string;
  } = {}
) {
  try {
    const response = await logsApiClient.searchLogs({
      q: searchQuery,
      searchFields: ["materialName", "userName", "actionDescription", "actionType"],
      limit: 1000,
      page: options.page || 1
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to search logs");
    }

    return response.data.logs.map((log, index) => ({
      Timestamp: log.actionTimestamp,
      User: log.userName || "System",
      Action: log.actionType,
      Item: log.materialName,
      // Keep original data for Item column formatting
      Material: log.materialName,
      "Stock Entry": log.stockEntryId,
      stockEntryId: log.stockEntryId,
      Quantity: log.quantityDelta || 0,
      Cost: log.costDelta || 0,
      Description: log.actionDescription || "-",
      Status: log.status,
      Relevance: `${Math.max(100 - index * 2, 10)}%` // Simple relevance calculation
    }));
  } catch (error) {
    console.error("Error generating search logs report:", error);
    throw error;
  }
}
