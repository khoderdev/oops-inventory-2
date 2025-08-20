import { Database, FileText, HardDrive, Loader2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { backupAPI, BackupProgress } from "@/api/backup.api";
import { CreateBackupDialogProps } from "@/types/backup-scheduler";

const CreateBackupDialog: React.FC<CreateBackupDialogProps> = ({ open, onOpenChange, onBackupCreated }) => {
  const [loading, setLoading] = useState(false);
  const [backupName, setBackupName] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<("custom" | "directory" | "sql")[]>(["sql"]);
  const [includeData, setIncludeData] = useState(true);
  const [includeSchema, setIncludeSchema] = useState(true);
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backupIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (!loading) {
        setBackupName("");
        setSelectedFormats(["sql"]);
        setProgress(null);
        backupIdRef.current = null;
      }
    }
  }, [open, loading]);

  const startProgressTracking = (backupId: string) => {
    backupIdRef.current = backupId;
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(async () => {
      if (!backupIdRef.current) return;
      try {
        const progressData = await backupAPI.getBackupProgress(backupIdRef.current);
        setProgress(progressData);
        if (progressData.status === "completed" || progressData.status === "failed") {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setLoading(false);
          if (progressData.status === "completed") {
            onBackupCreated();
            setTimeout(() => {
              onOpenChange(false);
            }, 1000);
          } else {
            setError(progressData.message || "Backup failed");
          }
        }
      } catch (error) {
        console.error("Failed to fetch backup progress:", error);
        setError("Failed to track backup progress. Please check the backup status manually.");
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setLoading(false);
      }
    }, 1000);
  };

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      setError("Please enter a backup name");
      return;
    }
    if (selectedFormats.length === 0) {
      setError("Please select at least one backup format");
      return;
    }
    setLoading(true);
    setError(null);
    setProgress({
      status: "starting",
      progress: 0,
      message: "Initializing backup process..."
    });
    try {
      const response = await backupAPI.createBackup({
        name: backupName,
        formats: selectedFormats,
        includeData,
        includeSchema
      });
      if (response.success) {
        const backupId = response.data.backup.id;
        startProgressTracking(backupId);
      }
    } catch (error) {
      setLoading(false);
      console.error("Failed to create backup:", error);
      setProgress({
        status: "failed",
        progress: 0,
        message: error instanceof Error ? error.message : "Failed to create backup"
      });
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

  const getProgressColor = () => {
    if (!progress) return "";

    switch (progress.status) {
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "in_progress":
        return progress.progress > 70 ? "bg-green-500" : "bg-blue-500";
      default:
        return "";
    }
  };

  // Get appropriate status indicator
  const getStatusIndicator = () => {
    if (!progress) return null;
    const statusClasses = {
      starting: "text-blue-500",
      in_progress: "text-blue-500",
      completed: "text-green-500",
      failed: "text-red-500"
    };
    return (
      <span className={`font-medium ${statusClasses[progress.status]}`}>
        {progress.status === "starting" && "Starting..."}
        {progress.status === "in_progress" && "In Progress"}
        {progress.status === "completed" && "Completed"}
        {progress.status === "failed" && "Failed"}
      </span>
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={newOpen => {
        // Prevent closing dialog during backup operation
        if (loading && newOpen === false) {
          return;
        }
        onOpenChange(newOpen);
      }}
    >
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
                <input type="checkbox" id="format-sql" checked={selectedFormats.includes("sql")} onChange={() => handleFormatToggle("sql")} disabled={loading} className="rounded" />
                <Label htmlFor="format-sql" className="flex items-center space-x-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  <div>
                    <span className="font-medium">Plain SQL</span>
                    <p className="text-xs text-muted-foreground">Cross-platform compatibility, manual editing</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="format-custom" checked={selectedFormats.includes("custom")} onChange={() => handleFormatToggle("custom")} disabled={loading} className="rounded" />
                <Label htmlFor="format-custom" className="flex items-center space-x-2 cursor-pointer">
                  <Database className="h-4 w-4" />
                  <div>
                    <span className="font-medium">Custom Format</span>
                    <p className="text-xs text-muted-foreground">Best for pgAdmin Restore, pg_restore command</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="format-directory" checked={selectedFormats.includes("directory")} onChange={() => handleFormatToggle("directory")} disabled={loading} className="rounded" />
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
            <div className="space-y-2 p-3 border rounded-md bg-muted/30">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {getStatusIndicator()}
                  <span>{progress.message}</span>
                </div>
                <span className="font-medium">{Math.round(progress.progress)}%</span>
              </div>

              <div className="relative">
                <Progress value={progress.progress} className="h-2" />
                {/* Add animation for all statuses except completed */}
                {progress.status !== "completed" && (
                  <div
                    className="absolute top-0 left-0 h-2 w-full animate-pulse opacity-30 bg-white"
                    style={{
                      clipPath: progress.progress > 0 ? `inset(0 ${100 - progress.progress}% 0 0)` : undefined,
                      animation: progress.status === "starting" ? "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite" : undefined
                    }}
                  />
                )}
              </div>

              {progress.currentStep && <p className="text-xs text-muted-foreground mt-1">{progress.currentStep}</p>}

              {progress.estimatedTimeRemaining !== undefined && progress.status === "in_progress" && <p className="text-xs text-muted-foreground">Estimated time remaining: {progress.estimatedTimeRemaining > 60 ? `${Math.round(progress.estimatedTimeRemaining / 60)} minutes` : `${progress.estimatedTimeRemaining} seconds`}</p>}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreateBackup} disabled={loading || !backupName.trim()} className={progress?.status === "completed" ? "bg-green-600 hover:bg-green-700" : ""}>
              {progress?.status === "completed" ? (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Completed
                </>
              ) : loading ? (
                <>
                  <Database className="mr-2 h-4 w-4 animate-pulse" />
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

export default CreateBackupDialog;
