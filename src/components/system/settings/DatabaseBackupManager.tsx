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
  const [selectedFormats, setSelectedFormats] = useState<("custom" | "directory" | "sql")[]>(["sql"]);
  const [includeData, setIncludeData] = useState(true);
  const [includeSchema, setIncludeSchema] = useState(true);
  const [progress, setProgress] = useState<BackupProgress | null>(null);

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      alert("Please enter a backup name");
      return;
    }

    if (selectedFormats.length === 0) {
      alert("Please select at least one backup format");
      return;
    }

    setLoading(true);
    try {
      const response = await backupAPI.createBackup({
        name: backupName,
        formats: selectedFormats,
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
                setSelectedFormats(["sql"]);
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

  const handleFormatToggle = (format: "custom" | "directory" | "sql") => {
    setSelectedFormats(prev => {
      if (prev.includes(format)) {
        return prev.filter(f => f !== format);
      } else {
        return [...prev, format];
      }
    });
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
            <Label>Backup Formats</Label>
            <div className="space-y-3 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="format-sql"
                  checked={selectedFormats.includes("sql")}
                  onChange={() => handleFormatToggle("sql")}
                  disabled={loading}
                  className="rounded"
                />
                <Label htmlFor="format-sql" className="flex items-center space-x-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  <div>
                    <span className="font-medium">Plain SQL</span>
                    <p className="text-xs text-muted-foreground">Cross-platform compatibility, manual editing</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="format-custom"
                  checked={selectedFormats.includes("custom")}
                  onChange={() => handleFormatToggle("custom")}
                  disabled={loading}
                  className="rounded"
                />
                <Label htmlFor="format-custom" className="flex items-center space-x-2 cursor-pointer">
                  <Database className="h-4 w-4" />
                  <div>
                    <span className="font-medium">Custom Format</span>
                    <p className="text-xs text-muted-foreground">Best for pgAdmin Restore, pg_restore command</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="format-directory"
                  checked={selectedFormats.includes("directory")}
                  onChange={() => handleFormatToggle("directory")}
                  disabled={loading}
                  className="rounded"
                />
                <Label htmlFor="format-directory" className="flex items-center space-x-2 cursor-pointer">
                  <HardDrive className="h-4 w-4" />
                  <div>
                    <span className="font-medium">Directory Format</span>
                    <p className="text-xs text-muted-foreground">Parallel restore, large databases</p>
                  </div>
                </Label>
              </div>
            </div>
            
            {selectedFormats.length > 0 && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <span className="font-medium">Selected:</span> {selectedFormats.map(f => f.toUpperCase()).join(", ")}
              </div>
            )}
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

interface UploadBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackupUploaded: () => void;
}

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backup: BackupInfo | null;
  onConfirm: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({ open, onOpenChange, backup, onConfirm }) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  if (!backup) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Backup</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this backup? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will permanently delete the backup "{backup.name}" and all its formats.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-3 rounded">
            <p className="text-sm font-medium mb-2">Backup Details:</p>
            <div className="text-xs space-y-1">
              <p><span className="font-medium">Name:</span> {backup.name}</p>
              <p><span className="font-medium">Created:</span> {backupAPI.formatDate(backup.createdAt)}</p>
              <p><span className="font-medium">Size:</span> {backupAPI.formatFileSize(backup.totalSize)}</p>
              <p><span className="font-medium">Formats:</span> {backup.formats.map(f => f.type.toUpperCase()).join(", ")}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Backup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const UploadBackupDialog: React.FC<UploadBackupDialogProps> = ({ open, onOpenChange, onBackupUploaded }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupName, setBackupName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    issues: string[];
    metadata?: any;
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setBackupName("");
      setValidationResult(null);
      setUploadProgress(0);
    }
  }, [open]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validExtensions = [".sql", ".custom", ".zip", ".tar", ".gz"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));

    if (!validExtensions.includes(fileExtension)) {
      alert(`Invalid file type. Please select a backup file with one of these extensions: ${validExtensions.join(", ")}`);
      return;
    }

    // Validate file size (max 1GB)
    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
      alert("File size too large. Maximum allowed size is 1GB.");
      return;
    }

    setSelectedFile(file);

    // Auto-generate backup name from filename
    if (!backupName) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf("."));
      setBackupName(`uploaded_${nameWithoutExt}_${new Date().toISOString().split("T")[0]}`);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a backup file to upload.");
      return;
    }

    if (!backupName.trim()) {
      alert("Please enter a backup name.");
      return;
    }

    const timestamp = new Date().toLocaleTimeString();
    console.log(`📤 [${timestamp}] Starting backup upload:`, {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      backupName: backupName
    });

    setLoading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress (since we don't have real progress from API)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await backupAPI.uploadBackup(selectedFile, backupName);

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log(`✅ [${timestamp}] Backup uploaded successfully:`, {
        backupId: response.data.backup.id,
        backupName: response.data.backup.name,
        message: response.data.message
      });

      if (response.success) {
        // Validate the uploaded backup
        try {
          const validation = await backupAPI.validateBackup(response.data.backup.id);
          setValidationResult(validation);

          if (validation.valid) {
            console.log(`🔄 [${timestamp}] Triggering forced data refresh after successful upload and validation...`);
            setTimeout(() => {
              onBackupUploaded();
              console.log(`🚪 [${timestamp}] Closing upload dialog after success...`);
              onOpenChange(false);
            }, 1000);
          }
        } catch (validationError) {
          console.warn("Backup uploaded but validation failed:", validationError);
          // Notify parent component to refresh data
          console.log(`🔄 [${timestamp}] Triggering data refresh after upload...`);
          onBackupUploaded();
          // Close dialog after successful upload
          setTimeout(() => {
            console.log(`🚪 [${timestamp}] Closing upload dialog...`);
            onOpenChange(false);
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Failed to upload backup:", error);
      alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Database Backup</DialogTitle>
          <DialogDescription>Upload a backup file to restore or store in your backup collection.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Supported formats: .sql, .custom, .zip, .tar, .gz (max 1GB)</AlertDescription>
          </Alert>

          {/* File Upload Area */}
          <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
            {selectedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} disabled={loading}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Drop your backup file here</p>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                  Browse Files
                </Button>
              </div>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept=".sql,.custom,.zip,.tar,.gz" onChange={handleFileInputChange} className="hidden" />

          {/* Backup Name Input */}
          <div>
            <Label htmlFor="backup-name">Backup Name</Label>
            <Input id="backup-name" placeholder="Enter backup name" value={backupName} onChange={e => setBackupName(e.target.value)} disabled={loading} />
          </div>

          {/* Upload Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading backup...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Validation Results */}
          {validationResult && (
            <Alert variant={validationResult.valid ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validationResult.valid ? (
                  <div>
                    <p className="font-medium">✅ Backup validated successfully!</p>
                    {validationResult.metadata && (
                      <div className="mt-2 text-xs">
                        <p>Database: {validationResult.metadata.database}</p>
                        <p>Tables: {validationResult.metadata.tables}</p>
                        <p>Records: {validationResult.metadata.records?.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">❌ Backup validation issues:</p>
                    <ul className="mt-1 text-xs list-disc list-inside">
                      {validationResult.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={loading || !selectedFile || !backupName.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Backup
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<BackupInfo | null>(null);
  const [schedulerRefreshTrigger, setSchedulerRefreshTrigger] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`🔄 [${timestamp}] Loading database backup data${forceRefresh ? " (forced refresh)" : ""}...`);

      // Clear cache if this is a forced refresh (e.g., after upload)
      if (forceRefresh) {
        console.log(`🗑️ [${timestamp}] Clearing API cache for fresh data...`);
        // Explicitly clear the backup API cache
        backupAPI.clearCache();
        // Add a small delay to ensure backend has processed the upload
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const [dbInfo, backupsResponse] = await Promise.all([backupAPI.getDatabaseInfo(), backupAPI.getBackups()]);

      console.log(`📊 [${timestamp}] Database Info loaded:`, {
        name: dbInfo.name,
        size: dbInfo.size,
        tables: dbInfo.tables,
        records: dbInfo.records
      });
      console.log(`💾 [${timestamp}] Backups loaded:`, backupsResponse.data.backups.length, "backups found");
      console.log(`🔍 [${timestamp}] Raw API Response:`, {
        success: backupsResponse.success,
        message: backupsResponse.message,
        dataKeys: Object.keys(backupsResponse.data),
        backupsArray: backupsResponse.data.backups
      });

      // Log ALL backup details for verification
      console.log(
        `📋 [${timestamp}] Complete backup list:`,
        backupsResponse.data.backups.map(backup => ({
          id: backup.id,
          name: backup.name,
          createdAt: backup.createdAt,
          formats: backup.formats.length,
          totalSize: backup.totalSize
        }))
      );

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
    setSchedulerRefreshTrigger(prev => prev + 1);
    console.log("✅ All tabs refreshed successfully!");
  };

  const handleUploadComplete = async () => {
    console.log("📤 Upload completed - forcing data refresh...");
    await loadData(true); // Force refresh after upload
  };

  const handleDeleteBackup = (backup: BackupInfo) => {
    setBackupToDelete(backup);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!backupToDelete) return;

    try {
      await backupAPI.deleteBackup(backupToDelete.id);
      console.log(`Backup ${backupToDelete.name} deleted successfully`);
      await loadData();
    } catch (error) {
      console.error('Error deleting backup:', error);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Backup Manager</h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <p className="text-muted-foreground">Manage database backups and restore operations</p>
            {lastRefresh && <p className="text-xs text-muted-foreground">Last refreshed: {lastRefresh.toLocaleTimeString()}</p>}
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
                <Card key={backup.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Database className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold">
                            {backup.metadata?.database ? 
                              `${backup.metadata.database} Backup` : 
                              backup.name.replace(/^pgdump_/, '').replace(/_/g, ' ')
                            }
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Created {backupAPI.formatDate(backup.createdAt)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Total Size</p>
                        <p className="text-lg font-semibold">{backupAPI.formatFileSize(backup.totalSize)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Database Metadata */}
                    {backup.metadata && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Database</p>
                          <p className="text-sm font-semibold">{backup.metadata.database}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tables</p>
                          <p className="text-sm font-semibold">{backup.metadata.tables}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Records</p>
                          <p className="text-sm font-semibold">{backup.metadata.records?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Formats</p>
                          <p className="text-sm font-semibold">{backup.formats.length} available</p>
                        </div>
                      </div>
                    )}

                    {/* Format Details */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-muted-foreground mb-3">Available Formats</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {backup.formats.map(format => (
                          <div key={format.type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted/70 transition-colors">
                            <div className="flex items-center space-x-2">
                              {getBackupTypeIcon(format.type)}
                              <span className="text-sm font-semibold">{format.type.toUpperCase()}</span>
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">{backupAPI.formatFileSize(format.size)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {/* Download Buttons */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Download Options</p>
                        <div className="flex flex-wrap gap-2">
                          {backup.formats.map(format => (
                            <Button key={format.type} variant="outline" size="sm" onClick={() => handleDownloadBackup(backup, format)} className="flex-1 min-w-[100px]">
                              <Download className="h-4 w-4 mr-2" />
                              {format.type.toUpperCase()}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Management Actions */}
                      <div className="flex items-center justify-end space-x-2 pt-2">
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteBackup(backup)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
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

      <UploadBackupDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onBackupUploaded={handleUploadComplete} />

      <DeleteConfirmationDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        backup={backupToDelete} 
        onConfirm={handleConfirmDelete} 
      />
    </div>
  );
};

export default DatabaseBackupManager;
