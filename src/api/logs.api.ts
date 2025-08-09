import api from "@/lib/http";

export interface StockEntryLog {
  id: number;
  userId?: number;
  userName?: string;
  actionType: string;
  actionDescription?: string;
  actionTimestamp: string;
  stockEntryId: number;
  materialId: number;
  materialName: string;
  quantityDelta?: number;
  costDelta?: number;
  status: "success" | "failure" | "warning";
  errorMessage?: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  userName: string;
  action: string;
  resource: string;
  recordId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  description?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface EmployeeAuditLog extends AuditLog {
  resource: "employee" | "employees";
}

export interface SettlementAuditLog extends AuditLog {
  resource: "employee_settlement" | "settlement";
  settlementInfo?: Record<string, unknown>;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface LogsFilters {
  stockEntryId?: number;
  materialId?: number;
  userId?: number;
  actionType?: string | string[];
  status?: "success" | "failure" | "warning";
  startDate?: string;
  endDate?: string;
  materialName?: string;
  userName?: string;
}

export interface AuditLogFilters {
  employeeId?: number;
  settlementId?: number;
  userId?: number;
  action?: string | string[];
  startDate?: string;
  endDate?: string;
}

export interface AuditLogQueryParams extends AuditLogFilters, LogsSorting {
  page?: number;
  limit?: number;
}

export interface EmployeeAuditLogsResponse {
  success: boolean;
  data: {
    logs: EmployeeAuditLog[];
    pagination: PaginationInfo;
    filters: AuditLogFilters;
    sorting: LogsSorting;
  };
  message: string;
}

export interface SettlementAuditLogsResponse {
  success: boolean;
  data: {
    logs: SettlementAuditLog[];
    pagination: PaginationInfo;
    filters: AuditLogFilters;
    sorting: LogsSorting;
  };
  message: string;
}

export interface AuditSummaryResponse {
  success: boolean;
  data: {
    overview: {
      totalEmployeeLogs: number;
      totalSettlementLogs: number;
      totalAuditLogs: number;
      dateRange: {
        startDate: string;
        endDate: string;
      };
    };
    employeeActions: Array<{
      action: string;
      count: number;
    }>;
    settlementActions: Array<{
      action: string;
      count: number;
    }>;
    recentActivity: Array<{
      id: number;
      action: string;
      resource: string;
      recordId: string;
      userName: string;
      timestamp: string;
      description?: string;
    }>;
    topUsers: Array<{
      userId: number;
      userName: string;
      activityCount: number;
    }>;
  };
  message: string;
}

export interface LogsSorting {
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface LogsQueryParams extends LogsFilters, LogsSorting {
  page?: number;
  limit?: number;
}

export interface LogsResponse {
  success: boolean;
  data: {
    logs: StockEntryLog[];
    pagination: PaginationInfo;
    filters: LogsFilters;
    sorting: LogsSorting;
  };
  message: string;
}

export interface StockHistoryResponse {
  success: boolean;
  data: {
    stockEntryId: number;
    history: StockEntryLog[];
    summary: {
      totalActions: number;
      actionBreakdown: Record<string, number>;
      totalQuantityChange: number;
      totalCostChange: number;
      successfulActions: number;
      failedActions: number;
    };
    filters: {
      limit: number;
      actionTypes?: string[];
      startDate?: string;
      endDate?: string;
    };
  };
  message: string;
}

export interface MaterialActivityResponse {
  success: boolean;
  data: {
    materialId: number;
    activity: StockEntryLog[];
    analytics: {
      totalActivities: number;
      uniqueStockEntries: number;
      actionBreakdown: Record<string, number>;
      totalQuantityChange: number;
      totalCostChange: number;
      timeRange: {
        earliest: string | null;
        latest: string | null;
      };
    };
    filters: {
      limit: number;
      actionTypes?: string[];
      startDate?: string;
      endDate?: string;
    };
  };
  message: string;
}

export interface UserActivityResponse {
  success: boolean;
  data: {
    userId: number;
    activity: StockEntryLog[];
    analytics: {
      totalActivities: number;
      uniqueMaterials: number;
      actionBreakdown: Record<string, number>;
      successRate: string;
      timeRange: {
        earliest: string | null;
        latest: string | null;
      };
    };
    filters: {
      limit: number;
      startDate?: string;
      endDate?: string;
    };
  };
  message: string;
}

export interface LogsSummaryResponse {
  success: boolean;
  data: {
    overview: {
      totalLogs: number;
      successfulLogs: number;
      failedLogs: number;
      successRate: string;
      dateRange: {
        startDate: string;
        endDate: string;
      };
    };
    actionBreakdown: Array<{
      actionType: string;
      count: number;
      totalQuantityChange: number;
      totalCostChange: number;
    }>;
    recentActivity: Array<{
      id: number;
      actionType: string;
      materialName: string;
      userName: string;
      timestamp: string;
      status: string;
      quantityChange: number;
      costChange: number;
    }>;
    topUsers: Array<{
      userId: number;
      userName: string;
      activityCount: number;
    }>;
    topMaterials: Array<{
      materialId: number;
      materialName: string;
      activityCount: number;
    }>;
  };
  message: string;
}

export interface LogsSearchResponse {
  success: boolean;
  data: {
    logs: StockEntryLog[];
    searchInfo: {
      query: string;
      searchFields: string[];
      totalResults: number;
      currentPage: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
  message: string;
}

export interface ExportOptions {
  format?: "json" | "csv";
  startDate?: string;
  endDate?: string;
  actionType?: string | string[];
  status?: "success" | "failure" | "warning";
  limit?: number;
}

export interface SearchOptions {
  q: string;
  searchFields?: string[];
  page?: number;
  limit?: number;
  [key: string]: any;
}

export class LogsApiClient {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  public clearCache(): void {
    this.cache.clear();
  }
  
  private buildQueryString(params: Record<string, unknown> | LogsQueryParams | ExportOptions | SearchOptions): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return searchParams.toString();
  }

  // ========================================================================
  // Core API Methods
  // ========================================================================

  /**
   * Get all stock entry logs with filtering and pagination
   */
  async getAllLogs(params: LogsQueryParams = {}): Promise<LogsResponse> {
    const queryString = this.buildQueryString(params);
    const cacheKey = `logs-all-${queryString}`;

    // Check cache first
    const cached = this.getCachedData<LogsResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await api.get<LogsResponse>(`/logs/stock-entries?${queryString}`);

      // Cache successful responses
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to fetch logs");
    }
  }

