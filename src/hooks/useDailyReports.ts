import { useState } from "react";
import { dayOperationReportsAPI } from "../api/dayOperationReports.api";
import { dayOperationsAPI } from "../api/dayOperations.api";
import { DayOperationReport } from "../types/inventory";

export const useDailyReports = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DayOperationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleViewReport = async (date: string, retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching report for date: ${date} (attempt ${retryCount + 1})`);
      const dayOperations = await dayOperationsAPI.getDayOperations(1, 100);
      console.log('Day operations fetched:', dayOperations);
      const dayOperation = dayOperations.dayOperations.find(op => op.date === date);
      console.log('Found day operation:', dayOperation);

      if (!dayOperation || !dayOperation.id) {
        throw new Error(`No day operation found for date: ${date}`);
      }

      // Check if day operation is closed before generating report
      if (dayOperation.status !== "closed") {
        console.warn(`Day operation status is "${dayOperation.status}", not "closed". Retrying...`);
        if (retryCount < 2) { // Retry up to 3 times
          setTimeout(() => {
            handleViewReport(date, retryCount + 1);
          }, 500); // Wait 500ms before retry
          return;
        } else {
          throw new Error(`Day operation is still "${dayOperation.status}". Please wait a moment and try again.`);
        }
      }

      console.log(`Fetching reports for day operation ID: ${dayOperation.id}`);
      const reportsResponse = await dayOperationReportsAPI.getReportsByDayOperation(dayOperation.id);
      console.log('Reports response:', reportsResponse);
      if (!reportsResponse.reports || reportsResponse.reports.length === 0) {
        console.log('No reports found, attempting to generate a report');
        const generatedReport = await dayOperationReportsAPI.generateReport(dayOperation.id, 'System');
        console.log('Generated report:', generatedReport);

        if (generatedReport && generatedReport.report) {
          setSelectedReport(generatedReport.report);
          setShowReportModal(true);
          return;
        }
        throw new Error(`No reports found for day operation on ${date}`);
      }
      setSelectedReport(reportsResponse.reports[0]);
      setShowReportModal(true);
    } catch (err) {
      console.error('Error in handleViewReport:', err);
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
