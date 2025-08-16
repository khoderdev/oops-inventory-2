import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DayOperationReport } from "@/types/inventory";
import { dayOperationReportsAPI } from "@/api/dayOperationReports.api";
import { ChevronDown, ChevronUp, FileText, DollarSign, BarChart2, Package } from "lucide-react";

export interface DayOperationReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId?: number;
  dayOperationId?: number;
  onReportUpdated?: () => void;
}

const DayOperationReportModal: React.FC<DayOperationReportModalProps> = ({
  open,
  onOpenChange,
  reportId,
  dayOperationId,
  onReportUpdated
}) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [report, setReport] = useState<DayOperationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);

  // Format currency helper
  const formatCurrency = (amount: number | null | undefined) => {
    const numAmount = Number(amount) || 0;
    return `$${numAmount.toFixed(2)}`;
  };

  // Format percentage helper
  const formatPercentage = (value: number | null | undefined) => {
    const numValue = Number(value) || 0;
    return `${numValue.toFixed(1)}%`;
  };

  // Load report data
  useEffect(() => {
    const fetchReport = async () => {
      if (!open) return;
      
      setLoading(true);
      setError(null);
      
      try {
        if (reportId) {
          // Fetch existing report
          const response = await dayOperationReportsAPI.getReportById(reportId);
          setReport(response.report);
          setNotes(response.report.notes || "");
        } else if (dayOperationId) {
          // Check if there's an existing report for this day operation
          const response = await dayOperationReportsAPI.getReportsByDayOperation(dayOperationId);
          if (response.reports && response.reports.length > 0) {
            // Use the most recent report
            const latestReport = response.reports.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
            setReport(latestReport);
            setNotes(latestReport.notes || "");
          } else {
            // No report exists, we'll need to generate one
            setReport(null);
          }
        }
      } catch (err) {
        setError("Failed to load report data");
        console.error("Error loading report:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [open, reportId, dayOperationId]);

  // Generate a new report
  const handleGenerateReport = async () => {
    if (!dayOperationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await dayOperationReportsAPI.generateReport(dayOperationId);
      setReport(response.report);
      setNotes(response.report.notes || "");
      if (onReportUpdated) onReportUpdated();
    } catch (err) {
      setError("Failed to generate report");
      console.error("Error generating report:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update report notes
  const handleUpdateNotes = async () => {
    if (!report) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await dayOperationReportsAPI.updateReport(report.id, { notes });
      setReport(response.report);
      setIsEditingNotes(false);
      if (onReportUpdated) onReportUpdated();
    } catch (err) {
      setError("Failed to update notes");
      console.error("Error updating notes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Finalize report
  const handleFinalizeReport = async () => {
    if (!report) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await dayOperationReportsAPI.updateReport(report.id, { reportStatus: "final" });
      setReport(response.report);
      if (onReportUpdated) onReportUpdated();
    } catch (err) {
      setError("Failed to finalize report");
      console.error("Error finalizing report:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete report (only drafts can be deleted)
  const handleDeleteReport = async () => {
    if (!report || report.reportStatus !== "draft") return;
    
    setLoading(true);
    setError(null);
    
    try {
      await dayOperationReportsAPI.deleteReport(report.id);
      onOpenChange(false);
      if (onReportUpdated) onReportUpdated();
    } catch (err) {
      setError("Failed to delete report");
      console.error("Error deleting report:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {report ? (
                <>
                  Day Operation Report
                  <Badge className="ml-2" variant={
                    report.reportStatus === "draft" ? "outline" : 
                    report.reportStatus === "final" ? "default" : "secondary"
                  }>
                    {report.reportStatus}
                  </Badge>
                </>
              ) : "Generate Day Operation Report"}
            </span>
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 float-right">
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading report data...</p>
          </div>
        ) : !report && dayOperationId ? (
          <div className="py-8 text-center">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="mb-6 text-gray-600">No report has been generated for this day operation yet.</p>
            <Button onClick={handleGenerateReport}>Generate Report</Button>
          </div>
        ) : report && (
          <>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sales Summary Card */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                        Sales Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Total Sales:</dt>
                          <dd className="text-sm font-medium">{formatCurrency(report.salesSummary.totalAmount)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Transactions:</dt>
                          <dd className="text-sm font-medium">{report.salesSummary.totalTransactions}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Average Ticket:</dt>
                          <dd className="text-sm font-medium">{formatCurrency(report.salesSummary.averageTicket)}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>

                  {/* Cash Summary Card */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <BarChart2 className="h-5 w-5 mr-2 text-blue-600" />
                        Cash Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Opening:</dt>
                          <dd className="text-sm font-medium">{formatCurrency(report.cashSummary.opening)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Closing:</dt>
                          <dd className="text-sm font-medium">{formatCurrency(report.cashSummary.closing)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Variance:</dt>
                          <dd className={`text-sm font-medium ${report.cashSummary.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(report.cashSummary.variance)}
                          </dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>

                  {/* Inventory Summary Card */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Package className="h-5 w-5 mr-2 text-orange-600" />
                        Inventory Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Total Items:</dt>
                          <dd className="text-sm font-medium">{report.inventorySummary.totalItems}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Total Value:</dt>
                          <dd className="text-sm font-medium">{formatCurrency(report.inventorySummary.totalValue)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Variances:</dt>
                          <dd className="text-sm font-medium">{report.inventorySummary.totalVariances}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                </div>

                {/* Notes Section */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Notes</span>
                      {!isEditingNotes ? (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(true)}>
                          Edit
                        </Button>
                      ) : (
                        <div className="space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setIsEditingNotes(false);
                            setNotes(report.notes || "");
                          }}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleUpdateNotes}>
                            Save
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditingNotes ? (
                      <Textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about this report..."
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm text-gray-700">
                        {report.notes || "No notes added for this report."}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Report Info */}
                <Card>
                  <CardContent className="pt-4">
                    <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <dt className="text-gray-500">Report Date:</dt>
                        <dd className="font-medium">{report.reportDate}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Report Type:</dt>
                        <dd className="font-medium capitalize">{report.reportType}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Generated By:</dt>
                        <dd className="font-medium">{report.generatedBy}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Generated At:</dt>
                        <dd className="font-medium">{new Date(report.generatedAt).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Status:</dt>
                        <dd className="font-medium capitalize">{report.reportStatus}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Additional tabs would be implemented here */}
              <TabsContent value="sales">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Details</CardTitle>
                    <CardDescription>Detailed breakdown of sales data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Sales by category */}
                    {report.salesByCategory && Object.keys(report.salesByCategory).length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium mb-2">Sales by Category</h4>
                        <div className="space-y-2">
                          {Object.entries(report.salesByCategory).map(([category, data]) => (
                            <div key={category} className="flex justify-between items-center">
                              <span className="text-sm">{category}</span>
                              <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-500">{data.count} items</span>
                                <span className="text-sm font-medium">{formatCurrency(data.total)}</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{formatPercentage(data.percentage)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sales by section */}
                    {report.salesBySection && Object.keys(report.salesBySection).length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium mb-2">Sales by Section</h4>
                        <div className="space-y-2">
                          {Object.entries(report.salesBySection).map(([section, data]) => (
                            <div key={section} className="flex justify-between items-center">
                              <span className="text-sm">{section}</span>
                              <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-500">{data.count} items</span>
                                <span className="text-sm font-medium">{formatCurrency(data.total)}</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{formatPercentage(data.percentage)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top selling items */}
                    {report.topSellingItems && report.topSellingItems.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Top Selling Items</h4>
                        <div className="space-y-2">
                          {report.topSellingItems.map((item, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm">{item.name}</span>
                              <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-500">{item.quantity} sold</span>
                                <span className="text-sm font-medium">{formatCurrency(item.revenue)}</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{formatPercentage(item.profitMargin)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inventory">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Details</CardTitle>
                    <CardDescription>Stock movements and variances</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Stock movements */}
                    {report.stockMovements && report.stockMovements.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium mb-2">Stock Movements</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Material</th>
                                <th className="text-right py-2">Start</th>
                                <th className="text-right py-2">End</th>
                                <th className="text-right py-2">Consumed</th>
                                <th className="text-right py-2">Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.stockMovements.map((movement, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-2">{movement.materialName}</td>
                                  <td className="text-right py-2">{movement.startQuantity} {movement.unit}</td>
                                  <td className="text-right py-2">{movement.endQuantity} {movement.unit}</td>
                                  <td className="text-right py-2">{movement.consumed} {movement.unit}</td>
                                  <td className="text-right py-2">{formatCurrency(movement.totalCost)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Significant variances */}
                    {report.significantVariances && report.significantVariances.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Significant Variances</h4>
                        <div className="space-y-2">
                          {report.significantVariances.map((variance, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm">{variance.materialName}</span>
                              <div className="flex items-center space-x-4">
                                <span className={`text-sm ${variance.variance > 0 ? "text-green-600" : "text-red-600"}`}>
                                  {variance.variance > 0 ? "+" : ""}{variance.variance} {variance.unit}
                                </span>
                                <span className="text-sm font-medium">{formatCurrency(variance.cost)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Report Details</CardTitle>
                    <CardDescription>Additional information and metadata</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-gray-500">Report ID:</dt>
                        <dd className="font-medium">{report.id}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Day Operation ID:</dt>
                        <dd className="font-medium">{report.dayOperationId}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Created At:</dt>
                        <dd className="font-medium">{new Date(report.createdAt).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Last Updated:</dt>
                        <dd className="font-medium">{new Date(report.updatedAt).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Report Status:</dt>
                        <dd className="font-medium capitalize">{report.reportStatus}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Report Type:</dt>
                        <dd className="font-medium capitalize">{report.reportType}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {report && report.reportStatus === "draft" && (
              <Button variant="destructive" onClick={handleDeleteReport} disabled={loading}>
                Delete Draft
              </Button>
            )}
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {report && report.reportStatus === "draft" && (
              <Button onClick={handleFinalizeReport} disabled={loading}>
                Finalize Report
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DayOperationReportModal;