  /**
   * Get history for a specific stock entry
   */
  async getStockHistory(
    stockEntryId: number,
    options: {
      limit?: number;
      actionTypes?: string[];
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<StockHistoryResponse> {
    const queryString = this.buildQueryString(options);
    const cacheKey = `stock-history-${stockEntryId}-${queryString}`;

    const cached = this.getCachedData<StockHistoryResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await api.get<StockHistoryResponse>(`/logs/stock-entries/${stockEntryId}?${queryString}`);

      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, `Failed to fetch stock history for entry ${stockEntryId}`);
    }
  }

  /**
   * Get activity for a specific material
   */
  async getMaterialActivity(
    materialId: number,
    options: {
      limit?: number;
      actionTypes?: string[];
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<MaterialActivityResponse> {
    const queryString = this.buildQueryString(options);
    const cacheKey = `material-activity-${materialId}-${queryString}`;

    const cached = this.getCachedData<MaterialActivityResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await api.get<MaterialActivityResponse>(`/logs/materials/${materialId}?${queryString}`);

      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, `Failed to fetch material activity for material ${materialId}`);
    }
  }

  /**
   * Get activity for a specific user
   */
  async getUserActivity(
    userId: number,
    options: {
      limit?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<UserActivityResponse> {
    const queryString = this.buildQueryString(options);
    const cacheKey = `user-activity-${userId}-${queryString}`;

    const cached = this.getCachedData<UserActivityResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await api.get<UserActivityResponse>(`/logs/users/${userId}?${queryString}`);

      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, `Failed to fetch user activity for user ${userId}`);
    }
  }

