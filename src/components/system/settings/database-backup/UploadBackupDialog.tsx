import { AlertCircle, FileText, Loader2, Upload, X } from "lucide-react";
import React, { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { backupAPI } from "@/api/backup.api";
import { UploadBackupDialogProps } from "@/types/backup-scheduler";

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
    const validExtensions = [".sql", ".custom", ".zip", ".tar", ".gz"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    if (!validExtensions.includes(fileExtension)) {
      alert(`Invalid file type. Please select a backup file with one of these extensions: ${validExtensions.join(", ")}`);
      return;
    }
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > maxSize) {
      alert("File size too large. Maximum allowed size is 1GB.");
      return;
    }
    setSelectedFile(file);
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
    setLoading(true);
    setUploadProgress(0);
    try {
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
      if (response.success) {
        try {
          const validation = await backupAPI.validateBackup(response.data.backup.id);
          setValidationResult(validation);
          if (validation.valid) {
            setTimeout(() => {
              onBackupUploaded();
              onOpenChange(false);
            }, 1000);
          }
        } catch (validationError) {
          console.warn("Backup uploaded but validation failed:", validationError);
          onBackupUploaded();
          setTimeout(() => {
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

export default UploadBackupDialog;
