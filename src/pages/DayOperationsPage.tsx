import { BarChart3, Calendar, CheckCircle, Clock, DollarSign, Home, Plus, ToggleLeft, ToggleRight, TrendingUp, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { closeDay, getCurrentDayActivities, getCurrentDayOperation, getDayOperations, openDay } from "../api/dayOperations.api";
import DailyReports from "../components/analytics/DailyReports";
import ViewReportButton from "../components/ui/ViewReportButton";
import { useAuth } from "../contexts/AuthContext";
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

  const formatCurrency = (amount: number | null | undefined) => {
    const numAmount = Number(amount) || 0;
    return `$${numAmount.toFixed(2)}`;
  };
  const formatDateTime = (date: Date | string) => new Date(date).toLocaleString();

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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Navigation Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/")} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <Home className="h-5 w-5 mr-2" />
            Home
          </button>
          <span className="text-gray-400">•</span>
          <button onClick={() => navigate("/sales-history")} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <BarChart3 className="h-5 w-5 mr-2" />
            Sales History
          </button>
          <span className="text-gray-400">•</span>
        </div>
        <button onClick={() => navigate("/pos")} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <BarChart3 className="h-5 w-5 mr-2" />
          POS Client
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <XCircle className="h-5 w-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {reportError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <XCircle className="h-5 w-5 text-red-500 mr-3" />
          <span className="text-red-700">{reportError}</span>
          <button onClick={() => setReportError(null)} className="ml-auto text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
          <span className="text-green-700">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">
            ×
          </button>
        </div>
      )}

      {/* Current Day Status */}
      <div className="grid grid-cols-1 gap-8 mb-12">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Current Day Status</h2>
                  <p className="text-lg text-gray-600 mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Today</div>
                <div className="text-2xl font-bold text-gray-900">{new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {currentDay ? (
              <div className="space-y-6">
                {currentDay.status === "opened" ? (
                  <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                    <div className="relative lg:w-2/3 lg:mx-auto flex flex-col lg:flex-row gap-6 items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="p-4 bg-green-100 rounded-2xl shadow-md">
                          <CheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-green-900 mb-2">Day is Open & Active</h3>
                          <p className="text-lg text-green-700 mb-1">Opened at {formatDateTime(currentDay.openedAt)}</p>
                          <p className="text-base text-green-600">
                            Managed by <span className="font-semibold">{currentDay.openedBy}</span>
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setShowCloseModal(true)} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg">
                        Close Day
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="p-4 bg-gray-100 rounded-2xl shadow-md">
                          <XCircle className="h-12 w-12 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">Day is Closed</h3>
                          <p className="text-lg text-gray-700 mb-1">{currentDay.closedAt ? `Closed at ${formatDateTime(currentDay.closedAt)}` : "Day was closed"}</p>
                          <p className="text-base text-gray-600">
                            {currentDay.closedBy && (
                              <span>
                                Managed by <span className="font-semibold">{currentDay.closedBy}</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setShowOpenModal(true)} className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg">
                        Open New Day
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
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
              <div className="text-center py-16">
                <div className="p-6 bg-gray-100 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                  <XCircle className="h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">No Day Operation Active</h3>
                <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">Start a new day to begin tracking sales and operations</p>
                <button
                  onClick={() => setShowOpenModal(true)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setShowOpenModal(true);
                    }
                  }}
                  className="bg-gradient-to-r from-[#4682b4] to-[#6ba4d3] text-white px-10 py-4 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center mx-auto text-lg font-semibold"
                >
                  <Plus className="h-6 w-6 mr-3" />
                  Open Day
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Days */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Day Operations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Variance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDays.map(day => (
                <tr key={day.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-bold">{new Date(day.date).toLocaleDateString("en-US", { weekday: "long" })}</div>
                      <div className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${day.status === "opened" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{day.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(day.totalSales)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.totalTransactions}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`${day.cashVariance === 0 ? "text-gray-900" : day.cashVariance > 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(day.cashVariance)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{day.autoReportGenerated && <ViewReportButton date={day.date} onClick={handleViewReport} loading={reportLoading} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Day Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onKeyDown={e => {
              if (e.key === "Enter" && !actionLoading) {
                e.preventDefault();
                handleOpenDay();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setShowOpenModal(false);
              }
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Open New Day</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Cash Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={openDayForm.openingCash}
                  onChange={e =>
                    setOpenDayForm({
                      ...openDayForm,
                      openingCash: parseFloat(e.target.value) || 0
                    })
                  }
                  onKeyDown={e => {
                    if (e.key === "Enter" && !actionLoading) {
                      e.preventDefault();
                      handleOpenDay();
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opened By</label>
                <input
                  type="text"
                  value={openDayForm.openedBy}
                  onChange={e =>
                    setOpenDayForm({
                      ...openDayForm,
                      openedBy: e.target.value
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  placeholder="Staff name"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Automatically detected from logged-in user</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={openDayForm.notes}
                  onChange={e =>
                    setOpenDayForm({
                      ...openDayForm,
                      notes: e.target.value
                    })
                  }
                  onKeyDown={e => {
                    if (e.key === "Enter" && e.ctrlKey && !actionLoading) {
                      e.preventDefault();
                      handleOpenDay();
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any opening notes... (Ctrl+Enter to submit)"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowOpenModal(false)} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleOpenDay}
                disabled={actionLoading}
                onKeyDown={e => {
                  if (e.key === "Enter" && !actionLoading) {
                    e.preventDefault();
                    handleOpenDay();
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Opening..." : "Open Day"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Day Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Close Current Day</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Closing Cash Amount *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    value={closeDayForm.closingCash}
                    onChange={e =>
                      setCloseDayForm({
                        ...closeDayForm,
                        closingCash: parseFloat(e.target.value) || 0
                      })
                    }
                    className=" border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                    autoFocus
                  />
                  {currentDay && (
                    <button
                      type="button"
                      onClick={() => {
                        setCloseDayForm({
                          ...closeDayForm,
                          closingCash: currentDay.expectedCash || 0
                        });
                      }}
                      className="w-full px-3 py-2 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium whitespace-nowrap"
                      title="Click to use expected cash amount"
                    >
                      Expected: {formatCurrency(currentDay.expectedCash)}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closed By</label>
                <input
                  type="text"
                  value={closeDayForm.closedBy}
                  onChange={e =>
                    setCloseDayForm({
                      ...closeDayForm,
                      closedBy: e.target.value
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  placeholder="Staff name"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Automatically detected from logged-in user</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closing Notes (Optional)</label>
                <textarea
                  value={closeDayForm.notes}
                  onChange={e =>
                    setCloseDayForm({
                      ...closeDayForm,
                      notes: e.target.value
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any closing notes..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowCloseModal(false)} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={handleCloseDay} disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                {actionLoading ? "Closing..." : "Close Day"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Daily Report - {selectedReport.date}</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sales Summary */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-3">Sales Summary</h4>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-green-700">Total Sales:</span>
                    <span className="font-medium ml-2">{formatCurrency(selectedReport.sales.totalAmount)}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-green-700">Transactions:</span>
                    <span className="font-medium ml-2">{selectedReport.sales.totalTransactions}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-green-700">Average Ticket:</span>
                    <span className="font-medium ml-2">{formatCurrency(selectedReport.sales.averageTicket)}</span>
                  </p>
                </div>
              </div>

              {/* Cash Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">Cash Summary</h4>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-blue-700">Opening:</span>
                    <span className="font-medium ml-2">{formatCurrency(selectedReport.cash.opening)}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-blue-700">Expected:</span>
                    <span className="font-medium ml-2">{formatCurrency(selectedReport.cash.expected)}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-blue-700">Actual:</span>
                    <span className="font-medium ml-2">{formatCurrency(selectedReport.cash.actual)}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-blue-700">Variance:</span>
                    <span className={`font-medium ml-2 ${selectedReport.cash.variance >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(selectedReport.cash.variance)}</span>
                  </p>
                </div>
              </div>

              {/* Inventory Summary */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-3">Inventory Summary</h4>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-orange-700">Total Variances:</span>
                    <span className="font-medium ml-2">{selectedReport.inventory.totalVariances}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-orange-700">Gains:</span>
                    <span className="font-medium ml-2 text-green-600">{selectedReport.inventory.gains}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-orange-700">Losses:</span>
                    <span className="font-medium ml-2 text-red-600">{selectedReport.inventory.losses}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-orange-700">Operational Hours:</span>
                    <span className="font-medium ml-2">{selectedReport.operationalHours.toFixed(1)}h</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button onClick={() => setShowReportModal(false)} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
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
