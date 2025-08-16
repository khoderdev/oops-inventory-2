import api from "@/lib/http";
import { CloseDayRequest, DailyReportData, DayActivitiesResponse, DayOperation, DayOperationResponse, DayOperationsListResponse, OpenDayRequest, UserOrderStats } from "../types/inventory";

export const dayOperationsAPI = {
  // Get all day operations with pagination
  getDayOperations: async (page: number = 1, limit: number = 20, status?: "opened" | "closed"): Promise<DayOperationsListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (status) {
      params.append("status", status);
    }

    const response = await api.get<DayOperationsListResponse>(`/day-operations?${params}`);
    return response.data;
  },

  // Get current day operation
  getCurrentDayOperation: async (): Promise<{ currentDay: DayOperation | null; message?: string }> => {
    const response = await api.get<{ currentDay: DayOperation | null; message?: string }>("/day-operations/current");
    return response.data;
  },

  // Get current day activities
  getCurrentDayActivities: async (): Promise<DayActivitiesResponse> => {
    const response = await api.get<DayActivitiesResponse>("/day-operations/current/activities");
    return response.data;
  },

  // Open a new day
  openDay: async (data: OpenDayRequest): Promise<DayOperationResponse> => {
    const response = await api.post<DayOperationResponse, OpenDayRequest>("/day-operations/open", data);
    return response.data;
  },

  // Close current day
  closeDay: async (data: CloseDayRequest): Promise<DayOperationResponse> => {
    const response = await api.post<DayOperationResponse, CloseDayRequest>("/day-operations/close", data);
    return response.data;
  },

  // Get day operation by ID
  getDayOperationById: async (id: number): Promise<{ dayOperation: DayOperation }> => {
    const response = await api.get<{ dayOperation: DayOperation }>(`/day-operations/${id}`);
    return response.data;
  },

  // Get daily report for a specific date
  getDailyReport: async (
    date: string
  ): Promise<{
    date: string;
    report: DailyReportData;
    dayOperation: Partial<DayOperation>;
  }> => {
    const response = await api.get<{
      date: string;
      report: DailyReportData;
      dayOperation: Partial<DayOperation>;
    }>(`/day-operations/report/${date}`);
    return response.data;
  },

  // Update day operation
  updateDayOperation: async (id: number, updates: Partial<DayOperation> & { allowClosedDayUpdate?: boolean }): Promise<{ message: string; dayOperation: DayOperation }> => {
    const response = await api.put<{ message: string; dayOperation: DayOperation }, Partial<DayOperation> & { allowClosedDayUpdate?: boolean }>(`/day-operations/${id}`, updates);
    return response.data;
  },
  
  // Get user order statistics for current day
  getUserOrderStats: async (): Promise<{ userOrderStats: UserOrderStats[] }> => {
    const response = await api.get<{ userOrderStats: UserOrderStats[] }>('/day-operations/current/user-order-stats');
    return response.data;
  }
};

// Export individual functions for backward compatibility
export const {
  getDayOperations,
  getCurrentDayOperation,
  getCurrentDayActivities,
  openDay,
  closeDay,
  getDayOperationById,
  getDailyReport,
  updateDayOperation,
  getUserOrderStats
} = dayOperationsAPI;
