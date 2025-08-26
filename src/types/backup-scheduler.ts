export interface BackupFormat {
  type: "sql";
  id: string;
  path: string;
  size: number;
  filename: string;
}

export interface BackupInfo {
  id: string;
  name: string;
  formats: BackupFormat[];
  totalSize: number;
  createdAt: string;
  metadata?: {
    database: string;
    version: string;
    tables: number;
    records: number;
  };
}

export interface BackupResponse {
  success: boolean;
  data: {
    backup: BackupInfo;
    message: string;
  };
  message: string;
}

export interface BackupListResponse {
  success: boolean;
  data: {
    backups: BackupInfo[];
    total: number;
  };
  message: string;
}

export interface RestoreResponse {
  success: boolean;
  data: {
    message: string;
    restoredTables: number;
    restoredRecords: number;
    duration: number;
  };
  message: string;
}

export interface BackupProgress {
  status: "starting" | "in_progress" | "completed" | "failed";
  progress: number;
  message: string;
  currentStep?: string;
  estimatedTimeRemaining?: number;
}

export interface RestoreProgress {
  status: "starting" | "in_progress" | "completed" | "failed";
  progress: number;
  message: string;
  currentStep?: string;
  tablesRestored: number;
  recordsRestored: number;
  estimatedTimeRemaining?: number;
}

export interface DatabaseInfo {
  name: string;
  size: number;
  tables: number;
  records: number;
  version: string;
  lastBackup?: string;
}

export interface BackupSchedule {
  id: string;
  name: string;
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  time: string; // HH:MM format (or minutes for minutely)
  intervalMinutes?: number; // For minutely frequency
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  backupType: "sql" | "custom" | "directory";
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
  backupType: "sql" | "custom" | "directory";
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

export interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleCreated: () => void;
  editSchedule?: BackupSchedule | null;
}

export interface BackupSchedulerProps {
  refreshTrigger?: number;
}

//---------------------------------------------------------------------------------

// Database Backup

export interface CreateBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackupCreated: () => void;
}

export interface RestoreBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backup: BackupInfo | null;
  onRestoreCompleted: () => void;
}

export interface UploadBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackupUploaded: () => void;
}

export interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backup: BackupInfo | null;
  onConfirm: () => void;
}


export interface BackupsTabProps {
  backups: BackupInfo[];
  lastRefresh: Date | null;
  onOpenUpload: () => void;
  onOpenCreate: () => void;
  onDownload: (backup: BackupInfo, format: BackupFormat) => void;
  onRestore: (backup: BackupInfo) => void;
  onDelete: (backup: BackupInfo) => void;
}

export interface DatabaseInfoTabProps {
  databaseInfo: DatabaseInfo | null;
  backups: BackupInfo[];
}