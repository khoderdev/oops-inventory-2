import { ReactNode } from "react";
import { ActivityLog, CloseDayRequest, DayOperation, DayOperationReport, OpenDayRequest } from "./inventory";

export interface DayOperationsContextType {
  // State
  currentDay: DayOperation | null;
  activities: ActivityLog[];
  userOrderStats: UserOrderStats[];
  loading: boolean;
  error: string | null;
  success: string | null;
  actionLoading: boolean;
  
  // Actions
  openDay: (data: OpenDayRequest) => Promise<void>;
  closeDay: (data: CloseDayRequest) => Promise<void>;
  refreshCurrentDay: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  refreshUserStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
  
  // Computed values
  isDayOpen: boolean;
  isDayClosed: boolean;
  hasActiveDay: boolean;
  
  // Real-time tracking
  lastRefresh: Date | null;
  autoRefreshEnabled: boolean;
  setAutoRefreshEnabled: (enabled: boolean) => void;
}

export interface DayOperationsProviderProps {
  children: ReactNode;
  autoRefreshInterval?: number; // in milliseconds, default 30 seconds
  enableAutoRefresh?: boolean; // default true
}

export interface DayOperationsFormData {
  openingCash?: number;
  closingCash?: number;
  openedBy?: string;
  closedBy?: string;
  notes?: string;
  userId?: number;
}

export interface UserOrderStats {
  userId: number;
  userName: string;
  orderCount: number;
  totalAmount: number;
  openingTime?: string;
  closingTime?: string;
  openingCash?: number;
  closingCash?: number;
  cashSales?: number;
  cardSales?: number;
  notes?: string;
}

export interface DayOperationsModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSubmit: (data: DayOperationsFormData) => void | Promise<void>;
  type: "open" | "close";
  formData: DayOperationsFormData;
  onFormChange?: (data: DayOperationsFormData) => void;
  onChange?: (data: DayOperationsFormData) => void;
  isLoading?: boolean;
  currentDay?: {
    // Optional status when the parent passes a full DayOperation
    status?: "opened" | "closed" | string;
    expectedCash?: number;
    userOrderStats?: UserOrderStats[];
  } | null;
  expectedCash?: number;
  userOrderStats?: UserOrderStats[];
  formatCurrency?: (amount: number) => string;
}

export interface DailyReportsProps {
  className?: string;
}

export interface DailyReportsModalProps {
  showReportModal: boolean;
  setShowReportModal: (show: boolean) => void;
  selectedReport: DayOperationReport | null;
  error: string | null;
  setError: (error: string | null) => void;
}
