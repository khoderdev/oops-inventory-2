import { formatCurrency } from "@/utils/conversionLogic";
import { pdf } from "@react-pdf/renderer";
import React from "react";

// Types for report utilities
export interface ReportColumn {
  key: string;
  label: string;
  width?: string; // Default: auto-calculated
  align?: "left" | "center" | "right";
  format?: "currency" | "date" | "number" | "text";
}

export interface ReportSummaryItem {
  label: string;
  value: string | number;
  format?: "currency" | "number" | "text";
  highlight?: boolean;
}

export interface ReportData {
  // Header information
  title: string;
  subtitle?: string;
  reportDate?: string;
  reportTime?: string;
  reportPeriod?: string;

  // Summary section (optional)
  summary?: ReportSummaryItem[];

  // Table data
  columns: ReportColumn[];
  rows: Record<string, string | number | boolean | Date | null>[];

  // Total row (optional)
  totalRow?: Record<string, string | number | boolean | Date | null>;

  // Footer information (optional)
  footerText?: string;
  customFooter?: string;

  // Styling options
  pageSize?: "A4" | "LETTER";
  orientation?: "portrait" | "landscape";
  showPageNumbers?: boolean;
}

// Utility functions for formatting
export const formatValue = (value: string | number | boolean | Date | null | undefined, format?: string): string => {
  if (value === null || value === undefined) return "-";

  switch (format) {
    case "currency":
      return formatCurrency(Number(value));
    case "number":
      return Number(value).toLocaleString();
    case "date":
      if (value instanceof Date) {
        return value.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
      } else if (typeof value === "boolean") {
        return "-";
      } else {
        return new Date(value as string | number).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
      }
    case "text":
    default:
      return String(value);
  }
};

export const calculateColumnWidth = (columns: ReportColumn[]): Record<string, string> => {
  const widths: Record<string, string> = {};
  const totalColumns = columns.length;

  // If no custom widths specified, distribute evenly
  const defaultWidth = `${100 / totalColumns}%`;

  columns.forEach(column => {
    widths[column.key] = column.width || defaultWidth;
  });

  return widths;
};

// Utility function to generate and print PDF
export const generateAndPrintPDF = async (
  reportData: ReportData,
  options?: {
    onStart?: () => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  }
): Promise<void> => {
  try {
    options?.onStart?.();

    // Import ReportPDF component dynamically to avoid circular dependency
    const { ReportPDF } = await import("@/components/reports/ReportPDF");

    // Generate PDF blob
    const blob = await pdf(React.createElement(ReportPDF, { data: reportData })).toBlob();

    // Create object URL for the blob
    const url = URL.createObjectURL(blob);

    // Create an iframe to load the PDF and trigger print
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.top = "-10000px";
    iframe.style.left = "-10000px";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.src = url;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      // Small delay to ensure PDF is fully loaded
      setTimeout(() => {
        // Trigger print dialog
        iframe.contentWindow?.print();

        // Clean up after user has time to print
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          URL.revokeObjectURL(url);
          options?.onComplete?.();
        }, 20000); // 20 seconds to allow user to complete printing
      }, 500);
    };

    // Fallback cleanup in case onload doesn't fire
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      URL.revokeObjectURL(url);
      options?.onComplete?.();
    }, 25000); // 25 seconds total fallback
  } catch (error) {
    console.error("Error generating/printing PDF:", error);
    options?.onError?.(error as Error);
  }
};

// Utility function to download PDF
export const generateAndDownloadPDF = async (
  reportData: ReportData,
  filename?: string,
  options?: {
    onStart?: () => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  }
): Promise<void> => {
  try {
    options?.onStart?.();

    // Import ReportPDF component dynamically to avoid circular dependency
    const { ReportPDF } = await import("@/components/reports/ReportPDF");

    // Generate PDF blob
    const blob = await pdf(React.createElement(ReportPDF, { data: reportData })).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `report_${new Date().toISOString().split("T")[0]}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
    options?.onComplete?.();
  } catch (error) {
    console.error("Error generating/downloading PDF:", error);
    options?.onError?.(error as Error);
  }
};
