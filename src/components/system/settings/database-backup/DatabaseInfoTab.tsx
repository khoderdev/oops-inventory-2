import React from "react";
import { Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { backupAPI } from "@/api/backup.api";
import { DatabaseInfoTabProps } from "@/types/backup-scheduler";

const DatabaseInfoTab: React.FC<DatabaseInfoTabProps> = ({ databaseInfo, backups }) => {
  return (
    <>
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
    </>
  );
};

export default DatabaseInfoTab;
