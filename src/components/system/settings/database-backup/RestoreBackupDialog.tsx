import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import React, { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { backupAPI } from "@/api/backup.api";
import { getBackupTypeIcon } from "./constants";
import { BackupFormat, RestoreBackupDialogProps, RestoreProgress } from "@/types/backup-scheduler";

const RestoreBackupDialog: React.FC<RestoreBackupDialogProps> = ({ open, onOpenChange, backup, onRestoreCompleted }) => {
  const [loading, setLoading] = useState(false);
  const [targetDatabase, setTargetDatabase] = useState("");
  const [dropExisting, setDropExisting] = useState(false);
  const [restoreData, setRestoreData] = useState(true);
  const [restoreSchema, setRestoreSchema] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<BackupFormat | null>(null);
  const [progress, setProgress] = useState<RestoreProgress | null>(null);

  React.useEffect(() => {
    if (backup && backup.formats.length > 0) {
      const preferredFormat = backup.formats.find(f => f.type === "sql") || backup.formats[0];
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

export default RestoreBackupDialog;
