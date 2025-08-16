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
      
      console.log(`Fetching report for date: ${date}`);
      const dayOperations = await dayOperationsAPI.getDayOperations(1, 100);
      console.log('Day operations fetched:', dayOperations);
      const dayOperation = dayOperations.dayOperations.find(op => op.date === date);
      console.log('Found day operation:', dayOperation);
      if (!dayOperation || !dayOperation.id) {
        throw new Error(`No day operation found for date: ${date}`);
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
