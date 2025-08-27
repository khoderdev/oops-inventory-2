export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  checkIn: string;
  checkOut?: string;
  status: 'checked-in' | 'checked-out' | 'on-break';
  duration?: number; // in minutes
  recordedById?: string;
  recordedByName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStatus {
  isClockedIn: boolean;
  lastCheckIn?: string;
  currentShift?: {
    startTime: string;
    duration: number;
  };
}

export interface AttendanceSummary {
  clockedIn: number;
  clockedOut: number;
  onBreak: number;
  totalEmployees: number;
  recentActivity: AttendanceRecord[];
}

export interface AttendanceFilters {
  startDate?: string;
  endDate?: string;
  status?: 'checked-in' | 'checked-out' | 'on-break';
  employeeId?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'checkIn' | 'checkOut' | 'employeeName' | 'duration';
  sortOrder?: 'asc' | 'desc';
}
