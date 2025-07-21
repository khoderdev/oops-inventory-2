import { useState } from "react";
import { getDailyReport } from "../api/dayOperations.api";
import { DailyReportData } from "../types/inventory";

export const useDailyReports = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleViewReport = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const reportResponse = await getDailyReport(date);
      setSelectedReport(reportResponse.report);
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
