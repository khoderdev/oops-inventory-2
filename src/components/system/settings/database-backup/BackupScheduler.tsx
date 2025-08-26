import { Activity, AlertCircle, Calendar, CheckCircle, Clock, Database, Edit, Loader2, Pause, Play, Plus, Power, PowerOff, Settings, Trash2, XCircle } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { backupSchedulerAPI } from "@/api/backup-scheduler.api";
import { BackupSchedule, BackupSchedulerProps, CreateScheduleDialogProps, ScheduleCreateRequest, ScheduleExecution, SchedulerStatus } from "@/types/backup-scheduler";

const CreateScheduleDialog: React.FC<CreateScheduleDialogProps> = ({ open, onOpenChange, onScheduleCreated, editSchedule }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ScheduleCreateRequest>({
    name: "",
    frequency: "daily",
    time: "02:00",
    intervalMinutes: 1,
    backupType: "sql",
    includeData: true,
    includeSchema: true,
    retentionDays: 30
  });
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (editSchedule) {
      setFormData({
        name: editSchedule.name,
        frequency: editSchedule.frequency,
        time: editSchedule.time,
        intervalMinutes: editSchedule.intervalMinutes,
        dayOfWeek: editSchedule.dayOfWeek,
        dayOfMonth: editSchedule.dayOfMonth,
        backupType: editSchedule.backupType,
        includeData: editSchedule.includeData,
        includeSchema: editSchedule.includeSchema,
        retentionDays: editSchedule.retentionDays
      });
    } else {
      setFormData({
        name: "",
        frequency: "daily",
        time: "02:00",
        intervalMinutes: 1,
        backupType: "sql",
        includeData: true,
        includeSchema: true,
        retentionDays: 30
      });
    }
    setTimeError(null);
  }, [editSchedule, open]);

  const handleTimeChange = (hour: string, minute: string, period: string) => {
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);

    if (isNaN(hourNum) || isNaN(minuteNum)) {
      setTimeError("Please enter valid time values");
      return;
    }

    if (hourNum < 1 || hourNum > 12 || minuteNum < 0 || minuteNum > 59) {
      setTimeError("Invalid time range. Hours: 1-12, Minutes: 0-59");
      return;
    }

    setTimeError(null);
    const militaryHour = period === "PM" ? (hourNum % 12) + 12 : hourNum % 12;
    const timeString = `${militaryHour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    setFormData(prev => ({ ...prev, time: timeString }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a schedule name");
      return;
    }

    if (timeError) {
      alert("Please correct the time selection");
      return;
    }

    setLoading(true);
    try {
      if (editSchedule) {
        await backupSchedulerAPI.updateSchedule(editSchedule.id, formData);
      } else {
        await backupSchedulerAPI.createSchedule(formData);
      }

      onScheduleCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save schedule:", error);
      alert("Failed to save schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [hour, minute] = formData.time.split(":");
  const displayHour = parseInt(hour) % 12 || 12;
  const displayPeriod = parseInt(hour) >= 12 ? "PM" : "AM";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editSchedule ? "Edit" : "Create"} Backup Schedule</DialogTitle>
          <DialogDescription>{editSchedule ? "Update the backup schedule settings." : "Set up automatic database backups."}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="schedule-name">Schedule Name</Label>
            <Input id="schedule-name" placeholder="e.g., Daily Production Backup" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} disabled={loading} className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={formData.frequency} onValueChange={(value: "daily" | "weekly" | "monthly") => setFormData(prev => ({ ...prev, frequency: value }))} disabled={loading}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Select value={displayHour.toString()} onValueChange={value => handleTimeChange(value, minute, displayPeriod)} disabled={loading}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                      <SelectItem key={h} value={h.toString()}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>:</span>
                <Select value={minute} onValueChange={value => handleTimeChange(displayHour.toString(), value, displayPeriod)} disabled={loading}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["00", "15", "30", "45"].map(m => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={displayPeriod} onValueChange={value => handleTimeChange(displayHour.toString(), minute, value)} disabled={loading}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {timeError && <p className="text-xs text-destructive mt-1">{timeError}</p>}
              <p className="text-xs text-muted-foreground mt-1">Time is in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})</p>
            </div>
          </div>

          {formData.frequency === "daily" && (
            <div>
              <Label htmlFor="interval">Interval (Minutes)</Label>
              <Input id="interval" type="number" min="1" max="60" placeholder="1" value={formData.intervalMinutes || 1} onChange={e => setFormData(prev => ({ ...prev, intervalMinutes: parseInt(e.target.value) || 1 }))} disabled={loading} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">How often to repeat the backup within the day</p>
            </div>
          )}

          {formData.frequency === "weekly" && (
            <div>
              <Label htmlFor="day-of-week">Day of Week</Label>
              <Select value={formData.dayOfWeek?.toString() || "0"} onValueChange={value => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(value) }))} disabled={loading}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.frequency === "monthly" && (
            <div>
              <Label htmlFor="day-of-month">Day of Month</Label>
              <Input id="day-of-month" type="number" min="1" max="31" value={formData.dayOfMonth || 1} onChange={e => setFormData(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) }))} disabled={loading} className="mt-1" />
            </div>
          )}

          <div>
            <Label htmlFor="backup-type">Backup Type</Label>
            <Select value={formData.backupType} onValueChange={(value: "custom" | "directory" | "sql") => setFormData(prev => ({ ...prev, backupType: value }))} disabled={loading}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sql">Plain SQL (Recommended)</SelectItem>
                <SelectItem value="custom">Custom Format</SelectItem>
                <SelectItem value="directory">Directory Format</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="retention">Retention (Days)</Label>
            <Input id="retention" type="number" min="1" max="365" value={formData.retentionDays} onChange={e => setFormData(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))} disabled={loading} className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Backups older than this will be automatically deleted</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch id="include-schema" checked={formData.includeSchema} onCheckedChange={checked => setFormData(prev => ({ ...prev, includeSchema: checked }))} disabled={loading} />
              <Label htmlFor="include-schema">Include Schema</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="include-data" checked={formData.includeData} onCheckedChange={checked => setFormData(prev => ({ ...prev, includeData: checked }))} disabled={loading} />
              <Label htmlFor="include-data">Include Data</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !formData.name.trim() || !!timeError}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editSchedule ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  {editSchedule ? "Update Schedule" : "Create Schedule"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const BackupScheduler: React.FC<BackupSchedulerProps> = ({ refreshTrigger }) => {
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ScheduleExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<BackupSchedule | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [schedulesResponse, statusResponse, historyResponse] = await Promise.all([backupSchedulerAPI.getSchedules(), backupSchedulerAPI.getSchedulerStatus(), backupSchedulerAPI.getExecutionHistory(undefined, 20)]);
      setSchedules(schedulesResponse.data);
      setSchedulerStatus(statusResponse.data);
      setExecutionHistory(historyResponse.data);
    } catch (error) {
      console.error("Failed to load scheduler data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadData();
    }
  }, [refreshTrigger, loadData]);

  const handleToggleScheduler = async () => {
    try {
      if (schedulerStatus?.isRunning) {
        await backupSchedulerAPI.stopScheduler();
      } else {
        await backupSchedulerAPI.startScheduler();
      }
      await loadData();
    } catch (error) {
      console.error("Failed to toggle scheduler:", error);
    }
  };

  const handleToggleSchedule = async (schedule: BackupSchedule) => {
    try {
      await backupSchedulerAPI.toggleSchedule(schedule.id, !schedule.enabled);
      await loadData();
    } catch (error) {
      console.error("Failed to toggle schedule:", error);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await backupSchedulerAPI.deleteSchedule(scheduleId);
      await loadData();
    } catch (error) {
      console.error("Failed to delete schedule:", error);
    }
  };

  const handleRunNow = async (schedule: BackupSchedule) => {
    try {
      await backupSchedulerAPI.runScheduleNow(schedule.id);
      await loadData();
    } catch (error) {
      console.error("Failed to run schedule:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="secondary">
            <Pause className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getExecutionStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "running":
        return (
          <Badge variant="default" className="bg-blue-500">
            <Activity className="w-3 h-3 mr-1" />
            Running
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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
          <h2 className="text-2xl font-bold">Backup Scheduler</h2>
          <p className="text-muted-foreground">Manage automatic database backup schedules</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant={schedulerStatus?.isRunning ? "destructive" : "default"} size="sm" onClick={handleToggleScheduler}>
            {schedulerStatus?.isRunning ? (
              <>
                <PowerOff className="h-4 w-4 mr-2" />
                Stop Scheduler
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Start Scheduler
              </>
            )}
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Scheduler Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Scheduler Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Status</p>
              <div className="flex items-center space-x-2 mt-1">
                {schedulerStatus?.isRunning ? (
                  <Badge variant="default" className="bg-green-500">
                    <Play className="w-3 h-3 mr-1" />
                    Running
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Pause className="w-3 h-3 mr-1" />
                    Stopped
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Active Schedules</p>
              <p className="text-2xl font-bold">{schedulerStatus?.activeSchedules || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Schedules</p>
              <p className="text-2xl font-bold">{schedulerStatus?.totalSchedules || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Next Run</p>
              <p className="text-sm text-muted-foreground">{schedulerStatus?.nextScheduledRun ? new Date(schedulerStatus.nextScheduledRun).toLocaleString() : "No scheduled runs"}</p>
            </div>
          </div>

          {schedulerStatus?.lastError && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Last Error:</strong> {schedulerStatus.lastError}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Schedules</CardTitle>
          <CardDescription>Manage your automatic backup schedules</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No schedules configured</h3>
              <p className="text-muted-foreground mb-4">Create your first backup schedule to automate database backups.</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Schedule
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map(schedule => (
                <Card key={schedule.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold">{schedule.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {backupSchedulerAPI.formatFrequency(schedule.frequency, schedule.dayOfWeek, schedule.dayOfMonth, schedule.intervalMinutes)}
                            {schedule.frequency !== "daily" && " at "}
                            {schedule.frequency !== "daily" && backupSchedulerAPI.formatTime(schedule.time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(schedule.status)}
                        <Switch checked={schedule.enabled} onCheckedChange={() => handleToggleSchedule(schedule)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Backup Type</p>
                        <p className="text-sm">{schedule.backupType.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Retention</p>
                        <p className="text-sm">{schedule.retentionDays} days</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Last Run</p>
                        <p className="text-sm">{schedule.lastRun ? new Date(schedule.lastRun).toLocaleDateString() : "Never"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Next Run</p>
                        <p className="text-sm">{schedule.nextRun ? new Date(schedule.nextRun).toLocaleDateString() : backupSchedulerAPI.getNextRunTime(schedule).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          <Database className="w-3 h-3 mr-1" />
                          {schedule.includeSchema ? "Schema" : ""}
                          {schedule.includeSchema && schedule.includeData ? " + " : ""}
                          {schedule.includeData ? "Data" : ""}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleRunNow(schedule)} disabled={!schedulerStatus?.isRunning}>
                          <Play className="h-4 w-4 mr-2" />
                          Run Now
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditSchedule(schedule);
                            setCreateDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteSchedule(schedule.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>History of scheduled backup executions</CardDescription>
        </CardHeader>
        <CardContent>
          {executionHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No execution history available</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Backup ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executionHistory.map(execution => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-medium">{execution.scheduleName}</TableCell>
                    <TableCell>{new Date(execution.startTime).toLocaleString()}</TableCell>
                    <TableCell>{execution.duration ? backupSchedulerAPI.formatDuration(execution.duration) : execution.status === "running" ? "Running..." : "-"}</TableCell>
                    <TableCell>{getExecutionStatusBadge(execution.status)}</TableCell>
                    <TableCell>
                      {execution.backupId ? (
                        <Badge variant="outline" className="font-mono">
                          {execution.backupId.substring(0, 8)}...
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Schedule Dialog */}
      <CreateScheduleDialog
        open={createDialogOpen}
        onOpenChange={open => {
          setCreateDialogOpen(open);
          if (!open) setEditSchedule(null);
        }}
        onScheduleCreated={loadData}
        editSchedule={editSchedule}
      />
    </div>
  );
};

export default BackupScheduler;
