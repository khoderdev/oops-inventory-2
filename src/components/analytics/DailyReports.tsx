import React from "react";
import { dayOperationReportsAPI } from "@/api/dayOperationReports.api";
import { DailyReportsModalProps, DailyReportsProps } from "@/types/dayOperations";

const DailyReports: React.FC<DailyReportsProps & DailyReportsModalProps> = ({ className = "", showReportModal, setShowReportModal, selectedReport, error, setError }) => {
  const formatCurrency = (amount: number | null | undefined) => {
    const numAmount = Number(amount) || 0;
    return `$${numAmount.toFixed(2)}`;
  };

  const formatDate = (value: any) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return String(value);
    }
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const formatDateTime = (value: any) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return String(value);
    }
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hours24 = d.getHours();
    const meridiem = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const hh = String(hours12).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}-${mm}-${yyyy} ${hh}:${min} ${meridiem}`;
  };

  // Normalize per-item sales data for display (prefer topSellingItems, fallback to salesSummary.topItems)
  type ItemSales = { name: string; quantity: number; revenue: number };
  const itemSales: ItemSales[] = React.useMemo(() => {
    const items: ItemSales[] =
      selectedReport?.topSellingItems && selectedReport.topSellingItems.length > 0
        ? selectedReport.topSellingItems.map(i => ({
            name: i.name,
            quantity: i.quantity,
            revenue: i.revenue
          }))
        : (selectedReport?.salesSummary?.topItems as ItemSales[]) || [];
    return [...items].sort((a, b) => (Number(b.revenue) || 0) - (Number(a.revenue) || 0));
  }, [selectedReport]);

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

      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md w-full max-w-md max-h-[90vh] font-mono text-xs text-gray-800 shadow-lg flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white p-4 border-b">
              <div className="text-center">
                <h3 className="text-sm font-bold tracking-wide">DAILY REPORT</h3>
                <p className="text-[11px] mt-1">{formatDate(selectedReport.reportDate || (selectedReport as any).date)}</p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="px-4 overflow-y-auto flex-1">
              {/* Sales Summary */}
              <div className="mt-3">
                <p className="uppercase text-[11px] tracking-wider text-gray-700">Sales Summary</p>
                <div className="border-t border-dashed border-gray-300 my-1" />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Total Sales</span>
                    <span className="tabular-nums font-semibold">{formatCurrency(selectedReport.salesSummary?.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transactions</span>
                    <span className="tabular-nums">{selectedReport.salesSummary?.totalTransactions ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Ticket</span>
                    <span className="tabular-nums">{formatCurrency(selectedReport.salesSummary?.averageTicket)}</span>
                  </div>
                </div>
              </div>

              {itemSales && itemSales.length > 0 && (
                <div className="mt-4">
                  <p className="uppercase text-[11px] tracking-wider text-gray-700">Sales by Item</p>
                  <div className="border-t border-dashed border-gray-300 my-1" />
                  <div className="space-y-1">
                    {itemSales.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between font-medium">
                          <span className="truncate">{`${item.name} x${item.quantity}`}</span>
                          <span className="tabular-nums">{formatCurrency(item.revenue)}</span>
                        </div>
                        <div className="border-t border-dashed border-gray-200 my-1" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Cash Summary */}
              <div className="mt-3">
                <p className="uppercase text-[11px] tracking-wider text-gray-700">Cash Summary</p>
                <div className="border-t border-dashed border-gray-300 my-1" />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Opening</span>
                    <span className="tabular-nums">{formatCurrency(selectedReport.cashSummary?.opening)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected</span>
                    <span className="tabular-nums">{formatCurrency(selectedReport.cashSummary?.expected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Actual</span>
                    <span className="tabular-nums">{formatCurrency(selectedReport.cashSummary?.closing)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variance</span>
                    <span className={`tabular-nums ${selectedReport.cashSummary?.variance >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency(selectedReport.cashSummary?.variance)}</span>
                  </div>
                  {/* User-specific Reports */}
                  {selectedReport.userReports && selectedReport.userReports.length > 0 && (
                    <div className="mt-4">
                      <p className="uppercase text-[11px] tracking-wider text-gray-700">Staff Summary</p>
                      <div className="border-t border-dashed border-gray-300 my-1" />
                      <div className="space-y-2">
                        {selectedReport.userReports.map((userReport, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between">
                              <span>{userReport.userName}</span>
                              <span className={`tabular-nums ${userReport.variance >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency(userReport.variance)}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span>Open</span>
                              <span className="tabular-nums">{formatCurrency(userReport.openingCash)}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span>Expected</span>
                              <span className="tabular-nums">{formatCurrency(userReport.expectedClosingCash)}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span>Actual</span>
                              <span className="tabular-nums">{formatCurrency(userReport.closingCash)}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span>Orders</span>
                              <span className="tabular-nums">{userReport.orderCount}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span>Sales</span>
                              <span className="tabular-nums">{formatCurrency(userReport.totalAmount)}</span>
                            </div>
                            <div className="border-t border-dashed border-gray-200 my-2" />
                          </div>
                        ))}
                      </div>
                      {/* Totals */}
                      <div className="flex justify-between font-bold">
                        <span>Totals</span>
                        <span className="text-right">{formatCurrency(selectedReport.userReports.reduce((sum, u) => sum + u.totalAmount, 0))}</span>
                      </div>
                    </div>
                  )}

                  {/* Report Generation Info */}
                  <div className="mt-4">
                    <div className="border-t border-dashed border-gray-400 my-2" />
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span>Generated</span>
                        <span className="tabular-nums">{formatDateTime(selectedReport.generatedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status</span>
                        <span className="uppercase">{selectedReport.reportStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type</span>
                        <span className="uppercase">{selectedReport.reportType}</span>
                      </div>
                      {selectedReport.generatedBy && (
                        <div className="flex justify-between">
                          <span>By</span>
                          <span>{selectedReport.generatedBy}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-dashed border-gray-400 mt-2" />
                  </div>
                </div>
              </div>

              {/* Footer Actions (Sticky) */}
              <div className="sticky bottom-0 z-10 bg-white p-4 border-t flex items-center justify-center gap-2">
                <button onClick={() => setShowReportModal(false)} className="px-4 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-800">
                  Close
                </button>
                <button onClick={() => window.print()} className="px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  Print
                </button>
                <button
                  onClick={async () => {
                    try {
                      await dayOperationReportsAPI.regenerateReport((selectedReport as any).dayOperationId, "Admin User");
                      setShowReportModal(false);
                    } catch (err) {
                      setError("Failed to regenerate report");
                    }
                  }}
                  className="px-4 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700"
                >
                  Regenerate
                </button>
                {selectedReport.reportStatus === "draft" && (
                  <button
                    onClick={async () => {
                      try {
                        await dayOperationReportsAPI.updateReport(selectedReport.id, { reportStatus: "final" });
                        setShowReportModal(false);
                      } catch (err) {
                        setError("Failed to finalize report");
                      }
                    }}
                    className="px-4 py-1.5 bg-green-700 text-white rounded hover:bg-green-800"
                  >
                    Finalize
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReports;
