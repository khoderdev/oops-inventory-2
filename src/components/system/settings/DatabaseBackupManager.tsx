import { AlertCircle, Database, Download, FileText, HardDrive, Loader2, RefreshCw, Trash2, Upload, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { backupAPI, BackupFormat, BackupInfo, BackupProgress, DatabaseInfo, RestoreProgress } from "@/api/backup.api";
import BackupScheduler from "@/components/system/settings/BackupScheduler";

// Helper functions for backup type icons and badges
const getBackupTypeIcon = (type: string) => {
  switch (type) {
    case "custom":
      return <Database className="h-4 w-4" />;
    case "directory":
      return <HardDrive className="h-4 w-4" />;
    case "sql":
      return <FileText className="h-4 w-4" />;
    default:
      return <Database className="h-4 w-4" />;
  }
};

const getBackupTypeBadge = (type: string) => {
  const variants = {
    custom: "default",
    directory: "secondary",
    sql: "outline"
  } as const;

  return (
    <Badge variant={variants[type as keyof typeof variants] || "default"}>
      {getBackupTypeIcon(type)}
      <span className="ml-1">{type.toUpperCase()}</span>
    </Badge>
  );
};

const getMainBackupIcon = (backup: BackupInfo) => {
  // Use the first available format's icon
  if (backup.formats.length > 0) {
    return getBackupTypeIcon(backup.formats[0].type);
  }
  return <Database className="h-4 w-4" />;
};

interface CreateBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackupCreated: () => void;
}

const CreateBackupDialog: React.FC<CreateBackupDialogProps> = ({ open, onOpenChange, onBackupCreated }) => {
  const [loading, setLoading] = useState(false);
  const [backupName, setBackupName] = useState("");
  const [backupType, setBackupType] = useState<"custom" | "directory" | "sql">("custom");
  const [includeData, setIncludeData] = useState(true);
  const [includeSchema, setIncludeSchema] = useState(true);
  const [progress, setProgress] = useState<BackupProgress | null>(null);

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      alert("Please enter a backup name");
      return;
    }

    setLoading(true);
    try {
      const response = await backupAPI.createBackup({
        name: backupName,
        type: backupType,
        includeData,
        includeSchema
      });

      if (response.success) {
        // Monitor progress
        const backupId = response.data.backup.id;
        const progressInterval = setInterval(async () => {
          try {
            const progressData = await backupAPI.getBackupProgress(backupId);
            setProgress(progressData);

            if (progressData.status === "completed" || progressData.status === "failed") {
              clearInterval(progressInterval);
              setLoading(false);
              if (progressData.status === "completed") {
                onBackupCreated();
                onOpenChange(false);
                setBackupName("");
                setProgress(null);
              }
            }
          } catch (error) {
            clearInterval(progressInterval);
            setLoading(false);
          }
        }, 1000);
      }
    } catch (error) {
      setLoading(false);
      console.error("Failed to create backup:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Database Backup</DialogTitle>
          <DialogDescription>Create a new backup of your database with custom settings.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="backup-name">Backup Name</Label>
            <Input id="backup-name" placeholder="Enter backup name" value={backupName} onChange={e => setBackupName(e.target.value)} disabled={loading} />
          </div>

          <div>
            <Label htmlFor="backup-type">Backup Type</Label>
            <Select value={backupType} onValueChange={(value: any) => setBackupType(value)} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sql">Plain SQL (Recommended)</SelectItem>
                <SelectItem value="custom">Custom Format</SelectItem>
                <SelectItem value="directory">Directory Format</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch id="include-schema" checked={includeSchema} onCheckedChange={setIncludeSchema} disabled={loading} />
              <Label htmlFor="include-schema">Include Schema</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="include-data" checked={includeData} onCheckedChange={setIncludeData} disabled={loading} />
              <Label htmlFor="include-data">Include Data</Label>
            </div>
          </div>

          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{progress.message}</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} />
              {progress.currentStep && <p className="text-xs text-muted-foreground">{progress.currentStep}</p>}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreateBackup} disabled={loading || !backupName.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Create Backup
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface RestoreBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backup: BackupInfo | null;
  onRestoreCompleted: () => void;
}

