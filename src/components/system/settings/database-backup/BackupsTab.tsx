import React from "react";
import { Database, Download, RefreshCw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { backupAPI } from "@/api/backup.api";
import { getBackupTypeIcon } from "./constants";
import { BackupsTabProps } from "@/types/backup-scheduler";

const BackupsTab: React.FC<BackupsTabProps> = ({ backups, lastRefresh, onOpenUpload, onOpenCreate, onDownload, onRestore, onDelete }) => {
  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex flex-col w-fit">
          <h2 className="text-2xl font-bold">Database Backup Manager</h2>
          <div className="w-fit flex flex-col sm:flex-row sm:items-center sm:space-x-4">{lastRefresh && <p className="text-xs text-muted-foreground">Last refreshed: {lastRefresh.toLocaleTimeString()}</p>}</div>
        </div>

        {/* Quick Actions */}
        <div className="flex w-fit items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onOpenUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Backup
          </Button>
          <Button size="sm" onClick={onOpenCreate}>
            <Database className="h-4 w-4 mr-2" />
            Create Backup
          </Button>
        </div>
      </div>

      {/* Backups List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {backups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No backups found</h3>
              <p className="text-muted-foreground text-center mb-4">Create your first backup to get started with database protection.</p>
              <Button onClick={onOpenCreate}>
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
                      <CardTitle className="text-lg font-semibold">
                        {backup.formats?.[0]?.filename
                          ? backup.formats[0].filename.replace(/\.[^/.]+$/, "") // strip extension -> "khoder"
                          : backup.metadata?.database
                            ? `${backup.metadata.database} Backup`
                            : backup.name.replace(/^pgdump_/, "").replace(/_/g, " ")}
                      </CardTitle>
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
                    <Button key={format.type} variant="outline" size="sm" onClick={() => onDownload(backup, format)} className="flex-1 min-w-[100px]">
                      <Download className="h-4 w-4 mr-2" />
                      {format.type.toUpperCase()}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => onRestore(backup)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDelete(backup)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
};

export default BackupsTab;
