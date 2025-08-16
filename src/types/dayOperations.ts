import { DayOperationReport } from "./inventory";

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
  onSubmit: () => void;
  type: "open" | "close";
  formData: DayOperationsFormData;
  onFormChange?: (data: DayOperationsFormData) => void;
  onChange?: (data: DayOperationsFormData) => void;
  isLoading?: boolean;
  currentDay?: {
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