const RestoreBackupDialog: React.FC<RestoreBackupDialogProps> = ({ open, onOpenChange, backup, onRestoreCompleted }) => {
  const [loading, setLoading] = useState(false);
  const [targetDatabase, setTargetDatabase] = useState("");
  const [dropExisting, setDropExisting] = useState(false);
  const [restoreData, setRestoreData] = useState(true);
  const [restoreSchema, setRestoreSchema] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<BackupFormat | null>(null);
  const [progress, setProgress] = useState<RestoreProgress | null>(null);

  // Set default format when backup changes
  React.useEffect(() => {
    if (backup && backup.formats.length > 0) {
      // Prefer custom format, then sql, then directory
      const preferredFormat = backup.formats.find(f => f.type === "custom") || backup.formats.find(f => f.type === "sql") || backup.formats[0];
      setSelectedFormat(preferredFormat);
    }
  }, [backup]);

  const handleRestore = async () => {
    if (!backup || !selectedFormat) return;

    setLoading(true);
    try {
      const response = await backupAPI.restoreBackup(selectedFormat.id, {
        targetDatabase: targetDatabase || undefined,
        dropExisting,
        restoreData,
        restoreSchema
      });

      if (response.success) {
        // Monitor progress (if supported)
        // For now, we'll just complete immediately
        onRestoreCompleted();
        onOpenChange(false);
        setTargetDatabase("");
        setProgress(null);
      }
    } catch (error) {
      console.error("Failed to restore backup:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!backup) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Restore Database Backup</DialogTitle>
          <DialogDescription>Restore from backup: {backup.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>This operation will modify your database. Make sure to backup current data if needed.</AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="backup-format">Backup Format</Label>
            <Select
              value={selectedFormat?.type || ""}
              onValueChange={value => {
                const format = backup.formats.find(f => f.type === value);
                if (format) setSelectedFormat(format);
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select backup format" />
              </SelectTrigger>
              <SelectContent>
                {backup.formats.map(format => (
                  <SelectItem key={format.type} value={format.type}>
                    <div className="flex items-center space-x-2">
                      {getBackupTypeIcon(format.type)}
                      <span>{format.type.toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">({backupAPI.formatFileSize(format.size)})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="target-db">Target Database (optional)</Label>
            <Input id="target-db" placeholder="Leave empty to use current database" value={targetDatabase} onChange={e => setTargetDatabase(e.target.value)} disabled={loading} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch id="drop-existing" checked={dropExisting} onCheckedChange={setDropExisting} disabled={loading} />
              <Label htmlFor="drop-existing">Drop existing tables</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="restore-schema" checked={restoreSchema} onCheckedChange={setRestoreSchema} disabled={loading} />
              <Label htmlFor="restore-schema">Restore Schema</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="restore-data" checked={restoreData} onCheckedChange={setRestoreData} disabled={loading} />
              <Label htmlFor="restore-data">Restore Data</Label>
            </div>
          </div>

          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{progress.message}</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} />
              <div className="text-xs text-muted-foreground">
                Tables: {progress.tablesRestored} | Records: {progress.recordsRestored}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={loading} variant="destructive">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restore
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DatabaseBackupManager: React.FC = () => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [schedulerRefreshTrigger, setSchedulerRefreshTrigger] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`🔄 [${timestamp}] Loading database backup data...`);
      const [dbInfo, backupsResponse] = await Promise.all([backupAPI.getDatabaseInfo(), backupAPI.getBackups()]);

      console.log(`📊 [${timestamp}] Database Info loaded:`, {
        name: dbInfo.name,
        size: dbInfo.size,
        tables: dbInfo.tables,
        records: dbInfo.records
      });
      console.log(`💾 [${timestamp}] Backups loaded:`, backupsResponse.data.backups.length, "backups found");
      
      // Log backup details for verification
      if (backupsResponse.data.backups.length > 0) {
        console.log(`📄 [${timestamp}] Latest backup:`, {
          name: backupsResponse.data.backups[0].name,
          createdAt: backupsResponse.data.backups[0].createdAt,
          formats: backupsResponse.data.backups[0].formats.length
        });
      }

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
    console.log("🔄 Refresh button clicked - refreshing all tabs...");
    setRefreshing(true);
    await loadData();
    // Trigger scheduler refresh by updating the trigger state
    setSchedulerRefreshTrigger(prev => prev + 1);
    console.log("✅ All tabs refreshed successfully!");
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm("Are you sure you want to delete this backup?")) return;

    try {
      await backupAPI.deleteBackup(backupId);
      setBackups(backups.filter(b => b.id !== backupId));
    } catch (error) {
      console.error("Failed to delete backup:", error);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Backup Manager</h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <p className="text-muted-foreground">Manage database backups and restore operations</p>
            {lastRefresh && (
              <p className="text-xs text-muted-foreground">
                Last refreshed: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
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

      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="database">Database Info</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4">
          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Backup
            </Button>
          </div>

          {/* Backups List */}
          <div className="grid gap-4">
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
                <Card key={backup.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getMainBackupIcon(backup)}
                        <div>
                          <CardTitle className="text-lg">{backup.name}</CardTitle>
                          <CardDescription>Created {backupAPI.formatDate(backup.createdAt)}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {backup.formats.map(format => (
                          <div key={format.type}>{getBackupTypeBadge(format.type)}</div>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium">Total Size</p>
                        <p className="text-sm text-muted-foreground">{backupAPI.formatFileSize(backup.totalSize)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Formats</p>
                        <p className="text-sm text-muted-foreground">{backup.formats.length} available</p>
                      </div>
                      {backup.metadata && (
                        <>
                          <div>
                            <p className="text-sm font-medium">Tables</p>
                            <p className="text-sm text-muted-foreground">{backup.metadata.tables}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Records</p>
                            <p className="text-sm text-muted-foreground">{backup.metadata.records?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Database</p>
                            <p className="text-sm text-muted-foreground">{backup.metadata.database}</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Format Details */}
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Available Formats:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {backup.formats.map(format => (
                          <div key={format.type} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center space-x-2">
                              {getBackupTypeIcon(format.type)}
                              <span className="text-sm font-medium">{format.type.toUpperCase()}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{backupAPI.formatFileSize(format.size)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {backup.formats.map(format => (
                          <Button key={format.type} variant="outline" size="sm" onClick={() => handleDownloadBackup(backup, format)}>
                            <Download className="h-4 w-4 mr-2" />
                            {format.type.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setRestoreDialogOpen(true);
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteBackup(backup.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          {databaseInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Database Information</CardTitle>
                <CardDescription>Current database statistics and information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm font-medium">Database Name</p>
                    <p className="text-2xl font-bold">{databaseInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Size</p>
                    <p className="text-2xl font-bold">{backupAPI.formatFileSize(databaseInfo.size)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tables</p>
                    <p className="text-2xl font-bold">{databaseInfo.tables}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Records</p>
                    <p className="text-2xl font-bold">{databaseInfo.records.toLocaleString()}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium">PostgreSQL Version</p>
                    <p className="text-lg">{databaseInfo.version}</p>
                  </div>
                  {databaseInfo.lastBackup && (
                    <div>
                      <p className="text-sm font-medium">Last Backup</p>
                      <p className="text-lg">{backupAPI.formatDate(databaseInfo.lastBackup)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <BackupScheduler refreshTrigger={schedulerRefreshTrigger} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateBackupDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onBackupCreated={loadData} />

      <RestoreBackupDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen} backup={selectedBackup} onRestoreCompleted={loadData} />
    </div>
  );
};

export default DatabaseBackupManager;
