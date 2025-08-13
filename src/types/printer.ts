// Printer Management Types

export interface PrinterChannel {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
  printers?: Printer[];
  creator?: {
    id: number;
    username: string;
    fullName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Printer {
  id: number;
  name: string;
  channelId: number;
  type: "thermal" | "inkjet" | "laser" | "receipt" | "label";
  connectionType: "usb" | "network" | "bluetooth" | "serial";
  status: "online" | "offline" | "error" | "busy" | "maintenance";
  isActive: boolean;
  location?: string;
  description?: string;
  networkConfig?: {
    ipAddress?: string;
    port?: number;
    protocol?: string;
  };
  osConfig?: {
    printerName?: string;
    driverName?: string;
  };
  channel?: {
    id: number;
    name: string;
  };
  creator?: {
    id: number;
    username: string;
    fullName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface PrintJob {
  id: number;
  printerId: number;
  jobType: "receipt" | "label" | "report" | "document" | "void";
  status: "pending" | "printing" | "completed" | "failed" | "cancelled";
  priority: number;
  content: string;
  metadata?: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
  printer?: {
    id: number;
    name: string;
    type: string;
  };
  createdBy?: {
    id: number;
    username: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

// Request/Response Types
export interface CreatePrinterChannelRequest {
  name: string;
  description?: string;
  priority: number;
}

export interface UpdatePrinterChannelRequest {
  name?: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
}

export interface CreatePrinterRequest {
  name: string;
  channelId: number;
  type: "thermal" | "inkjet" | "laser" | "receipt" | "label";
  connectionType: "usb" | "network" | "bluetooth" | "serial";
  location?: string;
  description?: string;
  networkConfig?: {
    ipAddress?: string;
    port?: number;
    protocol?: string;
  };
  osConfig?: {
    printerName?: string;
    driverName?: string;
  };
}

export interface UpdatePrinterRequest {
  name?: string;
  channelId?: number;
  type?: "thermal" | "inkjet" | "laser" | "receipt" | "label";
  connectionType?: "usb" | "network" | "bluetooth" | "serial";
  location?: string;
  description?: string;
  isActive?: boolean;
  networkConfig?: {
    ipAddress?: string;
    port?: number;
    protocol?: string;
  };
  osConfig?: {
    printerName?: string;
    driverName?: string;
  };
}

export interface CreatePrintJobRequest {
  printerId: number;
  jobType: "receipt" | "label" | "report" | "document" | "void";
  content: {
    template?: string | null;
    data?: Record<string, any>;
    rawContent?: string;
    format?: string;
    encoding?: string;
  };
  priority?: number;
  settings?: {
    copies?: number;
    priority?: string;
    paperSize?: string;
    margins?: any;
    orientation?: string;
    duplex?: boolean;
    colorMode?: string;
  };
  metadata?: Record<string, any>;
}

export interface PrintJobFilters {
  printerId?: number;
  status?: string;
  jobType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Response Types
export interface PrinterChannelsResponse {
  success: boolean;
  channels: PrinterChannel[];
  total: number;
  message?: string;
}

export interface PrinterChannelResponse {
  success: boolean;
  channel: PrinterChannel;
  message?: string;
}

export interface PrintersResponse {
  success: boolean;
  printers: Printer[];
  total: number;
  message?: string;
}

export interface PrinterResponse {
  success: boolean;
  printer: Printer;
  message?: string;
}

export interface PrintJobsResponse {
  success: boolean;
  jobs: PrintJob[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}

export interface PrintJobResponse {
  success: boolean;
  job: PrintJob;
  message?: string;
}

export interface PrinterStats {
  totalPrinters: number;
  activePrinters: number;
  onlinePrinters: number;
  offlinePrinters: number;
  errorPrinters: number;
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  failedJobs: number;
}

export interface PrintJobStats {
  totalJobs: number;
  pendingJobs: number;
  printingJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  averageProcessingTime: number;
  successRate: number;
}

export interface NetworkPrinterDiscovery {
  ipAddress: string;
  port: number;
  manufacturer?: string;
  model?: string;
  status?: string;
  capabilities?: string[];
}

export interface WindowsPrinter {
  name: string;
  driverName: string;
  portName: string;
  status: string;
  isDefault: boolean;
  isShared: boolean;
}

export interface PrinterServiceStatus {
  success: boolean;
  status: "running" | "unavailable";
  activePrinters?: number;
  queuedJobs?: number;
  message?: string;
}

// Discovery Response Types
export interface NetworkPrinterDiscoveryResponse {
  success: boolean;
  discoveries: NetworkPrinterDiscovery[];
  count: number;
  message?: string;
}

export interface WindowsPrinterDiscoveryResponse {
  success: boolean;
  printers: WindowsPrinter[];
  count: number;
  message?: string;
}

// Test Printer Response
export interface TestPrinterResponse {
  success: boolean;
  testResult: {
    connected: boolean;
    responseTime?: number;
    error?: string;
    details?: Record<string, any>;
  };
  message?: string;
}

// Bulk Operations
export interface BulkCancelJobsRequest {
  jobIds: number[];
  reason?: string;
}

export interface BulkCancelJobsResponse {
  success: boolean;
  cancelledJobs: number;
  failedJobs: number;
  errors?: Array<{
    jobId: number;
    error: string;
  }>;
  message?: string;
}
