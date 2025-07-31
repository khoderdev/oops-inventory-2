import { ReportData, calculateColumnWidth, formatValue } from "@/utils/reportUtils";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import React from "react";

// Re-export types for convenience
export { generateAndDownloadPDF, generateAndPrintPDF } from "@/utils/reportUtils";
export type { ReportColumn, ReportData, ReportSummaryItem } from "@/utils/reportUtils";

interface ReportPDFProps {
  data: ReportData;
  onGenerated?: (blob: Blob) => void;
}

// Default PDF styles with customization options
const createStyles = (data: ReportData) =>
  StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#ffffff",
      padding: 30,
      fontFamily: "Helvetica",
      fontSize: 10
    },
    header: {
      marginBottom: 30,
      textAlign: "center",
      borderBottom: "2 solid #e5e7eb",
      paddingBottom: 20
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#1f2937",
      marginBottom: 10
    },
    subtitle: {
      fontSize: 14,
      color: "#374151",
      marginBottom: 5,
      fontWeight: "bold"
    },
    metaText: {
      fontSize: 12,
      color: "#6b7280",
      marginBottom: 5
    },
    summarySection: {
      backgroundColor: "#f9fafb",
      padding: 15,
      marginBottom: 20,
      borderRadius: 8,
      border: "1 solid #e5e7eb"
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#374151",
      marginBottom: 10
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8
    },
    summaryLabel: {
      fontSize: 12,
      color: "#6b7280"
    },
    summaryValue: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#059669"
    },
    summaryValueHighlight: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#dc2626"
    },
    table: {
      width: "auto",
      borderStyle: "solid",
      borderWidth: 1,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderColor: "#e5e7eb"
    },
    tableRow: {
      margin: "auto",
      flexDirection: "row"
    },
    tableColHeader: {
      borderStyle: "solid",
      borderWidth: 1,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      borderColor: "#e5e7eb",
      backgroundColor: "#f3f4f6",
      padding: 8
    },
    tableCol: {
      borderStyle: "solid",
      borderWidth: 1,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      borderColor: "#e5e7eb",
      padding: 8
    },
    tableCellHeader: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#374151"
    },
    tableCell: {
      fontSize: 9,
      color: "#6b7280"
    },
    tableCellCenter: {
      fontSize: 9,
      color: "#6b7280",
      textAlign: "center"
    },
    tableCellRight: {
      fontSize: 9,
      color: "#6b7280",
      textAlign: "right"
    },
    totalRow: {
      backgroundColor: "#ecfdf5"
    },
    totalCell: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#059669"
    },
    totalCellCenter: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#059669",
      textAlign: "center"
    },
    totalCellRight: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#059669",
      textAlign: "right"
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 30,
      right: 30,
      textAlign: "center",
      borderTop: "1 solid #e5e7eb",
      paddingTop: 10
    },
    footerText: {
      fontSize: 8,
      color: "#9ca3af"
    }
  });

// Main PDF Document Component
export const ReportPDF: React.FC<ReportPDFProps> = ({ data }) => {
  const styles = createStyles(data);
  const columnWidths = calculateColumnWidth(data.columns);

  const getCellStyle = (align?: string, isTotal = false) => {
    if (isTotal) {
      switch (align) {
        case "center":
          return styles.totalCellCenter;
        case "right":
          return styles.totalCellRight;
        default:
          return styles.totalCell;
      }
    } else {
      switch (align) {
        case "center":
          return styles.tableCellCenter;
        case "right":
          return styles.tableCellRight;
        default:
          return styles.tableCell;
      }
    }
  };

  return (
    <Document>
      <Page size={data.pageSize || "A4"} orientation={data.orientation || "portrait"} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          {data.subtitle && <Text style={styles.subtitle}>{data.subtitle}</Text>}
          {data.reportDate && (
            <Text style={styles.metaText}>
              Generated on {data.reportDate}
              {data.reportTime && ` at ${data.reportTime}`}
            </Text>
          )}
          {data.reportPeriod && <Text style={styles.metaText}>Report Period: {data.reportPeriod}</Text>}
        </View>

        {/* Summary Section */}
        {data.summary && data.summary.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Summary</Text>
            {data.summary.map((item, index) => (
              <View key={index} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{item.label}:</Text>
                <Text style={item.highlight ? styles.summaryValueHighlight : styles.summaryValue}>{formatValue(item.value, item.format)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Data Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            {data.columns.map(column => (
              <View key={column.key} style={[styles.tableColHeader, { width: columnWidths[column.key] }]}>
                <Text style={styles.tableCellHeader}>{column.label}</Text>
              </View>
            ))}
          </View>

          {/* Table Rows */}
          {data.rows.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              {data.columns.map(column => (
                <View key={column.key} style={[styles.tableCol, { width: columnWidths[column.key] }]}>
                  <Text style={getCellStyle(column.align)}>{formatValue(row[column.key] as string | number | boolean | Date | null, column.format)}</Text>
                </View>
              ))}
            </View>
          ))}

          {/* Total Row */}
          {data.totalRow && (
            <View style={[styles.tableRow, styles.totalRow]}>
              {data.columns.map(column => (
                <View key={column.key} style={[styles.tableCol, { width: columnWidths[column.key] }]}>
                  <Text style={getCellStyle(column.align, true)}>{formatValue(data.totalRow![column.key], column.format)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{data.footerText || "This report was generated automatically by the oOps POS System"}</Text>
          {data.customFooter && <Text style={styles.footerText}>{data.customFooter}</Text>}
          {data.showPageNumbers !== false && <Text style={styles.footerText}>Page 1 of 1 • Generated at {new Date().toISOString()}</Text>}
        </View>
      </Page>
    </Document>
  );
};

export default ReportPDF;
