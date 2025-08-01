import api from "../lib/http";
import type { BulkCancelJobsRequest, BulkCancelJobsResponse, CreatePrinterChannelRequest, CreatePrinterRequest, CreatePrintJobRequest, NetworkPrinterDiscoveryResponse, PrinterChannelResponse, PrinterChannelsResponse, PrinterResponse, PrinterServiceStatus, PrintersResponse, PrinterStats, PrintJobFilters, PrintJobResponse, PrintJobsResponse, PrintJobStats, TestPrinterResponse, UpdatePrinterChannelRequest, UpdatePrinterRequest, WindowsPrinterDiscoveryResponse } from "../types/printer";

export const printerAPI = {
  // Printer Channels
  getChannels: async (): Promise<PrinterChannelsResponse> => {
    const response = await api.get<PrinterChannelsResponse>("/printers/channels");
    return response.data;
  },

  createChannel: async (data: CreatePrinterChannelRequest): Promise<PrinterChannelResponse> => {
    const response = await api.post<PrinterChannelResponse, CreatePrinterChannelRequest>("/printers/channels", data);
    return response.data;
  },

  updateChannel: async (id: number, data: UpdatePrinterChannelRequest): Promise<PrinterChannelResponse> => {
    const response = await api.put<PrinterChannelResponse, UpdatePrinterChannelRequest>(`/printers/channels/${id}`, data);
    return response.data;
  },

  deleteChannel: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/printers/channels/${id}`);
    return response.data;
  },

  // Printers
  getPrinters: async (): Promise<PrintersResponse> => {
    const response = await api.get<PrintersResponse>("/printers");
    return response.data;
  },

  getPrinter: async (id: number): Promise<PrinterResponse> => {
    const response = await api.get<PrinterResponse>(`/printers/${id}`);
    return response.data;
  },

  createPrinter: async (data: CreatePrinterRequest): Promise<PrinterResponse> => {
    const response = await api.post<PrinterResponse, CreatePrinterRequest>("/printers", data);
    return response.data;
  },

  updatePrinter: async (id: number, data: UpdatePrinterRequest): Promise<PrinterResponse> => {
    const response = await api.put<PrinterResponse, UpdatePrinterRequest>(`/printers/${id}`, data);
    return response.data;
  },

  deletePrinter: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/printers/${id}`);
    return response.data;
  },

  testPrinter: async (id: number): Promise<TestPrinterResponse> => {
    const response = await api.post<TestPrinterResponse, Record<string, never>>(`/printers/${id}/test`, {});
    return response.data;
  },

  getPrinterStats: async (id: number): Promise<{ success: boolean; stats: PrinterStats }> => {
    const response = await api.get<{ success: boolean; stats: PrinterStats }>(`/printers/${id}/stats`);
    return response.data;
  },

  // Print Jobs
  getPrintJobs: async (filters?: PrintJobFilters): Promise<PrintJobsResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const url = `/printers/jobs${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get<PrintJobsResponse>(url);
    return response.data;
  },

  getPrintJobStats: async (): Promise<{ success: boolean; stats: PrintJobStats }> => {
    const response = await api.get<{ success: boolean; stats: PrintJobStats }>("/printers/jobs/stats");
    return response.data;
  },

  createPrintJob: async (data: CreatePrintJobRequest): Promise<PrintJobResponse> => {
    const response = await api.post<PrintJobResponse, CreatePrintJobRequest>("/printers/jobs", data);
    return response.data;
  },

  getPrintJob: async (id: number): Promise<PrintJobResponse> => {
    const response = await api.get<PrintJobResponse>(`/printers/jobs/${id}`);
    return response.data;
  },

  cancelPrintJob: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }, Record<string, never>>(`/printers/jobs/${id}/cancel`, {});
    return response.data;
  },

  retryPrintJob: async (id: number): Promise<PrintJobResponse> => {
    const response = await api.post<PrintJobResponse, Record<string, never>>(`/printers/jobs/${id}/retry`, {});
    return response.data;
  },

  bulkCancelJobs: async (data: BulkCancelJobsRequest): Promise<BulkCancelJobsResponse> => {
    const response = await api.post<BulkCancelJobsResponse, BulkCancelJobsRequest>("/printers/jobs/bulk-cancel", data);
    return response.data;
  },

  // Discovery and Utility
  discoverNetworkPrinters: async (subnet?: string): Promise<NetworkPrinterDiscoveryResponse> => {
    const params = subnet ? `?subnet=${encodeURIComponent(subnet)}` : "";
    const response = await api.get<NetworkPrinterDiscoveryResponse>(`/printers/discover/network${params}`);
    return response.data;
  },

  discoverWindowsPrinters: async (): Promise<WindowsPrinterDiscoveryResponse> => {
    const response = await api.get<WindowsPrinterDiscoveryResponse>("/printers/discover/windows");
    return response.data;
  },

  // Alias for discoverWindowsPrinters for the scanning functionality
  scanSystemPrinters: async (): Promise<WindowsPrinterDiscoveryResponse> => {
    const response = await api.get<WindowsPrinterDiscoveryResponse>("/printers/discover/windows");
    return response.data;
  },

  getServiceStatus: async (): Promise<PrinterServiceStatus> => {
    const response = await api.get<PrinterServiceStatus>("/printers/service/status");
    return response.data;
  }
};

export default printerAPI;