  /**
   * Get logging summary and statistics
   */
  async getSummary(
    options: {
      startDate?: string;
      endDate?: string;
      groupBy?: string;
    } = {}
  ): Promise<LogsSummaryResponse> {
    const queryString = this.buildQueryString(options);
    const cacheKey = `logs-summary-${queryString}`;

    const cached = this.getCachedData<LogsSummaryResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await api.get<LogsSummaryResponse>(`/logs/summary?${queryString}`);

      // Cache summary for shorter time (2 minutes)
      this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to fetch logs summary");
    }
  }

  /**
   * Search logs with advanced text search
   */
  async searchLogs(options: SearchOptions): Promise<LogsSearchResponse> {
    const queryString = this.buildQueryString(options);

    try {
      const response = await api.get<LogsSearchResponse>(`/logs/search?${queryString}`);

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to search logs");
    }
  }

  /**
   * Export logs to CSV or JSON
   */
  async exportLogs(options: ExportOptions = {}): Promise<Blob | unknown> {
    const queryString = this.buildQueryString(options);

    try {
      // Note: The existing HTTP client doesn't support responseType configuration
      // This would need to be handled differently or the HTTP client would need to be extended
      const response = await api.get<Blob | unknown>(`/logs/export?${queryString}`);

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to export logs");
    }
  }

  // ========================================================================
  // Audit Log Methods (Employee & Settlement)
  // ========================================================================

  /**
   * Get employee audit logs with filtering and pagination
   */
  async getEmployeeAuditLogs(params: AuditLogQueryParams = {}): Promise<EmployeeAuditLogsResponse> {
    const queryString = this.buildQueryString(params);
    const cacheKey = `employee-audit-logs-${queryString}`;

    // Check cache first
    const cached = this.getCachedData<EmployeeAuditLogsResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await api.get<EmployeeAuditLogsResponse>(`/logs/employees?${queryString}`);

      // Cache successful responses
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to fetch employee audit logs");
    }
  }

  /**
   * Get settlement audit logs with filtering and pagination
   */
  async getSettlementAuditLogs(params: AuditLogQueryParams = {}): Promise<SettlementAuditLogsResponse> {
    const queryString = this.buildQueryString(params);
    const cacheKey = `settlement-audit-logs-${queryString}`;

    // Check cache first
    const cached = this.getCachedData<SettlementAuditLogsResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await api.get<SettlementAuditLogsResponse>(`/logs/settlements?${queryString}`);

      // Cache successful responses
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to fetch settlement audit logs");
    }
  }

