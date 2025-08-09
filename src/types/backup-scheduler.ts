export interface BackupSchedule {
  id: string;
  name: string;
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  time: string; // HH:MM format (or minutes for minutely)
  intervalMinutes?: number; // For minutely frequency
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  backupType: "custom" | "directory" | "sql";
  includeData: boolean;
  includeSchema: boolean;
  retentionDays: number; // How many days to keep backups
  lastRun?: string;
  nextRun?: string;
  status: "active" | "paused" | "error";
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleCreateRequest {
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  time: string;
  intervalMinutes?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  backupType: "custom" | "directory" | "sql";
  includeData: boolean;
  includeSchema: boolean;
  retentionDays: number;
}

export interface ScheduleUpdateRequest extends Partial<ScheduleCreateRequest> {
  enabled?: boolean;
  status?: "active" | "paused" | "error";
}

export interface SchedulerStatus {
  isRunning: boolean;
  nextScheduledRun?: string;
  activeSchedules: number;
  totalSchedules: number;
  lastError?: string;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  scheduleName: string;
  startTime: string;
  endTime?: string;
  status: "running" | "completed" | "failed";
  backupId?: string;
  error?: string;
  duration?: number; // in seconds
}
