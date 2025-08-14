import { BarChart3, Calendar, CheckCircle, Clock, DollarSign, Plus, ToggleLeft, ToggleRight, TrendingUp, XCircle } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dayOperationsAPI } from "../api/dayOperations.api";

// Destructure API methods for cleaner usage
const { getCurrentDayOperation, getDayOperations, getCurrentDayActivities, openDay, closeDay } = dayOperationsAPI;
import { useAuth } from "../contexts/AuthContext";
import { DayOperationsModal, DayOperationsFormData } from "../components/DayOperationsModal/DayOperationsModal";
import DailyReports from "../components/analytics/DailyReports";
import ViewReportButton from "../components/ui/ViewReportButton";
import { useDailyReports } from "../hooks/useDailyReports";
import { ActivityLog, CloseDayRequest, DayOperation, OpenDayRequest } from "../types/inventory";

const DayOperationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentDay, setCurrentDay] = useState<DayOperation | null>(null);
  const [recentDays, setRecentDays] = useState<DayOperation[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showTotalSales, setShowTotalSales] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form states - automatically populate user information
  const [openDayForm, setOpenDayForm] = useState<OpenDayRequest>({
    openingCash: 0,
    openedBy: user?.fullName || "",
    notes: ""
  });
  const [closeDayForm, setCloseDayForm] = useState<CloseDayRequest>({
    closingCash: 0,
    closedBy: user?.fullName || "",
    notes: ""
  });

  // Modal states
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Daily reports hook
  const { handleViewReport, showReportModal, setShowReportModal, selectedReport, loading: reportLoading, error: reportError, setError: setReportError } = useDailyReports();

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard event handler for Enter key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !showOpenModal && !showCloseModal && !currentDay) {
        event.preventDefault();
        setShowOpenModal(true);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [showOpenModal, showCloseModal, currentDay]);

  // Update form user fields when user changes
  useEffect(() => {
    if (user?.fullName) {
      setOpenDayForm(prev => ({
        ...prev,
        openedBy: user.fullName
      }));
      setCloseDayForm(prev => ({
        ...prev,
        closedBy: user.fullName
      }));
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load current day
      const currentResponse = await getCurrentDayOperation();
      setCurrentDay(currentResponse.currentDay);

      // Load recent days
      const recentResponse = await getDayOperations(1, 10);

      // Debug: Log the date values to understand the format
      console.log(
        "🔍 Debug - Recent days data:",
        recentResponse.dayOperations.map(day => {
          const dateStr = day.date;
          let localDate: Date;

          if (typeof dateStr === "string" && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, dayNum] = dateStr.split("-").map(Number);
            localDate = new Date(year, month - 1, dayNum);
          } else {
            localDate = new Date(dateStr);
          }

          return {
            id: day.id,
            date: dateStr,
            dateType: typeof dateStr,
            openedAt: day.openedAt,
            closedAt: day.closedAt,
            parsedDate: new Date(dateStr),
            localDate: localDate,
            currentTime: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          };
        })
      );

      setRecentDays(recentResponse.dayOperations);

      // Load current day activities if day is open
      if (currentResponse.currentDay && currentResponse.currentDay.status === "opened") {
        try {
          const activitiesResponse = await getCurrentDayActivities();
          setActivities(activitiesResponse.activities);
        } catch (activityError) {
          console.warn("Could not load activities:", activityError);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load day operations");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDay = async () => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await openDay(openDayForm);

      // Immediately update the current day state with the response
      if (response.dayOperation) {
        setCurrentDay(response.dayOperation);
      }

      setSuccess(`Day opened successfully! ${response.stockItemsCaptured} stock items captured.`);
      setShowOpenModal(false);
      setOpenDayForm({ openingCash: 0, openedBy: user?.fullName || "", notes: "" });

      // Add a small delay then refresh to ensure backend consistency
      setTimeout(async () => {
        await loadData();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open day");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseDay = async () => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await closeDay(closeDayForm);

      // Immediately update the current day state with the response
      if (response.dayOperation) {
        setCurrentDay(response.dayOperation);
      }

      setSuccess(`Day closed successfully! Total sales: $${response.summary?.totalSales.toFixed(2)}`);
      setShowCloseModal(false);
      setCloseDayForm({ closingCash: 0, closedBy: user?.fullName || "", notes: "" });

      // Add a small delay then refresh to ensure backend consistency
      setTimeout(async () => {
        await loadData();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close day");
    } finally {
      setActionLoading(false);
    }
  };

  // Convert form data for the reusable modal component
  const convertToModalFormData = (type: "open" | "close"): DayOperationsFormData => {
    if (type === "open") {
      return {
        openingCash: openDayForm.openingCash,
        openedBy: openDayForm.openedBy,
        notes: openDayForm.notes
      };
    } else {
      return {
        closingCash: closeDayForm.closingCash,
        closedBy: closeDayForm.closedBy,
        notes: closeDayForm.notes
      };
    }
  };

  const handleModalFormChange = (type: "open" | "close", data: DayOperationsFormData) => {
    if (type === "open") {
      setOpenDayForm({
        openingCash: data.openingCash || 0,
        openedBy: data.openedBy || "",
        notes: data.notes || ""
      });
    } else {
      setCloseDayForm({
        closingCash: data.closingCash || 0,
        closedBy: data.closedBy || "",
        notes: data.notes || ""
      });
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    const numAmount = Number(amount) || 0;
    return `$${numAmount.toFixed(2)}`;
  };

  // Enhanced date/time formatting functions for consistent display
  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "Invalid Date";
      return dateObj.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    try {
      let dateObj: Date;

      // Handle date string parsing to avoid timezone issues
      if (typeof date === "string") {
        // If it's a date-only string like "2025-08-01", parse it as local date
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = date.split("-").map(Number);
          dateObj = new Date(year, month - 1, day); // month is 0-indexed
        } else {
          dateObj = new Date(date);
        }
      } else {
        dateObj = new Date(date);
      }

      if (isNaN(dateObj.getTime())) return "Invalid Date";
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (error) {
      console.error("Error formatting date:", error, "Input:", date);
      return "Invalid Date";
    }
  };

  const formatWeekday = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    try {
      let dateObj: Date;

      // Handle date string parsing to avoid timezone issues
      if (typeof date === "string") {
        // If it's a date-only string like "2025-08-01", parse it as local date
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = date.split("-").map(Number);
          dateObj = new Date(year, month - 1, day); // month is 0-indexed
        } else {
          dateObj = new Date(date);
        }
      } else {
        dateObj = new Date(date);
      }

      if (isNaN(dateObj.getTime())) return "Invalid Date";
      return dateObj.toLocaleDateString("en-US", {
        weekday: "long"
      });
    } catch (error) {
      console.error("Error formatting weekday:", error, "Input:", date);
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading day operations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* Alerts */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start sm:items-center">
          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
          <span className="text-red-700 text-sm sm:text-base flex-1">{error}</span>
          <button onClick={() => setError(null)} className="ml-2 sm:ml-auto text-red-500 hover:text-red-700 text-lg sm:text-xl">
            ×
          </button>
        </div>
      )}

      {reportError && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start sm:items-center">
          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
          <span className="text-red-700 text-sm sm:text-base flex-1">{reportError}</span>
          <button onClick={() => setReportError(null)} className="ml-2 sm:ml-auto text-red-500 hover:text-red-700 text-lg sm:text-xl">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex items-start sm:items-center">
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
          <span className="text-green-700 text-sm sm:text-base flex-1">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-2 sm:ml-auto text-green-500 hover:text-green-700 text-lg sm:text-xl">
            ×
          </button>
        </div>
      )}

      {/* Current Day Status */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10 lg:mb-12">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Current Day Status</h2>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">
                    {formatWeekday(currentTime)}, {formatDate(currentTime)}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <div className="text-xs sm:text-sm text-gray-500">Current Time</div>
                <div className="text-base sm:text-lg font-bold text-gray-900">{currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">{formatDate(currentTime)}</div>
              </div>
            </div>

            {currentDay ? (
              <div className="space-y-6">
                {currentDay.status === "opened" ? (
                  <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
                    <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-green-100 rounded-full -mr-10 -mt-10 sm:-mr-16 sm:-mt-16 opacity-50"></div>
                    <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
                        <div className="p-2 sm:p-3 lg:p-4 bg-green-100 rounded-xl sm:rounded-2xl shadow-md">
                          <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900 mb-1 sm:mb-2">Day is Open & Active</h3>
                          <p className="text-sm sm:text-base lg:text-lg text-green-700 mb-1">Opened at {formatDateTime(currentDay.openedAt)}</p>
                          <p className="text-xs sm:text-sm lg:text-base text-green-600">
                            Managed by <span className="font-semibold">{currentDay.openedBy}</span>
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setShowCloseModal(true)} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm sm:text-base lg:text-lg w-full sm:w-auto">
                        Close Day
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
                    <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gray-100 rounded-full -mr-10 -mt-10 sm:-mr-16 sm:-mt-16 opacity-50"></div>
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                      <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
                        <div className="p-2 sm:p-3 lg:p-4 bg-gray-100 rounded-xl sm:rounded-2xl shadow-md">
                          <XCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Day is Closed</h3>
                          <p className="text-sm sm:text-base lg:text-lg text-gray-700 mb-1">{currentDay.closedAt ? `Closed at ${formatDateTime(currentDay.closedAt)}` : "Day was closed"}</p>
                          <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                            {currentDay.closedBy && (
                              <span>
                                Managed by <span className="font-semibold">{currentDay.closedBy}</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setShowOpenModal(true)} className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm sm:text-base lg:text-lg w-full sm:w-auto">
                        Open New Day
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-blue-200 rounded-lg mb-3">
                        <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-700" />
                      </div>
                      <span className="text-sm sm:text-base font-medium text-blue-800 mb-2">Opening Cash</span>
                      <p className="text-xl sm:text-2xl font-bold text-blue-900">{formatCurrency(currentDay?.openingCash)}</p>
                    </div>
                  </div>

                  {/* Total Sales - conditionally shown based on toggle */}
                  {showTotalSales && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-green-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                      <div className="flex flex-col items-center text-center relative">
                        <button onClick={() => setShowTotalSales(false)} className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors" title="Show Expected Cash">
                          <ToggleRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <div className="p-3 bg-green-200 rounded-lg mb-3">
                          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-700" />
                        </div>
                        <span className="text-sm sm:text-base font-medium text-green-800 mb-2">Total Sales</span>
                        <p className="text-xl sm:text-2xl font-bold text-green-900">{formatCurrency(currentDay?.totalSales)}</p>
                      </div>
                    </div>
                  )}

                  {/* Expected Cash - conditionally shown based on toggle */}
                  {!showTotalSales && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-orange-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                      <div className="flex flex-col items-center text-center relative">
                        <button onClick={() => setShowTotalSales(true)} className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors" title="Show Total Sales">
                          <ToggleLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <div className="p-3 bg-orange-200 rounded-lg mb-3">
                          <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-700" />
                        </div>
                        <span className="text-sm sm:text-base font-medium text-orange-800 mb-2">Expected Cash</span>
                        <p className="text-xl sm:text-2xl font-bold text-orange-900">{formatCurrency(currentDay?.expectedCash)}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-purple-200 rounded-lg mb-3">
                        <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-700" />
                      </div>
                      <span className="text-sm sm:text-base font-medium text-purple-800 mb-2">Transactions</span>
                      <p className="text-xl sm:text-2xl font-bold text-purple-900">{currentDay?.totalTransactions || 0}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 sm:p-6 rounded-2xl shadow-lg border border-red-200 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-red-200 rounded-lg mb-3">
                        <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-red-700" />
                      </div>
                      <span className="text-sm sm:text-base font-medium text-red-800 mb-2">Cash Variance</span>
                      <p className="text-xl sm:text-2xl font-bold text-red-900">{formatCurrency(currentDay?.status === "closed" ? currentDay?.cashVariance : (currentDay?.expectedCash || 0) - (currentDay?.openingCash || 0))}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 lg:py-16">
                <div className="p-4 sm:p-6 bg-gray-100 rounded-full w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto mb-6 sm:mb-8 flex items-center justify-center">
                  <XCircle className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-gray-400" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">No Day Operation Active</h3>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">Start a new day to begin tracking sales and operations</p>
                <button
                  onClick={() => setShowOpenModal(true)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setShowOpenModal(true);
                    }
                  }}
                  className="bg-gradient-to-r from-[#4682b4] to-[#6ba4d3] text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center mx-auto text-base sm:text-lg font-semibold"
                >
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                  Open Day
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Days */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Day Operations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Transactions</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Cash Variance</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDays.map(day => (
                <tr key={day.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    <div>
                      <div className="font-bold">{formatWeekday(day.date)}</div>
                      <div className="text-xs text-gray-500">{formatDate(day.date)}</div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${day.status === "opened" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{day.status}</span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{formatCurrency(day.totalSales)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">{day.totalTransactions}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm hidden md:table-cell">
                    <span className={`${day.cashVariance === 0 ? "text-gray-900" : day.cashVariance > 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(day.cashVariance)}</span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">{day.autoReportGenerated && <ViewReportButton date={day.date} onClick={handleViewReport} loading={reportLoading} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Day Modal */}
      <DayOperationsModal 
        open={showOpenModal} 
        onOpenChange={setShowOpenModal} 
        onSubmit={handleOpenDay} 
        type="open" 
        formData={convertToModalFormData("open")} 
        onFormChange={data => handleModalFormChange("open", data)} 
        isLoading={actionLoading} 
        formatCurrency={formatCurrency} 
      />

      {/* Close Day Modal */}
      <DayOperationsModal 
        open={showCloseModal} 
        onOpenChange={setShowCloseModal} 
        onSubmit={handleCloseDay} 
        type="close" 
        formData={convertToModalFormData("close")} 
        onFormChange={data => handleModalFormChange("close", data)} 
        isLoading={actionLoading} 
        currentDay={currentDay} 
        formatCurrency={formatCurrency} 
      />

      {/* Daily Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Daily Report - {selectedReport.date}</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl">
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Sales Summary */}
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2 sm:mb-3 text-sm sm:text-base">Sales Summary</h4>
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm">
                    <span className="text-green-700">Total Sales:</span>
                    <span className="font-medium ml-2">{formatCurrency(selectedReport.sales.totalAmount)}</span>
                  </p>
                  <p className="text-xs sm:text-sm">
                    <span className="text-green-700">Transactions:</span>
                    <span className="font-medium ml-2">{selectedReport.sales.totalTransactions}</span>
                  </p>
                  <p className="text-xs sm:text-sm">
                    <span className="text-green-700">Average Ticket:</span>
                    <span className="font-medium ml-2">{formatCurrency(selectedReport.sales.averageTicket)}</span>
                  </p>
                </div>
              </div>

              {/* Cash Summary */}
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">Cash Summary</h4>
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm">
                    <span className="text-blue-700">Opening:</span>
                    <span className="font-medium ml-2">{formatCurrency(selectedReport.cash.opening)}</span>
                  </p>
                  <p className="text-xs sm:text-sm">
                    <span className="text-blue-700">Expected:</span>
                    <span className="font-medium ml-2">{formatCurrency(selectedReport.cash.expected)}</span>
                  </p>
                  <p className="text-xs sm:text-sm">
                    <span className="text-blue-700">Actual:</span>
                    <span className="font-medium ml-2">{formatCurrency(selectedReport.cash.actual)}</span>
                  </p>
                  <p className="text-xs sm:text-sm">
                    <span className="text-blue-700">Variance:</span>
                    <span className={`font-medium ml-2 ${selectedReport.cash.variance >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(selectedReport.cash.variance)}</span>
                  </p>
                </div>
              </div>

              {/* Inventory Summary */}
              <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2 sm:mb-3 text-sm sm:text-base">Inventory Summary</h4>
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm">
                    <span className="text-orange-700">Total Variances:</span>
                    <span className="font-medium ml-2">{selectedReport.inventory.totalVariances}</span>
                  </p>
                  <p className="text-xs sm:text-sm">
                    <span className="text-orange-700">Gains:</span>
                    <span className="font-medium ml-2 text-green-600">{selectedReport.inventory.gains}</span>
                  </p>
                  <p className="text-xs sm:text-sm">
                    <span className="text-orange-700">Losses:</span>
                    <span className="font-medium ml-2 text-red-600">{selectedReport.inventory.losses}</span>
                  </p>
                  <p className="text-xs sm:text-sm">
                    <span className="text-orange-700">Operational Hours:</span>
                    <span className="font-medium ml-2">{selectedReport.operationalHours.toFixed(1)}h</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 text-center">
              <button onClick={() => setShowReportModal(false)} className="px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base">
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Reports Modal */}
      <DailyReports showReportModal={showReportModal} setShowReportModal={setShowReportModal} selectedReport={selectedReport} error={reportError} setError={setReportError} />
    </div>
  );
};

export default DayOperationsPage;
