import { Database, Download, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { backupAPI, BackupFormat, BackupInfo, DatabaseInfo } from "@/api/backup.api";
import BackupScheduler from "@/components/system/settings/database-backup/BackupScheduler";
import { getBackupTypeIcon } from "./constants";
import CreateBackupDialog from "./CreateBackupDialog";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import RestoreBackupDialog from "./RestoreBackupDialog";
import UploadBackupDialog from "./UploadBackupDialog";
import { Badge } from "@/components/ui/badge";

const DatabaseBackupManager: React.FC = () => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<BackupInfo | null>(null);
  const [schedulerRefreshTrigger, setSchedulerRefreshTrigger] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      const timestamp = new Date().toLocaleTimeString();
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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setSchedulerRefreshTrigger(prev => prev + 1);
  };

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
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col w-fit">
              <h2 className="text-2xl font-bold">Database Backup Manager</h2>
              <div className="w-fit flex flex-col sm:flex-row sm:items-center sm:space-x-4">{lastRefresh && <p className="text-xs text-muted-foreground">Last refreshed: {lastRefresh.toLocaleTimeString()}</p>}</div>
            </div>

            {/* Quick Actions */}
            <div className="flex w-fit items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Backup
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Database className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
            </div>
          </div>

          {/* Backups List */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {backups.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No backups found</h3>
                  <p className="text-muted-foreground text-center mb-4">Create your first backup to get started with database protection.</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Database className="h-4 w-4 mr-2" />
                    Create First Backup
                  </Button>
                </CardContent>
              </Card>
            ) : (
              backups.map(backup => (
                <Card key={backup.id} className="hover:shadow-md transition-shadow rounded-xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Database className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold">{backup.metadata?.database ? `${backup.metadata.database} Backup` : backup.name.replace(/^pgdump_/, "").replace(/_/g, " ")}</CardTitle>
                          <CardDescription className="text-sm">Created {backupAPI.formatDate(backup.createdAt)}</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Total Size</p>
                        <p className="text-lg font-semibold">{backupAPI.formatFileSize(backup.totalSize)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Format Details */}
                    <div className="mb-4 ">
                      <p className="text-sm font-medium text-muted-foreground mb-3">Available Formats</p>
                      <div className="w-full ">
                        {backup.formats.map(format => (
                          <div key={format.type} className="w-full flex items-center justify-between ">
                            <Badge className="space-x-2 hover:!bg-primary">
                              {getBackupTypeIcon(format.type)}
                              <span className="text-sm font-semibold">{format.type.toUpperCase()}</span>
                            </Badge>
                            <Badge variant="outline" className="">
                              {backupAPI.formatFileSize(format.size)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Management Actions */}
                    <div className="flex items-center justify-center space-x-2 pt-2">
                      {backup.formats.map(format => (
                        <Button key={format.type} variant="outline" size="sm" onClick={() => handleDownloadBackup(backup, format)} className="flex-1 min-w-[100px]">
                          <Download className="h-4 w-4 mr-2" />
                          {format.type.toUpperCase()}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setRestoreDialogOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteBackup(backup)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          {databaseInfo && (
            <>
              {/* Main Database Statistics */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Database className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Database Overview</CardTitle>
                      <CardDescription>Current database statistics and information</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">Database Name</p>
                      <p className="text-2xl font-bold text-primary">{databaseInfo.name}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">Total Size</p>
                      <p className="text-2xl font-bold text-blue-600">{backupAPI.formatFileSize(databaseInfo.size)}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">Tables</p>
                      <p className="text-2xl font-bold text-green-600">{databaseInfo.tables}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                      <p className="text-2xl font-bold text-orange-600">{databaseInfo.records.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Information</CardTitle>
                  <CardDescription>PostgreSQL server and connection details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">PostgreSQL Version</p>
                      <p className="text-lg font-semibold">{databaseInfo.version}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Connection Status</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-lg font-semibold text-green-600">Connected</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Database Type</p>
                      <p className="text-lg font-semibold">PostgreSQL</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Backup Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Backup Information</CardTitle>
                  <CardDescription>Recent backup activity and statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {databaseInfo.lastBackup && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Last Backup</p>
                        <p className="text-lg font-semibold">{backupAPI.formatDate(databaseInfo.lastBackup)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Backups</p>
                      <p className="text-lg font-semibold">{backups.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Backup Storage</p>
                      <p className="text-lg font-semibold">{backupAPI.formatFileSize(backups.reduce((total, backup) => total + backup.totalSize, 0))}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Backup Details */}
              {backups.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Backup Details</CardTitle>
                    <CardDescription>Information from the most recent backup</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {backups[0].metadata && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm font-medium text-muted-foreground">Database</p>
                          <p className="text-sm font-semibold">{backups[0].metadata.database}</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm font-medium text-muted-foreground">Tables</p>
                          <p className="text-sm font-semibold">{backups[0].metadata.tables}</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm font-medium text-muted-foreground">Records</p>
                          <p className="text-sm font-semibold">{backups[0].metadata.records?.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm font-medium text-muted-foreground">Formats Available</p>
                          <p className="text-sm font-semibold">{backups[0].formats.length} formats</p>
                        </div>
                      </div>
                    )}

                    {backups[0].metadata && (
                      <>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">PostgreSQL Version (from backup)</p>
                            <p className="text-sm font-semibold">{backups[0].metadata.version}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Backup Created</p>
                            <p className="text-sm font-semibold">{backupAPI.formatDate(backups[0].createdAt)}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <BackupScheduler refreshTrigger={schedulerRefreshTrigger} />
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
