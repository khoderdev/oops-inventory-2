import { AttendanceRecord } from "@/types/attendance";
import api from "../lib/http";

export const attendanceApi = {
  checkIn: (employeeId: string, code: string) => api.post<AttendanceRecord, { employeeId: string; code: string }>(`/attendance/check-in`, { employeeId, code }),

  checkOut: (employeeId: string, code: string) => api.post<AttendanceRecord, { employeeId: string; code: string }>(`/attendance/check-out`, { employeeId, code }),

  getStatus: (employeeId: string) => api.get<{ isCheckedIn: boolean; lastCheckIn?: string }>(`/attendance/status?employeeId=${employeeId}`),

  getEmployeeAttendance: (employeeId: string, params?: any) => api.get<{ records: AttendanceRecord[]; total: number }>(`/attendance/employee/${employeeId}`, { params }),

  generateCode: (employeeId: string) => api.post<{ code: string }, { employeeId: string }>(`/attendance/generate-code`, { employeeId }),

  getTodaysSummary: () => api.get<{ clockedIn: number; totalEmployees: number }>(`/attendance/today`)
};
