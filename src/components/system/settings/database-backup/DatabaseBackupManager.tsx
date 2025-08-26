import { Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { backupAPI, BackupFormat, BackupInfo, DatabaseInfo } from "@/api/backup.api";
import BackupScheduler from "@/components/system/settings/database-backup/BackupScheduler";
import CreateBackupDialog from "./CreateBackupDialog";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import RestoreBackupDialog from "./RestoreBackupDialog";
import UploadBackupDialog from "./UploadBackupDialog";
import BackupsTab from "./BackupsTab";
import DatabaseInfoTab from "./DatabaseInfoTab";

const DatabaseBackupManager: React.FC = () => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<BackupInfo | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        backupAPI.clearCache();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      const [dbInfo, backupsResponse] = await Promise.all([backupAPI.getDatabaseInfo(), backupAPI.getBackups()]);
      setDatabaseInfo(dbInfo);
      setBackups(backupsResponse.data.backups);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("❌ Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUploadComplete = async () => {
    await loadData(true);
  };

  const handleDeleteBackup = (backup: BackupInfo) => {
    setBackupToDelete(backup);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!backupToDelete) return;

    try {
      await backupAPI.deleteBackup(backupToDelete.id);
      await loadData();
    } catch (error) {
      console.error("Error deleting backup:", error);
    } finally {
      setDeleteDialogOpen(false);
      setBackupToDelete(null);
    }
  };

  const handleDownloadBackup = async (backup: BackupInfo, format: BackupFormat) => {
    try {
      const blob = await backupAPI.downloadBackup(format.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${backup.name}.${format.type === "sql" ? "sql" : format.type === "custom" ? "custom" : "zip"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download backup:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="database">Database Info</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4">
          <BackupsTab
            backups={backups}
            lastRefresh={lastRefresh}
            onOpenUpload={() => setUploadDialogOpen(true)}
            onOpenCreate={() => setCreateDialogOpen(true)}
            onDownload={handleDownloadBackup}
            onRestore={(backup) => {
              setSelectedBackup(backup);
              setRestoreDialogOpen(true);
            }}
            onDelete={handleDeleteBackup}
          />
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <DatabaseInfoTab databaseInfo={databaseInfo} backups={backups} />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <BackupScheduler />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateBackupDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onBackupCreated={loadData} />

      <RestoreBackupDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen} backup={selectedBackup} onRestoreCompleted={loadData} />

      <UploadBackupDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onBackupUploaded={handleUploadComplete} />

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} backup={backupToDelete} onConfirm={handleConfirmDelete} />
    </div>
  );
};

export default DatabaseBackupManager;
