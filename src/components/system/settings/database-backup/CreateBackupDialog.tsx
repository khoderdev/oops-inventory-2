import { Database, FileText, HardDrive, Loader2 } from "lucide-react";
import React, { useState } from "react";
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

export default CreateBackupDialog;
