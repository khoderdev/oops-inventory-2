import { BackupInfo } from "@/api/backup.api";
import { Database, HardDrive, FileText, Badge } from "lucide-react";

// Helper functions for backup type icons and badges
export const getBackupTypeIcon = (type: string) => {
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

export const getBackupTypeBadge = (type: string) => {
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

export const getMainBackupIcon = (backup: BackupInfo) => {
  // Use the first available format's icon
  if (backup.formats.length > 0) {
    return getBackupTypeIcon(backup.formats[0].type);
  }
  return <Database className="h-4 w-4" />;
};
