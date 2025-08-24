import api, { PaginatedResponse } from "@/lib/http";
import { DayOperationReport } from "../types/inventory";

// Define response types
interface DayOperationReportsListResponse extends PaginatedResponse {
  reports: DayOperationReport[];
}

interface DayOperationReportResponse {
  report: DayOperationReport;
  message?: string;
}

interface DayOperationReportsForDayResponse {
  reports: DayOperationReport[];
  dayOperationId: number;
}

export const dayOperationReportsAPI = {
  // Get all reports with pagination and filtering
  getReports: async (
    page: number = 1,
    limit: number = 20,
    filters?: {
      reportType?: "daily" | "weekly" | "monthly" | "custom";
      startDate?: string;
      endDate?: string;
      reportStatus?: "draft" | "final" | "amended";
    }
  ): Promise<DayOperationReportsListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (filters) {
      if (filters.reportType) {
        params.append("reportType", filters.reportType);
      }
      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }
      if (filters.reportStatus) {
        params.append("reportStatus", filters.reportStatus);
      }
    }

    const response = await api.get<DayOperationReportsListResponse>(`/day-operation-reports?${params}`);
    return response.data;
  },

  // Get report by ID
  getReportById: async (id: number): Promise<DayOperationReportResponse> => {
    const response = await api.get<DayOperationReportResponse>(`/day-operation-reports/${id}`);
    return response.data;
  },

  // Get reports for a specific day operation
  getReportsByDayOperation: async (dayOperationId: number): Promise<DayOperationReportsForDayResponse> => {
    const response = await api.get<DayOperationReportsForDayResponse>(`/day-operation-reports/day-operation/${dayOperationId}`);
    return response.data;
  },

  // Create a new report
  createReport: async (reportData: Partial<DayOperationReport>): Promise<DayOperationReportResponse> => {
    const response = await api.post<DayOperationReportResponse, Partial<DayOperationReport>>("/day-operation-reports", reportData);
    return response.data;
  },

  // Generate a report for a day operation
  generateReport: async (dayOperationId: number, generatedBy?: string): Promise<DayOperationReportResponse> => {
    const response = await api.post<DayOperationReportResponse, { generatedBy?: string }>(`/day-operation-reports/generate/${dayOperationId}`, { generatedBy });
    return response.data;
  },

  // Regenerate/update a report for a day operation (recompute per-item totals)
  regenerateReport: async (dayOperationId: number, generatedBy?: string): Promise<DayOperationReportResponse> => {
    const response = await api.post<DayOperationReportResponse, { generatedBy?: string }>(`/day-operation-reports/regenerate/${dayOperationId}`, { generatedBy });
    return response.data;
  },

  // Update an existing report
  updateReport: async (id: number, updates: Partial<DayOperationReport>): Promise<DayOperationReportResponse> => {
    const response = await api.put<DayOperationReportResponse, Partial<DayOperationReport>>(`/day-operation-reports/${id}`, updates);
    return response.data;
  },

  // Delete a report
  deleteReport: async (id: number): Promise<{ message: string; reportId: number }> => {
    const response = await api.delete<{ message: string; reportId: number }>(`/day-operation-reports/${id}`);
    return response.data;
  }
};

// Export individual functions for backward compatibility
export const { getReports, getReportById, getReportsByDayOperation, createReport, generateReport, regenerateReport, updateReport, deleteReport } = dayOperationReportsAPI;
