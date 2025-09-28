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

      // First, try to get existing reports for this day
      console.log(`Fetching reports for day operation ID: ${dayOperation.id}`);
      const reportsResponse = await dayOperationReportsAPI.getReportsByDayOperation(dayOperation.id);
      console.log('Reports response:', reportsResponse);

      // If we have existing reports, use the most recent one
      if (reportsResponse.reports && reportsResponse.reports.length > 0) {
        console.log(`Found ${reportsResponse.reports.length} existing reports, using the most recent one`);
        const mostRecentReport = reportsResponse.reports[0];
        setSelectedReport(mostRecentReport);
        setShowReportModal(true);
        return;
      }

      // If no reports exist, create a partial report
      try {
        console.log('No existing reports found, creating a partial report');
        const today = new Date().toISOString().split('T')[0];
        const isToday = date === today;
        
        // Create a partial report with the current day's data
        const partialReport: any = {
          id: `partial-${dayOperation.id}`,
          dayOperationId: dayOperation.id,
          reportDate: date,
          reportType: isToday ? 'interim' : 'daily',
          reportStatus: isToday ? 'draft' : 'final',
          generatedAt: new Date(),
          generatedBy: 'System (Auto)',
          salesSummary: {
            totalAmount: String(dayOperation.totalSales || '0.00'),
            totalTransactions: Number(dayOperation.totalTransactions || 0),
            averageTicket: String(dayOperation.averageTicket || '0.00'),
            topItems: []
          },
          cashSummary: {
            opening: Number(dayOperation.openingCash || 0),
            expected: Number(dayOperation.expectedCash || 0),
            closing: Number(dayOperation.closingCash || 0),
            variance: Number(dayOperation.cashVariance || 0),
            variancePercentage: 0,
            transactions: {
              cash: 0,
              card: 0,
              other: 0
            }
          },
          userReports: [],
          topSellingItems: [],
          notes: isToday 
            ? 'This is an interim report. The day is still open.' 
            : 'Report generated from day operation data'
        };
        
        // Add user reports if available
        if (dayOperation.reportData) {
          const reportData = dayOperation.reportData as any;
          if (Array.isArray(reportData.userOrderStats)) {
            partialReport.userReports = reportData.userOrderStats.map((user: any) => ({
              userId: user.userId,
              userName: user.userName,
              openingCash: user.openingCash || 0,
              expectedClosingCash: (user.cashSales || 0) + (user.cardSales || 0),
              closingCash: user.closingCash || 0,
              variance: ((user.cashSales || 0) + (user.cardSales || 0)) - (user.closingCash || 0),
              orderCount: user.orderCount || 0,
              totalAmount: user.totalAmount || 0
            }));
          }
        }
        
        console.log('Created partial report:', partialReport);
        setSelectedReport(partialReport);
        setShowReportModal(true);
      } catch (genError) {
        console.warn('Error during report generation:', genError);
        
        // If we hit an error, create an error report
        const errorReport: any = {
          id: `error-${Date.now()}`,
          dayOperationId: dayOperation?.id || 'unknown',
          reportDate: date,
          reportType: 'daily',
          reportStatus: 'draft',
          generatedAt: new Date(),
          generatedBy: 'System (Error)',
          salesSummary: {
            totalAmount: '0.00',
            totalTransactions: 0,
            averageTicket: '0.00',
            topItems: []
          },
          cashSummary: {
            opening: 0,
            expected: 0,
            closing: 0,
            variance: 0,
            variancePercentage: 0,
            transactions: {
              cash: 0,
              card: 0,
              other: 0
            }
          },
          userReports: [],
          topSellingItems: [],
          notes: `Error generating report: ${genError instanceof Error ? genError.message : 'Unknown error'}`
        };
        
        setSelectedReport(errorReport);
        setShowReportModal(true);
      }
    } catch (err) {
      console.error('Error in handleViewReport:', err);
      setError(err instanceof Error ? err.message : "Failed to load daily report");
      throw err;
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
