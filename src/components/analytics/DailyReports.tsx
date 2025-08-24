import React from "react";
import { dayOperationReportsAPI } from "@/api/dayOperationReports.api";
import { DailyReportsModalProps, DailyReportsProps } from "@/types/dayOperations";

const DailyReports: React.FC<DailyReportsProps & DailyReportsModalProps> = ({ className = "", showReportModal, setShowReportModal, selectedReport, error, setError }) => {
  const formatCurrency = (amount: number | null | undefined) => {
    const numAmount = Number(amount) || 0;
    return `$${numAmount.toFixed(2)}`;
  };

  // Normalize per-item sales data for display (prefer topSellingItems, fallback to salesSummary.topItems)
  type ItemSales = { name: string; quantity: number; revenue: number };
  const itemSales: ItemSales[] = React.useMemo(() => {
    const items: ItemSales[] = selectedReport?.topSellingItems && selectedReport.topSellingItems.length > 0 ? selectedReport.topSellingItems.map(i => ({ name: i.name, quantity: i.quantity, revenue: i.revenue })) : (selectedReport?.salesSummary?.topItems as ItemSales[]) || [];
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

      {/* Daily Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-4 w-full max-w-md max-h-[90vh] overflow-y-auto font-mono text-xs text-gray-800 shadow-lg">
            {/* Header */}
            <div className="text-center">
              <h3 className="text-sm font-bold tracking-wide">DAILY REPORT</h3>
              <p className="text-[11px] mt-1">{selectedReport.reportDate || (selectedReport as any).date}</p>
              <div className="border-t border-dashed border-gray-400 mt-2" />
            </div>

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

            {/* Sales by Item */}
            {itemSales && itemSales.length > 0 && (
              <div className="mt-4">
                <p className="uppercase text-[11px] tracking-wider text-gray-700">Sales by Item</p>
                <div className="border-t border-dashed border-gray-300 my-1" />
                <div className="space-y-1">
                  {itemSales.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between font-medium">
                        <span className="truncate">{`${item.name} X${item.quantity}`}</span>
                        <span className="tabular-nums">{formatCurrency(item.revenue)}</span>
                      </div>
                      <div className="border-t border-dashed border-gray-200 my-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No item sales placeholder */}
            {(!itemSales || itemSales.length === 0) && (
              <div className="mt-4">
                <p className="uppercase text-[11px] tracking-wider text-gray-700">Sales by Item</p>
                <div className="border-t border-dashed border-gray-300 my-1" />
                <p className="text-gray-500 text-[11px]">No item sales recorded for this day.</p>
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
                  <span className={`tabular-nums font-semibold ${(selectedReport.cashSummary?.variance ?? 0) >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency(selectedReport.cashSummary?.variance)}</span>
                </div>
              </div>
            </div>

            {/* Inventory Summary */}
            <div className="mt-3">
              <p className="uppercase text-[11px] tracking-wider text-gray-700">Inventory Summary</p>
              <div className="border-t border-dashed border-gray-300 my-1" />
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Total Variances</span>
                  <span className="tabular-nums">{selectedReport.inventorySummary?.totalVariances ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gains</span>
                  <span className="tabular-nums text-green-700">{selectedReport.inventorySummary?.gains ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Losses</span>
                  <span className="tabular-nums text-red-700">{selectedReport.inventorySummary?.losses ?? 0}</span>
                </div>
              </div>
            </div>

            {/* User-specific Reports */}
            {selectedReport.userReports && selectedReport.userReports.length > 0 && (
              <div className="mt-4">
                <p className="uppercase text-[11px] tracking-wider text-gray-700">Staff Summary</p>
                <div className="border-t border-dashed border-gray-300 my-1" />
                <div className="space-y-2">
                  {selectedReport.userReports.map((userReport, index) => (
                    <div key={index}>
                      <div className="flex justify-between font-semibold">
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

            {/* Sales by Section */}
            {selectedReport.salesBySection && Object.keys(selectedReport.salesBySection).length > 0 && (
              <div className="mt-4">
                <p className="uppercase text-[11px] tracking-wider text-gray-700">Sales by Section</p>
                <div className="border-t border-dashed border-gray-300 my-1" />
                <div className="space-y-1">
                  {Object.entries(selectedReport.salesBySection).map(([sectionName, sectionData]) => (
                    <div key={sectionName}>
                      <div className="flex justify-between font-medium">
                        <span>{sectionName}</span>
                        <span className="tabular-nums">{formatCurrency(sectionData.total)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Tx</span>
                        <span className="tabular-nums">{sectionData.count}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>%</span>
                        <span className="tabular-nums">{((sectionData.percentage || 0) as number).toFixed(1)}%</span>
                      </div>
                      <div className="border-t border-dashed border-gray-200 my-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Generation Info */}
            <div className="mt-4">
              <div className="border-t border-dashed border-gray-400 my-2" />
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Generated</span>
                  <span className="tabular-nums">{selectedReport.generatedAt ? new Date(selectedReport.generatedAt).toLocaleString() : "-"}</span>
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

            {/* Actions */}
            <div className="mt-4 flex items-center justify-center gap-2">
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
      )}
    </div>
  );
};

export default DailyReports;