  /**
   * Get audit logs summary for employees and settlements
   */
  async getAuditSummary(
    options: {
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<AuditSummaryResponse> {
    const queryString = this.buildQueryString(options);
    const cacheKey = `audit-summary-${queryString}`;

    const cached = this.getCachedData<AuditSummaryResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await api.get<AuditSummaryResponse>(`/logs/audit-summary?${queryString}`);

      // Cache summary for shorter time (2 minutes)
      this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to fetch audit summary");
    }
  }

  /**
   * Get recent activity (last 50 logs)
   */
  async getRecentActivity(): Promise<StockEntryLog[]> {
    const response = await this.getAllLogs({
      limit: 50,
      sortBy: "actionTimestamp",
      sortOrder: "DESC"
    });
    return response.data.logs;
  }

  async getTodaysLogs(): Promise<StockEntryLog[]> {
    const today = new Date().toISOString().split("T")[0];
    const response = await this.getAllLogs({
      startDate: today,
      endDate: today,
      limit: 1000
    });
    return response.data.logs;
  }

  async getFailedOperations(limit: number = 100): Promise<StockEntryLog[]> {
    const response = await this.getAllLogs({
      status: "failure",
      limit,
      sortBy: "actionTimestamp",
      sortOrder: "DESC"
    });
    return response.data.logs;
  }

  async getLogsByActionType(actionType: string, limit: number = 100): Promise<StockEntryLog[]> {
    const response = await this.getAllLogs({
      actionType,
      limit,
      sortBy: "actionTimestamp",
      sortOrder: "DESC"
    });
    return response.data.logs;
  }

  async getLogsForDateRange(startDate: string, endDate: string, limit: number = 500): Promise<StockEntryLog[]> {
    const response = await this.getAllLogs({
      startDate,
      endDate,
      limit,
      sortBy: "actionTimestamp",
      sortOrder: "DESC"
    });
    return response.data.logs;
  }

  async getMaterialUsageStats(materialId: number): Promise<{
    totalQuantityChange: number;
    totalCostChange: number;
    actionCounts: Record<string, number>;
    lastActivity: string | null;
  }> {
    const response = await this.getMaterialActivity(materialId);
    const { analytics, activity } = response.data;

    return {
      totalQuantityChange: analytics.totalQuantityChange,
      totalCostChange: analytics.totalCostChange,
      actionCounts: analytics.actionBreakdown,
      lastActivity: analytics.timeRange.latest
    };
  }

  async getUserPerformanceMetrics(userId: number): Promise<{
    totalActions: number;
    successRate: number;
    actionBreakdown: Record<string, number>;
    uniqueMaterials: number;
    lastActivity: string | null;
  }> {
    const response = await this.getUserActivity(userId);
    const { analytics } = response.data;

    return {
      totalActions: analytics.totalActivities,
      successRate: parseFloat(analytics.successRate),
      actionBreakdown: analytics.actionBreakdown,
      uniqueMaterials: analytics.uniqueMaterials,
      lastActivity: analytics.timeRange.latest
    };
  }

  // ========================================================================
  // Audit Log Convenience Methods
  // ========================================================================

  /**
   * Get recent employee audit activity
   */
  async getRecentEmployeeActivity(limit: number = 50): Promise<EmployeeAuditLog[]> {
    const response = await this.getEmployeeAuditLogs({
      limit,
      sortBy: "timestamp",
      sortOrder: "DESC"
    });
    return response.data.logs;
  }

  /**
   * Get recent settlement audit activity
   */
  async getRecentSettlementActivity(limit: number = 50): Promise<SettlementAuditLog[]> {
    const response = await this.getSettlementAuditLogs({
      limit,
      sortBy: "timestamp",
      sortOrder: "DESC"
    });
    return response.data.logs;
  }

  /**
   * Get employee audit logs for a specific employee
   */
  async getEmployeeAuditHistory(employeeId: number, limit: number = 100): Promise<EmployeeAuditLog[]> {
    const response = await this.getEmployeeAuditLogs({
      employeeId,
      limit,
      sortBy: "timestamp",
      sortOrder: "DESC"
    });
    return response.data.logs;
  }

  /**
   * Get settlement audit logs for a specific settlement
   */
  async getSettlementAuditHistory(settlementId: number, limit: number = 100): Promise<SettlementAuditLog[]> {
    const response = await this.getSettlementAuditLogs({
      settlementId,
      limit,
      sortBy: "timestamp",
      sortOrder: "DESC"
    });
    return response.data.logs;
  }

  /**
   * Get audit logs by action type
   */
  async getAuditLogsByAction(
    action: string,
    resource: "employee" | "settlement" | "both" = "both",
    limit: number = 100
  ): Promise<(EmployeeAuditLog | SettlementAuditLog)[]> {
    const params = {
      action,
      limit,
      sortBy: "timestamp",
      sortOrder: "DESC" as const
    };

    if (resource === "employee") {
      const response = await this.getEmployeeAuditLogs(params);
      return response.data.logs;
    } else if (resource === "settlement") {
      const response = await this.getSettlementAuditLogs(params);
      return response.data.logs;
    } else {
      // Get both employee and settlement logs
      const [employeeResponse, settlementResponse] = await Promise.all([
        this.getEmployeeAuditLogs(params),
        this.getSettlementAuditLogs(params)
      ]);

      // Combine and sort by timestamp
      const combinedLogs = [
        ...employeeResponse.data.logs,
        ...settlementResponse.data.logs
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return combinedLogs.slice(0, limit);
    }
  }

  /**
   * Get audit logs for a specific user across employees and settlements
   */
  async getUserAuditActivity(userId: number, limit: number = 100): Promise<(EmployeeAuditLog | SettlementAuditLog)[]> {
    const params = {
      userId,
      limit: Math.ceil(limit / 2), // Split limit between employee and settlement logs
      sortBy: "timestamp",
      sortOrder: "DESC" as const
    };

    const [employeeResponse, settlementResponse] = await Promise.all([
      this.getEmployeeAuditLogs(params),
      this.getSettlementAuditLogs(params)
    ]);

    // Combine and sort by timestamp
    const combinedLogs = [
      ...employeeResponse.data.logs,
      ...settlementResponse.data.logs
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return combinedLogs.slice(0, limit);
  }

  /**
   * Get audit logs for a date range
   */
  async getAuditLogsForDateRange(
    startDate: string,
    endDate: string,
    resource: "employee" | "settlement" | "both" = "both",
    limit: number = 500
  ): Promise<(EmployeeAuditLog | SettlementAuditLog)[]> {
    const params = {
      startDate,
      endDate,
      limit: resource === "both" ? Math.ceil(limit / 2) : limit,
      sortBy: "timestamp",
      sortOrder: "DESC" as const
    };

    if (resource === "employee") {
      const response = await this.getEmployeeAuditLogs(params);
      return response.data.logs;
    } else if (resource === "settlement") {
      const response = await this.getSettlementAuditLogs(params);
      return response.data.logs;
    } else {
      const [employeeResponse, settlementResponse] = await Promise.all([
        this.getEmployeeAuditLogs(params),
        this.getSettlementAuditLogs(params)
      ]);

      // Combine and sort by timestamp
      const combinedLogs = [
        ...employeeResponse.data.logs,
        ...settlementResponse.data.logs
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return combinedLogs.slice(0, limit);
    }
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Handle API errors consistently
   */
  private handleApiError(error: unknown, defaultMessage: string): Error {
    // Handle our custom API error format
    if (error && typeof error === 'object' && 'message' in error) {
      return new Error((error as { message: string }).message);
    }
    
    // Handle standard error objects
    if (error instanceof Error) {
      return error;
    }
    
    // Fallback to default message
    return new Error(defaultMessage);
  }

  /**
   * Format date for API calls
   */
  public static formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * Format datetime for API calls
   */
  public static formatDateTime(date: Date): string {
    return date.toISOString();
  }

  /**
   * Get date range for common periods
   */
  public static getDateRange(period: "today" | "yesterday" | "week" | "month" | "quarter"): {
    startDate: string;
    endDate: string;
  } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case "today":
        return {
          startDate: this.formatDate(today),
          endDate: this.formatDate(today)
        };

      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: this.formatDate(yesterday),
          endDate: this.formatDate(yesterday)
        };
      }

      case "week": {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        return {
          startDate: this.formatDate(weekStart),
          endDate: this.formatDate(today)
        };
      }

      case "month": {
        const monthStart = new Date(today);
        monthStart.setDate(monthStart.getDate() - 30);
        return {
          startDate: this.formatDate(monthStart),
          endDate: this.formatDate(today)
        };
      }

      case "quarter": {
        const quarterStart = new Date(today);
        quarterStart.setDate(quarterStart.getDate() - 90);
        return {
          startDate: this.formatDate(quarterStart),
          endDate: this.formatDate(today)
        };
      }

      default:
        return {
          startDate: this.formatDate(today),
          endDate: this.formatDate(today)
        };
    }
  }
}

// ============================================================================
// Export Default Instance
// ============================================================================

// Create and export a default instance
export const logsApiClient = new LogsApiClient();

// Export individual methods for convenience
export const { 
  getAllLogs, 
  getStockHistory, 
  getMaterialActivity, 
  getUserActivity, 
  getSummary, 
  searchLogs, 
  exportLogs, 
  getRecentActivity, 
  getTodaysLogs, 
  getFailedOperations, 
  getLogsByActionType, 
  getLogsForDateRange, 
  getMaterialUsageStats, 
  getUserPerformanceMetrics,
  // Audit log methods
  getEmployeeAuditLogs,
  getSettlementAuditLogs,
  getAuditSummary,
  getRecentEmployeeActivity,
  getRecentSettlementActivity,
  getEmployeeAuditHistory,
  getSettlementAuditHistory,
  getAuditLogsByAction,
  getUserAuditActivity,
  getAuditLogsForDateRange,
  clearCache 
} = logsApiClient;

// Export static utility methods
export const LogsApiUtils = {
  formatDate: LogsApiClient.formatDate,
  formatDateTime: LogsApiClient.formatDateTime,
  getDateRange: LogsApiClient.getDateRange
};

export default logsApiClient;
