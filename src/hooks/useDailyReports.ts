import { useState } from "react";
import { dayOperationReportsAPI } from "../api/dayOperationReports.api";
import { dayOperationsAPI } from "../api/dayOperations.api";
import { DayOperationReport } from "../types/inventory";


export const useDailyReports = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DayOperationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleViewReport = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get day operations for the specified date
      const dayOperations = await dayOperationsAPI.getDayOperations(1, 100);
      const dayOperation = dayOperations.items.find(op => op.date === date);
      
      if (!dayOperation || !dayOperation.id) {
        throw new Error(`No day operation found for date: ${date}`);
      }
      
      // Get reports for this day operation
      const reportsResponse = await dayOperationReportsAPI.getReportsByDayOperation(dayOperation.id);
      
      if (!reportsResponse.reports || reportsResponse.reports.length === 0) {
        throw new Error(`No reports found for day operation on ${date}`);
      }
      
      // Use the first report (typically there should be only one daily report per day operation)
      setSelectedReport(reportsResponse.reports[0]);
      setShowReportModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load daily report");
    } finally {
      setLoading(false);
    }
  };

  return {
    handleViewReport,
    showReportModal,
    setShowReportModal,
    selectedReport,
    loading,
    error,
    setError
  };
};
