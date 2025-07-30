import api from "@/lib/http";
import { BackupSchedule, ScheduleCreateRequest, ScheduleExecution, ScheduleUpdateRequest, SchedulerStatus } from "@/types/backup-scheduler";

class BackupSchedulerAPI {
  private baseUrl = "/backup-scheduler";

  // Schedule Management
  async getSchedules(): Promise<{ success: boolean; data: BackupSchedule[] }> {
    const response = await api.get<{ success: boolean; data: BackupSchedule[] }>(`${this.baseUrl}/schedules`);
    return response.data;
  }

  async getSchedule(id: string): Promise<{ success: boolean; data: BackupSchedule }> {
    const response = await api.get<{ success: boolean; data: BackupSchedule }>(`${this.baseUrl}/schedules/${id}`);
    return response.data;
  }

  async createSchedule(schedule: ScheduleCreateRequest): Promise<{ success: boolean; data: BackupSchedule }> {
    const response = await api.post<{ success: boolean; data: BackupSchedule }, ScheduleCreateRequest>(`${this.baseUrl}/schedules`, schedule);
    return response.data;
  }

  async updateSchedule(id: string, updates: ScheduleUpdateRequest): Promise<{ success: boolean; data: BackupSchedule }> {
    const response = await api.put<{ success: boolean; data: BackupSchedule }, ScheduleUpdateRequest>(`${this.baseUrl}/schedules/${id}`, updates);
    return response.data;
  }

  async deleteSchedule(id: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`${this.baseUrl}/schedules/${id}`);
    return response.data;
  }

  async toggleSchedule(id: string, enabled: boolean): Promise<{ success: boolean; data: BackupSchedule }> {
    const response = await api.post<{ success: boolean; data: BackupSchedule }, { enabled: boolean }>(`${this.baseUrl}/schedules/${id}/toggle`, { enabled });
    return response.data;
  }

  // Scheduler Control
  async getSchedulerStatus(): Promise<{ success: boolean; data: SchedulerStatus }> {
    const response = await api.get<{ success: boolean; data: SchedulerStatus }>(`${this.baseUrl}/status`);
    return response.data;
  }

  async startScheduler(): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }, Record<string, never>>(`${this.baseUrl}/start`, {});
    return response.data;
  }

  async stopScheduler(): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }, Record<string, never>>(`${this.baseUrl}/stop`, {});
    return response.data;
  }

  async runScheduleNow(id: string): Promise<{ success: boolean; data: ScheduleExecution }> {
    const response = await api.post<{ success: boolean; data: ScheduleExecution }, Record<string, never>>(`${this.baseUrl}/schedules/${id}/run`, {});
    return response.data;
  }

  // Execution History
  async getExecutionHistory(scheduleId?: string, limit = 50): Promise<{ success: boolean; data: ScheduleExecution[] }> {
    const params = new URLSearchParams();
    if (scheduleId) params.append("scheduleId", scheduleId);
    params.append("limit", limit.toString());

    const response = await api.get<{ success: boolean; data: ScheduleExecution[] }>(`${this.baseUrl}/executions?${params.toString()}`);
    return response.data;
  }

  async getExecution(id: string): Promise<{ success: boolean; data: ScheduleExecution }> {
    const response = await api.get<{ success: boolean; data: ScheduleExecution }>(`${this.baseUrl}/executions/${id}`);
    return response.data;
  }

  // Utility Methods
  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}:00`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  formatFrequency(frequency: string, dayOfWeek?: number, dayOfMonth?: number, intervalMinutes?: number): string {
    switch (frequency) {
      case "daily":
        return "Daily";
      case "weekly": {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return `Weekly on ${days[dayOfWeek || 0]}`;
      }
      case "monthly":
        return `Monthly on day ${dayOfMonth || 1}`;
      default:
        return frequency;
    }
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  getNextRunTime(schedule: BackupSchedule): Date {
    const now = new Date();
    const nextRun = new Date();

    switch (schedule.frequency) {
      case "daily": {
        const [hours, minutes] = schedule.time.split(":").map(Number);
        nextRun.setHours(hours, minutes, 0, 0);

        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      }

      case "weekly": {
        const [hours, minutes] = schedule.time.split(":").map(Number);
        nextRun.setHours(hours, minutes, 0, 0);

        const targetDay = schedule.dayOfWeek || 0;
        const currentDay = nextRun.getDay();
        let daysUntilTarget = targetDay - currentDay;

        if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
          daysUntilTarget += 7;
        }

        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        break;
      }

      case "monthly": {
        const [hours, minutes] = schedule.time.split(":").map(Number);
        nextRun.setHours(hours, minutes, 0, 0);

        const targetDate = schedule.dayOfMonth || 1;
        nextRun.setDate(targetDate);

        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
          nextRun.setDate(targetDate);
        }
        break;
      }
    }

    return nextRun;
  }
}

export const backupSchedulerAPI = new BackupSchedulerAPI();
