import React from "react";
import { DailyReportsModalProps, DailyReportsProps } from "../../types/inventory";

const DailyReports: React.FC<DailyReportsProps & DailyReportsModalProps> = ({ className = "", showReportModal, setShowReportModal, selectedReport, error, setError }) => {
  const formatCurrency = (amount: number | null | undefined) => {
    const numAmount = Number(amount) || 0;
    return `$${numAmount.toFixed(2)}`;
  };

  return (
    <div className={className}>
      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 float-right">
            ×
          </button>
        </div>
      )}

      {/* Daily Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Daily Report - {selectedReport.date}</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
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

            {/* Sales by Section */}
            {selectedReport.sales.salesBySection && Object.keys(selectedReport.sales.salesBySection).length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Sales by Section</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(selectedReport.sales.salesBySection).map(([sectionName, sectionData]) => (
                    <div key={sectionName} className="bg-gray-50 p-3 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2">{sectionName}</h5>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          Transactions: <span className="font-medium">{sectionData.count}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Total: <span className="font-medium">{formatCurrency(sectionData.total)}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Average: <span className="font-medium">{formatCurrency(sectionData.total / sectionData.count)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Generation Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Report Generated:</span> {new Date(selectedReport.generatedAt).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Operational Hours:</span> {selectedReport.operationalHours.toFixed(1)} hours
              </p>
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

export default DailyReports;
