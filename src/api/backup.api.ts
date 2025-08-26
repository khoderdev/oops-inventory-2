import api from "@/lib/http";
import { DatabaseInfo, BackupResponse, BackupProgress, BackupListResponse, RestoreResponse, RestoreProgress, BackupInfo } from "@/types/backup-scheduler";

class BackupApiClient {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  // Get current database information
  async getDatabaseInfo(): Promise<DatabaseInfo> {
    const cacheKey = "database-info";
    const cached = this.getCachedData<DatabaseInfo>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get<{ success: boolean; data: DatabaseInfo; message?: string }>("/backup/database-info");
      const data = response.data.data;
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to get database information");
    }
  }

  // Create a new backup
  async createBackup(
    options: {
      name?: string;
      formats?: string[];
      includeData?: boolean;
      includeSchema?: boolean;
    } = {}
  ): Promise<BackupResponse> {
    this.clearCache(); // Clear cache when creating new backup

    try {
      // Sanitize formats and default to ["sql"] if none specified
      const formats = (options.formats && options.formats.length > 0 ? options.formats : ["sql"]).filter(f => f === "sql");

      const response = await api.post<BackupResponse, typeof options>("/backup/create", { ...options, formats });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to create backup");
    }
  }

  // Get backup progress (for real-time updates)
  async getBackupProgress(backupId: string): Promise<BackupProgress> {
    try {
      const response = await api.get<{ success: boolean; data: BackupProgress; message?: string }>(`/backup/progress/${backupId}`);
      return response.data.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to get backup progress");
    }
  }

  // Get all available backups
  async getBackups(): Promise<BackupListResponse> {
    const cacheKey = "backups-list";
    const cached = this.getCachedData<BackupListResponse>(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get<BackupListResponse>("/backup/list");
      const data = response.data;
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to get backups list");
    }
  }

  // Delete a backup
  async deleteBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    this.clearCache(); // Clear cache when deleting backup

    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/backup/${backupId}`);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to delete backup");
    }
  }

  // Restore from backup
  async restoreBackup(
    backupId: string,
    options: {
      targetDatabase?: string;
      dropExisting?: boolean;
      restoreData?: boolean;
      restoreSchema?: boolean;
    } = {}
  ): Promise<RestoreResponse> {
    this.clearCache(); // Clear cache when restoring

    try {
      const response = await api.post<RestoreResponse, typeof options>(`/backup/restore/${backupId}`, options);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to restore backup");
    }
  }

  // Get restore progress (for real-time updates)
  async getRestoreProgress(restoreId: string): Promise<RestoreProgress> {
    try {
      const response = await api.get<{ success: boolean; data: RestoreProgress; message?: string }>(`/backup/restore-progress/${restoreId}`);
      return response.data.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to get restore progress");
    }
  }

  // Download backup file
  async downloadBackup(backupId: string): Promise<Blob> {
    try {
      const response = await api.get<Blob>(`/backup/download/${backupId}`, {
        responseType: "blob"
      });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to download backup");
    }
  }

  // Upload backup file
  async uploadBackup(file: File, name?: string): Promise<BackupResponse> {
    this.clearCache(); // Clear cache when uploading backup

    try {
      const formData = new FormData();
      formData.append("backup", file);
      if (name) formData.append("name", name);

      const response = await api.post<BackupResponse, FormData>("/backup/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to upload backup");
    }
  }

  // Validate backup file
  async validateBackup(backupId: string): Promise<{
    valid: boolean;
    issues: string[];
    metadata: BackupInfo["metadata"];
  }> {
    try {
      const response = await api.get<{ success: boolean; data: { valid: boolean; issues: string[]; metadata: BackupInfo["metadata"] }; message?: string }>(
        `/backup/validate/${backupId}`
      );
      return response.data.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to validate backup");
    }
  }

  // Get backup schedule settings
  async getScheduleSettings(): Promise<{
    enabled: boolean;
    frequency: "daily" | "weekly" | "monthly";
    time: string;
    retentionDays: number;
    lastRun?: string;
    nextRun?: string;
  }> {
    try {
      const response = await api.get<{ success: boolean; data: { enabled: boolean; frequency: "daily" | "weekly" | "monthly"; time: string; retentionDays: number; lastRun?: string; nextRun?: string } }>(
        "/backup/schedule"
      );
      return response.data.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to get schedule settings");
    }
  }

  // Update backup schedule settings
  async updateScheduleSettings(settings: { enabled: boolean; frequency: "daily" | "weekly" | "monthly"; time: string; retentionDays: number }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.put<{ success: boolean; message: string }, typeof settings>("/backup/schedule", settings);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, "Failed to update schedule settings");
    }
  }

  // Handle API errors consistently
  private handleApiError(error: unknown, defaultMessage: string): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === "object" && error !== null) {
      const apiError = error as any;
      if (apiError.response?.data?.message) {
        return new Error(apiError.response.data.message);
      }
      if (apiError.message) {
        return new Error(apiError.message);
      }
    }

    return new Error(defaultMessage);
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}

// Export singleton instance
export const backupAPI = new BackupApiClient();
export default backupAPI;
