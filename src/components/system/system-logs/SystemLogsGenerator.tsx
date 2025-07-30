import { userAPI } from "@/api/auth.ts";
import { materialsAPI } from "@/api/matierials.api.ts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getLogsTableHeaders } from "@/utils/getLogsTableHeaders";
import { format, isValid } from "date-fns";
import { CalendarIcon, Database, Download, RotateCcw, TrendingUp, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ACTION_TYPE_OPTIONS, LOG_CONFIGS, LogType } from "./configs.tsx";
import { generateActionTypeLogsReport, generateFailedOperationsReport, generateMaterialActivityLogsReport, generateRecentActivityReport, generateSearchLogsReport, generateStockEntryLogsReport, generateSummaryOverviewReport, generateTodayLogsReport, generateUserActivityLogsReport } from "./generationFunctions.ts";
import { LogsTable } from "./LogsTable.tsx";

export interface SystemLogsGeneratorProps {
  className?: string;
}

interface User {
  id: number;
  fullName: string;
  username: string;
}

interface Material {
  id: string;
  name: string;
  category: string;
}

export function SystemLogsGenerator({ className }: SystemLogsGeneratorProps) {
  const [selectedLogType, setSelectedLogType] = useState<LogType>("stock-entry-logs");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [logData, setLogData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isChangingLogType, setIsChangingLogType] = useState(false);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  // Additional parameters
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [selectedActionType, setSelectedActionType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data for dropdowns
  const [users, setUsers] = useState<User[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Refs for focus management
  const logTypeSelectRef = useRef<HTMLButtonElement>(null);
  const userSelectRef = useRef<HTMLButtonElement>(null);
  const materialSelectRef = useRef<HTMLButtonElement>(null);
  const actionTypeSelectRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentLogConfig = LOG_CONFIGS.find(config => config.id === selectedLogType);

  // Load users and materials for dropdowns
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await userAPI.getAllUsers();
        setUsers(response.users || []);
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    const loadMaterials = async () => {
      try {
        setLoadingMaterials(true);
        const response = await materialsAPI.getMaterials();
        setMaterials(response.data || []);
      } catch (error) {
        console.error("Error loading materials:", error);
      } finally {
        setLoadingMaterials(false);
      }
    };

    loadUsers();
    loadMaterials();
  }, []);

  // Focus management for required inputs on initial mount
  useEffect(() => {
    // Focus the log type selector on initial mount only if no log type is selected
    const timer = setTimeout(() => {
      if (logTypeSelectRef.current && !selectedLogType) {
        logTypeSelectRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedLogType]);

  // Focus required additional parameter inputs when log type changes
  useEffect(() => {
    if (!currentLogConfig?.requiresAdditionalParams || isChangingLogType) return;

    const timer = setTimeout(() => {
      const { additionalParamType } = currentLogConfig;

      // Focus the appropriate required input based on log type
      if (additionalParamType === "userId" && userSelectRef.current && !selectedUserId) {
        userSelectRef.current.focus();
      } else if (additionalParamType === "materialId" && materialSelectRef.current && !selectedMaterialId) {
        materialSelectRef.current.focus();
      } else if (additionalParamType === "actionType" && actionTypeSelectRef.current && !selectedActionType) {
        actionTypeSelectRef.current.focus();
      } else if (additionalParamType === "searchQuery" && searchInputRef.current && !searchQuery.trim()) {
        searchInputRef.current.focus();
      }
    }, 150); // Slight delay to ensure DOM is ready after log type change

    return () => clearTimeout(timer);
  }, [selectedLogType, currentLogConfig, isChangingLogType, selectedUserId, selectedMaterialId, selectedActionType, searchQuery]);

  const handleLogTypeChange = (newLogType: LogType) => {
    if (newLogType === selectedLogType) return;
    setIsChangingLogType(true);
    setLogData([]);
    setHasGenerated(false);
    setIsLoading(false);
    setDateFromOpen(false);
    setDateToOpen(false);

    // Reset additional parameters
    setSelectedUserId("");
    setSelectedMaterialId("");
    setSelectedActionType("");
    setSearchQuery("");

    const newConfig = LOG_CONFIGS.find(config => config.id === newLogType);
    // Don't clear date ranges when switching log types since all types support them now

    setTimeout(() => {
      setSelectedLogType(newLogType);
      setIsChangingLogType(false);
    }, 150);
  };

  const isDateRangeValid = useMemo(() => {
    // Date range is always optional, but if provided, must be valid
    if (!dateFrom && !dateTo) return true;
    if (dateFrom && dateTo) return dateFrom <= dateTo;
    if (dateFrom && !dateTo) return false; // From date without To date is invalid
    if (!dateFrom && dateTo) return false; // To date without From date is invalid
    return true;
  }, [dateFrom, dateTo]);

  const isAdditionalParamValid = useMemo(() => {
    if (!currentLogConfig?.requiresAdditionalParams) return true;

    switch (currentLogConfig.additionalParamType) {
      case "userId":
        return selectedUserId !== "";
      case "materialId":
        return selectedMaterialId !== "";
      case "actionType":
        return selectedActionType !== "";
      case "searchQuery":
        return searchQuery.trim() !== "";
      default:
        return true;
    }
  }, [currentLogConfig, selectedUserId, selectedMaterialId, selectedActionType, searchQuery]);

  const generateLogs = async () => {
    if (!isDateRangeValid) {
      let errorMessage = "Please select a valid date range.";
      if (dateFrom && !dateTo) {
        errorMessage = "Please select a 'To Date' to complete the date range.";
      } else if (!dateFrom && dateTo) {
        errorMessage = "Please select a 'From Date' to complete the date range.";
      } else if (dateFrom && dateTo && dateFrom > dateTo) {
        errorMessage = "The 'From Date' must be before or equal to the 'To Date'.";
      }

      toast({
        title: "Invalid Date Range",
        description: errorMessage,
        variant: "destructive",
        duration: 1500
      });
      return;
    }

    if (!isAdditionalParamValid) {
      toast({
        title: "Missing Parameter",
        description: `Please provide the required ${currentLogConfig?.additionalParamLabel?.toLowerCase()}.`,
        variant: "destructive",
        duration: 1500
      });
      return;
    }

    setIsLoading(true);
    setHasGenerated(false);

    try {
      let logResults: Record<string, unknown>[] | undefined;

      switch (selectedLogType) {
        case "stock-entry-logs":
          logResults = await generateStockEntryLogsReport({
            startDate: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
            endDate: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined
          });
          break;

        case "user-activity-logs":
          if (!selectedUserId) throw new Error("User ID is required");
          logResults = await generateUserActivityLogsReport(parseInt(selectedUserId), {
            startDate: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
            endDate: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined
          });
          break;

        case "material-activity-logs":
          if (!selectedMaterialId) throw new Error("Material ID is required");
          logResults = await generateMaterialActivityLogsReport(parseInt(selectedMaterialId), {
            startDate: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
            endDate: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined
          });
          break;

        case "failed-operations":
          logResults = await generateFailedOperationsReport({
            startDate: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
            endDate: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined
          });
          break;

        case "recent-activity":
          logResults = await generateRecentActivityReport({
            startDate: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
            endDate: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined
          });
          break;

        case "today-logs":
          logResults = await generateTodayLogsReport({
            startDate: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
            endDate: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined
          });
          break;

        case "action-type-logs":
          if (!selectedActionType) throw new Error("Action type is required");
          logResults = await generateActionTypeLogsReport(selectedActionType, {
            startDate: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
            endDate: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined
          });
          break;

        case "summary-overview":
          logResults = await generateSummaryOverviewReport({
            startDate: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
            endDate: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined
          });
          break;

        case "search-logs":
          if (!searchQuery.trim()) throw new Error("Search query is required");
          logResults = await generateSearchLogsReport(searchQuery.trim(), {
            startDate: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
            endDate: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined
          });
          break;

        default:
          throw new Error("Invalid log type");
      }

      setLogData(logResults);
      setHasGenerated(true);

      toast({
        title: "Logs Generated",
        description: `${currentLogConfig?.name} has been generated successfully.`,
        duration: 1500
      });
    } catch (error) {
      console.error("Error generating logs:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate logs. Please check the console for details.",
        variant: "destructive",
        duration: 1500
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearDateRange = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    toast({
      title: "Date Range Cleared",
      description: "Date range filters have been removed.",
      duration: 1500
    });
  };

  const clearAllFilters = () => {
    // Clear date range
    setDateFrom(undefined);
    setDateTo(undefined);

    // Clear additional parameters
    setSelectedUserId("");
    setSelectedMaterialId("");
    setSelectedActionType("");
    setSearchQuery("");

    // Clear generated data
    setLogData([]);
    setHasGenerated(false);
    setIsLoading(false);

    // Close any open popovers
    setDateFromOpen(false);
    setDateToOpen(false);

    toast({
      title: "All Filters Cleared",
      description: "All filters and data have been reset to default state.",
      duration: 1500
    });
  };

  const exportLogs = () => {
    if (!hasGenerated || logData.length === 0) return;

    const headers = getLogsTableHeaders(selectedLogType);
    const csvContent = [
      headers.join(","),
      ...logData.map(row =>
        headers
          .map(header => {
            const value = row[header] ?? row[header.toLowerCase().replace(/\s+/g, "")] ?? "-";
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
          })
          .join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedLogType}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <Card className="flex flex-col h-full">
        <CardHeader className="flex-shrink-0 p-4 px-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Logs Generator
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-6 min-h-0 overflow-hidden">
          {/* Filter Controls Section */}
          <div className="space-y-1">
            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 items-center">
              {/* Log Type Selection */}
              <div className="space-y-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
                <Label htmlFor="log-type" className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Log Type
                </Label>
                <Select value={selectedLogType} onValueChange={handleLogTypeChange} disabled={isChangingLogType || isLoading}>
                  <SelectTrigger ref={logTypeSelectRef} id="log-type" className={cn("h-14 w-full text-base bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:border-teal-400 dark:hover:border-teal-500 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200", isChangingLogType && "opacity-60")}>
                    <SelectValue placeholder="Select log type" />
                    {isChangingLogType && (
                      <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      </div>
                    )}
                  </SelectTrigger>
                  <SelectContent className="max-w-[90vw] sm:max-w-md">
                    {LOG_CONFIGS.map(config => (
                      <SelectItem key={config.id} value={config.id} className="cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors">
                        <div className="flex items-start gap-3 py-2 min-w-0 text-left">
                          <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm truncate">{config.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2 leading-tight">{config.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range - Available for all log types */}
              {currentLogConfig?.supportsDateRange && (
                <>
                  <div className="space-y-1">
                    <Label className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">From Date</Label>
                    <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full h-14 justify-start text-left font-medium px-4 text-base bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500 focus:border-green-500 dark:focus:border-green-400 transition-colors duration-200", !dateFrom && "text-muted-foreground", (isChangingLogType || isLoading) && "pointer-events-none opacity-50")} disabled={isChangingLogType || isLoading}>
                          <CalendarIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{dateFrom ? format(dateFrom, "MMM d, yyyy") : "Pick a date"}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 max-w-[90vw]" align="start" side="bottom">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={date => {
                            if (isValid(date)) {
                              setDateFrom(date);
                            }
                            setDateFromOpen(false);
                          }}
                          initialFocus
                          className="p-3"
                          disabled={date => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">To Date</Label>
                    <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full h-14 justify-start text-left font-medium px-4 text-base bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500 focus:border-green-500 dark:focus:border-green-400 transition-colors duration-200", !dateTo && "text-muted-foreground", (isChangingLogType || isLoading) && "pointer-events-none opacity-50")} disabled={isChangingLogType || isLoading}>
                          <CalendarIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{dateTo ? format(dateTo, "MMM d, yyyy") : "Pick a date"}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 max-w-[90vw]" align="start" side="bottom">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={date => {
                            if (isValid(date)) {
                              setDateTo(date);
                            }
                            setDateToOpen(false);
                          }}
                          initialFocus
                          className="p-3"
                          disabled={date => date > new Date() || (dateFrom && date < dateFrom)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}

              {/* Additional Parameters */}
              {currentLogConfig?.requiresAdditionalParams && (
                <div className="space-y-1">
                  <Label className="text-base font-semibold text-gray-800 dark:text-gray-200">{currentLogConfig.additionalParamLabel}</Label>

                  {currentLogConfig.additionalParamType === "userId" && (
                    <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={isChangingLogType || isLoading || loadingUsers}>
                      <SelectTrigger ref={userSelectRef} className="h-14 text-base bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200">
                        <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select user"} />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{user.fullName}</span>
                              <span className="text-xs text-muted-foreground">@{user.username}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {currentLogConfig.additionalParamType === "materialId" && (
                    <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId} disabled={isChangingLogType || isLoading || loadingMaterials}>
                      <SelectTrigger ref={materialSelectRef} className="h-14 text-base bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:border-orange-400 dark:hover:border-orange-500 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200">
                        <SelectValue placeholder={loadingMaterials ? "Loading materials..." : "Select material"} />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map(material => (
                          <SelectItem key={material.id} value={material.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{material.name}</span>
                              <span className="text-xs text-muted-foreground">{material.category}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {currentLogConfig.additionalParamType === "actionType" && (
                    <Select value={selectedActionType} onValueChange={setSelectedActionType} disabled={isChangingLogType || isLoading}>
                      <SelectTrigger ref={actionTypeSelectRef} className="h-14 text-base bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200">
                        <SelectValue placeholder="Select action type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {currentLogConfig.additionalParamType === "searchQuery" && (
                    <Input ref={searchInputRef} placeholder="Enter search query..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-14 text-base bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:border-cyan-400 dark:hover:border-cyan-500 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-colors duration-200" disabled={isChangingLogType || isLoading} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button onClick={generateLogs} disabled={isLoading || !isDateRangeValid || !isAdditionalParamValid || isChangingLogType} className="flex items-center justify-center gap-3 h-12 min-w-[160px] text-base font-semibold bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 transition-all duration-200 shadow-md hover:shadow-lg">
                {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <TrendingUp className="h-5 w-5" />}
                <span className="truncate">{isLoading ? "Generating..." : "Generate Logs"}</span>
              </Button>
              <Button variant="outline" onClick={clearAllFilters} disabled={isChangingLogType || isLoading} className="flex items-center justify-center gap-2 h-12 px-4 text-base font-medium bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800 dark:bg-red-950 dark:hover:bg-red-900 dark:border-red-800 dark:text-red-300 dark:hover:text-red-200 transition-all duration-200">
                <RotateCcw className="h-4 w-4" />
                <span>Clear All</span>
              </Button>
              {(dateFrom || dateTo) && (
                <Button variant="outline" onClick={clearDateRange} disabled={isChangingLogType || isLoading} className="flex items-center justify-center gap-2 h-12 px-4 text-base font-medium bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800 hover:text-amber-900 dark:bg-amber-950 dark:hover:bg-amber-900 dark:border-amber-700 dark:text-amber-300 dark:hover:text-amber-200 transition-all duration-200">
                  <X className="h-4 w-4" />
                  <span>Clear Dates</span>
                </Button>
              )}

              {hasGenerated && (
                <Button variant="outline" onClick={exportLogs} disabled={isChangingLogType || isLoading} className="flex items-center justify-center gap-2 h-12 px-4 text-base font-medium bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 hover:text-emerald-900 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:border-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200 transition-all duration-200">
                  <Download className="h-5 w-5" />
                  <span>Export CSV</span>
                </Button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {(dateFrom || dateTo) && (
                <Badge variant="outline" className="flex items-center justify-center gap-2 px-4 py-2 h-12 text-base font-medium border-2 border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-200">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{dateFrom && dateTo ? `${format(dateFrom, "MMM d")} - ${format(dateTo, "MMM d, yyyy")}` : dateFrom ? `From ${format(dateFrom, "MMM d, yyyy")}` : `Until ${format(dateTo!, "MMM d, yyyy")}`}</span>
                </Badge>
              )}
            </div>
          </div>

          {isChangingLogType && (
            <div className="flex-1 flex flex-col animate-in fade-in-50 duration-200 min-h-0">
              <div className="flex-1 flex items-center justify-center border rounded-lg bg-muted/30 min-h-[200px]">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  <span className="text-sm">Switching log type...</span>
                </div>
              </div>
            </div>
          )}

          {hasGenerated && !isChangingLogType && (
            <div className="flex-1 flex flex-col space-y-4 animate-in fade-in-50 duration-300 min-h-0 overflow-hidden">
              <div className="flex-1 bg-card overflow-hidden min-h-0">
                <LogsTable logType={selectedLogType} data={logData} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
