import { BarChart3, Calendar, CheckCircle, Clock, DollarSign, FileText, Home, Minus, Plus, TrendingUp, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { closeDay, getCurrentDayActivities, getCurrentDayOperation, getDailyReport, getDayOperations, openDay } from "../api/dayOperations.api";
import { ActivityLog, CloseDayRequest, DailyReportData, DayOperation, OpenDayRequest } from "../types/inventory";

const DayOperationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentDay, setCurrentDay] = useState<DayOperation | null>(null);
  const [recentDays, setRecentDays] = useState<DayOperation[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [openDayForm, setOpenDayForm] = useState<OpenDayRequest>({
    openingCash: 0,
    openedBy: "",
    notes: ""
  });
  const [closeDayForm, setCloseDayForm] = useState<CloseDayRequest>({
    closingCash: 0,
    closedBy: "",
    notes: ""
  });

  // Modal states
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyReportData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

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
      setSuccess(`Day opened successfully! ${response.stockItemsCaptured} stock items captured.`);
      setShowOpenModal(false);
      setOpenDayForm({ openingCash: 0, openedBy: "", notes: "" });
      await loadData();
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
      setSuccess(`Day closed successfully! Total sales: $${response.summary?.totalSales.toFixed(2)}`);
      setShowCloseModal(false);
      setCloseDayForm({ closingCash: 0, closedBy: "", notes: "" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close day");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewReport = async (date: string) => {
    try {
      const reportResponse = await getDailyReport(date);
      setSelectedReport(reportResponse.report);
      setShowReportModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load daily report");
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
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Day Operations</h1>
        <p className="text-gray-600">Manage daily business operations, cash handling, and automated reporting</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Current Day Status</h2>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-600">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {currentDay ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium text-green-900">Day is Open</p>
                      <p className="text-sm text-green-700">
                        Opened at {formatDateTime(currentDay.openedAt)} by {currentDay.openedBy}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowCloseModal(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                    Close Day
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm text-blue-700">Opening Cash</span>
                    </div>
                    <p className="text-lg font-semibold text-blue-900">{formatCurrency(currentDay?.openingCash)}</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm text-green-700">Total Sales</span>
                    </div>
                    <p className="text-lg font-semibold text-green-900">{formatCurrency(currentDay?.totalSales)}</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-sm text-purple-700">Transactions</span>
                    </div>
                    <p className="text-lg font-semibold text-purple-900">{currentDay?.totalTransactions || 0}</p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="text-sm text-orange-700">Expected Cash</span>
                    </div>
                    <p className="text-lg font-semibold text-orange-900">{formatCurrency(currentDay?.expectedCash)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Day Operation Active</h3>
                <p className="text-gray-600 mb-4">Start a new day to begin tracking sales and operations</p>
                <button onClick={() => setShowOpenModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Open Day
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {!currentDay && (
                <button onClick={() => setShowOpenModal(true)} className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Open Day
                </button>
              )}
              {currentDay && (
                <button onClick={() => setShowCloseModal(true)} className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center">
                  <Minus className="h-4 w-4 mr-2" />
                  Close Day
                </button>
              )}
              <button onClick={loadData} className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                Refresh Data
              </button>
            </div>
          </div>

          {/* Activity Logs - Show only when day is open */}
          {currentDay && currentDay.status === "opened" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activities</h3>
              <div className="max-h-64 overflow-y-auto">
                {activities.length > 0 ? (
                  <div className="space-y-2">
                    {activities.slice(0, 10).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${activity.type === "SALE" ? "bg-green-500" : activity.type === "STOCK" ? "bg-blue-500" : activity.type === "INVENTORY" ? "bg-orange-500" : "bg-gray-500"}`}></span>
                          <span className="font-medium text-gray-700">{activity.type}</span>
                        </div>
                        <span className="text-gray-500">{new Date(activity.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                    {activities.length > 10 && <p className="text-center text-gray-500 text-sm mt-2">... and {activities.length - 10} more activities</p>}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No activities recorded yet today</p>
                )}
              </div>
            </div>
          )}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(day.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${day.status === "opened" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{day.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(day.totalSales)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.totalTransactions}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`${day.cashVariance === 0 ? "text-gray-900" : day.cashVariance > 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(day.cashVariance)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {day.autoReportGenerated && (
                      <button onClick={() => handleViewReport(day.date)} className="text-blue-600 hover:text-blue-900 flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        View Report
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Day Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Staff name"
                />
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any opening notes..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowOpenModal(false)} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={handleOpenDay} disabled={actionLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Staff name"
                />
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
              {currentDay && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">Expected Cash: {formatCurrency(currentDay.expectedCash)}</p>
                  <p className="text-sm text-blue-700">Variance: {formatCurrency(closeDayForm.closingCash - currentDay.expectedCash)}</p>
                </div>
              )}
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
    </div>
  );
};

export default DayOperationsPage;
