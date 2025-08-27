import api from "../lib/http";

type AttendanceRecord = {
  id: string;
  employeeId: string;
  checkIn: string;
  checkOut?: string;
  status: "checked-in" | "checked-out";
};

export const attendanceApi = {
  checkIn: (employeeId: string, code: string) => api.post<AttendanceRecord, { employeeId: string; code: string }>(`/attendance/check-in`, { employeeId, code }),

  checkOut: (employeeId: string, code: string) => api.post<AttendanceRecord, { employeeId: string; code: string }>(`/attendance/check-out`, { employeeId, code }),

  getStatus: (employeeId: string) => api.get<{ isClockedIn: boolean; lastCheckIn?: string }>(`/attendance/status?employeeId=${employeeId}`),

  getEmployeeAttendance: (employeeId: string, params?: any) => api.get<{ records: AttendanceRecord[]; total: number }>(`/attendance/employee/${employeeId}`, { params }),

  generateCode: (employeeId: string) => api.post<{ code: string }, { employeeId: string }>(`/attendance/generate-code`, { employeeId }),

  getTodaysSummary: () => api.get<{ clockedIn: number; totalEmployees: number }>(`/attendance/today`)
};
